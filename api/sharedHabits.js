
// api/sharedHabits.js
import mongoose from 'mongoose';

// UserProfile Schema for updating streaks and rewards
const UserProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  pokeBalls: { type: Number, default: 0 },
  experiencePoints: { type: Number, default: 0 },
  sharedHabitStreaks: { type: Map, of: Number, default: {} },
  // Add other fields from UserProfile that might be relevant for rewards if needed
}, { collection: 'userprofiles', strict: false }); // Use strict: false to allow other fields not defined here
const UserProfileModel = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);


const SharedHabitSchema = new mongoose.Schema({
  creatorUsername: { type: String, required: true, index: true, trim: true },
  inviteeUsername: { type: String, required: true, index: true, trim: true },
  habitText: { type: String, required: true, maxlength: 100, trim: true },
  status: {
    type: String,
    required: true,
    enum: ['pending_invitee_approval', 'active', 'declined_invitee', 'cancelled_creator', 'archived'],
    default: 'pending_invitee_approval'
  },
  creatorCompletedToday: { type: Boolean, default: false },
  inviteeCompletedToday: { type: Boolean, default: false },
  lastRewardGrantedDate: { type: String, default: '' }, // YYYY-MM-DD
  lastCompletionResetDate: { type: String, default: '' }, // YYYY-MM-DD
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  acceptedAt: Date,
});

SharedHabitSchema.index({ creatorUsername: 1, inviteeUsername: 1, status: 1 });
SharedHabitSchema.index({ inviteeUsername: 1, creatorUsername: 1, status: 1 });

SharedHabitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
SharedHabitSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const SharedHabitModel = mongoose.models.SharedHabit || mongoose.model('SharedHabit', SharedHabitSchema);

const uri = process.env.MONGODB_URI;
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    if (!uri) throw new Error("MONGODB_URI not defined.");
    await mongoose.connect(uri);
    isConnected = true;
    console.log("MongoDB connected successfully for sharedHabits API.");
  } catch (error) {
    console.error("MongoDB connection error for sharedHabits API:", error);
    isConnected = false;
    throw error;
  }
}

const getTodayDateStringLocal = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Constants for shared habit rewards (can be moved to a shared constants file if needed)
const XP_PER_SHARED_HABIT_JOINT_COMPLETION = 5; 
const POKEBALLS_PER_SHARED_HABIT_JOINT_COMPLETION = 1;


export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (dbError) {
    return res.status(500).json({ message: 'Database connection failed.', error: dbError.message });
  }

  const { method, url } = req;
  const today = getTodayDateStringLocal();
  
  // Use URL searchParams for routing parameters
  const { searchParams } = new URL(url, `http://${req.headers.host}`);
  const action = searchParams.get('action');
  const sharedHabitIdQueryParam = searchParams.get('id'); 
  const usernameQuery = searchParams.get('username');

  let reqBody;
  try {
    // Only attempt to parse body if it's not GET and body exists
    if (method !== 'GET' && req.body && (typeof req.body !== 'object' || Object.keys(req.body).length > 0)) {
        reqBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else if (method !== 'GET') {
        reqBody = {}; // Default to empty object if no body for non-GET requests
    }
  } catch (e) {
    return res.status(400).json({ message: "Invalid JSON body."});
  }


  if (method === 'POST') {
    if (action === 'invite') {
      try {
        let { creatorUsername, inviteeUsername, habitText } = reqBody;
        if (!creatorUsername || !inviteeUsername || !habitText) {
          return res.status(400).json({ message: 'Creator, invitee, and habit text are required.' });
        }
        creatorUsername = creatorUsername.trim();
        inviteeUsername = inviteeUsername.trim();
        habitText = habitText.trim();

        if (creatorUsername.toLowerCase() === inviteeUsername.toLowerCase()) {
          return res.status(400).json({ message: 'Cannot create a shared habit with oneself.' });
        }
        if (habitText.length > 100 || habitText.length === 0) {
          return res.status(400).json({ message: 'Habit text must be between 1 and 100 characters.' });
        }

        const inviteeExists = await UserProfileModel.findOne({ username: inviteeUsername }).lean();
        if (!inviteeExists) {
          return res.status(404).json({ message: `Treinador "${inviteeUsername}" não encontrado.` });
        }

        const existingHabit = await SharedHabitModel.findOne({
          $or: [
            { creatorUsername, inviteeUsername },
            { creatorUsername: inviteeUsername, inviteeUsername: creatorUsername }
          ],
          status: { $in: ['pending_invitee_approval', 'active'] }
        }).lean();

        if (existingHabit) {
          return res.status(409).json({ message: `Já existe um hábito compartilhado ${existingHabit.status === 'active' ? 'ativo' : 'pendente'} entre ${creatorUsername} e ${inviteeUsername}. Limite de 1 por dupla.` });
        }

        const newSharedHabit = new SharedHabitModel({
          creatorUsername, inviteeUsername, habitText,
          status: 'pending_invitee_approval',
          lastCompletionResetDate: today,
        });
        await newSharedHabit.save();
        const { _id, ...restOfNewHabit } = newSharedHabit.toObject(); // Use toObject() for saved doc
        return res.status(201).json({ message: 'Convite para hábito compartilhado enviado!', sharedHabit: { id: _id.toString(), ...restOfNewHabit } });
      } catch (error) {
        console.error('Error creating shared habit invitation:', error);
        return res.status(500).json({ message: 'Falha ao criar convite: ' + error.message });
      }
    } else if (action === 'complete' && sharedHabitIdQueryParam) {
      try {
        const { usernameCompleting } = reqBody;
        if (!usernameCompleting) return res.status(400).json({ message: 'Username completing is required.' });

        const habit = await SharedHabitModel.findById(sharedHabitIdQueryParam);
        if (!habit) return res.status(404).json({ message: 'Shared habit not found.' });
        if (habit.status !== 'active') return res.status(400).json({ message: 'Habit is not active.' });
        
        if (habit.lastCompletionResetDate !== today) {
           habit.creatorCompletedToday = false;
           habit.inviteeCompletedToday = false;
           habit.lastRewardGrantedDate = '';
           habit.lastCompletionResetDate = today;
        }

        if (habit.creatorUsername === usernameCompleting) {
          if (habit.creatorCompletedToday) return res.status(400).json({ message: 'Você já completou este hábito hoje.' });
          habit.creatorCompletedToday = true;
        } else if (habit.inviteeUsername === usernameCompleting) {
          if (habit.inviteeCompletedToday) return res.status(400).json({ message: 'Você já completou este hábito hoje.' });
          habit.inviteeCompletedToday = true;
        } else {
          return res.status(403).json({ message: 'User not part of this shared habit.' });
        }
        
        let message = "Hábito marcado como completo!";
        if (habit.creatorCompletedToday && habit.inviteeCompletedToday && habit.lastRewardGrantedDate !== today) {
          habit.lastRewardGrantedDate = today;
          message += " Ambos completaram! Recompensas e streak atualizados.";

          const profilesToUpdate = [habit.creatorUsername, habit.inviteeUsername];
          for (const uname of profilesToUpdate) {
              const partnerForUname = uname === habit.creatorUsername ? habit.inviteeUsername : habit.creatorUsername;
              await UserProfileModel.updateOne(
                  { username: uname },
                  {
                      $inc: {
                          pokeBalls: POKEBALLS_PER_SHARED_HABIT_JOINT_COMPLETION,
                          experiencePoints: XP_PER_SHARED_HABIT_JOINT_COMPLETION,
                          [`sharedHabitStreaks.${partnerForUname}`]: 1
                      },
                  },
                  { upsert: false }
              );
          }
        }
        await habit.save();
        const { _id, ...restOfHabit } = habit.toObject();
        return res.status(200).json({ message, sharedHabit: { id: _id.toString(), ...restOfHabit } });
      } catch (error) {
        console.error('Error completing shared habit:', error);
        return res.status(500).json({ message: 'Falha ao completar o hábito: ' + error.message });
      }
    } else {
      return res.status(400).json({ message: 'Invalid POST action or missing ID.' });
    }
  } else if (method === 'GET') {
    if (usernameQuery) {
      try {
        const sharedHabitsFromDB = await SharedHabitModel.find({
            $or: [{ creatorUsername: usernameQuery }, { inviteeUsername: usernameQuery }],
            status: { $nin: ['archived', 'declined_invitee', 'cancelled_creator'] }
        }).sort({ createdAt: -1 }).lean();
        
        const activeDBUpdates = [];
        for (const habit of sharedHabitsFromDB) {
            if (habit.lastCompletionResetDate !== today) {
                activeDBUpdates.push(
                    SharedHabitModel.updateOne({ _id: habit._id }, {
                        $set: {
                            creatorCompletedToday: false, inviteeCompletedToday: false,
                            lastRewardGrantedDate: '', lastCompletionResetDate: today
                        }
                    })
                );
                // Update the local copy for immediate reflection in the response
                habit.creatorCompletedToday = false; habit.inviteeCompletedToday = false;
                habit.lastRewardGrantedDate = ''; habit.lastCompletionResetDate = today;
            }
        }
        if (activeDBUpdates.length > 0) await Promise.all(activeDBUpdates);

        // Transform for client: map _id to id
        const clientReadySharedHabits = sharedHabitsFromDB.map(habit => {
            const { _id, __v, ...rest } = habit; // __v is mongoose version key, good to exclude
            return { id: _id.toString(), ...rest };
        });

        const active = clientReadySharedHabits.filter(h => h.status === 'active');
        const pendingInvitationsReceived = clientReadySharedHabits.filter(h => h.inviteeUsername === usernameQuery && h.status === 'pending_invitee_approval');
        const pendingInvitationsSent = clientReadySharedHabits.filter(h => h.creatorUsername === usernameQuery && h.status === 'pending_invitee_approval');
        
        return res.status(200).json({ active, pendingInvitationsReceived, pendingInvitationsSent });
      } catch (error) {
          console.error('Error fetching shared habits:', error);
          return res.status(500).json({ message: 'Falha ao buscar hábitos compartilhados: ' + error.message });
      }
    } else {
      return res.status(400).json({ message: 'Username query parameter is required for GET.' });
    }
  } else if (method === 'PUT') {
    if (action === 'respond' && sharedHabitIdQueryParam) {
      try {
        const { response: userResponse, responderUsername } = reqBody;
        if (!responderUsername || !['accept', 'decline'].includes(userResponse)) {
          return res.status(400).json({ message: 'Responder username and valid response (accept/decline) are required.' });
        }
        const habit = await SharedHabitModel.findById(sharedHabitIdQueryParam);
        if (!habit) return res.status(404).json({ message: 'Shared habit not found.' });
        if (habit.inviteeUsername !== responderUsername) return res.status(403).json({ message: 'Only the invitee can respond.' });
        if (habit.status !== 'pending_invitee_approval') return res.status(400).json({ message: 'Habit is not pending approval.' });

        habit.status = userResponse === 'accept' ? 'active' : 'declined_invitee';
        if (userResponse === 'accept') habit.acceptedAt = new Date();
        habit.lastCompletionResetDate = today; // Initialize reset date on activation
        await habit.save();
        const { _id, ...restOfHabit } = habit.toObject();
        return res.status(200).json({ message: `Convite ${userResponse === 'accept' ? 'aceito' : 'recusado'}!`, sharedHabit: { id: _id.toString(), ...restOfHabit } });
      } catch (error) {
        console.error('Error responding to shared habit:', error);
        return res.status(500).json({ message: 'Falha ao responder ao convite: ' + error.message });
      }
    } else if (action === 'cancel' && sharedHabitIdQueryParam) { 
       try {
          const { cancellerUsername } = reqBody;
          if (!cancellerUsername) return res.status(400).json({ message: 'Canceller username is required.' });

          const habit = await SharedHabitModel.findById(sharedHabitIdQueryParam);
          if (!habit) return res.status(404).json({ message: 'Shared habit not found.' });
          if (habit.creatorUsername !== cancellerUsername) return res.status(403).json({ message: 'Only the creator can cancel a pending invitation.' });
          if (habit.status !== 'pending_invitee_approval') return res.status(400).json({ message: 'Invitation is not pending.' });

          habit.status = 'cancelled_creator';
          await habit.save();
          const { _id, ...restOfHabit } = habit.toObject();
          return res.status(200).json({ message: 'Convite cancelado.', sharedHabit: { id: _id.toString(), ...restOfHabit } });
        } catch (error) {
          console.error('Error canceling shared habit invitation:', error);
          return res.status(500).json({ message: 'Falha ao cancelar o convite: ' + error.message });
        }
    } else if (action === 'delete' && sharedHabitIdQueryParam) { // New delete action
        try {
            const { deleterUsername } = reqBody;
            if (!deleterUsername) return res.status(400).json({ message: 'Deleter username is required.' });

            const habit = await SharedHabitModel.findById(sharedHabitIdQueryParam);
            if (!habit) return res.status(404).json({ message: 'Hábito compartilhado não encontrado.' });
            
            if (habit.status !== 'active') {
                 return res.status(400).json({ message: 'Apenas hábitos ativos podem ser excluídos desta forma.' });
            }

            if (habit.creatorUsername !== deleterUsername && habit.inviteeUsername !== deleterUsername) {
                return res.status(403).json({ message: 'Você não faz parte deste hábito compartilhado.' });
            }
            
            habit.status = 'archived'; // Mark as archived
            await habit.save();
            const { _id, ...restOfHabit } = habit.toObject();
            return res.status(200).json({ message: 'Hábito compartilhado excluído (arquivado).', sharedHabit: { id: _id.toString(), ...restOfHabit } });
        } catch (error) {
            console.error('Error deleting shared habit:', error);
            if (error.kind === 'ObjectId') {
                 return res.status(400).json({ message: 'ID do hábito compartilhado inválido.' });
            }
            return res.status(500).json({ message: 'Falha ao excluir o hábito compartilhado: ' + error.message });
        }
    } else {
      return res.status(400).json({ message: 'Invalid PUT action or missing ID.' });
    }
  } 
  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']); 
    res.status(405).end(`Method ${method} Not Allowed on /api/sharedHabits`);
  }
}

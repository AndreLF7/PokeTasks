
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
const XP_PER_SHARED_HABIT_JOINT_COMPLETION = 5; // Example XP
const POKEBALLS_PER_SHARED_HABIT_JOINT_COMPLETION = 1;


export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (dbError) {
    return res.status(500).json({ message: 'Database connection failed.', error: dbError.message });
  }

  const { method, url } = req;
  const today = getTodayDateStringLocal();
  const pathname = url.split('?')[0]; // Use pathname for regex matching

  // URL Parsers
  const inviteRegex = /^\/api\/sharedHabits\/invite\/?$/;
  const generalHabitsRegex = /^\/api\/sharedHabits\/?$/;
  // Matches /api/sharedHabits/:id/action (e.g., /api/sharedHabits/someID123/respond)
  const idActionRegex = /^\/api\/sharedHabits\/([a-zA-Z0-9]+)\/(respond|complete|cancel)$/;


  if (method === 'POST' && inviteRegex.test(pathname)) { // Test against pathname
    try {
      let { creatorUsername, inviteeUsername, habitText } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
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
      return res.status(201).json({ message: 'Convite para hábito compartilhado enviado!', sharedHabit: newSharedHabit });
    } catch (error) {
      console.error('Error creating shared habit invitation:', error);
      return res.status(500).json({ message: 'Falha ao criar convite: ' + error.message });
    }
  } else if (method === 'GET' && generalHabitsRegex.test(pathname)) { // Test against pathname
    try {
        // Use req.url here for new URL() as it contains the query string
        const queryParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const username = queryParams.get('username');

        if (!username) {
            return res.status(400).json({ message: 'Username query parameter is required.' });
        }

        const sharedHabits = await SharedHabitModel.find({
            $or: [{ creatorUsername: username }, { inviteeUsername: username }],
            status: { $nin: ['archived', 'declined_invitee', 'cancelled_creator'] } // Fetch active and pending
        }).sort({ createdAt: -1 }).lean();
        
        const activeDBUpdates = [];
        for (const habit of sharedHabits) {
            if (habit.lastCompletionResetDate !== today) {
                activeDBUpdates.push(
                    SharedHabitModel.updateOne({ _id: habit._id }, {
                        $set: {
                            creatorCompletedToday: false, inviteeCompletedToday: false,
                            lastRewardGrantedDate: '', lastCompletionResetDate: today
                        }
                    })
                );
                // Update in-memory object for current response
                habit.creatorCompletedToday = false; habit.inviteeCompletedToday = false;
                habit.lastRewardGrantedDate = ''; habit.lastCompletionResetDate = today;
            }
        }
        if (activeDBUpdates.length > 0) await Promise.all(activeDBUpdates);

        const active = sharedHabits.filter(h => h.status === 'active');
        const pendingInvitationsReceived = sharedHabits.filter(h => h.inviteeUsername === username && h.status === 'pending_invitee_approval');
        const pendingInvitationsSent = sharedHabits.filter(h => h.creatorUsername === username && h.status === 'pending_invitee_approval');
        
        return res.status(200).json({ active, pendingInvitationsReceived, pendingInvitationsSent });
    } catch (error) {
        console.error('Error fetching shared habits:', error);
        return res.status(500).json({ message: 'Falha ao buscar hábitos compartilhados: ' + error.message });
    }
  } else {
    const idActionMatch = pathname.match(idActionRegex); // Test against pathname
    if (idActionMatch) {
      const sharedHabitId = idActionMatch[1];
      const action = idActionMatch[2];
      let reqBody;
      try {
        reqBody = typeof req.body === 'string' && req.body.length > 0 ? JSON.parse(req.body) : req.body;
      } catch (e) {
        return res.status(400).json({ message: "Invalid JSON body."});
      }


      if (method === 'PUT' && action === 'respond') {
        try {
          const { response: userResponse, responderUsername } = reqBody;
          if (!responderUsername || !['accept', 'decline'].includes(userResponse)) {
            return res.status(400).json({ message: 'Responder username and valid response (accept/decline) are required.' });
          }
          const habit = await SharedHabitModel.findById(sharedHabitId);
          if (!habit) return res.status(404).json({ message: 'Shared habit not found.' });
          if (habit.inviteeUsername !== responderUsername) return res.status(403).json({ message: 'Only the invitee can respond.' });
          if (habit.status !== 'pending_invitee_approval') return res.status(400).json({ message: 'Habit is not pending approval.' });

          habit.status = userResponse === 'accept' ? 'active' : 'declined_invitee';
          if (userResponse === 'accept') habit.acceptedAt = new Date();
          habit.lastCompletionResetDate = today; // Ensure reset date is current
          await habit.save();
          return res.status(200).json({ message: `Convite ${userResponse === 'accept' ? 'aceito' : 'recusado'}!`, sharedHabit: habit });
        } catch (error) {
          console.error('Error responding to shared habit:', error);
          return res.status(500).json({ message: 'Falha ao responder ao convite: ' + error.message });
        }
      } else if (method === 'POST' && action === 'complete') {
        try {
          const { usernameCompleting } = reqBody;
          if (!usernameCompleting) return res.status(400).json({ message: 'Username completing is required.' });

          const habit = await SharedHabitModel.findById(sharedHabitId);
          if (!habit) return res.status(404).json({ message: 'Shared habit not found.' });
          if (habit.status !== 'active') return res.status(400).json({ message: 'Habit is not active.' });
          
          if (habit.lastCompletionResetDate !== today) { // Double check reset on completion attempt
             habit.creatorCompletedToday = false;
             habit.inviteeCompletedToday = false;
             habit.lastRewardGrantedDate = '';
             habit.lastCompletionResetDate = today;
          }

          let userProfileCompleting, partnerProfile;
          let partnerUsername;

          if (habit.creatorUsername === usernameCompleting) {
            if (habit.creatorCompletedToday) return res.status(400).json({ message: 'Você já completou este hábito hoje.' });
            habit.creatorCompletedToday = true;
            partnerUsername = habit.inviteeUsername;
          } else if (habit.inviteeUsername === usernameCompleting) {
            if (habit.inviteeCompletedToday) return res.status(400).json({ message: 'Você já completou este hábito hoje.' });
            habit.inviteeCompletedToday = true;
            partnerUsername = habit.creatorUsername;
          } else {
            return res.status(403).json({ message: 'User not part of this shared habit.' });
          }
          
          let message = "Hábito marcado como completo!";
          // Check for joint completion and reward
          if (habit.creatorCompletedToday && habit.inviteeCompletedToday && habit.lastRewardGrantedDate !== today) {
            habit.lastRewardGrantedDate = today;
            message += " Ambos completaram! Recompensas e streak atualizados.";

            // Update profiles for rewards and streaks
            const profilesToUpdate = [habit.creatorUsername, habit.inviteeUsername];
            for (const uname of profilesToUpdate) {
                const partnerForUname = uname === habit.creatorUsername ? habit.inviteeUsername : habit.creatorUsername;
                await UserProfileModel.updateOne(
                    { username: uname },
                    {
                        $inc: {
                            pokeBalls: POKEBALLS_PER_SHARED_HABIT_JOINT_COMPLETION,
                            experiencePoints: XP_PER_SHARED_HABIT_JOINT_COMPLETION,
                            [`sharedHabitStreaks.${partnerForUname}`]: 1 // Mongoose map increment
                        },
                         // If sharedHabitStreaks.partner doesn't exist, $inc creates it with value 1
                    },
                    { upsert: false } // Do not create profile if not exists, though it should.
                );
            }
          }
          await habit.save();
          return res.status(200).json({ message, sharedHabit: habit });
        } catch (error) {
          console.error('Error completing shared habit:', error);
          return res.status(500).json({ message: 'Falha ao completar o hábito: ' + error.message });
        }
      } else if ((method === 'DELETE' || method === 'PUT') && action === 'cancel') { // Using PUT for cancel for simplicity if DELETE body is tricky
        try {
          const { cancellerUsername } = reqBody;
          if (!cancellerUsername) return res.status(400).json({ message: 'Canceller username is required.' });

          const habit = await SharedHabitModel.findById(sharedHabitId);
          if (!habit) return res.status(404).json({ message: 'Shared habit not found.' });
          if (habit.creatorUsername !== cancellerUsername) return res.status(403).json({ message: 'Only the creator can cancel a pending invitation.' });
          if (habit.status !== 'pending_invitee_approval') return res.status(400).json({ message: 'Invitation is not pending.' });

          habit.status = 'cancelled_creator';
          await habit.save();
          return res.status(200).json({ message: 'Convite cancelado.', sharedHabit: habit });
        } catch (error) {
          console.error('Error canceling shared habit invitation:', error);
          return res.status(500).json({ message: 'Falha ao cancelar o convite: ' + error.message });
        }
      } else {
        // If idActionMatch was true, but method and action didn't match any above
        return res.status(405).json({ message: `Method ${method} not allowed for action ${action} on ${pathname}` });
      }
    } else {
      // Fallback for unmatched routes
      return res.status(404).json({ message: `Endpoint ${url} not found or method ${method} not allowed.` });
    }
  }
}

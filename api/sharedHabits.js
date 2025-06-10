
// api/sharedHabits.js
import mongoose from 'mongoose';

// Ensure UserProfileModel is also available if needed for cross-checks like user existence.
// For now, focusing on SharedHabitModel.
const UserProfileSchema = new mongoose.Schema({ // Minimal UserProfile for existence check
  username: { type: String, required: true, unique: true, index: true },
}, { collection: 'userprofiles' }); // Ensure it uses the same collection as api/habits.js
const UserProfileModel = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);


const SharedHabitSchema = new mongoose.Schema({
  creatorUsername: { type: String, required: true, index: true },
  inviteeUsername: { type: String, required: true, index: true },
  habitText: { type: String, required: true, maxlength: 100 },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending_invitee_approval', 'active', 'declined_invitee', 'cancelled_creator', 'archived'], 
    default: 'pending_invitee_approval' 
  },
  creatorCompletedToday: { type: Boolean, default: false },
  inviteeCompletedToday: { type: Boolean, default: false },
  lastRewardGrantedDate: { type: String, default: '' }, // YYYY-MM-DD
  lastCompletionResetDate: { type: String, default: '' }, // YYYY-MM-DD, when completion flags were last reset
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  acceptedAt: Date,
});

// Compound index to quickly find habits between two users and ensure uniqueness for active/pending
SharedHabitSchema.index({ creatorUsername: 1, inviteeUsername: 1, status: 1 });
SharedHabitSchema.index({ inviteeUsername: 1, creatorUsername: 1, status: 1 });


// Pre-save hook to update `updatedAt`
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
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  try {
    if (!uri) {
      throw new Error("MONGODB_URI not defined in environment variables for sharedHabits API.");
    }
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

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (dbError) {
    return res.status(500).json({ error: 'Database connection failed. Please check server logs.' });
  }

  const { method } = req;
  const today = getTodayDateStringLocal();

  if (method === 'POST' && req.url.includes('/invite')) { // Create/Invite to a shared habit
    try {
      const { creatorUsername, inviteeUsername, habitText } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!creatorUsername || !inviteeUsername || !habitText) {
        return res.status(400).json({ message: 'Creator, invitee, and habit text are required.' });
      }
      if (creatorUsername === inviteeUsername) {
        return res.status(400).json({ message: 'Cannot create a shared habit with oneself.' });
      }
       if (habitText.length > 100) {
        return res.status(400).json({ message: 'Habit text cannot exceed 100 characters.' });
      }

      // Check if invitee exists
      const inviteeExists = await UserProfileModel.findOne({ username: inviteeUsername }).lean();
      if (!inviteeExists) {
        return res.status(404).json({ message: `Desculpe, não localizamos o Treinador "${inviteeUsername}".` });
      }

      // Check for existing pending or active shared habit between these users
      // Users can be creator or invitee, so check both combinations
      const existingHabit = await SharedHabitModel.findOne({
        $or: [
          { creatorUsername, inviteeUsername },
          { creatorUsername: inviteeUsername, inviteeUsername: creatorUsername }
        ],
        status: { $in: ['pending_invitee_approval', 'active'] } // Only care about currently active or pending ones
      }).lean();

      if (existingHabit) {
        let message = 'Já existe um hábito compartilhado ';
        if (existingHabit.status === 'pending_invitee_approval') {
            message += `pendente entre ${creatorUsername} e ${inviteeUsername}.`;
        } else if (existingHabit.status === 'active') {
            message += `ativo entre ${creatorUsername} e ${inviteeUsername}.`;
        } else {
             message += `entre ${creatorUsername} e ${inviteeUsername}. Limite de 1 por dupla.`;
        }
        return res.status(409).json({ message });
      }

      const newSharedHabit = new SharedHabitModel({
        creatorUsername,
        inviteeUsername,
        habitText,
        status: 'pending_invitee_approval',
        lastCompletionResetDate: today, // Initialize with today's date
      });
      await newSharedHabit.save();
      return res.status(201).json({ message: 'Convite para hábito compartilhado enviado!', sharedHabit: newSharedHabit });

    } catch (error) {
      console.error('Error creating shared habit invitation:', error);
      return res.status(500).json({ message: 'Falha ao criar convite para hábito compartilhado.' });
    }
  } else if (method === 'GET') { // Fetch shared habits for a user
     try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ message: 'Username query parameter is required.' });
        }

        const sharedHabits = await SharedHabitModel.find({
            $or: [{ creatorUsername: username }, { inviteeUsername: username }],
            status: { $ne: 'archived' } // Don't fetch archived ones by default
        }).sort({ createdAt: -1 }).lean();
        
        // Lazy reset completion flags if day rolled over
        const habitsToUpdate = [];
        for (const habit of sharedHabits) {
            if (habit.lastCompletionResetDate !== today) {
                habit.creatorCompletedToday = false;
                habit.inviteeCompletedToday = false;
                habit.lastRewardGrantedDate = ''; // Also reset reward granted date for the new day
                habit.lastCompletionResetDate = today;
                habitsToUpdate.push(
                    SharedHabitModel.updateOne(
                        { _id: habit._id }, 
                        { 
                            $set: { 
                                creatorCompletedToday: false, 
                                inviteeCompletedToday: false,
                                lastRewardGrantedDate: '',
                                lastCompletionResetDate: today 
                            } 
                        }
                    )
                );
            }
        }
        if (habitsToUpdate.length > 0) {
            await Promise.all(habitsToUpdate);
            // Re-fetch or update in-memory objects if needed, for now client will get updated data on next fetch
            console.log(`Reset completion for ${habitsToUpdate.length} shared habits for user ${username}.`);
        }


        const active = sharedHabits.filter(h => h.status === 'active');
        const pendingInvitationsReceived = sharedHabits.filter(h => h.inviteeUsername === username && h.status === 'pending_invitee_approval');
        const pendingInvitationsSent = sharedHabits.filter(h => h.creatorUsername === username && h.status === 'pending_invitee_approval');
        // Add other statuses like 'declined' if needed by UI

        return res.status(200).json({ active, pendingInvitationsReceived, pendingInvitationsSent });

     } catch (error) {
        console.error('Error fetching shared habits:', error);
        return res.status(500).json({ message: 'Falha ao buscar hábitos compartilhados.' });
     }
  } else if (method === 'PUT' && req.url.includes('/respond')) { // Respond to an invitation
    // Placeholder for PUT /api/sharedHabits/respond/:sharedHabitId
    // Body: { response: 'accept' | 'decline', responderUsername: '...' }
    return res.status(501).json({ message: 'Response endpoint not fully implemented' });
  } else if (method === 'POST' && req.url.includes('/complete')) { // Mark habit as complete
    // Placeholder for POST /api/sharedHabits/complete/:sharedHabitId
    // Body: { usernameCompleting: '...' }
    return res.status(501).json({ message: 'Complete endpoint not fully implemented' });
  } else if (method === 'DELETE' && req.url.includes('/cancel')) { // Cancel a sent request (by creator)
    // Placeholder for DELETE /api/sharedHabits/cancel/:sharedHabitId
    // Query/Body: {cancellerUsername: '...'}
    return res.status(501).json({ message: 'Cancel endpoint not fully implemented' });
  }
  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed on /api/sharedHabits`);
  }
}

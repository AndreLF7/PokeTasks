
// api/sharedHabits.js
import mongoose from 'mongoose';

// Minimal UserProfile Schema for cross-reference
const UserProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  pokeBalls: { type: Number, default: 0 },
  experiencePoints: { type: Number, default: 0 },
  sharedHabitStreaks: { type: Map, of: Number, default: {} },
}, { collection: 'userprofiles', strict: false });

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
  lastRewardGrantedDate: { type: String, default: '' },
  lastCompletionResetDate: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SharedHabitModel = mongoose.models.SharedHabit || mongoose.model('SharedHabit', SharedHabitSchema);

const uri = process.env.MONGODB_URI;
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (!uri) throw new Error("MONGODB_URI not defined.");
  await mongoose.connect(uri);
  isConnected = true;
}

const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (err) {
    return res.status(500).json({ message: 'DB Connection Failed' });
  }

  const { method, query, body } = req;
  const today = getTodayDateStr();
  const { action, id, username } = query;

  if (method === 'GET') {
    if (!username) return res.status(400).json({ message: 'Username required' });
    try {
      const raw = await SharedHabitModel.find({
          $or: [{ creatorUsername: username }, { inviteeUsername: username }],
          status: { $nin: ['archived', 'declined_invitee', 'cancelled_creator'] }
      }).sort({ createdAt: -1 }).lean();
      
      const updated = raw.map(h => {
          if (h.lastCompletionResetDate !== today) {
              return { ...h, creatorCompletedToday: false, inviteeCompletedToday: false, lastCompletionResetDate: today, id: h._id.toString() };
          }
          return { ...h, id: h._id.toString() };
      });

      return res.status(200).json({
          active: updated.filter(h => h.status === 'active'),
          pendingInvitationsReceived: updated.filter(h => h.inviteeUsername === username && h.status === 'pending_invitee_approval'),
          pendingInvitationsSent: updated.filter(h => h.creatorUsername === username && h.status === 'pending_invitee_approval'),
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  if (method === 'POST' && action === 'invite') {
    const { creatorUsername, inviteeUsername, habitText } = body;
    if (!creatorUsername || !inviteeUsername || !habitText) return res.status(400).json({ message: 'Fields missing' });
    
    try {
      const invitee = await UserProfileModel.findOne({ username: inviteeUsername.trim() });
      if (!invitee) return res.status(404).json({ message: 'Treinador não encontrado.' });

      const exists = await SharedHabitModel.findOne({
        $or: [{ creatorUsername, inviteeUsername }, { creatorUsername: inviteeUsername, inviteeUsername: creatorUsername }],
        status: { $in: ['pending_invitee_approval', 'active'] }
      });
      if (exists) return res.status(409).json({ message: 'Já existe um hábito entre vocês.' });

      const nh = new SharedHabitModel({ creatorUsername, inviteeUsername, habitText, lastCompletionResetDate: today });
      await nh.save();
      return res.status(201).json({ message: 'Convite enviado!' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

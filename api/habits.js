
// api/habits.js
import mongoose from 'mongoose';

// Define UserProfile Schema (mirroring types.ts)
const HabitSchema = new mongoose.Schema({
  id: String,
  text: String,
  completedToday: Boolean,
  rewardClaimedToday: Boolean,
  pendingRewardConfirmation: Boolean,
  totalCompletions: Number,
}, { _id: false });

const ProgressionHabitSchema = new mongoose.Schema({
  id: String,
  mainHabitId: String,
  text: String,
  completedToday: Boolean,
  totalCompletions: Number,
}, { _id: false });

const PeriodicHabitSchema = new mongoose.Schema({
  id: String,
  text: String,
  period: { type: String, enum: ['weekly', 'monthly', 'annual'], required: true },
  isCompleted: Boolean,
  currentPeriodStartDate: String, 
  createdAt: String,
}, { _id: false });

const CaughtPokemonSchema = new mongoose.Schema({
  id: Number,
  name: String,
  instanceId: String,
  caughtDate: String,
  spriteUrl: String,
  caughtWithBallType: String, 
  isShiny: Boolean,
  isActive: { type: Boolean, default: false }
}, { _id: false });

const PlayablePokemonSchema = new mongoose.Schema({
  instanceId: String,
  id: Number,
  name: String,
  spriteUrl: String,
  isShiny: Boolean,
  stats: {
    hp: Number,
    attack: Number,
    defense: Number,
    accuracy: Number,
    agility: Number
  },
  activatedAt: String
}, { _id: false });

const UserProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String }, 
  habits: [HabitSchema],
  progressionHabits: [ProgressionHabitSchema], 
  periodicHabits: { type: [PeriodicHabitSchema], default: [] },
  caughtPokemon: [CaughtPokemonSchema],
  activePokemon: { type: [PlayablePokemonSchema], default: [] }, // New field
  pokeBalls: { type: Number, default: 0 },
  greatBalls: { type: Number, default: 0 },
  ultraBalls: { type: Number, default: 0 },
  masterBalls: { type: Number, default: 0 },
  taskCoins: { type: Number, default: 0 }, 
  dailyCompletions: { type: Number, default: 0 },
  lastResetDate: String, 
  shinyCaughtPokemonIds: [Number],
  
  dailyStreak: { type: Number, default: 0 },
  lastStreakUpdateDate: { type: String, default: "" },
  lastStreakDayClaimedForReward: { type: Number, default: 0 },

  fiveHabitStreak: { type: Number, default: 0 },
  lastFiveHabitStreakUpdateDate: { type: String, default: "" },
  lastFiveHabitStreakDayClaimedForReward: { type: Number, default: 0 },

  tenHabitStreak: { type: Number, default: 0 },
  lastTenHabitStreakUpdateDate: { type: String, default: "" },
  lastTenHabitStreakDayClaimedForReward: { type: Number, default: 0 },
  
  experiencePoints: { type: Number, default: 0 },
  shareHabitsPublicly: { type: Boolean, default: false },
  lastLevelRewardClaimed: { type: Number, default: 1 },
  maxHabitSlots: { type: Number, default: 10 }, 
  avatarId: { type: String, default: 'red' }, 
  boostedHabitId: { type: String, default: null }, 
  sharedHabitStreaks: { type: Map, of: Number, default: {} }, 
  lastSharedHabitCompletionResetDate: { type: String, default: '' }, 
});

const UserProfileModel = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);

const uri = process.env.MONGODB_URI;
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (!uri) throw new Error("MONGODB_URI not defined.");
  await mongoose.connect(uri);
  isConnected = true;
}

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (err) {
    return res.status(500).json({ error: 'DB Connection failed' });
  }

  if (req.method === 'POST') {
    try {
      const profileData = req.body;
      const updatedProfile = await UserProfileModel.findOneAndUpdate(
        { username: profileData.username },
        profileData,
        { new: true, upsert: true }
      );
      return res.status(200).json({ message: 'Saved successfully.', profile: updatedProfile });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save profile.' });
    }
  } else if (req.method === 'GET') {
    try {
      const { username } = req.query;
      const profile = await UserProfileModel.findOne({ username }).lean(); 
      if (!profile) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(profile); 
    } catch (error) {
      return res.status(500).json({ error: 'Failed to load profile.' });
    }
  }
}


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
}, { _id: false });

const CompletionHistorySchema = new mongoose.Schema({
  date: String,
  count: Number,
}, { _id: false });

const UserProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String }, 
  habits: [HabitSchema],
  progressionHabits: [ProgressionHabitSchema], 
  periodicHabits: { type: [PeriodicHabitSchema], default: [] }, // Added periodic habits
  caughtPokemon: [CaughtPokemonSchema],
  pokeBalls: Number,
  greatBalls: Number,
  ultraBalls: Number,
  masterBalls: Number,
  taskCoins: { type: Number, default: 0 }, 
  dailyCompletions: Number,
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
  
  completionHistory: [CompletionHistorySchema],
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
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected.");
    return;
  }
  try {
    if (!uri) {
        throw new Error("MONGODB_URI not defined in environment variables.");
    }
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    isConnected = true;
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    isConnected = false; 
    throw error; 
  }
}

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (dbError) {
    console.error("Database connection setup failed:", dbError);
    return res.status(500).json({ error: 'Database connection failed. Please check server logs.'});
  }

  if (req.method === 'POST') { // Save user profile
    try {
      const profileData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      if (!profileData || !profileData.username) {
        return res.status(400).json({ error: 'Username is required in profile data.' });
      }

      // Ensure defaults for new fields if not present
      profileData.taskCoins = profileData.taskCoins ?? 0;
      profileData.progressionHabits = profileData.progressionHabits ?? [];
      profileData.periodicHabits = profileData.periodicHabits ?? []; // Ensure periodicHabits default
      profileData.lastStreakDayClaimedForReward = profileData.lastStreakDayClaimedForReward ?? 0;
      profileData.dailyStreak = profileData.dailyStreak ?? 0;
      profileData.lastStreakUpdateDate = profileData.lastStreakUpdateDate ?? "";

      profileData.fiveHabitStreak = profileData.fiveHabitStreak ?? 0;
      profileData.lastFiveHabitStreakUpdateDate = profileData.lastFiveHabitStreakUpdateDate ?? "";
      profileData.lastFiveHabitStreakDayClaimedForReward = profileData.lastFiveHabitStreakDayClaimedForReward ?? 0;

      profileData.tenHabitStreak = profileData.tenHabitStreak ?? 0;
      profileData.lastTenHabitStreakUpdateDate = profileData.lastTenHabitStreakUpdateDate ?? "";
      profileData.lastTenHabitStreakDayClaimedForReward = profileData.lastTenHabitStreakDayClaimedForReward ?? 0;

      profileData.shareHabitsPublicly = profileData.shareHabitsPublicly ?? false;
      profileData.lastLevelRewardClaimed = profileData.lastLevelRewardClaimed ?? 1;
      profileData.maxHabitSlots = 10; 
      profileData.avatarId = profileData.avatarId ?? 'red';
      profileData.boostedHabitId = profileData.boostedHabitId === undefined ? null : profileData.boostedHabitId; 
      profileData.sharedHabitStreaks = profileData.sharedHabitStreaks ?? {};
      profileData.lastSharedHabitCompletionResetDate = profileData.lastSharedHabitCompletionResetDate ?? '';
      

      const updatedProfile = await UserProfileModel.findOneAndUpdate(
        { username: profileData.username },
        profileData,
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      
      const { password, ...profileToReturn } = updatedProfile.toObject();
      return res.status(200).json({ message: 'Profile saved successfully.', profile: profileToReturn });
    } catch (error) {
      console.error('Error saving profile:', error);
      return res.status(500).json({ error: 'Failed to save profile. An internal error occurred.' });
    }
  } else if (req.method === 'GET') { // Load user profile
    try {
      const { username } = req.query;
      if (!username) {
        return res.status(400).json({ error: 'Username query parameter is required.' });
      }
      const profile = await UserProfileModel.findOne({ username }).lean(); 
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
      
      // Ensure new fields have defaults if loading an older document
      profile.taskCoins = profile.taskCoins ?? 0;
      profile.progressionHabits = profile.progressionHabits ?? [];
      profile.periodicHabits = profile.periodicHabits ?? []; // Ensure periodicHabits default
      profile.lastLevelRewardClaimed = profile.lastLevelRewardClaimed ?? 1;
      profile.maxHabitSlots = 10; 
      profile.avatarId = profile.avatarId ?? 'red';
      profile.boostedHabitId = profile.boostedHabitId === undefined ? null : profile.boostedHabitId; 
      profile.sharedHabitStreaks = profile.sharedHabitStreaks ?? {};
      profile.lastSharedHabitCompletionResetDate = profile.lastSharedHabitCompletionResetDate ?? '';

      profile.dailyStreak = profile.dailyStreak ?? 0;
      profile.lastStreakUpdateDate = profile.lastStreakUpdateDate ?? "";
      profile.lastStreakDayClaimedForReward = profile.lastStreakDayClaimedForReward ?? 0;
      profile.fiveHabitStreak = profile.fiveHabitStreak ?? 0;
      profile.lastFiveHabitStreakUpdateDate = profile.lastFiveHabitStreakUpdateDate ?? "";
      profile.lastFiveHabitStreakDayClaimedForReward = profile.lastFiveHabitStreakDayClaimedForReward ?? 0;
      profile.tenHabitStreak = profile.tenHabitStreak ?? 0;
      profile.lastTenHabitStreakUpdateDate = profile.lastTenHabitStreakUpdateDate ?? "";
      profile.lastTenHabitStreakDayClaimedForReward = profile.lastTenHabitStreakDayClaimedForReward ?? 0;
      
      delete profile._id; 
      delete profile.__v; 
      return res.status(200).json(profile); 
    } catch (error) {
      console.error('Error loading profile:', error);
      return res.status(500).json({ error: 'Failed to load profile. An internal error occurred.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

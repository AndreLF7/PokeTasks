
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
  password: { type: String }, // Added password field
  habits: [HabitSchema],
  caughtPokemon: [CaughtPokemonSchema],
  pokeBalls: Number,
  greatBalls: Number,
  ultraBalls: Number,
  masterBalls: Number,
  dailyCompletions: Number,
  lastResetDate: String, 
  shinyCaughtPokemonIds: [Number],
  dailyStreak: Number,
  lastStreakUpdateDate: String, 
  lastStreakDayClaimedForReward: { type: Number, default: 0 },
  completionHistory: [CompletionHistorySchema],
  experiencePoints: Number,
  shareHabitsPublicly: { type: Boolean, default: false },
  lastLevelRewardClaimed: { type: Number, default: 1 },
  maxHabitSlots: { type: Number, default: 10 },
  avatarId: { type: String, default: 'red' }, 
  boostedHabitId: { type: String, default: null }, // Added boostedHabitId field
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
      profileData.lastStreakDayClaimedForReward = profileData.lastStreakDayClaimedForReward ?? 0;
      profileData.shareHabitsPublicly = profileData.shareHabitsPublicly ?? false;
      profileData.lastLevelRewardClaimed = profileData.lastLevelRewardClaimed ?? 1;
      profileData.maxHabitSlots = 10; 
      profileData.avatarId = profileData.avatarId ?? 'red';
      profileData.boostedHabitId = profileData.boostedHabitId === undefined ? null : profileData.boostedHabitId; // Allow null
      profileData.sharedHabitStreaks = profileData.sharedHabitStreaks ?? {};
      profileData.lastSharedHabitCompletionResetDate = profileData.lastSharedHabitCompletionResetDate ?? '';
      // Password is intentionally not defaulted here, it's set on creation/first update if missing.

      const updatedProfile = await UserProfileModel.findOneAndUpdate(
        { username: profileData.username },
        profileData,
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      // Do not return password in response
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
      profile.lastLevelRewardClaimed = profile.lastLevelRewardClaimed ?? 1;
      profile.maxHabitSlots = 10; 
      profile.avatarId = profile.avatarId ?? 'red';
      profile.boostedHabitId = profile.boostedHabitId === undefined ? null : profile.boostedHabitId; // Allow null
      profile.sharedHabitStreaks = profile.sharedHabitStreaks ?? {};
      profile.lastSharedHabitCompletionResetDate = profile.lastSharedHabitCompletionResetDate ?? '';
      
      // Password exists in 'profile' here from DB
      // We'll let the UserContext decide if it needs to be set/used

      delete profile._id; // _id is mongoose specific
      delete profile.__v; // __v is mongoose version key
      return res.status(200).json(profile); // Return profile including password for UserContext to handle
    } catch (error) {
      console.error('Error loading profile:', error);
      return res.status(500).json({ error: 'Failed to load profile. An internal error occurred.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

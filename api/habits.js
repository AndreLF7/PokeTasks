
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
  completionHistory: [CompletionHistorySchema],
  experiencePoints: Number,
  shareHabitsPublicly: { type: Boolean, default: false }, // Added field
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
    // Log the detailed error for server-side debugging
    console.error("Database connection setup failed:", dbError);
    return res.status(500).json({ error: 'Database connection failed. Please check server logs.'});
  }

  if (req.method === 'POST') { // Save user profile
    try {
      const profileData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      if (!profileData || !profileData.username) {
        return res.status(400).json({ error: 'Username is required in profile data.' });
      }

      const updatedProfile = await UserProfileModel.findOneAndUpdate(
        { username: profileData.username },
        profileData,
        { new: true, upsert: true, runValidators: true }
      );
      return res.status(200).json({ message: 'Profile saved successfully.', profile: updatedProfile });
    } catch (error) {
      console.error('Error saving profile:', error);
      // Provide a more generic error message to the client
      return res.status(500).json({ error: 'Failed to save profile. An internal error occurred.' });
    }
  } else if (req.method === 'GET') { // Load user profile
    try {
      const { username } = req.query;
      if (!username) {
        return res.status(400).json({ error: 'Username query parameter is required.' });
      }
      const profile = await UserProfileModel.findOne({ username }).lean(); // .lean() for plain JS object
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
      // Remove MongoDB specific fields if necessary, though .lean() helps
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
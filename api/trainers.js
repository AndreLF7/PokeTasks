
// api/trainers.js
import mongoose from 'mongoose';

// Define UserProfile Schema (mirroring types.ts, ensure consistency)
const HabitSchema = new mongoose.Schema({
  id: String,
  text: String,
  completedToday: Boolean,
  rewardClaimedToday: Boolean,
  pendingRewardConfirmation: Boolean,
  totalCompletions: Number,
}, { _id: false });

const CaughtPokemonSchema = new mongoose.Schema({
  id: Number, // This is the Pokedex ID
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
});

const UserProfileModel = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);

const uri = process.env.MONGODB_URI;
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected for /api/trainers.");
    return;
  }
  try {
    if (!uri) {
        throw new Error("MONGODB_URI not defined in environment variables for /api/trainers.");
    }
    console.log("Connecting to MongoDB for /api/trainers...");
    await mongoose.connect(uri);
    isConnected = true;
    console.log("MongoDB connected successfully for /api/trainers.");
  } catch (error) {
    console.error("MongoDB connection error for /api/trainers:", error);
    isConnected = false; 
    throw error; 
  }
}

export default async function handler(req, res) {
  try {
    await connectToDatabase();
  } catch (dbError) {
    console.error("Database connection setup failed for /api/trainers:", dbError);
    return res.status(500).json({ error: 'Database connection failed. Please check server logs.'});
  }

  if (req.method === 'GET') {
    try {
      const profiles = await UserProfileModel.find({}, 'username caughtPokemon').lean();
      
      const trainerRankings = profiles.map(profile => {
        const uniquePokemonIds = new Set(profile.caughtPokemon.map(p => p.id));
        return {
          username: profile.username,
          uniquePokemonCount: uniquePokemonIds.size,
        };
      });
      
      return res.status(200).json(trainerRankings);
    } catch (error) {
      console.error('Error fetching trainer data for ranking:', error);
      return res.status(500).json({ error: 'Failed to fetch trainer data. An internal error occurred.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

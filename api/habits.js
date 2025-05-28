//hello world
// api/habits.js
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

const handler = async (req, res) => {
  await mongoose.connect(uri);

  // Exemplo: retornar um hábito fictício
  res.status(200).json({ name: "Dormir cedo", done: false });
};

export default handler;

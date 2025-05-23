// server/configDb.js
import { connect } from 'mongoose';

export const connectDB = async () => {
  try {
    await connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn('  MONGO_URI not set. MongoDB will not be connected.');
}

let connection = null;

export async function connectMongo() {
  if (!MONGO_URI) return null;
  if (connection) return connection;

  try {
    connection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(' MongoDB connected');
    return connection;
  } catch (err) {
    console.error(' MongoDB connection error:', err.message);
    throw err;
  }
}

export default connectMongo;

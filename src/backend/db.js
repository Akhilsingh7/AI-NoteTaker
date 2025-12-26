import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI;

let isConnected = false;

async function dbConnect() {
  if (isConnected) {
    console.log("Mongodb is already connected");
    return;
  }

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URL environment variable inside .env"
    );
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;

    console.log("Connected to Mongodb");
  } catch (error) {
    console.log("error in connecting database ", error);
    isConnected = false;
    throw error;
  }
}

export default dbConnect;

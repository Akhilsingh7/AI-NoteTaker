import mongoose, { mongo } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URL;

let isConnected = false;

async function dbConnect() {
  if (isConnected) {
    console.log("Mongodb is already connected");
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;

    console.log("Connected to Mongodb");
  } catch (error) {
    console.log("error in connecting database ", error);
    throw error;
  }
}

export default dbConnect;

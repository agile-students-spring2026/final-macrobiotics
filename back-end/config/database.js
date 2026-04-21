import mongoose from "mongoose";
import "./env.js";

let connectionPromise = null;

export const connectToDatabase = async (
  mongoUri = process.env.MONGO_URI,
) => {
  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured on the backend.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(mongoUri)
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
};

export const disconnectFromDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

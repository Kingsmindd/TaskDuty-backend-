import mongoose from "mongoose";
import { setServers } from "node:dns/promises";

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  setServers(["8.8.8.8", "8.8.4.4"]);

  await mongoose.connect(mongoUri);

  console.log("MongoDB connected");
}

import mongoose from "mongoose";

export const Subscription = mongoose.model("Subscription", new mongoose.Schema({
  userId: String,
  endpoint: String,
  keys: {
    p256dh: String,
    auth: String
  }
}));

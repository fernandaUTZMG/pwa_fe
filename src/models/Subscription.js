// src/models/Subscription.js
import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  role: { type: String, required: false },
  subscription: { type: Object, required: true },
}, { timestamps: true });

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);

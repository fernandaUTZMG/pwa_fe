import { Schema, model } from "mongoose";

const PurchaseSchema = new Schema({
  userId: String,
  productId: String,
  quantity: Number,
  date: { type: Date, default: Date.now },
});


export const Purchase = model("Purchase", PurchaseSchema, "purchases");

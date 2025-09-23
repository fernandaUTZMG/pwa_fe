import { Schema, model } from "mongoose";

const ProductSchema = new Schema({
  name: String,
  price: Number,
  description: String,
});

export const Product = model("Product", ProductSchema, "products");

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { User } from "./models/user.js";
import { Product } from "./models/Product.js";
import { Purchase } from "./models/Purchase.js";
import { Cart } from "./models/Cart.js"; // Importar modelo de carrito

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/celeste_dos")
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Error Mongo:", err));


// --------------------- AUTH ---------------------
// Registro
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.json({ message: "Usuario registrado ✅" });
  } catch (err) {
    res.status(500).json({ error: "Error en el registro" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id }, "secreto123", { expiresIn: "1h" });
    res.json({ message: "Login exitoso ✅", token, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: "Error en el login" });
  }
});


// --------------------- PRODUCTS ---------------------
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// --------------------- PURCHASE ---------------------
app.post("/purchase", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    const purchase = new Purchase({ userId, productId, quantity });
    await purchase.save();
    res.json({ message: "Compra registrada ✅" });
  } catch (err) {
    res.status(500).json({ error: "Error al registrar compra" });
  }
});

// --------------------- CART ---------------------
// Agregar al carrito
app.post("/cart/add", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [{ productId, quantity }] });
    } else {
      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }
    await cart.save();
    res.json({ message: "Producto agregado al carrito ✅", cart });
  } catch (err) {
    res.status(500).json({ error: "Error al agregar al carrito" });
  }
});

// Ver carrito
app.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el carrito" });
  }
});

// Comprar todos los productos del carrito
app.post("/cart/checkout", async (req, res) => {
  try {
    const { userId } = req.body;
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: "Carrito vacío" });

    // Guardar cada producto como compra
    for (const item of cart.items) {
      const purchase = new Purchase({
        userId,
        productId: item.productId,
        quantity: item.quantity,
      });
      await purchase.save();
    }

    // Vaciar carrito
    cart.items = [];
    await cart.save();

    res.json({ message: "Compra finalizada ✅" });
  } catch (err) {
    res.status(500).json({ error: "Error en el checkout" });
  }
});


app.listen(5000, () => console.log("🚀 Servidor backend en http://192.168.100.12:5000"));
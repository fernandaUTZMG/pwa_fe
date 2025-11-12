// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import webpush from "web-push";

import { User } from './src/models/user.js';
import { Product } from './src/models/Product.js';
import { Purchase } from "./src/models/Purchase.js";
import { Cart } from "./src/models/Cart.js";

// -------------------- VAPID KEYS --------------------
const publicVapidKey = "BAJsbBvLPvl-vgyjPtnENPdRrR4RMoNPd6vEuUt4nKMdek-lOirCFs3A4gG9BSEujvD58jfEz4oCy4aUfwWaIBM";
const privateVapidKey = "kIThQQnhmekPdgek3WJOAILsG_PUNojMtnZ4i9UimV4";

webpush.setVapidDetails(
  "mailto:fer@example.com", // email válido
  publicVapidKey,
  privateVapidKey
);

const app = express();
app.use(cors({
  origin: "https://pwa-fe.onrender.com",
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));

// Para responder correctamente a todas las opciones preflight


app.use(express.json());

// -------------------- MongoDB --------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Error Mongo:", err));


// -------------------- AUTH --------------------
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

// -------------------- PRODUCTS --------------------
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// -------------------- PURCHASE --------------------
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

// -------------------- CART --------------------
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

app.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el carrito" });
  }
});

app.post("/cart/checkout", async (req, res) => {
  try {
    const { userId } = req.body;
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: "Carrito vacío" });

    for (const item of cart.items) {
      const purchase = new Purchase({
        userId,
        productId: item.productId,
        quantity: item.quantity,
      });
      await purchase.save();
    }

    cart.items = [];
    await cart.save();

    res.json({ message: "Compra finalizada ✅" });
  } catch (err) {
    res.status(500).json({ error: "Error en el checkout" });
  }
});

// -------------------- PUSH NOTIFICATIONS --------------------
import { Subscription } from "./src/models/Subscription.js";

// Ruta para recibir y guardar suscripción (frontend debe enviar { subscription, userId?, role? })
app.post("/subscribe", async (req, res) => {
  try {
    const { subscription, userId, role } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Faltan datos: subscription" });
    }

    // Guardar o actualizar por endpoint (evita duplicados)
    const existing = await Subscription.findOne({ "subscription.endpoint": subscription.endpoint });
    if (existing) {
      existing.subscription = subscription;
      if (userId) existing.userId = userId;
      if (role) existing.role = role;
      await existing.save();
      console.log("🔁 Suscripción actualizada:", existing._id.toString());
      return res.status(200).json({ message: "Suscripción actualizada ✅" });
    }

    const sub = new Subscription({ subscription, userId: userId || null, role: role || null });
    await sub.save();
    console.log("📌 Suscripción guardada:", sub._id.toString());
    return res.status(201).json({ message: "Suscripción guardada ✅" });
  } catch (err) {
    console.error("❌ Error en /subscribe:", err);
    return res.status(500).json({ error: "Error al guardar suscripción" });
  }
});

// Función que envía la notificación y elimina subs inválidas
async function sendNotificationDoc(subDoc, payload) {
  try {
    await webpush.sendNotification(subDoc.subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    console.error("sendNotification error:", err && err.statusCode, err && err.body);
    // 410 Gone o 404 Not Found -> eliminar suscripción obsoleta
    if (err && (err.statusCode === 410 || err.statusCode === 404)) {
      await Subscription.deleteOne({ _id: subDoc._id });
      console.log("🧹 Suscripción removida (obsoleta):", subDoc._id.toString());
      return { ok: false, removed: true };
    }
    return { ok: false, error: String(err) };
  }
}

// Endpoint: enviar a todos los usuarios con un role específico
// Body: { role, title, body, url, customData? }
app.post("/notify/role", async (req, res) => {
  try {
    const { role, title, body, url, customData } = req.body;
    if (!role) return res.status(400).json({ error: "role required" });

    const subs = await Subscription.find({ role });
    const payloadFactory = (s) => ({
      title: title || "Notificación",
      body: body || "Tienes una notificación",
      icon: "/icons/icon-192.png",
      url: url || "/",
      data: { role: s.role, userId: s.userId, ...(customData || {}) }
    });

    const results = await Promise.all(subs.map(s => sendNotificationDoc(s, payloadFactory(s))));
    return res.json({ ok: true, sent: results.length, results });
  } catch (err) {
    console.error("❌ Error en /notify/role:", err);
    return res.status(500).json({ error: "Error al notificar por role" });
  }
});

// Endpoint: enviar a un usuario específico (puede haber varias suscripciones para 1 userId)
// Body: { userId, title, body, url, customData? }
app.post("/notify/user", async (req, res) => {
  try {
    const { userId, title, body, url, customData } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const subs = await Subscription.find({ userId });
    const payload = {
      title: title || "Notificación Personal",
      body: body || "Tienes un mensaje nuevo",
      icon: "/icons/labial.jpg",
      url: url || "/",
      data: { userId, ...(customData || {}) }
    };

    const results = await Promise.all(subs.map(s => sendNotificationDoc(s, payload)));
    return res.json({ ok: true, sent: results.length, results });
  } catch (err) {
    console.error("❌ Error en /notify/user:", err);
    return res.status(500).json({ error: "Error al notificar por user" });
  }
});


// -------------------- INICIAR SERVIDOR --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`));

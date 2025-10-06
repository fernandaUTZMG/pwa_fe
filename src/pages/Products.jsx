// src/pages/Products.jsx
import React, { useState, useEffect } from "react";
import { FaShoppingCart, FaTrash } from "react-icons/fa";
import axios from "axios";
import "./Products.css";
import { saveProducts, getProducts, saveCart, getCart } from "../db";
import { guardarEnIndexedDB, obtenerPendientes, eliminarPendiente } from "../utils/indexedDB";
import TestIndexedDB from "../components/TestIndexedDB";

const initialProducts = [
  { id: 1, name: "Labial rojo intenso", price: 250, image: "/labial.jpg" },
  { id: 2, name: "Paleta de sombras nude", price: 450, image: "/paleta.jpg" },
  { id: 3, name: "Base líquida", price: 300, image: "/base.jpg" },
  { id: 4, name: "Rubor en polvo", price: 220, image: "/rubor.jpg" },
  { id: 5, name: "Delineador de ojos", price: 150, image: "/delineador.jpg" },
];

export default function Products() {
  const userId = localStorage.getItem("userId");
  const [products, setProducts] = useState(initialProducts);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // 🔹 Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      if (navigator.onLine) {
        try {
          const res = await axios.get(`${API_URL}/products`);
          if (res.data && res.data.length > 0) {
            setProducts(res.data);
            saveProducts(res.data); // guardar offline
          }
        } catch {
          loadOfflineProducts();
        }
      } else {
        loadOfflineProducts();
      }
    };

    const loadOfflineProducts = async () => {
      const offlineProducts = await getProducts();
      if (offlineProducts.length > 0) setProducts(offlineProducts);
    };

    loadProducts();
  }, []);

  // 🔹 Cargar carrito desde IndexedDB
  useEffect(() => {
    getCart(userId).then(items => setCartItems(items));
  }, [userId]);

  // 🔹 Sincronizar compras pendientes al volver online
  useEffect(() => {
    const syncPending = async () => {
      if (navigator.onLine) {
        const pendientes = await obtenerPendientes();
        for (let order of pendientes) {
          try {
            await axios.post(`${API_URL}/cart/checkout`, order);
            await eliminarPendiente(order.id); // eliminar del IndexedDB
            setCartItems([]); // vaciar carrito local si se envió correctamente
            await saveCart([], userId);
            setShowCart(false);
          } catch (err) {
            console.error("Error sincronizando pedido pendiente:", err);
          }
        }
      }
    };

    window.addEventListener("online", syncPending);
    return () => window.removeEventListener("online", syncPending);
  }, [userId]);

  // 🔹 Listener para mensajes del Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CLEAR_CART") {
          setCartItems([]);
          saveCart([], userId);
          setShowCart(false);
        }
      });
    }
  }, [userId]);

  // 🔹 Agregar producto al carrito
  const handleAddToCart = async (product) => {
    const existing = cartItems.find(item => item.id === (product._id || product.id));
    let updatedCart;

    if (existing) {
      updatedCart = cartItems.map(item =>
        item.id === (product._id || product.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cartItems, { ...product, id: product._id || product.id, quantity: 1 }];
    }

    setCartItems(updatedCart);
    await saveCart(updatedCart, userId);

    if (navigator.onLine) {
      axios.post(`${API_URL}/cart/add`, {
        userId,
        productId: product._id || product.id,
        quantity: 1,
      }).catch(err => console.error("Error al agregar al carrito:", err));
    }
  };

  // 🔹 Remover producto del carrito
  const handleRemoveFromCart = async (productId) => {
    const updatedCart = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedCart);
    await saveCart(updatedCart, userId);
  };

  // 🔹 Checkout con almacenamiento en IndexedDB si falla
  const handleCheckout = async () => {
    try {
      const cartItemsSaved = await getCart(userId);
      if (!cartItemsSaved || cartItemsSaved.length === 0) {
        alert("Tu carrito está vacío.");
        return;
      }

      const orderData = { userId, items: cartItemsSaved };

      if (navigator.onLine) {
        try {
          const res = await axios.post(`${API_URL}/cart/checkout`, orderData);
          alert(res.data.message);
          setCartItems([]);
          await saveCart([], userId);
          setShowCart(false);
        } catch (err) {
          console.error("Error enviando checkout online:", err);
          await guardarEnIndexedDB(orderData);
          alert("No se pudo completar el checkout. Pedido guardado para sincronizar.");
        }
      } else {
        await guardarEnIndexedDB(orderData);
        alert("No tienes conexión. Tu carrito se guardó para sincronizar cuando tengas internet.");

        if ("serviceWorker" in navigator && "SyncManager" in window) {
          navigator.serviceWorker.ready.then(reg => {
            reg.sync.register("sync-pedidos")
              .then(() => console.log("✅ Sync registrada: sync-pedidos"))
              .catch(err => console.error("Error registrando sync:", err));
          });
        } else {
          console.log("⚠️ Background Sync no soportado en este navegador.");
        }
      }
    } catch (err) {
      console.error("Error en checkout:", err);
    }
  };

  return (
    <div className="products-container">
      <h1>Productos de Maquillaje</h1>

      {/* Botón de prueba para IndexedDB */}
      <TestIndexedDB />

      <div className="cart-icon" onClick={() => setShowCart(!showCart)}>
        <FaShoppingCart size={30} />
        {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
      </div>

      {showCart && (
        <div className="cart-panel">
          <h2>Carrito</h2>
          {cartItems.length === 0 ? (
            <p>Carrito vacío</p>
          ) : (
            <ul>
              {cartItems.map(item => (
                <li key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                  {item.name} x {item.quantity} - ${item.price * item.quantity}
                  <button className="remove-btn" onClick={() => handleRemoveFromCart(item.id)}>
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {cartItems.length > 0 && (
            <button onClick={handleCheckout} className="checkout-btn">Comprar todo</button>
          )}

          {/* Botón de prueba para IndexedDB debajo del checkout */}
          <TestIndexedDB />
        </div>
      )}

      <div className="products-grid">
        {products.map(product => (
          <div key={product._id || product.id} className="product-card">
            <img src={product.image} alt={product.name} className="product-img" />
            <h2>{product.name}</h2>
            <p>${product.price}</p>
            <button onClick={() => handleAddToCart(product)} className="add-cart-btn">
              Agregar al carrito
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

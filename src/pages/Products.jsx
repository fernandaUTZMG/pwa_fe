import React, { useState, useEffect } from "react";
import { FaShoppingCart, FaTrash } from "react-icons/fa";
import axios from "axios";
import "./Products.css";

const initialProducts = [
  { id: 1, name: "Labial rojo intenso", price: 250, image: "/labial.jpg" },
  { id: 2, name: "Paleta de sombras nude", price: 450, image: "/paleta.jpg" },
  { id: 3, name: "Base líquida", price: 300, image: "/base.jpg" },
  { id: 4, name: "Rubor en polvo", price: 220, image: "/rubor.jpg" },
  { id: 5, name: "Delineador de ojos", price: 150, image: "/delineador.jpg" },
];

export default function Products() {
  const userId = localStorage.getItem("userId"); 
  const [products, setProducts] = useState(initialProducts); // Mantengo las imágenes
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // Traer productos desde el backend
  useEffect(() => {
    axios.get("http://localhost:5000/products")
      .then(res => {
        if (res.data && res.data.length > 0) {
          setProducts(res.data); // Sobreescribe solo si hay productos en la BD
        }
      })
      .catch(err => console.error("Error al cargar productos:", err));
  }, []);

  const handleAddToCart = (product) => {
    const existing = cartItems.find(item => item.id === (product._id || product.id));
    if (existing) {
      setCartItems(cartItems.map(item =>
        item.id === (product._id || product.id) ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, id: product._id || product.id, quantity: 1 }]);
    }

    // Enviar al backend
    axios.post("http://localhost:5000/cart/add", {
      userId,
      productId: product._id || product.id,
      quantity: 1,
    }).catch(err => console.error("Error al agregar al carrito:", err));
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  const handleCheckout = () => {
    axios.post("http://localhost:5000/cart/checkout", { userId })
      .then(res => {
        alert(res.data.message);
        setCartItems([]); 
        setShowCart(false);
      })
      .catch(err => console.error("Error en checkout:", err));
  };

  return (
    <div className="products-container">
      <h1>Productos de Maquillaje</h1>

      {/* Icono de carrito */}
      <div className="cart-icon" onClick={() => setShowCart(!showCart)}>
        <FaShoppingCart size={30} />
        {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
      </div>

      {/* Panel de carrito */}
      {showCart && (
        <div className="cart-panel">
          <h2>Carrito</h2>
          {cartItems.length === 0 ? (
            <p>Carrito vacío</p>
          ) : (
            <ul>
              {cartItems.map(item => (
                <li key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-img"/>
                  {item.name} x {item.quantity} - ${item.price * item.quantity}
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveFromCart(item.id)}
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {cartItems.length > 0 && (
            <button onClick={handleCheckout} className="checkout-btn">
              Comprar todo
            </button>
          )}
        </div>
      )}

      {/* Grid de productos */}
      <div className="products-grid">
        {products.map((product) => (
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

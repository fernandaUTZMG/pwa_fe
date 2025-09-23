// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Products from "./pages/Products";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/products" element={<Products />} />
    </Routes>
  );
}

export default App;

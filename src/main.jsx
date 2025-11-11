import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// ------------------------------------
// ✅ Registrar Service Worker sin Push
// ------------------------------------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registro = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker registrado:", registro);
    } catch (error) {
      console.error("❌ Error al registrar el Service Worker:", error);
    }
  });
} else {
  console.warn("⚠️ Service Worker NO soportado en este navegador");
}


// ------------------------------------
// ⚛️ Montar React App
// ------------------------------------
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

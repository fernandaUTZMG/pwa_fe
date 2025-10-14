import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// -----------------------------
// 🔔 REGISTRO DEL SERVICE WORKER + NOTIFICACIONES PUSH
// -----------------------------

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

if ("serviceWorker" in navigator && "PushManager" in window) {
  window.addEventListener("load", async () => {
    try {
      const registro = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker registrado:", registro);

      await navigator.serviceWorker.ready;

      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        console.warn("🚫 Permiso de notificaciones denegado.");
        return;
      }

      console.log("🔐 Permiso de notificaciones otorgado.");

      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BAJsbBvLPvl-vgyjPtnENPdRrR4RMoNPd6vEuUt4nKMdek-lOirCFs3A4gG9BSEujvD58jfEz4oCy4aUfwWaIBM"
        ),
      });

      console.log("📨 Suscripción creada:", suscripcion.toJSON());

      const isLocal = window.location.hostname === "localhost";
      const subscribeUrl = isLocal
        ? "http://localhost:5000/subscribe-local" // ruta simulada
        : "http://localhost:5000/subscribe";      // ruta real

      const respuesta = await fetch(subscribeUrl, {
        method: "POST",
        body: JSON.stringify(suscripcion.toJSON()),
        headers: { "Content-Type": "application/json" },
      });

      if (!respuesta.ok) {
        throw new Error(`Error al enviar suscripción: ${respuesta.status}`);
      }

      console.log("✅ Suscripción enviada al backend correctamente.");

      // Simulación de notificación inmediata en localhost
      if (isLocal) {
  setTimeout(() => {
    new Notification("Nuevos productos de maquillaje a la venta! 💄", {
      body: "Descubre nuestras últimas novedades en maquillaje 💋",
      icon: "/public/labial.jpg",
      image: "/public/paleta.jpg",
    });
  }, 2000);
}

    } catch (error) {
      console.error("❌ Error al registrar el Service Worker o suscribirse:", error);
    }
  });
} else {
  console.warn("⚠️ Este navegador no soporta Service Workers o Push Notifications.");
}

// -----------------------------
// ⚛️ MONTAJE DE LA APP REACT
// -----------------------------
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

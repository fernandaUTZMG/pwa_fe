// pushManager.js
export async function subscribeUserToPush(userId) {
  if (!("serviceWorker" in navigator)) return;

  // Solicitar permiso de notificaciones
  const permiso = await Notification.requestPermission();
  console.log("🔹 Estado de permisos (pushManager):", permiso);
  if (permiso !== "granted") return;

  // Esperar a que el Service Worker esté listo
  const registration = await navigator.serviceWorker.ready;
  console.log("📌 Service Worker listo:", registration);

  // 🔑 Convertir la clave pública a Uint8Array (requerido en Android)
  const publicVapidKey = "BAJsbBvLPvl-vgyjPtnENPdRrR4RMoNPd6vEuUt4nKMdek-lOirCFs3A4gG9BSEujvD58jfEz4oCy4aUfwWaIBM";
  const applicationServerKey = urlBase64ToUint8Array(publicVapidKey);

  // Crear la suscripción push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  console.log("📨 Suscripción lista:", subscription);

  // Obtener API_URL desde .env
  const API_URL = import.meta.env.VITE_API_URL;
  console.log("🌐 Enviando suscripción a:", `${API_URL}/subscribe`);

  // Guardar suscripción en backend
  await fetch(`${API_URL}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, subscription }),
  });

  console.log("✅ Suscripción guardada en backend");
}

// --------------------------------------------------
// 📦 Función para convertir la clave base64 a Uint8Array
// (necesaria para Android)
// --------------------------------------------------
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

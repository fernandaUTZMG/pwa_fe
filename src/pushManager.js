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

  // Crear la suscripción push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: "BAJsbBvLPvl-vgyjPtnENPdRrR4RMoNPd6vEuUt4nKMdek-lOirCFs3A4gG9BSEujvD58jfEz4oCy4aUfwWaIBM",
  });

  console.log("📨 Suscripción lista:", subscription);

  // Obtener API_URL desde .env
  const API_URL = import.meta.env.VITE_API_URL;

  // Guardar suscripción en backend
  await fetch(`${API_URL}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, subscription }),
  });

  console.log("✅ Suscripción guardada en backend");
}

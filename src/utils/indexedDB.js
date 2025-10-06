// src/utils/indexedDB.js

// Abre (o crea) la base de datos "miDB" con una tabla llamada "pendientes"
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("miDB", 1);

    // Se ejecuta una vez al crear la base o al cambiar la versión
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pendientes")) {
        db.createObjectStore("pendientes", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject("Error al abrir la base de datos");
    };
  });
}

// Guarda un registro dentro de la tabla "pendientes"
export async function guardarEnIndexedDB(data) {
  const db = await openDB();
  const tx = db.transaction("pendientes", "readwrite");
  const store = tx.objectStore("pendientes");
  store.add(data);
  return tx.complete;
}

// Obtiene todos los registros guardados
export async function obtenerPendientes() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("pendientes", "readonly");
    const store = tx.objectStore("pendientes");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

// Elimina un registro por ID
export async function eliminarPendiente(id) {
  const db = await openDB();
  const tx = db.transaction("pendientes", "readwrite");
  tx.objectStore("pendientes").delete(id);
  return tx.complete;
}

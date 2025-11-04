const APP_SHELL_CACHE = "app_shell_v1.0";
const DYNAMIC_CACHE = "dynamic_v1.0";

const APP_SHELL_FILES = [
  '/src/index.css',
  '/src/App.jsx',
  '/src/App.css',
  '/src/main.jsx',
  '/src/pages/Products.jsx', 
  '/src/pages/login.jsx',
  '/src/pages/Cart.jsx',
  '/public/base.jpg',
  '/public/delineador.jpg',
  '/public/labial.jpg',
  '/public/paleta.jpg',
  '/public/rubor.jpg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(cache => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== APP_SHELL_CACHE && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key))
      )
    )
  );
});

// Cache para GET requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Si la petición es hacia tu API backend, NO la interceptes
  if (url.origin === 'http://localhost:5000') {
    return; // pasa directo al network
  }

  // Solo cachear GETs de tu app
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cachedResp => {
        return cachedResp || fetch(event.request).then(fetchResp => {
          const responseClone = fetchResp.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, responseClone));
          return fetchResp;
        }).catch(() => caches.match(event.request));
      })
    );
  }
});


// -----------------------------
// 🎯 BACKGROUND SYNC
// -----------------------------
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pedidos') {
    event.waitUntil(sincronizarPedidos());
  }
});

async function sincronizarPedidos() {
  console.log('[SW] Sincronizando pedidos pendientes...');
  const db = await openDB('miDB', 1);
  const tx = db.transaction('pendientes', 'readwrite');
  const store = tx.objectStore('pendientes');
  const pedidos = await store.getAll();

  for (let pedido of pedidos) {
    try {
      const response = await fetch(`${self.location.origin}/api/cart/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido), // <-- enviamos pedido completo
      });

      if (response.ok) {
        console.log('Pedido sincronizado correctamente:', pedido);
        store.delete(pedido.id);

        // Enviar mensaje al cliente para vaciar carrito
        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.postMessage({ type: 'CLEAR_CART' }));
        });
      } else {
        console.error('Error al sincronizar pedido:', response.statusText);
      }
    } catch (err) {
      console.error('Error intentando sincronizar:', err);
    }
  }

  await tx.done;
  db.close();
}

function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// -----------------------------
// 📢 NOTIFICACIONES PUSH
// -----------------------------
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Nuevos productos de maquillaje 💄';
  const options = {
    body: data.body || 'Descubre nuestras últimas novedades 💋',
    icon: 'http://localhost:4173/labial.jpg',
    badge: 'http://localhost:4173/rubor.jpg',
    image: 'http://localhost:4173/paleta.jpg',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'ver', title: 'Ver productos' },
      { action: 'cerrar', title: 'Cerrar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'ver') {
    event.waitUntil(clients.openWindow('/products'));
  }
});

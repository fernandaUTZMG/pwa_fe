const APP_SHELL_CACHE = "app_shell_v1.0";
const DYNAMIC_CACHE = "dynamic_v1.0";

// Archivos estáticos de tu app
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

// Install: cachear archivos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

// Activate: limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys
          .filter(key => key !== APP_SHELL_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
});

// Fetch: interceptar solo peticiones HTTP/HTTPS
self.addEventListener('fetch', event => {
  const requestUrl = event.request.url;

  if (
    event.request.method === 'GET' &&
    (requestUrl.startsWith('http://') || requestUrl.startsWith('https://'))
  ) {
    event.respondWith(
      caches.match(event.request).then(cachedResp => {
        if (cachedResp) return cachedResp;

        return fetch(event.request).then(fetchResp => {
          // Guardar solo en GET y del mismo origen
          if (requestUrl.includes(self.location.origin)) {
            const responseClone = fetchResp.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, responseClone));
          }
          return fetchResp;
        }).catch(() => caches.match(event.request));
      })
    );
  }
});

// Eventos de background sync y push
self.addEventListener('sync', event => {});
self.addEventListener('push', event => {});

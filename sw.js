const CACHE = 'instinto-v22-niimbot-labels';
// Solo cachear index.html — no incluir manifest.json ni '/' que pueden fallar
// en GitHub Pages o servidores sin esos archivos exactos.
const ASSETS = ['/instinto-app/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(err => {
        // Si el caché falla (archivo no encontrado, etc.) no bloquear la instalación
        console.warn('[SW] Cache install warning (non-fatal):', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network first: siempre intenta descargar la versión más nueva.
// Solo usa caché si no hay internet.
self.addEventListener('fetch', e => {
  // No interceptar requests de Firebase/Firestore ni CDN externos
  const url = e.request.url;
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('gstatic.com') ||
      url.includes('googleapis.com') ||
      url.includes('emailjs.com')) {
    return; // dejar pasar sin interceptar
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Solo cachear respuestas válidas (status 200)
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

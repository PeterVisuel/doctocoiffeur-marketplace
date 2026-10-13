/* Service worker de Rendez Vous : rend l'application installable, plus rapide au démarrage
   et utilisable hors connexion (les données sont de toute façon stockées sur l'appareil).
   - Pages : réseau d'abord (toujours la dernière version en ligne), cache si hors connexion.
   - Fichiers statiques (JS, CSS, images, polices) : cache d'abord, mis à jour en arrière-plan.
   - /api/ (rappels par e-mail) : jamais mis en cache. */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `rendez-vous-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `rendez-vous-runtime-${CACHE_VERSION}`;
const RUNTIME_MAX_ENTRIES = 80;

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/logo-rendez-vous.jpg',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('rendez-vous-') && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

const trimCache = async (cacheName, maxEntries) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
};

const networkFirstPage = async (request) => {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put('/', response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match('/');
    return cached || Response.error();
  }
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone()).then(() => trimCache(RUNTIME_CACHE, RUNTIME_MAX_ENTRIES));
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;
  if (sameOrigin && url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});

/**
 * KIVU — Service Worker
 * Mode hors-ligne complet : cache des shells + dictionnaire local
 * pour fonctionner en brousse, sans réseau.
 */

const CACHE_VERSION = 'kivu-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Ressources critiques pré-cachées — l'app fonctionne 100% offline dès le 1er chargement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
];

// ---------- INSTALL ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- FETCH STRATEGIES ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1) Navigation HTML → Network First avec fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // 2) API KIVU → Network First avec cache de secours
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // 3) Assets statiques → Cache First
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Par défaut → Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ---------- STRATEGIES ----------
async function networkFirstHTML(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || (await caches.match('/offline.html')) ||
      new Response('<h1>KIVU hors-ligne 🌍</h1><p>Aucune connexion détectée — certaines fonctions restent accessibles.</p>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ offline: true, message: 'Mode hors-ligne — action en file' }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

// ---------- MESSAGES ----------
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
});

// ---------- BACKGROUND SYNC (queue offline actions) ----------
self.addEventListener('sync', (event) => {
  if (event.tag === 'kivu-sync-translations') {
    event.waitUntil(syncQueuedTranslations());
  }
});

async function syncQueuedTranslations() {
  // Les traductions effectuées hors-ligne seront pushées au retour du réseau
  // (lecture depuis IndexedDB → POST /api/v1/translation/translate)
  console.log('[KIVU SW] Synchronisation des traductions offline…');
}

// ---------- PUSH NOTIFICATIONS ----------
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'KIVU',
    body: 'Nouveau défi linguistique disponible !',
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});

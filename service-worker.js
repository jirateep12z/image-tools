const CACHE_VERSION = 'image-tools-v1';
const APP_SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/ImageApp.js',
  './js/modules/core.js',
  './js/modules/cropper.js',
  './js/modules/filters.js',
  './js/modules/history.js',
  './js/modules/watermark.js',
  './js/modules/compressor.js',
  './js/modules/comparison.js',
  './js/modules/keyboard.js',
  './js/modules/batch.js',
  './image/icon-16.png',
  './image/icon-32.png',
  './image/icon-48.png',
  './image/icon-128.png',
  './image/icon-192.png',
  './image/icon-512.png'
];

function IsSameOriginGetRequest(request) {
  const request_url = new URL(request.url);
  return (
    request.method === 'GET' && request_url.origin === self.location.origin
  );
}

async function CacheAppShell() {
  const cache = await caches.open(CACHE_VERSION);
  await cache.addAll(APP_SHELL_URLS);
}

async function ClearOldCaches() {
  const cache_names = await caches.keys();
  const delete_tasks = cache_names
    .filter(cache_name => cache_name !== CACHE_VERSION)
    .map(cache_name => caches.delete(cache_name));
  await Promise.all(delete_tasks);
}

async function HandleNavigationRequest(request) {
  try {
    const network_response = await fetch(request);
    const cache = await caches.open(CACHE_VERSION);
    cache.put('./index.html', network_response.clone());
    return network_response;
  } catch (error) {
    const cached_response = await caches.match('./index.html');
    if (cached_response) {
      return cached_response;
    }
    throw error;
  }
}

async function HandleAssetRequest(request) {
  const cached_response = await caches.match(request);
  if (cached_response) {
    return cached_response;
  }
  const network_response = await fetch(request);
  if (network_response.ok) {
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, network_response.clone());
  }

  return network_response;
}

self.addEventListener('install', event => {
  event.waitUntil(CacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(ClearOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (!IsSameOriginGetRequest(event.request)) {
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(HandleNavigationRequest(event.request));
    return;
  }
  event.respondWith(HandleAssetRequest(event.request));
});

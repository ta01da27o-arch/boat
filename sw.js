const CACHE_NAME = 'pwa-test-v1';
const FILES_TO_CACHE = [
  './index.html',
  './style.css',
  './script.js',
  './data.json'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// オフライン対応
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
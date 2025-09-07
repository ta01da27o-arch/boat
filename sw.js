self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('boatrace-cache').then(cache => cache.addAll([
      '/',
      '/index.html',
      '/style.css',
      '/app.js',
      '/data.json',
      '/manifest.webmanifest'
    ]))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
const CACHE_NAME = 'boat-ai-pwa-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if(k !== CACHE_NAME) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // data.json はネット優先（新しいデータがあればキャッシュ更新）
  if(url.pathname.endsWith('/data.json')){
    event.respondWith(
      fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
        return resp;
      }).catch(()=> caches.match(event.request))
    );
    return;
  }

  // 他はキャッシュ優先（オフライン対応）
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request).then(r => {
      if (r && r.type === 'basic') {
        const copy = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
      }
      return r;
    }).catch(()=> caches.match('./index.html')))
  );
});
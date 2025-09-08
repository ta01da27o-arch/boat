const CACHE = 'kyuin-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './data.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=> self.clients.claim());

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  // data.json: try network first (fresh), fallback to cache
  if(url.pathname.endsWith('/data.json')){
    e.respondWith(
      fetch(e.request).then(r=>{
        const copy = r.clone();
        caches.open(CACHE).then(c=> c.put(e.request, copy));
        return r;
      }).catch(()=> caches.match(e.request))
    );
    return;
  }

  // other: cache-first
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r=>{
      const copy = r.clone();
      caches.open(CACHE).then(c=> c.put(e.request, copy));
      return r;
    }))
  );
});
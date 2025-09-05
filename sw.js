const CACHE = 'boat-ai-cache-v1';
const CORE = ['/', '/index.html', '/style.css', '/app.js', '/data.json', '/manifest.webmanifest'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  // data.json -> network-first (try network, fallback cache)
  if(url.pathname.endsWith('/data.json')){
    e.respondWith(
      fetch(e.request).then(r=>{
        const copy = r.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copy));
        return r;
      }).catch(()=> caches.match(e.request))
    );
    return;
  }
  // others: cache-first
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r=>{ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r; }))
  );
});
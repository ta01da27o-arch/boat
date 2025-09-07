const CACHE = 'boatrace-app-v1';
const ASSETS = ['/', '/index.html', '/style.css', '/app.js', '/data.json', '/manifest.webmanifest'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e=> self.clients.claim());

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  // data.json should be fetched fresh
  if(url.pathname.endsWith('/data.json') || url.pathname.endsWith('/data.json/')){
    e.respondWith(fetch(e.request).then(r=>{
      const copy = r.clone();
      caches.open(CACHE).then(c=> c.put(e.request, copy));
      return r;
    }).catch(()=> caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request).then(r=>{
    const copy = r.clone();
    caches.open(CACHE).then(c=> c.put(e.request, copy));
    return r;
  })));
});
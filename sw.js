const CACHE_NAME = "boat-ai-cache-v5";
const ASSETS = ["./", "./index.html", "./style.css", "./script.js", "./data.json", "./manifest.webmanifest"];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=> c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  if(url.pathname.endsWith('/data.json')){
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)); return r; }).catch(()=> caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(res=> res || fetch(e.request).then(r=>{ const copy=r.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)); return r; })));
});
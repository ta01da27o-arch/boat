const CACHE_NAME = "boat-ai-cache-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./data.json",
  "./manifest.webmanifest"
];

// install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// activate - remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch - prefer network for data.json, cache-first for others
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // always try network for data.json (fresh)
  if(url.pathname.endsWith('/data.json')){
    event.respondWith(
      fetch(event.request).then(resp=>{
        // update cache copy
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
        return resp;
      }).catch(()=> caches.match(event.request))
    );
    return;
  }

  // other assets: cache-first then network
  event.respondWith(
    caches.match(event.request).then(res => {
      return res || fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
        return resp;
      });
    })
  );
});
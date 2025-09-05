self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("boat-ai-cache-v2").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./script.js",
        "./data.json",
        "./manifest.webmanifest"
      ]);
    })
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== "boat-ai-cache-v2").map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    fetch(e.request).then(res => {
      const resClone = res.clone();
      caches.open("boat-ai-cache-v2").then(cache => cache.put(e.request, resClone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
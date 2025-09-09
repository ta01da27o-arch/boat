self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("boatrace-app").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/app.js",
        "/data.json",
        "/manifest.webmanifest"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
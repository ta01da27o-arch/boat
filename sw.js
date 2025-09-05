self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("boat-ai-cache").then(cache => {
      return cache.addAll(["/", "/index.html", "/style.css", "/app.js", "/data.json"]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
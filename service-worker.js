self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("v1").then(cache => cache.addAll([
      "/", "/index.html", "/style.css", "/app.js", "/ai.js", "/manifest.json"
    ]))
  );
});

self.addEventListener("fetch", e => {
  if (e.request.url.includes("race_data.json")) {
    // race_data.json は毎回最新を取得
    e.respondWith(fetch(e.request));
  } else {
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
  }
});
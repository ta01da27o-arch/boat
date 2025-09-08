self.addEventListener("install",e=>{
  e.waitUntil(
    caches.open("boatrace-cache").then(cache=>{
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./app.js",
        "./data.json"
      ]);
    })
  );
});

self.addEventListener("fetch",e=>{
  e.respondWith(
    caches.match(e.request).then(resp=>{
      return resp || fetch(e.request);
    })
  );
});
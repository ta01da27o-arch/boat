const CACHE = 'boat-ai-pwa-v2';
const ASSETS = [
  './', './index.html', './style.css', './script.js',
  './manifest.webmanifest', './data.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if(k !== CACHE) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  // data.json は常に新鮮さ優先
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
  // 他はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(res=>{
      return res || fetch(e.request).then(r=>{
        const copy = r.clone();
        caches.open(CACHE).then(c=> c.put(e.request, copy));
        return r;
      });
    })
  );
});
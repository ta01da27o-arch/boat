const CACHE = 'boat-ai-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './data.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e=> self.clients.claim());

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);

  // data.json -> ネットワーク優先で最新キャッシュ更新
  if(url.pathname.endsWith('/data.json')){
    e.respondWith(
      fetch(e.request).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=> c.put(e.request, copy));
        return res;
      }).catch(()=> caches.match(e.request))
    );
    return;
  }

  // 他はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r=>{
      const copy = r.clone();
      caches.open(CACHE).then(c=> c.put(e.request, copy));
      return r;
    }))
  );
});
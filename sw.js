const CACHE = 'boat-ai-pwa-v1';
const ASSETS = [
  './', './index.html', './style.css', './script.js',
  './manifest.webmanifest', './data.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=> self.clients.claim());

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  // data.json は常に新鮮さ優先（キャッシュ回避）
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
  // 他はキャッシュ優先・なければ取得
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
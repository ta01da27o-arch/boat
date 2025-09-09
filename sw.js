const CACHE_NAME = 'boat-ai-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './data.json'
];

// Install: 静的ファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// Fetch: ネット優先＋キャッシュフォールバック
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // data.json は常にネット優先
  if(url.pathname.endsWith('/data.json')){
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 静的ファイルはキャッシュ優先 → ネット更新があれば上書き
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(networkResp => {
          // ネット取得成功 → キャッシュ更新
          if(networkResp && networkResp.status === 200 && networkResp.type === 'basic'){
            caches.open(CACHE_NAME).then(c => c.put(event.request, networkResp.clone()));
          }
          return networkResp;
        })
        .catch(()=> null);
      // キャッシュがあれば先に返し、ネット更新は裏で行う
      return cached || fetchPromise.then(resp => resp || cached);
    })
  );
});

// 定期更新（Background Sync 的に）
self.addEventListener('periodicsync', event => {
  if(event.tag === 'update-data-json'){
    event.waitUntil(
      fetch('./data.json')
        .then(resp => resp.ok ? caches.open(CACHE_NAME).then(c=>c.put('./data.json', resp.clone())) : null)
        .catch(()=>{})
    );
  }
});
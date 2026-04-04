const CACHE_NAME = 'ai-fortune-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app_v2.js',
  './fortune-engine.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css'
];

// 설치 단계: 새로운 파일들을 캐싱
self.addEventListener('install', event => {
  self.skipWaiting(); // 새로운 서비스 워커가 즉시 활성화되도록 강제
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// 활성화 단계: 이전 버전의 캐시를 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

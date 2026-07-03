const CACHE_NAME = 'cleanplayer-v3';
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Pasang Cache install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets).catch(err => console.log("Gagal cache asset dasar:", err));
    })
  );
});

// Jalankan Fetch request biar PWA bekerja lancar
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});


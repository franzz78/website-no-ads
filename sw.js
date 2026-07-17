const CACHE_NAME = 'minitube-v1';

// Daftar aset inti yang wajib disimpan di cache agar aplikasi instan terbuka
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. Tahap Install: Membuat penyimpanan cache offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mengamankan aset statis ke dalam cache');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Tahap Aktivasi: Membersihkan versi cache lama jika Anda melakukan update kode
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache usang:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Tahap Fetch: Mengambil data dari cache untuk UI, dan langsung dari internet untuk API Video
self.addEventListener('fetch', (event) => {
  // Jika request menuju ke API video, jangan masukkan cache agar konten beranda & pencarian selalu terupdate
  if (event.request.url.includes('/api/v1/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: "Koneksi internet tidak stabil atau server sedang penuh." }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Strategi Cache First, Network Fallback untuk file lokal (HTML, CSS, JS)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

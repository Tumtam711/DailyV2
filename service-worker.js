

const CACHE_NAME = 'sales-report-v11.6'; // เปลี่ยนชื่อเพื่อบังคับอัปเดตแคช

const ASSETS = [
  '/style.css',
  '/sales.css',
  '/manage.css',
  '/shared.js',
  '/sales.js',
  '/manage.js',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/copy.mp3'
];

// install: cache เฉพาะ static assets
self.addEventListener('install', event => {
  console.log('🚀 SW installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 caching assets...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// activate: ลบ cache เก่า
self.addEventListener('activate', event => {
  console.log('🔥 SW activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🗑 deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// fetch strategy:
// - HTML → โหลดสดทุกครั้ง (แก้บัค manage/manage.html ตาย)
// - asset อื่น → cache-first
self.addEventListener('fetch', event => {
  const req = event.request;
  
  // ถ้าเป็นไฟล์ JS ให้ใช้ Network-First เพื่อความสดใหม่ของ Logic
  if (req.destination === 'script') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req)) // ถ้าไม่มีเน็ตค่อยเอาในแคช
    );
    return;
  }

  // ส่วนของ asset → cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      return (
        cached ||
        fetch(req).then(networkRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(req, networkRes.clone());
            return networkRes;
          });
        })
      );
    })
  );
});

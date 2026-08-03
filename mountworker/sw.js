/* ============================================================
   MountWalker Service Worker
   전략: App Shell 캐시 우선 + 외부 리소스(지도/타일) Stale-While-Revalidate
   ============================================================ */

const CACHE_VERSION = 'mountwalker-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// 오프라인에서도 동작해야 하는 핵심 App Shell 리소스 (상대 경로)
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  // 오프라인 대체 페이지
  './offline.html'
];

// CDN (Leaflet) - 실패해도 앱은 동작, 온라인일 때만 로드
const CDN_RESOURCES = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// 설치: 핵심 App Shell 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // 개별 파일 실패가 전체 설치를 막지 않도록 addAll 대신 개별 캐싱
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn('[SW] 캐시 실패(무시됨):', url, err.message);
          }
        })
      );
      // CDN 리소스도 캐싱 시도 (선택적)
      await Promise.all(
        CDN_RESOURCES.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn('[SW] CDN 캐시 실패(오프라인 시 지도 미작동):', url);
          }
        })
      );
      self.skipWaiting();
    })()
  );
});

// 활성화: 구버전 캐시 정리 + 클라이언트 즉시 제어
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// 요청 처리: 리소스 유형별 다른 전략 적용
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // GET 요청만 처리 (POST 등은 무시)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) 타일 서버(OpenStreetMap 등): Stale-While-Revalidate (런타임 캐시)
  if (url.hostname.endsWith('tile.openstreetmap.org') ||
      url.hostname.endsWith('tile.osm.org') ||
      url.hostname.endsWith('openstreetmap.org')) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  // 2) CDN(Leaflet): 캐시 우선, 실패 시 네트워크 → 런타임 캐시에 저장
  if (url.hostname === 'unpkg.com' || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirstThenNetwork(req, RUNTIME_CACHE));
    return;
  }

  // 3) 동일 출처(우리 앱) 리소스: 네트워크 우선(최신 콘텐츠) → 캐시 폴백
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirstAppShell(req));
    return;
  }

  // 4) 그 외 크로스 오리진: 캐시 우선, 실패 시 네트워크
  event.respondWith(cacheFirstThenNetwork(req, RUNTIME_CACHE));
});

// 전략 A: 캐시 우선 + 백그라운드 갱신 (Cache-First with Background Update)
async function cacheFirstThenNetwork(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    // 백그라운드에서 최신 버전 갱신
    fetch(req).then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone());
    }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (err) {
    // 최후의 수단
    return cached || Response.error();
  }
}

// 전략 B: Stale-While-Revalidate
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

// 전략 C: 네트워크 우선(앱 셸) - 최신 HTML/JS 확보, 실패 시 캐시/오프라인
async function networkFirstAppShell(req) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const res = await fetch(req);
    // HTML/JS/CSS 등은 캐시 갱신
    if (res && res.status === 200) {
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    // 네비게이션 요청이고 캐시도 없으면 오프라인 페이지
    if (req.mode === 'navigate') {
      const offline = await cache.match('./offline.html');
      return offline || (await cache.match('./index.html')) || Response.error();
    }
    return Response.error();
  }
}

// 푸시 알림 (향후 확장용)
self.addEventListener('push', (event) => {
  let data = { title: '🏔️ MountWalker', body: '새로운 등산 정보가 있습니다!' };
  try { if (event.data) data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icons/icon-192.png',
      badge: 'favicon.png',
      vibrate: [100, 50, 100],
      tag: 'mountwalker-notification',
      renotify: true,
    })
  );
});

// 알림 클릭 → 앱 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});

// 메시지: 새 버전 사용 가능 시 즉시 활성화
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
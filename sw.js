const CACHE_NAME = 'tap-counter-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
  // Иконки можно добавить сюда, но они не критичны для работы
];

// Установка SW — кэшируем основные файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Заставляем новый SW активироваться сразу
  self.skipWaiting();
});

// Перехват запросов: сначала пытаемся из сети, если нет — из кэша
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если нашли в кэше — возвращаем
        if (response) {
          return response;
        }
        // Иначе идём в сеть
        return fetch(event.request).then(
          networkResponse => {
            // Проверяем, валидный ли ответ
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // Кэшируем новый ресурс для будущего офлайн-доступа
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
      })
  );
});

// Очистка старых кэшей при активации
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Захватываем контроль над клиентами
  event.waitUntil(self.clients.claim());
});
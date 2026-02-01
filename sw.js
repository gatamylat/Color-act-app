// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    SERVICE WORKER - АКТ ЦВЕТА                             ║
// ║                    Massivburg - Offline Support                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const CACHE_NAME = 'color-act-v4';
const CACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// ═══════════════════════════════════════════════════════════════════════
// УСТАНОВКА
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
    console.log('🎨 Service Worker: Установка...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Кэширование файлов...');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('✅ Service Worker установлен');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Ошибка кэширования:', error);
            })
    );
});

// ═══════════════════════════════════════════════════════════════════════
// АКТИВАЦИЯ
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
    console.log('🎨 Service Worker: Активация...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('🗑️ Удаление старого кэша:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('✅ Service Worker активирован');
                return self.clients.claim();
            })
    );
});

// ═══════════════════════════════════════════════════════════════════════
// ПЕРЕХВАТ ЗАПРОСОВ
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
    // Пропускаем не-GET запросы
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Пропускаем chrome-extension и другие схемы
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Стратегия: Cache First, затем Network
                if (cachedResponse) {
                    // Возвращаем из кэша и обновляем в фоне
                    fetchAndCache(event.request);
                    return cachedResponse;
                }
                
                // Если нет в кэше - идем в сеть
                return fetchAndCache(event.request);
            })
            .catch(() => {
                // Если всё упало - возвращаем главную страницу
                return caches.match('./index.html');
            })
    );
});

// ═══════════════════════════════════════════════════════════════════════
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════════════════════════════════

async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Проверяем, что ответ валидный
        if (!response || response.status !== 200) {
            return response;
        }
        
        // Кэшируем копию ответа (для basic и cors типов)
        if (response.type === 'basic' || response.type === 'cors') {
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(request, responseToCache);
                });
        }
        
        return response;
    } catch (error) {
        console.log('⚠️ Fetch error:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// ОБРАБОТКА СООБЩЕНИЙ
// ═══════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data === 'clearCache') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('🗑️ Кэш очищен');
        });
    }
});

console.log('🎨 Service Worker загружен: Акт Цвета - Massivburg');

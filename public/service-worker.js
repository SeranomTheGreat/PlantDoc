/**
 * CropDocWeb - Progressive Web App Service Worker
 * Enables complete offline capability for crop disease diagnosis in remote fields.
 */

const CACHE_NAME = 'cropdoc-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './disease_db.json',
  './icon.png'
];

// Optional model resources - cached dynamically or on-install if present
const OPTIONAL_ASSETS = [
  './unified_crop_model.onnx',
  './unified_crop_model.onnx.data'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing CropDoc SW...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline-ready core assets...');
      
      // Warm up the cache with core resources
      const corePromises = ASSETS_TO_CACHE.map(asset => {
        return cache.add(asset).catch(err => {
          console.warn(`[Service Worker] Failed to pre-cache core asset: ${asset}`, err);
        });
      });

      // Try pre-caching large ONNX model files if already uploaded
      const modelPromises = OPTIONAL_ASSETS.map(asset => {
        return cache.add(asset).catch(err => {
          console.info(`[Service Worker] Model file ${asset} not available yet to cache on install (will cache on first fetch).`);
        });
      });

      return Promise.all([...corePromises, ...modelPromises]);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating CropDoc SW...');
  event.waitUntil(
    caches.keys().then((cacheKeys) => {
      return Promise.all(
        cacheKeys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning up stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Claim all active clients immediately so they are controlled on first load
      return self.clients.claim();
    })
  );
});

// Cache-First with Network Fallback / Dynamic Caching strategy
self.addEventListener('fetch', (event) => {
  // Let Vite dev-server HMR connection websockets bypass the service worker
  if (event.request.url.includes('ws://') || event.request.url.includes('wss://') || event.request.url.includes('/@vite/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache, but trigger a background check for update (stale-while-revalidate) for non-model assets
        const isLargeModel = event.request.url.includes('.onnx') || event.request.url.includes('.data');
        if (!isLargeModel) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {/* Ignore background sync failures offline */});
        }
        return cachedResponse;
      }

      // If not in cache, fetch from the network and dynamically cache the result
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Cache the newly fetched asset
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((error) => {
        console.warn(`[Service Worker] Network request failed offline for: ${event.request.url}`);
        
        // Fallback for app navigation if completely offline and page is requested
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
        
        throw error;
      });
    })
  );
});

// This is the service worker with the combined offline experience 
// and network first strategy

// Updated the cache name with version
const CACHE = "task-manager-v1";
const OFFLINE_URL = '/offline.html';

// Always update the cache when a new service worker is activated
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Network-first strategy with offline fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    // Handle API requests - network first, then offline handling
    if (event.request.url.includes('/api/')) {
      return handleApiRequest(event);
    }
    
    // Handle static assets and pages - cache first, then network
    return handleStaticRequest(event);
  }
});

// Handle API requests - Network first with offline queueing
async function handleApiRequest(event) {
  // POST, PUT, DELETE requests need to be queued when offline
  if (event.request.method !== 'GET') {
    return handleMutationRequest(event);
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache the response for future offline use
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // If offline, try to return from cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, return a generic offline response for API
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'You are offline. The request will be processed when you are back online.' 
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 503,
            statusText: 'Service Unavailable'
          }
        );
      })
  );
}

// Queue mutation requests when offline
async function handleMutationRequest(event) {
  // Try to send the request to the network
  event.respondWith(
    fetch(event.request.clone())
      .then((response) => {
        return response;
      })
      .catch(async () => {
        // If offline, save the request to IndexedDB for later syncing
        try {
          await saveRequestForLater(event.request.clone());
          
          // Return a fake successful response
          return new Response(
            JSON.stringify({ 
              success: true, 
              offline: true,
              message: 'Your request has been saved and will be processed when you are back online.' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 202,
              statusText: 'Accepted for Processing'
            }
          );
        } catch (err) {
          // Return error response if unable to save
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to save request for offline processing.' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 500,
              statusText: 'Internal Server Error'
            }
          );
        }
      })
  );
}

// Handle static requests - Cache first, then network
function handleStaticRequest(event) {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return from cache if available
        if (response) {
          return response;
        }
        
        // Otherwise, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache the response for future offline use
            caches.open(CACHE).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
            
            return networkResponse;
          })
          .catch(() => {
            // For navigation requests, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // For image requests, return a placeholder
            if (event.request.destination === 'image') {
              return new Response(
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext x="50" y="50" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif"%3EOffline%3C/text%3E%3C/svg%3E',
                { 
                  headers: { 'Content-Type': 'image/svg+xml' },
                  status: 200
                }
              );
            }
            
            // Default empty response
            return new Response('', { status: 408, statusText: 'Offline' });
          });
      })
  );
}

// IndexedDB setup for offline requests
const DB_NAME = 'taskmanager-offline';
const STORE_NAME = 'offline-requests';
let db;

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = reject;
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME, { autoIncrement: true });
    };
  });
}

// Save request for later processing
async function saveRequestForLater(request) {
  if (!db) {
    await initDB();
  }
  
  // Clone the request data
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Array.from(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(requestData);
    
    request.onsuccess = resolve;
    request.onerror = reject;
  });
}

// Process saved requests when online
async function processSavedRequests() {
  if (!db) {
    await initDB();
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = async (event) => {
      const savedRequests = event.target.result;
      
      if (savedRequests.length === 0) {
        resolve();
        return;
      }
      
      let successfulSync = 0;
      
      for (const savedRequest of savedRequests) {
        try {
          // Recreate the request
          const request = new Request(savedRequest.url, {
            method: savedRequest.method,
            headers: new Headers(savedRequest.headers),
            body: savedRequest.method !== 'GET' && savedRequest.method !== 'HEAD' ? savedRequest.body : undefined,
          });
          
          // Try to send the request
          await fetch(request);
          
          // If successful, remove from store
          const deleteTransaction = db.transaction([STORE_NAME], 'readwrite');
          const deleteStore = deleteTransaction.objectStore(STORE_NAME);
          await new Promise((resolve) => {
            const deleteRequest = deleteStore.delete(savedRequest.id);
            deleteRequest.onsuccess = resolve;
          });
          
          successfulSync++;
        } catch (error) {
          console.error('Failed to sync request:', error);
        }
      }
      
      resolve(successfulSync);
    };
    
    getAllRequest.onerror = reject;
  });
}

// Listen for online events
self.addEventListener('online', () => {
  processSavedRequests().then((synced) => {
    if (synced > 0) {
      // Notify clients that tasks have been synced
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_COMPLETED',
            synced: synced
          });
        });
      });
    }
  });
});

// Cache the offline page during install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.ico',
        '/static/css/main.css',
        '/static/js/main.js',
        '/icons/icon-192x192.png'
      ]);
    })
  );
});
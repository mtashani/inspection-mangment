// Service Worker for offline functionality
const CACHE_NAME = 'inspection-app-v1'
const STATIC_CACHE_NAME = 'inspection-static-v1'
const DYNAMIC_CACHE_NAME = 'inspection-dynamic-v1'
const API_CACHE_NAME = 'inspection-api-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/offline',
  '/manifest.json',
  // Add other critical static files
]

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/equipment',
  '/api/inspections',
  '/api/reports',
  '/api/maintenance',
  '/api/templates'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('📦 Caching static files')
        return cache.addAll(STATIC_FILES)
      }),
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('📦 Initializing API cache')
        return Promise.resolve()
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully')
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName !== API_CACHE_NAME
          ) {
            console.log('🗑️ Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('✅ Service Worker activated')
      return self.clients.claim()
    })
  )
})

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static files
  if (isStaticFile(url.pathname)) {
    event.respondWith(handleStaticRequest(request))
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  // Handle other requests with network first strategy
  event.respondWith(handleOtherRequest(request))
})

// Handle API requests with cache-first strategy for GET requests
async function handleApiRequest(request) {
  const url = new URL(request.url)
  const cacheKey = getCacheKey(request)
  
  try {
    // Try cache first for read operations
    if (isReadOnlyApiRequest(url.pathname)) {
      const cachedResponse = await caches.match(cacheKey)
      if (cachedResponse) {
        console.log('📱 Serving API from cache:', url.pathname)
        
        // Update cache in background
        updateCacheInBackground(request, cacheKey)
        
        return cachedResponse
      }
    }

    // Try network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      if (isReadOnlyApiRequest(url.pathname)) {
        const cache = await caches.open(API_CACHE_NAME)
        await cache.put(cacheKey, networkResponse.clone())
        console.log('💾 Cached API response:', url.pathname)
      }
      
      return networkResponse
    } else {
      throw new Error(`Network response not ok: ${networkResponse.status}`)
    }
  } catch (error) {
    console.log('🔌 Network failed for API request:', url.pathname)
    
    // Try to serve from cache as fallback
    const cachedResponse = await caches.match(cacheKey)
    if (cachedResponse) {
      console.log('📱 Serving stale API data from cache:', url.pathname)
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This data is not available offline',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return a generic offline page for failed static requests
    return caches.match('/offline')
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      // Cache successful navigation responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Try to serve from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Serve offline page
    return caches.match('/offline')
  }
}

// Handle other requests with network-first strategy
async function handleOtherRequest(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Update cache in background
async function updateCacheInBackground(request, cacheKey) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME)
      await cache.put(cacheKey, networkResponse.clone())
      console.log('🔄 Background cache update:', request.url)
    }
  } catch (error) {
    console.log('❌ Background cache update failed:', error)
  }
}

// Helper functions
function isStaticFile(pathname) {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf')
  )
}

function isReadOnlyApiRequest(pathname) {
  // Only cache GET requests for read operations
  return (
    pathname.includes('/equipment') ||
    pathname.includes('/inspections') ||
    pathname.includes('/reports') ||
    pathname.includes('/templates') ||
    pathname.includes('/maintenance')
  ) && !pathname.includes('/create') && !pathname.includes('/update') && !pathname.includes('/delete')
}

function getCacheKey(request) {
  const url = new URL(request.url)
  // Remove timestamp and other cache-busting parameters
  url.searchParams.delete('_t')
  url.searchParams.delete('timestamp')
  return url.toString()
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag)
  
  if (event.tag === 'offline-actions') {
    event.waitUntil(syncOfflineActions())
  }
})

// Sync offline actions when connection is restored
async function syncOfflineActions() {
  try {
    const db = await openOfflineDB()
    const actions = await getAllOfflineActions(db)
    
    console.log(`📤 Syncing ${actions.length} offline actions`)
    
    for (const action of actions) {
      try {
        await executeOfflineAction(action)
        await removeOfflineAction(db, action.id)
        console.log('✅ Synced offline action:', action.type)
      } catch (error) {
        console.log('❌ Failed to sync offline action:', error)
        // Keep the action for retry
      }
    }
  } catch (error) {
    console.log('❌ Background sync failed:', error)
  }
}

// IndexedDB operations for offline actions
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineActions', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('actions')) {
        const store = db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp')
        store.createIndex('type', 'type')
      }
    }
  })
}

function getAllOfflineActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['actions'], 'readonly')
    const store = transaction.objectStore('actions')
    const request = store.getAll()
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function removeOfflineAction(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['actions'], 'readwrite')
    const store = transaction.objectStore('actions')
    const request = store.delete(id)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function executeOfflineAction(action) {
  const { type, url, method, body, headers } = action
  
  const response = await fetch(url, {
    method,
    headers: headers || {},
    body: body ? JSON.stringify(body) : undefined
  })
  
  if (!response.ok) {
    throw new Error(`Failed to execute offline action: ${response.status}`)
  }
  
  return response
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    console.log('📬 Push notification received:', data)
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: data.data
      })
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.data)
  
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})

console.log('🚀 Service Worker loaded')
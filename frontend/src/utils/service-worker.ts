import { toast } from 'sonner'

export interface ServiceWorkerOptions {
  enableNotifications?: boolean
  enableAutoUpdate?: boolean
  updateCheckInterval?: number
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onOffline?: () => void
  onOnline?: () => void
}

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private options: Required<ServiceWorkerOptions>
  private updateCheckInterval: NodeJS.Timeout | null = null

  constructor(options: ServiceWorkerOptions = {}) {
    this.options = {
      enableNotifications: true,
      enableAutoUpdate: false,
      updateCheckInterval: 60000, // 1 minute
      onUpdate: () => {},
      onOffline: () => {},
      onOnline: () => {},
      ...options
    }
  }

  // Register service worker
  public async register(swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return null
    }

    try {
      console.log('🔧 Registering Service Worker...')
      
      this.registration = await navigator.serviceWorker.register(swPath, {
        scope: '/'
      })

      console.log('✅ Service Worker registered:', this.registration.scope)

      // Setup event listeners
      this.setupEventListeners()

      // Setup update checking
      if (this.options.enableAutoUpdate) {
        this.setupUpdateChecking()
      }

      // Show notification
      if (this.options.enableNotifications) {
        toast.success('App is ready for offline use')
      }

      return this.registration
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
      
      if (this.options.enableNotifications) {
        toast.error('Failed to enable offline functionality')
      }
      
      return null
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (!this.registration) return

    // Listen for updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing
      if (!newWorker) return

      console.log('🔄 Service Worker update found')

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('📦 New Service Worker installed')
          
          if (this.options.enableNotifications) {
            toast.info('App update available', {
              action: {
                label: 'Update',
                onClick: () => this.activateUpdate()
              },
              duration: 10000
            })
          }

          this.options.onUpdate(this.registration!)
        }
      })
    })

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker controller changed')
      
      if (this.options.enableNotifications) {
        toast.success('App updated successfully')
      }
      
      // Reload the page to use the new service worker
      window.location.reload()
    })

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data)
    })

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored')
      this.options.onOnline()
      
      if (this.options.enableNotifications) {
        toast.success('Connection restored')
      }
    })

    window.addEventListener('offline', () => {
      console.log('📱 Connection lost')
      this.options.onOffline()
      
      if (this.options.enableNotifications) {
        toast.warning('Working offline')
      }
    })
  }

  // Handle messages from service worker
  private handleServiceWorkerMessage(data: unknown): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('📦 Cache updated:', data.url)
        break
        
      case 'OFFLINE_FALLBACK':
        console.log('📱 Serving offline fallback:', data.url)
        break
        
      case 'SYNC_COMPLETE':
        console.log('🔄 Background sync complete')
        if (this.options.enableNotifications) {
          toast.success('Offline changes synced')
        }
        break
        
      case 'SYNC_FAILED':
        console.log('❌ Background sync failed:', data.error)
        if (this.options.enableNotifications) {
          toast.error('Failed to sync offline changes')
        }
        break
        
      default:
        console.log('📨 Service Worker message:', data)
    }
  }

  // Setup automatic update checking
  private setupUpdateChecking(): void {
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates()
    }, this.options.updateCheckInterval)
  }

  // Check for service worker updates
  public async checkForUpdates(): Promise<void> {
    if (!this.registration) return

    try {
      await this.registration.update()
      console.log('🔍 Checked for Service Worker updates')
    } catch (error) {
      console.error('❌ Failed to check for updates:', error)
    }
  }

  // Activate pending service worker update
  public activateUpdate(): void {
    if (!this.registration || !this.registration.waiting) return

    console.log('🚀 Activating Service Worker update')
    
    // Send message to waiting service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  // Unregister service worker
  public async unregister(): Promise<boolean> {
    if (!this.registration) return false

    try {
      const result = await this.registration.unregister()
      console.log('🗑️ Service Worker unregistered')
      
      if (this.updateCheckInterval) {
        clearInterval(this.updateCheckInterval)
        this.updateCheckInterval = null
      }
      
      return result
    } catch (error) {
      console.error('❌ Failed to unregister Service Worker:', error)
      return false
    }
  }

  // Get registration
  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }

  // Check if service worker is supported
  public static isSupported(): boolean {
    return 'serviceWorker' in navigator
  }

  // Get service worker state
  public getState(): string {
    if (!this.registration) return 'not-registered'
    
    if (this.registration.active) return 'active'
    if (this.registration.installing) return 'installing'
    if (this.registration.waiting) return 'waiting'
    
    return 'unknown'
  }

  // Send message to service worker
  public sendMessage(message: any): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message)
    }
  }

  // Request persistent storage
  public async requestPersistentStorage(): Promise<boolean> {
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
      console.warn('Persistent storage not supported')
      return false
    }

    try {
      const granted = await navigator.storage.persist()
      
      if (granted) {
        console.log('✅ Persistent storage granted')
        
        if (this.options.enableNotifications) {
          toast.success('Offline storage enabled')
        }
      } else {
        console.log('❌ Persistent storage denied')
      }
      
      return granted
    } catch (error) {
      console.error('❌ Failed to request persistent storage:', error)
      return false
    }
  }

  // Get storage estimate
  public async getStorageEstimate(): Promise<StorageEstimate | null> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null
    }

    try {
      return await navigator.storage.estimate()
    } catch (error) {
      console.error('❌ Failed to get storage estimate:', error)
      return null
    }
  }

  // Clear all caches
  public async clearCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys()
      
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      
      console.log('🗑️ All caches cleared')
      
      if (this.options.enableNotifications) {
        toast.success('Cache cleared')
      }
    } catch (error) {
      console.error('❌ Failed to clear caches:', error)
      
      if (this.options.enableNotifications) {
        toast.error('Failed to clear cache')
      }
    }
  }
}

// Global service worker manager instance
let globalServiceWorkerManager: ServiceWorkerManager | null = null

export function getServiceWorkerManager(options?: ServiceWorkerOptions): ServiceWorkerManager {
  if (!globalServiceWorkerManager) {
    globalServiceWorkerManager = new ServiceWorkerManager(options)
  }
  return globalServiceWorkerManager
}

// Initialize service worker
export async function initializeServiceWorker(
  swPath?: string,
  options?: ServiceWorkerOptions
): Promise<ServiceWorkerRegistration | null> {
  const manager = getServiceWorkerManager(options)
  return manager.register(swPath)
}

// Utility function to check if app is running in standalone mode (PWA)
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

// Utility function to check if app can be installed (PWA)
export function canInstall(): boolean {
  return 'beforeinstallprompt' in window
}

// PWA install prompt handler
export class PWAInstallManager {
  private deferredPrompt: any = null
  private isInstalled = false

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA install prompt available')
      e.preventDefault()
      this.deferredPrompt = e
    })

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed')
      this.isInstalled = true
      this.deferredPrompt = null
      
      toast.success('App installed successfully')
    })
  }

  // Show install prompt
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('❌ No install prompt available')
      return false
    }

    try {
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      
      console.log(`📱 Install prompt outcome: ${outcome}`)
      
      if (outcome === 'accepted') {
        toast.success('Installing app...')
        return true
      } else {
        toast.info('App installation cancelled')
        return false
      }
    } catch (error) {
      console.error('❌ Install prompt failed:', error)
      return false
    } finally {
      this.deferredPrompt = null
    }
  }

  // Check if install prompt is available
  public canInstall(): boolean {
    return this.deferredPrompt !== null
  }

  // Check if app is installed
  public isAppInstalled(): boolean {
    return this.isInstalled || isStandalone()
  }
}

// Global PWA install manager
let globalPWAInstallManager: PWAInstallManager | null = null

export function getPWAInstallManager(): PWAInstallManager {
  if (!globalPWAInstallManager) {
    globalPWAInstallManager = new PWAInstallManager()
  }
  return globalPWAInstallManager
}

export type { ServiceWorkerOptions }
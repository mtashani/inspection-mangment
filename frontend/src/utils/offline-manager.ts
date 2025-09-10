import { toast } from 'sonner'

export interface OfflineAction {
  id?: number
  type: 'create' | 'update' | 'delete'
  entityType: string
  entityId: string
  url: string
  method: string
  body?: any
  headers?: Record<string, string>
  timestamp: number
  retryCount: number
  maxRetries: number
}

export interface OfflineManagerOptions {
  dbName?: string
  dbVersion?: number
  maxRetries?: number
  retryDelay?: number
  enableNotifications?: boolean
}

export class OfflineManager {
  private db: IDBDatabase | null = null
  private options: Required<OfflineManagerOptions>
  private isOnline = navigator.onLine
  private listeners = new Set<(isOnline: boolean) => void>()
  private syncInProgress = false

  constructor(options: OfflineManagerOptions = {}) {
    this.options = {
      dbName: 'OfflineActions',
      dbVersion: 1,
      maxRetries: 3,
      retryDelay: 1000,
      enableNotifications: true,
      ...options
    }

    this.initializeDB()
    this.setupEventListeners()
  }

  // Initialize IndexedDB
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.options.dbName, this.options.dbVersion)

      request.onerror = () => {
        console.error('Failed to open offline database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('📱 Offline database initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('actions')) {
          const store = db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
          store.createIndex('timestamp', 'timestamp')
          store.createIndex('type', 'type')
          store.createIndex('entityType', 'entityType')
          store.createIndex('retryCount', 'retryCount')
        }
      }
    })
  }

  // Setup event listeners
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored')
      this.isOnline = true
      this.notifyListeners(true)
      
      if (this.options.enableNotifications) {
        toast.success('Connection restored - syncing offline changes...')
      }
      
      this.syncOfflineActions()
    })

    window.addEventListener('offline', () => {
      console.log('📱 Connection lost - entering offline mode')
      this.isOnline = false
      this.notifyListeners(false)
      
      if (this.options.enableNotifications) {
        toast.warning('Connection lost - working offline')
      }
    })
  }

  // Add offline action
  public async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<number> {
    if (!this.db) {
      await this.initializeDB()
    }

    const fullAction: OfflineAction = {
      ...action,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: action.maxRetries || this.options.maxRetries
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')
      const request = store.add(fullAction)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const id = request.result as number
        console.log('💾 Offline action stored:', id, action.type)
        resolve(id)
      }
    })
  }

  // Get all offline actions
  public async getOfflineActions(): Promise<OfflineAction[]> {
    if (!this.db) {
      await this.initializeDB()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readonly')
      const store = transaction.objectStore('actions')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  // Remove offline action
  public async removeOfflineAction(id: number): Promise<void> {
    if (!this.db) {
      await this.initializeDB()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // Update offline action retry count
  public async updateRetryCount(id: number, retryCount: number): Promise<void> {
    if (!this.db) {
      await this.initializeDB()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const action = getRequest.result
        if (action) {
          action.retryCount = retryCount
          const putRequest = store.put(action)
          putRequest.onerror = () => reject(putRequest.error)
          putRequest.onsuccess = () => resolve()
        } else {
          reject(new Error('Action not found'))
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Sync offline actions
  public async syncOfflineActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return
    }

    this.syncInProgress = true

    try {
      const actions = await this.getOfflineActions()
      console.log(`📤 Syncing ${actions.length} offline actions`)

      for (const action of actions) {
        try {
          await this.executeAction(action)
          await this.removeOfflineAction(action.id!)
          console.log('✅ Synced offline action:', action.type, action.entityType)
        } catch (error) {
          console.error('❌ Failed to sync action:', error)
          
          // Increment retry count
          const newRetryCount = action.retryCount + 1
          
          if (newRetryCount >= action.maxRetries) {
            console.log('🚫 Max retries reached, removing action:', action.id)
            await this.removeOfflineAction(action.id!)
            
            if (this.options.enableNotifications) {
              toast.error(`Failed to sync ${action.type} action after ${action.maxRetries} attempts`)
            }
          } else {
            await this.updateRetryCount(action.id!, newRetryCount)
            console.log(`🔄 Will retry action ${action.id} (attempt ${newRetryCount}/${action.maxRetries})`)
          }
        }
      }

      if (actions.length > 0 && this.options.enableNotifications) {
        toast.success('Offline changes synced successfully')
      }
    } catch (error) {
      console.error('❌ Sync failed:', error)
      
      if (this.options.enableNotifications) {
        toast.error('Failed to sync offline changes')
      }
    } finally {
      this.syncInProgress = false
    }
  }

  // Execute offline action
  private async executeAction(action: OfflineAction): Promise<void> {
    const response = await fetch(action.url, {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
        ...action.headers
      },
      body: action.body ? JSON.stringify(action.body) : undefined
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  // Check if online
  public isOnlineStatus(): boolean {
    return this.isOnline
  }

  // Subscribe to online status changes
  public subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Notify listeners
  private notifyListeners(isOnline: boolean): void {
    this.listeners.forEach(listener => listener(isOnline))
  }

  // Get offline actions count
  public async getOfflineActionsCount(): Promise<number> {
    const actions = await this.getOfflineActions()
    return actions.length
  }

  // Clear all offline actions
  public async clearOfflineActions(): Promise<void> {
    if (!this.db) {
      await this.initializeDB()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log('🗑️ All offline actions cleared')
        resolve()
      }
    })
  }

  // Force retry failed actions
  public async retryFailedActions(): Promise<void> {
    const actions = await this.getOfflineActions()
    const failedActions = actions.filter(action => action.retryCount > 0)

    for (const action of failedActions) {
      // Reset retry count
      await this.updateRetryCount(action.id!, 0)
    }

    if (failedActions.length > 0) {
      console.log(`🔄 Reset ${failedActions.length} failed actions for retry`)
      await this.syncOfflineActions()
    }
  }
}

// Singleton instance
let offlineManager: OfflineManager | null = null

export function getOfflineManager(options?: OfflineManagerOptions): OfflineManager {
  if (!offlineManager) {
    offlineManager = new OfflineManager(options)
  }
  return offlineManager
}

// Initialize offline manager
export function initializeOfflineManager(options?: OfflineManagerOptions): OfflineManager {
  offlineManager = new OfflineManager(options)
  return offlineManager
}

export type { OfflineManagerOptions }
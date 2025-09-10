import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { getOfflineManager, OfflineAction, OfflineManagerOptions } from '@/utils/offline-manager'

export interface UseOfflineOptions extends OfflineManagerOptions {
  enableAutoSync?: boolean
  syncInterval?: number
  showNotifications?: boolean
}

export interface UseOfflineReturn {
  isOnline: boolean
  isOffline: boolean
  offlineActionsCount: number
  isSyncing: boolean
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => Promise<number>
  syncOfflineActions: () => Promise<void>
  clearOfflineActions: () => Promise<void>
  retryFailedActions: () => Promise<void>
  getOfflineActions: () => Promise<OfflineAction[]>
}

export function useOffline(options: UseOfflineOptions = {}): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineActionsCount, setOfflineActionsCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const managerRef = useRef(getOfflineManager(options))
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const {
    enableAutoSync = true,
    syncInterval = 30000, // 30 seconds
    showNotifications = true
  } = options

  // Update offline actions count
  const updateOfflineActionsCount = useCallback(async () => {
    try {
      const count = await managerRef.current.getOfflineActionsCount()
      setOfflineActionsCount(count)
    } catch (error) {
      console.error('Failed to get offline actions count:', error)
    }
  }, [])

  // Add offline action
  const addOfflineAction = useCallback(async (
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>
  ) => {
    const id = await managerRef.current.addOfflineAction(action)
    await updateOfflineActionsCount()
    
    if (showNotifications) {
      toast.info(`Action queued for sync: ${action.type} ${action.entityType}`)
    }
    
    return id
  }, [updateOfflineActionsCount, showNotifications])

  // Sync offline actions
  const syncOfflineActions = useCallback(async () => {
    if (isSyncing || !isOnline) {
      return
    }

    setIsSyncing(true)
    try {
      await managerRef.current.syncOfflineActions()
      await updateOfflineActionsCount()
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, isOnline, updateOfflineActionsCount])

  // Clear offline actions
  const clearOfflineActions = useCallback(async () => {
    await managerRef.current.clearOfflineActions()
    await updateOfflineActionsCount()
    
    if (showNotifications) {
      toast.success('Offline actions cleared')
    }
  }, [updateOfflineActionsCount, showNotifications])

  // Retry failed actions
  const retryFailedActions = useCallback(async () => {
    await managerRef.current.retryFailedActions()
    await updateOfflineActionsCount()
    
    if (showNotifications) {
      toast.info('Retrying failed actions...')
    }
  }, [updateOfflineActionsCount, showNotifications])

  // Get offline actions
  const getOfflineActions = useCallback(async () => {
    return managerRef.current.getOfflineActions()
  }, [])

  // Setup online status listener
  useEffect(() => {
    const unsubscribe = managerRef.current.subscribe((online) => {
      setIsOnline(online)
      
      if (online && enableAutoSync) {
        // Sync when coming back online
        syncOfflineActions()
      }
    })

    return unsubscribe
  }, [enableAutoSync, syncOfflineActions])

  // Setup auto-sync interval
  useEffect(() => {
    if (enableAutoSync && isOnline) {
      syncIntervalRef.current = setInterval(() => {
        syncOfflineActions()
      }, syncInterval)
    } else if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [enableAutoSync, isOnline, syncInterval, syncOfflineActions])

  // Initial offline actions count
  useEffect(() => {
    updateOfflineActionsCount()
  }, [updateOfflineActionsCount])

  return {
    isOnline,
    isOffline: !isOnline,
    offlineActionsCount,
    isSyncing,
    addOfflineAction,
    syncOfflineActions,
    clearOfflineActions,
    retryFailedActions,
    getOfflineActions
  }
}

// Hook for offline-capable API operations
export function useOfflineApi<T = any>(
  baseUrl: string,
  options: UseOfflineOptions = {}
) {
  const offline = useOffline(options)

  // Create with offline support
  const create = useCallback(async (
    endpoint: string,
    data: T,
    entityType: string,
    entityId: string
  ) => {
    const url = `${baseUrl}${endpoint}`
    
    try {
      if (offline.isOnline) {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        return response.json()
      } else {
        // Queue for offline sync
        await offline.addOfflineAction({
          type: 'create',
          entityType,
          entityId,
          url,
          method: 'POST',
          body: data,
          maxRetries: 3
        })
        
        // Return optimistic response
        return { id: entityId, ...data, _offline: true }
      }
    } catch (error) {
      if (offline.isOffline) {
        // Queue for offline sync
        await offline.addOfflineAction({
          type: 'create',
          entityType,
          entityId,
          url,
          method: 'POST',
          body: data,
          maxRetries: 3
        })
        
        return { id: entityId, ...data, _offline: true }
      }
      
      throw error
    }
  }, [baseUrl, offline])

  // Update with offline support
  const update = useCallback(async (
    endpoint: string,
    data: Partial<T>,
    entityType: string,
    entityId: string
  ) => {
    const url = `${baseUrl}${endpoint}`
    
    try {
      if (offline.isOnline) {
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        return response.json()
      } else {
        // Queue for offline sync
        await offline.addOfflineAction({
          type: 'update',
          entityType,
          entityId,
          url,
          method: 'PUT',
          body: data,
          maxRetries: 3
        })
        
        return { ...data, _offline: true }
      }
    } catch (error) {
      if (offline.isOffline) {
        // Queue for offline sync
        await offline.addOfflineAction({
          type: 'update',
          entityType,
          entityId,
          url,
          method: 'PUT',
          body: data,
          maxRetries: 3
        })
        
        return { ...data, _offline: true }
      }
      
      throw error
    }
  }, [baseUrl, offline])

  // Delete with offline support
  const remove = useCallback(async (
    endpoint: string,
    entityType: string,
    entityId: string
  ) => {
    const url = `${baseUrl}${endpoint}`
    
    try {
      if (offline.isOnline) {
        const response = await fetch(url, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        return true
      } else {
        // Queue for offline sync
        await offline.addOfflineAction({
          type: 'delete',
          entityType,
          entityId,
          url,
          method: 'DELETE',
          maxRetries: 3
        })
        
        return true
      }
    } catch (error) {
      if (offline.isOffline) {
        // Queue for offline sync
        await offline.addOfflineAction({
          type: 'delete',
          entityType,
          entityId,
          url,
          method: 'DELETE',
          maxRetries: 3
        })
        
        return true
      }
      
      throw error
    }
  }, [baseUrl, offline])

  // Get with cache fallback
  const get = useCallback(async (endpoint: string) => {
    const url = `${baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return response.json()
    } catch (error) {
      if (offline.isOffline) {
        // Try to get from cache via service worker
        const cachedResponse = await caches.match(url)
        if (cachedResponse) {
          return cachedResponse.json()
        }
      }
      
      throw error
    }
  }, [baseUrl, offline])

  return {
    ...offline,
    create,
    update,
    remove,
    get
  }
}

// Hook for offline form handling
export function useOfflineForm<T extends Record<string, any>>(
  entityType: string,
  initialData: T,
  options: UseOfflineOptions = {}
) {
  const [data, setData] = useState<T>(initialData)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const offline = useOffline(options)

  // Update form data
  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }, [])

  // Save form data
  const save = useCallback(async (
    saveFunction: (data: T) => Promise<T>
  ) => {
    setIsSaving(true)
    
    try {
      if (offline.isOnline) {
        const result = await saveFunction(data)
        setData(result)
        setIsDirty(false)
        return result
      } else {
        // Queue for offline sync
        await offline.addOfflineAction({
          type: 'update',
          entityType,
          entityId: data.id || 'new',
          url: '/api/save', // This would be replaced with actual endpoint
          method: 'POST',
          body: data,
          maxRetries: 3
        })
        
        setIsDirty(false)
        toast.info('Changes saved offline - will sync when connection is restored')
        return data
      }
    } finally {
      setIsSaving(false)
    }
  }, [data, entityType, offline])

  // Auto-save functionality
  const enableAutoSave = useCallback((
    saveFunction: (data: T) => Promise<T>,
    delay: number = 2000
  ) => {
    const timeoutRef = { current: null as NodeJS.Timeout | null }
    
    const autoSave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        if (isDirty && !isSaving) {
          save(saveFunction)
        }
      }, delay)
    }
    
    return autoSave
  }, [isDirty, isSaving, save])

  return {
    data,
    isDirty,
    isSaving,
    updateData,
    save,
    enableAutoSave,
    ...offline
  }
}

export type { UseOfflineOptions, UseOfflineReturn }
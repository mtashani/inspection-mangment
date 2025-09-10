import { useState, useCallback, useRef } from 'react'

export interface OptimisticUpdate<T> {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: string
  entityId: string
  data: T
  originalData?: T
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  retryCount: number
}

export interface OptimisticUpdatesOptions {
  maxRetries?: number
  retryDelay?: number
  timeoutMs?: number
  onConflict?: (update: OptimisticUpdate<any>, serverData: any) => 'client' | 'server' | any
}

export class OptimisticUpdatesManager<T = any> {
  private updates = new Map<string, OptimisticUpdate<T>>()
  private listeners = new Set<(updates: OptimisticUpdate<T>[]) => void>()
  private options: Required<OptimisticUpdatesOptions>

  constructor(options: OptimisticUpdatesOptions = {}) {
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      timeoutMs: 10000,
      onConflict: () => 'server',
      ...options
    }
  }

  // Add optimistic update
  public addUpdate(
    type: OptimisticUpdate<T>['type'],
    entityType: string,
    entityId: string,
    data: T,
    originalData?: T
  ): string {
    const id = this.generateId()
    const update: OptimisticUpdate<T> = {
      id,
      type,
      entityType,
      entityId,
      data,
      originalData,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    }

    this.updates.set(id, update)
    this.notifyListeners()

    // Set timeout for update
    setTimeout(() => {
      const currentUpdate = this.updates.get(id)
      if (currentUpdate && currentUpdate.status === 'pending') {
        this.failUpdate(id, new Error('Update timeout'))
      }
    }, this.options.timeoutMs)

    return id
  }

  // Confirm update (when server responds successfully)
  public confirmUpdate(id: string, serverData?: T): void {
    const update = this.updates.get(id)
    if (!update) return

    if (serverData && this.hasConflict(update.data, serverData)) {
      this.handleConflict(update, serverData)
    } else {
      update.status = 'confirmed'
      // Remove confirmed updates after a short delay
      setTimeout(() => {
        this.updates.delete(id)
        this.notifyListeners()
      }, 1000)
    }

    this.notifyListeners()
  }

  // Fail update (when server responds with error)
  public failUpdate(id: string, error: Error): void {
    const update = this.updates.get(id)
    if (!update) return

    if (update.retryCount < this.options.maxRetries) {
      // Retry the update
      update.retryCount++
      setTimeout(() => {
        // Emit retry event
        this.notifyListeners()
      }, this.options.retryDelay * Math.pow(2, update.retryCount - 1))
    } else {
      // Mark as failed
      update.status = 'failed'
      this.notifyListeners()
    }
  }

  // Get all pending updates
  public getPendingUpdates(): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values()).filter(u => u.status === 'pending')
  }

  // Get all failed updates
  public getFailedUpdates(): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values()).filter(u => u.status === 'failed')
  }

  // Get updates for specific entity
  public getEntityUpdates(entityType: string, entityId: string): OptimisticUpdate<T>[] {
    return Array.from(this.updates.values()).filter(
      u => u.entityType === entityType && u.entityId === entityId
    )
  }

  // Apply optimistic updates to data
  public applyUpdates<TData>(
    data: TData[],
    entityType: string,
    getEntityId: (item: TData) => string
  ): TData[] {
    let result = [...data]
    const updates = Array.from(this.updates.values())
      .filter(u => u.entityType === entityType && u.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp)

    for (const update of updates) {
      switch (update.type) {
        case 'create':
          // Add new item if not already present
          if (!result.find(item => getEntityId(item) === update.entityId)) {
            result.push(update.data as TData)
          }
          break

        case 'update':
          // Update existing item
          const updateIndex = result.findIndex(item => getEntityId(item) === update.entityId)
          if (updateIndex !== -1) {
            result[updateIndex] = { ...result[updateIndex], ...update.data }
          }
          break

        case 'delete':
          // Remove item
          result = result.filter(item => getEntityId(item) !== update.entityId)
          break
      }
    }

    return result
  }

  // Retry failed update
  public retryUpdate(id: string): void {
    const update = this.updates.get(id)
    if (!update || update.status !== 'failed') return

    update.status = 'pending'
    update.retryCount = 0
    update.timestamp = Date.now()
    this.notifyListeners()
  }

  // Cancel update
  public cancelUpdate(id: string): void {
    this.updates.delete(id)
    this.notifyListeners()
  }

  // Clear all updates
  public clearUpdates(): void {
    this.updates.clear()
    this.notifyListeners()
  }

  // Subscribe to updates
  public subscribe(listener: (updates: OptimisticUpdate<T>[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Handle conflict between optimistic update and server data
  private handleConflict(update: OptimisticUpdate<T>, serverData: T): void {
    const resolution = this.options.onConflict(update, serverData)
    
    if (resolution === 'server') {
      // Accept server data
      update.data = serverData
      update.status = 'confirmed'
    } else if (resolution === 'client') {
      // Keep client data, mark as confirmed
      update.status = 'confirmed'
    } else {
      // Use custom resolution
      update.data = resolution
      update.status = 'confirmed'
    }
  }

  // Check if there's a conflict between client and server data
  private hasConflict(clientData: T, serverData: T): boolean {
    // Simple deep comparison - in real app, you might want more sophisticated conflict detection
    return JSON.stringify(clientData) !== JSON.stringify(serverData)
  }

  // Notify all listeners
  private notifyListeners(): void {
    const updates = Array.from(this.updates.values())
    this.listeners.forEach(listener => listener(updates))
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// React hook for optimistic updates
export function useOptimisticUpdates<T>(options?: OptimisticUpdatesOptions) {
  const managerRef = useRef<OptimisticUpdatesManager<T>>()
  const [updates, setUpdates] = useState<OptimisticUpdate<T>[]>([])

  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = new OptimisticUpdatesManager<T>(options)
  }

  // Subscribe to updates
  useState(() => {
    const unsubscribe = managerRef.current!.subscribe(setUpdates)
    return unsubscribe
  })

  // Add optimistic update
  const addUpdate = useCallback((
    type: OptimisticUpdate<T>['type'],
    entityType: string,
    entityId: string,
    data: T,
    originalData?: T
  ) => {
    return managerRef.current!.addUpdate(type, entityType, entityId, data, originalData)
  }, [])

  // Confirm update
  const confirmUpdate = useCallback((id: string, serverData?: T) => {
    managerRef.current!.confirmUpdate(id, serverData)
  }, [])

  // Fail update
  const failUpdate = useCallback((id: string, error: Error) => {
    managerRef.current!.failUpdate(id, error)
  }, [])

  // Apply updates to data
  const applyUpdates = useCallback(<TData>(
    data: TData[],
    entityType: string,
    getEntityId: (item: TData) => string
  ) => {
    return managerRef.current!.applyUpdates(data, entityType, getEntityId)
  }, [])

  // Retry failed update
  const retryUpdate = useCallback((id: string) => {
    managerRef.current!.retryUpdate(id)
  }, [])

  // Cancel update
  const cancelUpdate = useCallback((id: string) => {
    managerRef.current!.cancelUpdate(id)
  }, [])

  return {
    updates,
    pendingUpdates: updates.filter(u => u.status === 'pending'),
    failedUpdates: updates.filter(u => u.status === 'failed'),
    addUpdate,
    confirmUpdate,
    failUpdate,
    applyUpdates,
    retryUpdate,
    cancelUpdate,
    manager: managerRef.current
  }
}

// Hook for optimistic CRUD operations
export function useOptimisticCRUD<T extends { id: string }>(
  entityType: string,
  initialData: T[] = [],
  options?: OptimisticUpdatesOptions
) {
  const [data, setData] = useState<T[]>(initialData)
  const optimistic = useOptimisticUpdates<T>(options)

  // Apply optimistic updates to data
  const optimisticData = optimistic.applyUpdates(
    data,
    entityType,
    (item) => item.id
  )

  // Create item optimistically
  const createItem = useCallback(async (
    newItem: T,
    serverCreate: (item: T) => Promise<T>
  ) => {
    const updateId = optimistic.addUpdate('create', entityType, newItem.id, newItem)
    
    try {
      const serverItem = await serverCreate(newItem)
      optimistic.confirmUpdate(updateId, serverItem)
      
      // Update actual data
      setData(prev => {
        const exists = prev.find(item => item.id === serverItem.id)
        return exists ? prev : [...prev, serverItem]
      })
      
      return serverItem
    } catch (error) {
      optimistic.failUpdate(updateId, error as Error)
      throw error
    }
  }, [optimistic, entityType])

  // Update item optimistically
  const updateItem = useCallback(async (
    id: string,
    updates: Partial<T>,
    serverUpdate: (id: string, updates: Partial<T>) => Promise<T>
  ) => {
    const originalItem = data.find(item => item.id === id)
    if (!originalItem) throw new Error('Item not found')

    const updatedItem = { ...originalItem, ...updates }
    const updateId = optimistic.addUpdate('update', entityType, id, updatedItem, originalItem)
    
    try {
      const serverItem = await serverUpdate(id, updates)
      optimistic.confirmUpdate(updateId, serverItem)
      
      // Update actual data
      setData(prev => prev.map(item => item.id === id ? serverItem : item))
      
      return serverItem
    } catch (error) {
      optimistic.failUpdate(updateId, error as Error)
      throw error
    }
  }, [optimistic, entityType, data])

  // Delete item optimistically
  const deleteItem = useCallback(async (
    id: string,
    serverDelete: (id: string) => Promise<void>
  ) => {
    const originalItem = data.find(item => item.id === id)
    if (!originalItem) throw new Error('Item not found')

    const updateId = optimistic.addUpdate('delete', entityType, id, originalItem, originalItem)
    
    try {
      await serverDelete(id)
      optimistic.confirmUpdate(updateId)
      
      // Update actual data
      setData(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      optimistic.failUpdate(updateId, error as Error)
      throw error
    }
  }, [optimistic, entityType, data])

  return {
    data: optimisticData,
    actualData: data,
    pendingUpdates: optimistic.pendingUpdates,
    failedUpdates: optimistic.failedUpdates,
    createItem,
    updateItem,
    deleteItem,
    retryUpdate: optimistic.retryUpdate,
    cancelUpdate: optimistic.cancelUpdate
  }
}

export type { OptimisticUpdate, OptimisticUpdatesOptions }
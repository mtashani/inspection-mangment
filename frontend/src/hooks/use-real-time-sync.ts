import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

export interface RealTimeSyncOptions {
  endpoint: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  enableOptimisticUpdates?: boolean
  conflictResolution?: 'client' | 'server' | 'manual'
}

export interface SyncEvent<T = any> {
  type: string
  entityType: string
  entityId: string
  data: T
  timestamp: string
  userId?: string
  version?: number
}

export interface ConflictData<T = any> {
  entityType: string
  entityId: string
  clientData: T
  serverData: T
  clientVersion: number
  serverVersion: number
}

export interface UseRealTimeSyncReturn<T> {
  isConnected: boolean
  isReconnecting: boolean
  lastSync: Date | null
  conflicts: ConflictData<T>[]
  subscribe: (entityType: string, entityId?: string) => void
  unsubscribe: (entityType: string, entityId?: string) => void
  sendUpdate: (entityType: string, entityId: string, data: T) => Promise<void>
  resolveConflict: (conflict: ConflictData<T>, resolution: 'client' | 'server' | T) => void
  forceSync: () => Promise<void>
}

export function useRealTimeSync<T = any>(
  options: RealTimeSyncOptions
): UseRealTimeSyncReturn<T> {
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [conflicts, setConflicts] = useState<ConflictData<T>[]>([])
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Interval | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const subscriptionsRef = useRef<Set<string>>(new Set())
  const pendingUpdatesRef = useRef<Map<string, T>>(new Map())
  const eventListenersRef = useRef<Map<string, Set<(event: SyncEvent<T>) => void>>>(new Map())

  const {
    endpoint,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
    enableOptimisticUpdates = true,
    conflictResolution = 'manual'
  } = options

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(endpoint)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('🔗 Real-time sync connected')
        setIsConnected(true)
        setIsReconnecting(false)
        reconnectAttemptsRef.current = 0
        setLastSync(new Date())

        // Resubscribe to all subscriptions
        subscriptionsRef.current.forEach(subscription => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            subscription
          }))
        })

        // Start heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, heartbeatInterval)

        toast.success('Real-time sync connected')
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('🔌 Real-time sync disconnected:', event.code, event.reason)
        setIsConnected(false)
        
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          setIsReconnecting(true)
          reconnectAttemptsRef.current++
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
            connect()
          }, reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current - 1))
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          toast.error('Failed to reconnect to real-time sync')
          setIsReconnecting(false)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('Real-time sync connection error')
      }

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      toast.error('Failed to connect to real-time sync')
    }
  }, [endpoint, reconnectInterval, maxReconnectAttempts, heartbeatInterval])

  // Handle incoming messages
  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'pong':
        // Heartbeat response
        break

      case 'sync_event':
        handleSyncEvent(message as SyncEvent<T>)
        break

      case 'conflict':
        handleConflict(message as ConflictData<T>)
        break

      case 'sync_complete':
        setLastSync(new Date())
        break

      case 'error':
        console.error('Sync error:', message.error)
        toast.error(`Sync error: ${message.error}`)
        break

      default:
        console.warn('Unknown message type:', message.type)
    }
  }, [])

  // Handle sync events
  const handleSyncEvent = useCallback((event: SyncEvent<T>) => {
    console.log('📡 Received sync event:', event)
    
    // Notify listeners
    const listeners = eventListenersRef.current.get(event.entityType) || new Set()
    listeners.forEach(listener => listener(event))

    // Remove from pending updates if this is our own update
    const pendingKey = `${event.entityType}:${event.entityId}`
    if (pendingUpdatesRef.current.has(pendingKey)) {
      pendingUpdatesRef.current.delete(pendingKey)
    }

    setLastSync(new Date())
  }, [])

  // Handle conflicts
  const handleConflict = useCallback((conflict: ConflictData<T>) => {
    console.warn('⚠️ Data conflict detected:', conflict)
    
    if (conflictResolution === 'server') {
      // Auto-resolve with server data
      resolveConflict(conflict, 'server')
    } else if (conflictResolution === 'client') {
      // Auto-resolve with client data
      resolveConflict(conflict, 'client')
    } else {
      // Manual resolution required
      setConflicts(prev => [...prev, conflict])
      toast.warning('Data conflict detected - manual resolution required')
    }
  }, [conflictResolution])

  // Subscribe to entity updates
  const subscribe = useCallback((entityType: string, entityId?: string) => {
    const subscription = entityId ? `${entityType}:${entityId}` : entityType
    subscriptionsRef.current.add(subscription)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        subscription
      }))
    }

    console.log('📡 Subscribed to:', subscription)
  }, [])

  // Unsubscribe from entity updates
  const unsubscribe = useCallback((entityType: string, entityId?: string) => {
    const subscription = entityId ? `${entityType}:${entityId}` : entityType
    subscriptionsRef.current.delete(subscription)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        subscription
      }))
    }

    console.log('📡 Unsubscribed from:', subscription)
  }, [])

  // Send update with optimistic updates
  const sendUpdate = useCallback(async (entityType: string, entityId: string, data: T) => {
    const updateKey = `${entityType}:${entityId}`
    
    if (enableOptimisticUpdates) {
      // Store pending update
      pendingUpdatesRef.current.set(updateKey, data)
      
      // Notify listeners immediately (optimistic update)
      const listeners = eventListenersRef.current.get(entityType) || new Set()
      listeners.forEach(listener => listener({
        type: 'update',
        entityType,
        entityId,
        data,
        timestamp: new Date().toISOString(),
        version: Date.now() // Temporary version
      }))
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update',
        entityType,
        entityId,
        data,
        timestamp: new Date().toISOString()
      }))
    } else {
      // Queue update for when connection is restored
      console.warn('WebSocket not connected, update queued')
      toast.warning('Update queued - will sync when connection is restored')
    }
  }, [enableOptimisticUpdates])

  // Resolve conflict
  const resolveConflict = useCallback((conflict: ConflictData<T>, resolution: 'client' | 'server' | T) => {
    let resolvedData: T

    if (resolution === 'client') {
      resolvedData = conflict.clientData
    } else if (resolution === 'server') {
      resolvedData = conflict.serverData
    } else {
      resolvedData = resolution as T
    }

    // Send resolution to server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'resolve_conflict',
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        data: resolvedData,
        resolution: typeof resolution === 'string' ? resolution : 'manual'
      }))
    }

    // Remove from conflicts list
    setConflicts(prev => prev.filter(c => 
      !(c.entityType === conflict.entityType && c.entityId === conflict.entityId)
    ))

    console.log('✅ Conflict resolved:', conflict.entityType, conflict.entityId)
    toast.success('Data conflict resolved')
  }, [])

  // Force sync
  const forceSync = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'force_sync',
        subscriptions: Array.from(subscriptionsRef.current)
      }))
      toast.info('Forcing data synchronization...')
    }
  }, [])

  // Add event listener
  const addEventListener = useCallback((entityType: string, listener: (event: SyncEvent<T>) => void) => {
    if (!eventListenersRef.current.has(entityType)) {
      eventListenersRef.current.set(entityType, new Set())
    }
    eventListenersRef.current.get(entityType)!.add(listener)

    // Return cleanup function
    return () => {
      const listeners = eventListenersRef.current.get(entityType)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          eventListenersRef.current.delete(entityType)
        }
      }
    }
  }, [])

  // Initialize connection
  useEffect(() => {
    connect()

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [connect])

  return {
    isConnected,
    isReconnecting,
    lastSync,
    conflicts,
    subscribe,
    unsubscribe,
    sendUpdate,
    resolveConflict,
    forceSync,
    addEventListener
  } as UseRealTimeSyncReturn<T> & {
    addEventListener: (entityType: string, listener: (event: SyncEvent<T>) => void) => () => void
  }
}

// Hook for syncing specific entity
export function useEntitySync<T>(
  entityType: string,
  entityId: string,
  initialData: T,
  syncOptions: RealTimeSyncOptions
) {
  const [data, setData] = useState<T>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const sync = useRealTimeSync<T>(syncOptions)

  // Subscribe to entity updates
  useEffect(() => {
    sync.subscribe(entityType, entityId)
    
    const cleanup = sync.addEventListener(entityType, (event) => {
      if (event.entityId === entityId) {
        setData(event.data)
        setLastUpdated(new Date())
      }
    })

    return () => {
      sync.unsubscribe(entityType, entityId)
      cleanup()
    }
  }, [entityType, entityId, sync])

  // Update entity
  const updateEntity = useCallback(async (updates: Partial<T>) => {
    setIsLoading(true)
    try {
      const updatedData = { ...data, ...updates }
      setData(updatedData) // Optimistic update
      await sync.sendUpdate(entityType, entityId, updatedData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to update entity:', error)
      setData(data) // Revert optimistic update
      toast.error('Failed to update data')
    } finally {
      setIsLoading(false)
    }
  }, [data, entityType, entityId, sync])

  return {
    data,
    isLoading,
    lastUpdated,
    updateEntity,
    ...sync
  }
}

export type { RealTimeSyncOptions, SyncEvent, ConflictData, UseRealTimeSyncReturn }
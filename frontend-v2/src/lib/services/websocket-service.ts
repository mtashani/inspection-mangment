import { EventEmitter } from 'events'
import { wsDebugHelper } from '../debug/websocket-debug-helper'

// Debug helper for development
let debugLogger: any = null
if (process.env.NODE_ENV === 'development') {
  import('../debug/websocket-debug').then(module => {
    debugLogger = module.wsDebugger
  }).catch(() => {
    // Debug module not available, continue without it
  })
}

export interface NotificationData {
  id: number
  title: string
  message: string
  notification_type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  related_item_id?: string
  related_item_type?: string
  action_url?: string
  extra_data?: Record<string, any>
  created_at: string
  expires_at?: string
}

export interface WebSocketMessage {
  type: string
  data?: any
  timestamp: string
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private sessionId: string
  private authToken: string | null = null
  private isConnecting = false
  private isConnected = false
  private messageQueue: WebSocketMessage[] = []
  private heartbeatInterval: NodeJS.Timeout | null = null
  
  constructor() {
    super()
    this.sessionId = this.generateSessionId()
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Connect to the WebSocket server
   */
  async connect(token: string): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return
    }
    
    this.authToken = token
    this.isConnecting = true
    
    // Debug logging
    debugLogger?.logConnectionAttempt()
    
    try {
      const wsUrl = this.buildWebSocketUrl()
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      
    } catch (error) {
      const errorInfo = {
        message: error instanceof Error ? error.message : 'Failed to connect to WebSocket',
        type: 'connection_error',
        timestamp: new Date().toISOString(),
        url: this.buildWebSocketUrl()
      }
      
      console.error('❌ WebSocket connection error:', errorInfo)
      debugLogger?.logError(error, 'connection_attempt')
      this.isConnecting = false
      this.emit('connection_error', errorInfo)
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.isConnected = false
    this.isConnecting = false
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnected')
      this.ws = null
    }
    
    this.emit('disconnected')
  }
  
  /**
   * Send a message to the WebSocket server
   */
  send(message: WebSocketMessage): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message)
    }
  }
  
  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; connecting: boolean } {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting
    }
  }
  
  private buildWebSocketUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const wsUrl = baseUrl.replace('http', 'ws')
    return `${wsUrl}/api/v1/notifications/ws/notifications?token=${this.authToken}&session_id=${this.sessionId}`
  }
  
  private handleOpen(): void {
    console.log('✅ WebSocket connected')
    this.isConnected = true
    this.isConnecting = false
    this.reconnectAttempts = 0
    
    // Start heartbeat
    this.startHeartbeat()
    
    // Send queued messages
    this.processMessageQueue()
    
    this.emit('connected')
  }
  
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      switch (message.type) {
        case 'connection_established':
          console.log('🔗 WebSocket connection established:', message.data)
          break
          
        case 'notification':
          this.handleNotification(message.data)
          break
          
        case 'ping':
          this.handlePing()
          break
          
        default:
          console.log('📨 WebSocket message:', message)
      }
      
      this.emit('message', message)
      
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error)
    }
  }
  
  private handleClose(event: CloseEvent): void {
    console.log('🔌 WebSocket disconnected:', event.code, event.reason)
    this.isConnected = false
    this.isConnecting = false
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    this.emit('disconnected', event)
    
    // Attempt reconnection if not intentional disconnect
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }
  
  private handleError(error: Event): void {
    // Enhanced debug logging
    wsDebugHelper.log('error', 'WebSocketService', 'WebSocket error event received', error)
    debugLogger?.logError({ type: 'websocket_error', timestamp: Date.now() }, 'websocket_error_event')
    
    // Create comprehensive error information without circular references
    let errorInfo: any
    
    try {
      // Extract readable state mapping
      const getReadyStateText = (state: number): string => {
        switch (state) {
          case 0: return 'CONNECTING'
          case 1: return 'OPEN'
          case 2: return 'CLOSING'
          case 3: return 'CLOSED'
          default: return 'UNKNOWN'
        }
      }
      
      // Safely extract WebSocket target information
      let targetInfo = null
      if (error?.target) {
        const target = error.target as any
        targetInfo = {
          readyState: target.readyState ?? 'unknown',
          readyStateText: typeof target.readyState === 'number' ? getReadyStateText(target.readyState) : 'unknown',
          url: target.url ?? 'unknown',
          protocol: target.protocol ?? 'unknown'
        }
      }
      
      // Get current WebSocket state
      const currentWsState = this.ws ? {
        readyState: this.ws.readyState,
        readyStateText: getReadyStateText(this.ws.readyState),
        url: this.buildWebSocketUrl(),
        protocol: this.ws.protocol || 'none'
      } : null
      
      errorInfo = {
        message: 'WebSocket connection error detected',
        type: 'websocket_error',
        details: {
          eventType: error?.type || 'unknown',
          targetInfo,
          currentWebSocket: currentWsState,
          connectionStatus: {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            reconnectAttempts: this.reconnectAttempts
          }
        },
        timestamp: new Date().toISOString(),
        errorSource: 'WebSocketService.handleError'
      }
      
    } catch (extractError) {
      // Ultimate fallback - create minimal error info
      errorInfo = {
        message: 'WebSocket error occurred but details could not be extracted',
        type: 'websocket_error_fallback',
        details: {
          extractionError: extractError instanceof Error ? extractError.message : 'Unknown extraction error',
          fallbackReason: 'Failed to safely extract Event object properties',
          wsReadyState: this.ws?.readyState ?? 'unknown',
          connectionUrl: this.buildWebSocketUrl()
        },
        timestamp: new Date().toISOString(),
        errorSource: 'WebSocketService.handleError.fallback'
      }
    }
    
    // Log structured error (this should now show actual content instead of {})
    console.error('❌ WebSocket error:', errorInfo)
    wsDebugHelper.log('error', 'WebSocketService', 'Processed WebSocket error', errorInfo)
    
    // Emit structured error for React component
    this.emit('connection_error', errorInfo)
    
    // Update connection status
    this.isConnected = false
    this.isConnecting = false
  }
  
  private handleNotification(notificationData: NotificationData): void {
    console.log('🔔 New notification:', notificationData)
    this.emit('notification', notificationData)
  }
  
  private handlePing(): void {
    // Respond to server ping with pong
    this.send({
      type: 'pong',
      timestamp: new Date().toISOString()
    })
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'ping',
          timestamp: new Date().toISOString()
        })
      }
    }, 30000) // Ping every 30 seconds
  }
  
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }
  
  private scheduleReconnect(): void {
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      if (!this.isConnected && this.authToken) {
        this.connect(this.authToken)
      }
    }, delay)
  }
}

// Singleton instance
export const webSocketService = new WebSocketService()

// React hook for using WebSocket service
export function useWebSocket() {
  return webSocketService
}
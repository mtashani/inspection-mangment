import { EventEmitter } from 'events'

export interface WebSocketMessage {
  type: string
  data?: any
  timestamp: string
  id?: string
}

export interface WebSocketServiceOptions {
  url: string
  protocols?: string[]
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  messageTimeout?: number
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null
  private options: Required<WebSocketServiceOptions>
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Interval | null = null
  private messageQueue: WebSocketMessage[] = []
  private pendingMessages = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>()
  private isConnecting = false

  constructor(options: WebSocketServiceOptions) {
    super()
    this.options = {
      protocols: [],
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageTimeout: 10000,
      ...options
    }
  }

  // Connect to WebSocket
  public async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.url, this.options.protocols)

        this.ws.onopen = () => {
          console.log('🔗 WebSocket connected to:', this.options.url)
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason)
          this.isConnecting = false
          this.stopHeartbeat()
          this.emit('disconnected', { code: event.code, reason: event.reason })
          
          // Auto-reconnect if not a manual close
          if (event.code !== 1000 && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          this.emit('error', error)
          reject(error)
        }

      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  // Disconnect from WebSocket
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }

    // Reject all pending messages
    this.pendingMessages.forEach(({ reject, timeout }) => {
      clearTimeout(timeout)
      reject(new Error('WebSocket disconnected'))
    })
    this.pendingMessages.clear()
  }

  // Check if connected
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // Send message
  public async send(message: Omit<WebSocketMessage, 'timestamp' | 'id'>): Promise<void> {
    const fullMessage: WebSocketMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date().toISOString()
    }

    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(fullMessage))
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(fullMessage)
      console.warn('WebSocket not connected, message queued:', message.type)
    }
  }

  // Send message and wait for response
  public async sendAndWaitForResponse(
    message: Omit<WebSocketMessage, 'timestamp' | 'id'>,
    responseType?: string
  ): Promise<any> {
    const messageId = this.generateMessageId()
    const fullMessage: WebSocketMessage = {
      ...message,
      id: messageId,
      timestamp: new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(messageId)
        reject(new Error(`Message timeout: ${message.type}`))
      }, this.options.messageTimeout)

      // Store pending message
      this.pendingMessages.set(messageId, { resolve, reject, timeout })

      // Send message
      if (this.isConnected()) {
        this.ws!.send(JSON.stringify(fullMessage))
      } else {
        clearTimeout(timeout)
        this.pendingMessages.delete(messageId)
        reject(new Error('WebSocket not connected'))
      }
    })
  }

  // Subscribe to specific message types
  public subscribe(messageType: string, handler: (data: any) => void): () => void {
    this.on(messageType, handler)
    return () => this.off(messageType, handler)
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      // Handle response to pending message
      if (message.id && this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id)!
        clearTimeout(pending.timeout)
        this.pendingMessages.delete(message.id)
        pending.resolve(message.data)
        return
      }

      // Handle heartbeat
      if (message.type === 'ping') {
        this.send({ type: 'pong' })
        return
      }

      if (message.type === 'pong') {
        this.emit('heartbeat')
        return
      }

      // Emit message event
      this.emit('message', message)
      this.emit(message.type, message.data, message)

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
      this.emit('error', error)
    }
  }

  // Schedule reconnection
  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    )

    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts} in ${delay}ms`)

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('Reconnection failed:', error)
      }
    }, delay)
  }

  // Start heartbeat
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' })
      }
    }, this.options.heartbeatInterval)
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Process queued messages
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()!
      this.ws!.send(JSON.stringify(message))
    }
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Get connection stats
  public getStats() {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      pendingMessages: this.pendingMessages.size,
      url: this.options.url
    }
  }
}

// Singleton instance for global use
let globalWebSocketService: WebSocketService | null = null

export function getWebSocketService(options?: WebSocketServiceOptions): WebSocketService {
  if (!globalWebSocketService && options) {
    globalWebSocketService = new WebSocketService(options)
  }
  
  if (!globalWebSocketService) {
    throw new Error('WebSocket service not initialized. Provide options on first call.')
  }
  
  return globalWebSocketService
}

// Initialize WebSocket service with default options
export function initializeWebSocketService(options: WebSocketServiceOptions): WebSocketService {
  if (globalWebSocketService) {
    globalWebSocketService.disconnect()
  }
  
  globalWebSocketService = new WebSocketService(options)
  return globalWebSocketService
}

// Cleanup function
export function cleanupWebSocketService(): void {
  if (globalWebSocketService) {
    globalWebSocketService.disconnect()
    globalWebSocketService = null
  }
}

export type { WebSocketServiceOptions, WebSocketMessage }
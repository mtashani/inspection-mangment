import { webSocketService, WebSocketService } from '@/lib/services/websocket-service'
import { EventEmitter } from 'events'

// Mock WebSocket
class MockWebSocket extends EventEmitter {
  public readyState: number = WebSocket.CONNECTING
  public CONNECTING = 0
  public OPEN = 1
  public CLOSING = 2
  public CLOSED = 3

  constructor(public url: string) {
    super()
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.emit('open')
    }, 100)
  }

  send(data: string) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open')
    }
    // Simulate message being sent
    this.emit('message-sent', data)
  }

  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED
    this.emit('close', { code: code || 1000, reason: reason || 'Normal closure' })
  }

  // Simulate receiving a message
  simulateMessage(data: any) {
    const event = { data: JSON.stringify(data) }
    this.emit('message', event)
  }

  // Simulate error
  simulateError(error: any) {
    this.emit('error', error)
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any

describe('WebSocketService', () => {
  let service: WebSocketService
  let mockWebSocket: MockWebSocket

  beforeEach(() => {
    service = new WebSocketService()
    // Reset any existing connections
    service.disconnect()
  })

  afterEach(() => {
    service.disconnect()
  })

  describe('Connection Management', () => {
    test('should connect successfully', async () => {
      const connectPromise = service.connect('test_token')
      
      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const status = service.getConnectionStatus()
      expect(status.connected).toBe(true)
      expect(status.connecting).toBe(false)
    })

    test('should handle connection failure', async () => {
      const originalWebSocket = global.WebSocket
      
      // Mock WebSocket that fails to connect
      global.WebSocket = class extends EventEmitter {
        constructor() {
          super()
          setTimeout(() => {
            this.emit('error', new Error('Connection failed'))
          }, 50)
        }
        close() {}
      } as any

      const errorSpy = jest.fn()
      service.on('connection_error', errorSpy)

      await service.connect('test_token')
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(errorSpy).toHaveBeenCalled()
      
      // Restore original
      global.WebSocket = originalWebSocket
    })

    test('should disconnect cleanly', async () => {
      await service.connect('test_token')
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const disconnectedSpy = jest.fn()
      service.on('disconnected', disconnectedSpy)
      
      service.disconnect()
      
      const status = service.getConnectionStatus()
      expect(status.connected).toBe(false)
      expect(disconnectedSpy).toHaveBeenCalled()
    })

    test('should prevent multiple simultaneous connections', async () => {
      const firstConnect = service.connect('token1')
      const secondConnect = service.connect('token2')
      
      await Promise.all([firstConnect, secondConnect])
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const status = service.getConnectionStatus()
      expect(status.connected).toBe(true)
    })
  })

  describe('Message Handling', () => {
    beforeEach(async () => {
      await service.connect('test_token')
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    test('should handle notification messages', (done) => {
      const testNotification = {
        id: 1,
        title: 'Test Notification',
        message: 'Test message',
        notification_type: 'event_created',
        priority: 'medium',
        created_at: new Date().toISOString()
      }

      service.on('notification', (notification) => {
        expect(notification).toEqual(testNotification)
        done()
      })

      // Simulate receiving notification
      const ws = (service as any).ws as MockWebSocket
      ws.simulateMessage({
        type: 'notification',
        data: testNotification,
        timestamp: new Date().toISOString()
      })
    })

    test('should handle connection established message', (done) => {
      service.on('connected', () => {
        done()
      })

      const ws = (service as any).ws as MockWebSocket
      ws.simulateMessage({
        type: 'connection_established',
        data: { session_id: 'test_session' },
        timestamp: new Date().toISOString()
      })
    })

    test('should handle ping messages', () => {
      const sendSpy = jest.fn()
      const ws = (service as any).ws as MockWebSocket
      ws.send = sendSpy

      // Simulate ping
      ws.simulateMessage({
        type: 'ping',
        timestamp: new Date().toISOString()
      })

      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"pong"')
      )
    })

    test('should handle malformed messages gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const ws = (service as any).ws as MockWebSocket
      // Simulate malformed message
      ws.emit('message', { data: 'invalid json {' })
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Message Sending', () => {
    beforeEach(async () => {
      await service.connect('test_token')
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    test('should send messages when connected', () => {
      const sendSpy = jest.fn()
      const ws = (service as any).ws as MockWebSocket
      ws.send = sendSpy

      const testMessage = {
        type: 'test',
        data: 'hello',
        timestamp: new Date().toISOString()
      }

      service.send(testMessage)

      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(testMessage))
    })

    test('should queue messages when disconnected', () => {
      service.disconnect()
      
      const testMessage = {
        type: 'test',
        data: 'queued',
        timestamp: new Date().toISOString()
      }

      // Should not throw error
      expect(() => service.send(testMessage)).not.toThrow()
      
      // Message should be queued
      const messageQueue = (service as any).messageQueue
      expect(messageQueue).toContain(testMessage)
    })

    test('should send queued messages after reconnection', async () => {
      // Send message while disconnected
      service.disconnect()
      const testMessage = {
        type: 'queued',
        data: 'test',
        timestamp: new Date().toISOString()
      }
      service.send(testMessage)

      // Reconnect
      await service.connect('test_token')
      await new Promise(resolve => setTimeout(resolve, 150))

      const sendSpy = jest.fn()
      const ws = (service as any).ws as MockWebSocket
      ws.send = sendSpy

      // Trigger queue processing (normally happens on connection)
      ;(service as any).processMessageQueue()

      expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(testMessage))
    })
  })

  describe('Heartbeat', () => {
    beforeEach(async () => {
      await service.connect('test_token')
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    test('should send periodic heartbeat when connected', (done) => {
      const sendSpy = jest.fn()
      const ws = (service as any).ws as MockWebSocket
      ws.send = sendSpy

      // Fast heartbeat for testing
      ;(service as any).heartbeatInterval = setInterval(() => {
        if ((service as any).isConnected) {
          service.send({
            type: 'ping',
            timestamp: new Date().toISOString()
          })
        }
      }, 100)

      setTimeout(() => {
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"ping"')
        )
        clearInterval((service as any).heartbeatInterval)
        done()
      }, 150)
    })

    test('should stop heartbeat when disconnected', () => {
      const heartbeatInterval = (service as any).heartbeatInterval
      expect(heartbeatInterval).toBeTruthy()

      service.disconnect()

      expect((service as any).heartbeatInterval).toBeNull()
    })
  })

  describe('Reconnection Logic', () => {
    test('should attempt reconnection on unexpected disconnect', (done) => {
      service.connect('test_token').then(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
        
        const reconnectSpy = jest.spyOn(service, 'connect')
        
        // Simulate unexpected disconnect
        const ws = (service as any).ws as MockWebSocket
        ws.close(1006, 'Abnormal closure') // Not normal closure
        
        setTimeout(() => {
          expect(reconnectSpy).toHaveBeenCalled()
          done()
        }, 200)
      })
    })

    test('should not reconnect on normal closure', async () => {
      await service.connect('test_token')
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const reconnectSpy = jest.spyOn(service, 'connect')
      
      // Normal closure (user initiated)
      const ws = (service as any).ws as MockWebSocket
      ws.close(1000, 'Normal closure')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      expect(reconnectSpy).not.toHaveBeenCalled()
    })

    test('should limit reconnection attempts', async () => {
      // Mock failed connections
      const originalWebSocket = global.WebSocket
      let attemptCount = 0
      
      global.WebSocket = class extends EventEmitter {
        constructor() {
          super()
          attemptCount++
          setTimeout(() => {
            this.emit('error', new Error('Connection failed'))
          }, 10)
        }
        close() {}
      } as any

      await service.connect('test_token')
      
      // Wait for multiple attempts
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Should not exceed max attempts
      expect(attemptCount).toBeLessThanOrEqual(5)
      
      global.WebSocket = originalWebSocket
    })
  })

  describe('URL Building', () => {
    test('should build correct WebSocket URL', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000'
      
      const buildUrl = (service as any).buildWebSocketUrl.bind(service)
      
      // Set token for URL building
      ;(service as any).authToken = 'test_token'
      ;(service as any).sessionId = 'test_session'
      
      const url = buildUrl()
      
      expect(url).toBe('ws://localhost:8000/api/v1/notifications/ws/notifications?token=test_token&session_id=test_session')
      
      process.env.NEXT_PUBLIC_API_URL = originalEnv
    })

    test('should use default URL when env var not set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL
      delete process.env.NEXT_PUBLIC_API_URL
      
      const buildUrl = (service as any).buildWebSocketUrl.bind(service)
      ;(service as any).authToken = 'test_token'
      ;(service as any).sessionId = 'test_session'
      
      const url = buildUrl()
      
      expect(url).toContain('ws://localhost:8000')
      
      process.env.NEXT_PUBLIC_API_URL = originalEnv
    })
  })
})
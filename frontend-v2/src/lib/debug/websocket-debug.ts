// WebSocket Debug Utility
// This utility helps diagnose WebSocket connection issues
// Can be used in browser console for debugging

interface WebSocketDebugInfo {
  connectionStatus: {
    connected: boolean
    connecting: boolean
    readyState?: number
    url?: string
  }
  errorHistory: Array<{
    timestamp: string
    type: string
    message: string
    details?: any
  }>
  connectionAttempts: number
  lastError?: any
}

class WebSocketDebugger {
  private errorHistory: Array<any> = []
  private connectionAttempts = 0
  private lastError: any = null

  logError(error: any, context: string = 'unknown') {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      context,
      type: typeof error,
      message: this.extractErrorMessage(error),
      details: this.safelyExtractDetails(error)
    }
    
    this.errorHistory.push(errorEntry)
    this.lastError = errorEntry
    
    console.group('🔍 WebSocket Debug - Error Logged')
    console.log('Context:', context)
    console.log('Error Entry:', errorEntry)
    console.groupEnd()
  }

  logConnectionAttempt() {
    this.connectionAttempts++
    console.log(`🔌 WebSocket Connection Attempt #${this.connectionAttempts}`)
  }

  getDebugInfo(): WebSocketDebugInfo {
    const service = (window as any).webSocketService
    
    return {
      connectionStatus: {
        connected: service?.isConnected || false,
        connecting: service?.isConnecting || false,
        readyState: service?.ws?.readyState,
        url: service?.buildWebSocketUrl?.()
      },
      errorHistory: this.errorHistory,
      connectionAttempts: this.connectionAttempts,
      lastError: this.lastError
    }
  }

  clearHistory() {
    this.errorHistory = []
    this.connectionAttempts = 0
    this.lastError = null
    console.log('🧹 WebSocket debug history cleared')
  }

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error instanceof Error) return error.message
    if (error && typeof error === 'object') {
      return error.message || error.type || 'Unknown error object'
    }
    return `Unknown error type: ${typeof error}`
  }

  private safelyExtractDetails(error: any): any {
    try {
      if (!error || typeof error !== 'object') return error
      
      // For Event objects, extract specific properties
      if (error.type && error.target) {
        return {
          type: error.type,
          target: {
            readyState: error.target.readyState,
            url: error.target.url
          },
          timeStamp: error.timeStamp
        }
      }
      
      // For other objects, try to safely extract properties
      const details: any = {}
      for (const key in error) {
        try {
          const value = error[key]
          if (typeof value !== 'function') {
            details[key] = value
          }
        } catch (e) {
          details[key] = `[Error accessing ${key}]`
        }
      }
      return details
      
    } catch (e) {
      return { extractionError: 'Failed to extract error details' }
    }
  }

  // Test various error scenarios
  testErrorHandling() {
    console.log('🧪 Testing WebSocket error handling...')
    
    // Test undefined error
    this.logError(undefined, 'undefined test')
    
    // Test Event-like object
    this.logError({
      type: 'error',
      target: { readyState: 3, url: 'ws://localhost:8000' },
      timeStamp: Date.now()
    }, 'event-like test')
    
    // Test circular reference
    const circular: any = { name: 'test' }
    circular.self = circular
    this.logError(circular, 'circular reference test')
    
    // Test Error instance
    this.logError(new Error('Test error message'), 'Error instance test')
    
    console.log('✅ Error handling tests completed')
  }
}

// Make debugger available globally
declare global {
  interface Window {
    wsDebugger: WebSocketDebugger
  }
}

const wsDebugger = new WebSocketDebugger()
if (typeof window !== 'undefined') {
  window.wsDebugger = wsDebugger
}

export { wsDebugger, WebSocketDebugger }

// Console helper functions
export const WebSocketDebugHelpers = {
  // Quick access functions for console debugging
  status: () => wsDebugger.getDebugInfo(),
  errors: () => wsDebugger.getDebugInfo().errorHistory,
  clear: () => wsDebugger.clearHistory(),
  test: () => wsDebugger.testErrorHandling(),
  
  // Service status
  serviceStatus: () => {
    const service = (window as any).webSocketService
    if (!service) return 'WebSocket service not found'
    
    return {
      connected: service.isConnected,
      connecting: service.isConnecting,
      readyState: service.ws?.readyState,
      readyStateText: service.ws ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][service.ws.readyState] : 'N/A'
    }
  }
}

// Make helpers available in console
if (typeof window !== 'undefined') {
  (window as any).wsDebug = WebSocketDebugHelpers
  console.log('🔧 WebSocket Debug Helpers loaded. Use wsDebug.status(), wsDebug.errors(), wsDebug.test() in console')
}
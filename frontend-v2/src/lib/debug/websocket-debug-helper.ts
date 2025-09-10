/**
 * WebSocket Debug Helper
 * 
 * Provides debugging utilities for WebSocket connections to help
 * troubleshoot connection issues and monitor error handling.
 */

interface DebugLogEntry {
  timestamp: string
  type: 'info' | 'warning' | 'error' | 'success'
  source: string
  message: string
  data?: any
}

class WebSocketDebugHelper {
  private logs: DebugLogEntry[] = []
  private maxLogs = 100
  private enabled = process.env.NODE_ENV === 'development'

  /**
   * Log a debug message
   */
  log(type: DebugLogEntry['type'], source: string, message: string, data?: any): void {
    if (!this.enabled) return

    const entry: DebugLogEntry = {
      timestamp: new Date().toISOString(),
      type,
      source,
      message,
      data: data ? this.safeStringify(data) : undefined
    }

    this.logs.unshift(entry)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Console output with color coding
    const emoji = {
      info: '📝',
      warning: '⚠️',
      error: '❌',
      success: '✅'
    }

    const style = {
      info: 'color: #0ea5e9',
      warning: 'color: #f59e0b',
      error: 'color: #ef4444',
      success: 'color: #10b981'
    }

    console.log(
      `%c${emoji[type]} [${source}] ${message}`,
      style[type],
      data ? data : ''
    )
  }

  /**
   * Safely stringify objects, handling circular references
   */
  private safeStringify(obj: any): any {
    try {
      // If it's already a string or primitive, return as-is
      if (typeof obj !== 'object' || obj === null) {
        return obj
      }

      // For Event objects and other non-serializable objects
      if (obj instanceof Event) {
        return {
          type: obj.type,
          target: obj.target ? {
            constructor: obj.target.constructor.name,
            readyState: (obj.target as any).readyState,
            url: (obj.target as any).url
          } : null,
          timestamp: Date.now()
        }
      }

      // For WebSocket objects
      if (obj instanceof WebSocket) {
        return {
          readyState: obj.readyState,
          url: obj.url,
          protocol: obj.protocol,
          extensions: obj.extensions
        }
      }

      // Regular object - use JSON.stringify with circular reference handler
      return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (value instanceof Event) {
          return '[Event Object]'
        }
        if (value instanceof WebSocket) {
          return '[WebSocket Object]'
        }
        return value
      }))
    } catch (error) {
      return {
        error: 'Failed to stringify object',
        type: typeof obj,
        constructor: obj?.constructor?.name || 'unknown'
      }
    }
  }

  /**
   * Get recent logs
   */
  getLogs(count = 20): DebugLogEntry[] {
    return this.logs.slice(0, count)
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: DebugLogEntry['type']): DebugLogEntry[] {
    return this.logs.filter(log => log.type === type)
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
    this.log('info', 'DebugHelper', 'Debug logs cleared')
  }

  /**
   * Export logs as text
   */
  exportLogs(): string {
    return this.logs
      .map(log => `[${log.timestamp}] ${log.type.toUpperCase()} ${log.source}: ${log.message}${log.data ? ` | Data: ${JSON.stringify(log.data)}` : ''}`)
      .join('\n')
  }

  /**
   * Get connection status summary
   */
  getConnectionSummary(webSocketService: any): object {
    const status = webSocketService?.getConnectionStatus?.() || { connected: false, connecting: false }
    
    return {
      status,
      recentErrors: this.getLogsByType('error').slice(0, 5),
      recentWarnings: this.getLogsByType('warning').slice(0, 3),
      totalLogs: this.logs.length,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Test error handling with sample errors
   */
  testErrorHandling(): void {
    this.log('info', 'DebugTester', 'Starting error handling tests...')

    // Test 1: String error
    setTimeout(() => {
      this.log('error', 'DebugTester', 'Test string error', 'Sample string error')
    }, 100)

    // Test 2: Object error
    setTimeout(() => {
      this.log('error', 'DebugTester', 'Test object error', {
        message: 'Sample object error',
        code: 1006,
        details: { test: true }
      })
    }, 200)

    // Test 3: Undefined/null error
    setTimeout(() => {
      this.log('error', 'DebugTester', 'Test undefined error', undefined)
    }, 300)

    // Test 4: Circular reference object
    setTimeout(() => {
      const circular: any = { name: 'test' }
      circular.self = circular
      this.log('error', 'DebugTester', 'Test circular reference error', circular)
    }, 400)

    setTimeout(() => {
      this.log('success', 'DebugTester', 'Error handling tests completed')
    }, 500)
  }

  /**
   * Enable/disable debug logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.log('info', 'DebugHelper', `Debug logging ${enabled ? 'enabled' : 'disabled'}`)
  }
}

// Singleton instance
export const wsDebugHelper = new WebSocketDebugHelper()

// Console utilities for browser debugging
if (typeof window !== 'undefined') {
  (window as any).wsDebugHelper = {
    logs: () => wsDebugHelper.getLogs(),
    errors: () => wsDebugHelper.getLogsByType('error'),
    clear: () => wsDebugHelper.clearLogs(),
    export: () => wsDebugHelper.exportLogs(),
    test: () => wsDebugHelper.testErrorHandling(),
    status: (service?: any) => wsDebugHelper.getConnectionSummary(service)
  }
}

export default wsDebugHelper
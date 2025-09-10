// Debugging and logging utilities

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: number
  url: string
  userAgent: string
}

class DebugService {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private isEnabled: boolean

  constructor() {
    this.isEnabled = this.shouldEnableDebug()
  }

  private shouldEnableDebug(): boolean {
    return (
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' ||
      (typeof window !== 'undefined' && window.location.search.includes('debug=true'))
    )
  }

  private createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry)
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Store in localStorage for persistence
    this.storeLogsLocally()
  }

  debug(message: string, data?: unknown): void {
    if (!this.isEnabled) return

    const entry = this.createLogEntry('debug', message, data)
    this.addLog(entry)
    console.debug(`[DEBUG] ${message}`, data)
  }

  info(message: string, data?: unknown): void {
    if (!this.isEnabled) return

    const entry = this.createLogEntry('info', message, data)
    this.addLog(entry)
    console.info(`[INFO] ${message}`, data)
  }

  warn(message: string, data?: unknown): void {
    if (!this.isEnabled) return

    const entry = this.createLogEntry('warn', message, data)
    this.addLog(entry)
    console.warn(`[WARN] ${message}`, data)
  }

  error(message: string, data?: unknown): void {
    if (!this.isEnabled) return

    const entry = this.createLogEntry('error', message, data)
    this.addLog(entry)
    console.error(`[ERROR] ${message}`, data)
  }

  // Get all logs
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('debug_logs')
    }
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Store logs in localStorage
  private storeLogsLocally(): void {
    if (typeof window === 'undefined') return

    try {
      // Store only the last 100 logs to avoid localStorage quota issues
      const logsToStore = this.logs.slice(-100)
      localStorage.setItem('debug_logs', JSON.stringify(logsToStore))
    } catch (error) {
      console.warn('Failed to store debug logs:', error)
    }
  }

  // Load logs from localStorage
  loadStoredLogs(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('debug_logs')
      if (stored) {
        const logs = JSON.parse(stored)
        this.logs = [...logs, ...this.logs]
      }
    } catch (error) {
      console.warn('Failed to load stored debug logs:', error)
    }
  }

  // Performance timing
  time(label: string): void {
    if (!this.isEnabled) return
    console.time(label)
  }

  timeEnd(label: string): void {
    if (!this.isEnabled) return
    console.timeEnd(label)
  }

  // Group logging
  group(label: string): void {
    if (!this.isEnabled) return
    console.group(label)
  }

  groupEnd(): void {
    if (!this.isEnabled) return
    console.groupEnd()
  }

  // Table logging for objects/arrays
  table(data: unknown): void {
    if (!this.isEnabled) return
    console.table(data)
  }

  // Assert logging
  assert(condition: boolean, message: string, data?: unknown): void {
    if (!this.isEnabled) return
    
    if (!condition) {
      this.error(`Assertion failed: ${message}`, data)
      console.assert(condition, message, data)
    }
  }

  // Count logging
  count(label?: string): void {
    if (!this.isEnabled) return
    console.count(label)
  }

  countReset(label?: string): void {
    if (!this.isEnabled) return
    console.countReset(label)
  }
}

// Export singleton instance
export const debug = new DebugService()

// Load stored logs on initialization
if (typeof window !== 'undefined') {
  debug.loadStoredLogs()
}

// Development helper functions
export function logComponentRender(componentName: string, props?: unknown): void {
  debug.debug(`Component rendered: ${componentName}`, props)
}

export function logApiCall(method: string, url: string, data?: unknown): void {
  debug.info(`API Call: ${method} ${url}`, data)
}

export function logApiResponse(method: string, url: string, status: number, data?: unknown): void {
  debug.info(`API Response: ${method} ${url} - ${status}`, data)
}

export function logUserAction(action: string, data?: unknown): void {
  debug.info(`User Action: ${action}`, data)
}

// React hook for debugging
export function useDebug() {
  return {
    debug: debug.debug.bind(debug),
    info: debug.info.bind(debug),
    warn: debug.warn.bind(debug),
    error: debug.error.bind(debug),
    time: debug.time.bind(debug),
    timeEnd: debug.timeEnd.bind(debug),
    group: debug.group.bind(debug),
    groupEnd: debug.groupEnd.bind(debug),
    table: debug.table.bind(debug),
    assert: debug.assert.bind(debug),
    count: debug.count.bind(debug),
    countReset: debug.countReset.bind(debug),
    getLogs: debug.getLogs.bind(debug),
    clearLogs: debug.clearLogs.bind(debug),
    exportLogs: debug.exportLogs.bind(debug),
  }
}
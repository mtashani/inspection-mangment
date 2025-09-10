// Error handling utilities and recovery mechanisms

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Error classification
export function classifyError(error: unknown): {
  type: 'network' | 'api' | 'validation' | 'client' | 'unknown'
  message: string
  statusCode?: number
  retryable: boolean
} {
  if (error instanceof NetworkError) {
    return {
      type: 'network',
      message: error.message,
      retryable: true
    }
  }

  if (error instanceof ApiError) {
    return {
      type: 'api',
      message: error.message,
      statusCode: error.statusCode,
      retryable: error.statusCode >= 500 || error.statusCode === 408
    }
  }

  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      retryable: false
    }
  }

  if (error instanceof Error) {
    return {
      type: 'client',
      message: error.message,
      retryable: false
    }
  }

  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    retryable: false
  }
}

// Retry mechanism
export class RetryManager {
  private retryCount = 0
  private maxRetries: number
  private baseDelay: number
  private maxDelay: number

  constructor(
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000
  ) {
    this.maxRetries = maxRetries
    this.baseDelay = baseDelay
    this.maxDelay = maxDelay
  }

  async execute<T>(
    operation: () => Promise<T>,
    shouldRetry?: (error: unknown) => boolean
  ): Promise<T> {
    try {
      const result = await operation()
      this.retryCount = 0 // Reset on success
      return result
    } catch (error) {
      const errorInfo = classifyError(error)
      
      if (
        this.retryCount < this.maxRetries &&
        (shouldRetry ? shouldRetry(error) : errorInfo.retryable)
      ) {
        this.retryCount++
        const delay = Math.min(
          this.baseDelay * Math.pow(2, this.retryCount - 1),
          this.maxDelay
        )
        
        console.warn(
          `Retrying operation (attempt ${this.retryCount}/${this.maxRetries}) after ${delay}ms:`,
          error
        )
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.execute(operation, shouldRetry)
      }
      
      throw error
    }
  }

  reset() {
    this.retryCount = 0
  }

  get currentRetryCount() {
    return this.retryCount
  }
}

// Network status detection
export class NetworkStatusManager {
  private listeners: Set<(online: boolean) => void> = new Set()
  private _isOnline = navigator.onLine

  constructor() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  private handleOnline = () => {
    this._isOnline = true
    this.notifyListeners(true)
  }

  private handleOffline = () => {
    this._isOnline = false
    this.notifyListeners(false)
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online))
  }

  get isOnline() {
    return this._isOnline
  }

  addListener(listener: (online: boolean) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      return response.ok
    } catch {
      return false
    }
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.listeners.clear()
  }
}

// Global error handler
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private errorQueue: Array<{ error: Error; timestamp: number }> = []
  private maxQueueSize = 50

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  private constructor() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    
    // Handle uncaught errors
    window.addEventListener('error', this.handleUncaughtError)
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason)
    this.logError(new Error(`Unhandled promise rejection: ${event.reason}`))
    
    // Prevent the default browser behavior
    event.preventDefault()
  }

  private handleUncaughtError = (event: ErrorEvent) => {
    console.error('Uncaught error:', event.error)
    this.logError(event.error || new Error(event.message))
  }

  logError(error: Error) {
    // Add to queue
    this.errorQueue.push({
      error,
      timestamp: Date.now()
    })

    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }

    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error)
    }
  }

  private async reportError(error: Error) {
    try {
      // Example: Send to error tracking service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: error.message,
      //     stack: error.stack,
      //     timestamp: Date.now(),
      //     userAgent: navigator.userAgent,
      //     url: window.location.href
      //   })
      // })
      console.log('Error would be reported to tracking service:', error)
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  getRecentErrors(limit = 10) {
    return this.errorQueue
      .slice(-limit)
      .map(({ error, timestamp }) => ({
        message: error.message,
        stack: error.stack,
        timestamp: new Date(timestamp).toISOString()
      }))
  }

  clearErrors() {
    this.errorQueue = []
  }
}

// Initialize global error handler
export const globalErrorHandler = GlobalErrorHandler.getInstance()

// Error recovery strategies
export const errorRecoveryStrategies = {
  // Refresh the page
  refreshPage: () => {
    window.location.reload()
  },

  // Navigate to home
  goHome: () => {
    window.location.href = '/dashboard'
  },

  // Clear local storage and refresh
  clearStorageAndRefresh: () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  },

  // Retry with exponential backoff
  retryWithBackoff: async <T>(
    operation: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> => {
    const retryManager = new RetryManager(maxRetries)
    return retryManager.execute(operation)
  }
}

// Hook for error recovery
export function useErrorRecovery() {
  return {
    classifyError,
    retryWithBackoff: errorRecoveryStrategies.retryWithBackoff,
    refreshPage: errorRecoveryStrategies.refreshPage,
    goHome: errorRecoveryStrategies.goHome,
    clearStorageAndRefresh: errorRecoveryStrategies.clearStorageAndRefresh
  }
}
// Error tracking and monitoring utilities

interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  url: string
  userAgent: string
  timestamp: number
  userId?: string
  sessionId: string
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url: string
  sessionId: string
}

class MonitoringService {
  private sessionId: string
  private userId?: string
  private isEnabled: boolean
  private isInitialized: boolean = false

  constructor() {
    // Don't generate session ID in constructor to avoid hydration mismatch
    this.sessionId = 'pending-hydration'
    this.isEnabled = this.shouldEnableMonitoring()
    
    // Initialize only on client side after hydration
    if (typeof window !== 'undefined') {
      this.initializeClient()
    }
  }

  private initializeClient(): void {
    if (this.isInitialized) return
    
    // Generate session ID only on client side
    this.sessionId = this.generateSessionId()
    this.isInitialized = true
    
    if (this.isEnabled) {
      this.setupGlobalErrorHandlers()
      this.setupUnhandledRejectionHandler()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private shouldEnableMonitoring(): boolean {
    return (
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true'
    )
  }

  private setupGlobalErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
      })
    })
  }

  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        userId: this.userId,
        sessionId: this.sessionId,
      })
    })
  }

  setUserId(userId: string): void {
    this.initializeClient() // Ensure client is initialized
    this.userId = userId
  }

  captureError(errorInfo: Partial<ErrorInfo> | Error | any): void {
    if (!this.isEnabled) return
    
    this.initializeClient() // Ensure client is initialized

    // Handle different error types
    let processedErrorInfo: Partial<ErrorInfo>
    
    if (errorInfo instanceof Error) {
      // Handle Error objects
      processedErrorInfo = {
        message: errorInfo.message,
        stack: errorInfo.stack,
      }
    } else if (typeof errorInfo === 'string') {
      // Handle string errors
      processedErrorInfo = {
        message: errorInfo,
      }
    } else if (errorInfo && typeof errorInfo === 'object') {
      // Handle error info objects
      processedErrorInfo = errorInfo
    } else {
      // Handle unknown error types
      processedErrorInfo = {
        message: `Unknown error type: ${typeof errorInfo}`,
        stack: JSON.stringify(errorInfo, null, 2),
      }
    }

    const fullErrorInfo: ErrorInfo = {
      message: processedErrorInfo.message || 'Unknown error',
      stack: processedErrorInfo.stack,
      componentStack: processedErrorInfo.componentStack,
      url: processedErrorInfo.url || (typeof window !== 'undefined' ? window.location.href : ''),
      userAgent: processedErrorInfo.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
      timestamp: processedErrorInfo.timestamp || Date.now(),
      userId: processedErrorInfo.userId || this.userId,
      sessionId: processedErrorInfo.sessionId || this.sessionId,
    }

    // Log to console in development with more details
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Error Captured by Monitoring Service')
      console.error('Message:', fullErrorInfo.message || 'No message')
      if (fullErrorInfo.stack) {
        console.error('Stack:', fullErrorInfo.stack)
      }
      if (fullErrorInfo.componentStack) {
        console.error('Component Stack:', fullErrorInfo.componentStack)
      }
      // Safely log error info by converting to string
      try {
        console.error('Full Error Info:', JSON.stringify(fullErrorInfo, null, 2))
      } catch (stringifyError) {
        console.error('Full Error Info (raw):', fullErrorInfo)
      }
      console.groupEnd()
    }

    // Send to monitoring service (implement based on your monitoring solution)
    this.sendToMonitoringService(fullErrorInfo)
  }

  capturePerformanceMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'url' | 'sessionId'>): void {
    if (!this.isEnabled) return
    
    this.initializeClient() // Ensure client is initialized

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      sessionId: this.sessionId,
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance metric:', fullMetric)
    }

    // Send to monitoring service
    this.sendPerformanceMetric(fullMetric)
  }

  private async sendToMonitoringService(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Replace with your actual monitoring service endpoint
      const endpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT
      
      if (!endpoint) {
        // Fallback: store in localStorage for debugging
        this.storeErrorLocally(errorInfo)
        return
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'error',
          data: errorInfo,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      // Prevent infinite loops by not calling captureError again
      if (process.env.NODE_ENV === 'development') {
        console.warn('❌ Failed to send error to monitoring service:', {
          error: error instanceof Error ? error.message : error,
          originalError: errorInfo.message
        })
      }
      this.storeErrorLocally(errorInfo)
    }
  }

  private async sendPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const endpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT
      
      if (!endpoint) {
        this.storeMetricLocally(metric)
        return
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'performance',
          data: metric,
        }),
      })
    } catch (error) {
      console.warn('Failed to send performance metric:', error)
      this.storeMetricLocally(metric)
    }
  }

  private storeErrorLocally(errorInfo: ErrorInfo): void {
    if (typeof window === 'undefined') return

    try {
      const errors = JSON.parse(localStorage.getItem('monitoring_errors') || '[]')
      
      // Add timestamp for debugging
      const errorWithTimestamp = {
        ...errorInfo,
        storedAt: new Date().toISOString()
      }
      
      errors.push(errorWithTimestamp)
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50)
      }
      
      localStorage.setItem('monitoring_errors', JSON.stringify(errors))
      
      if (process.env.NODE_ENV === 'development') {
        console.info('💾 Error stored locally. Total errors:', errors.length)
      }
    } catch (error) {
      // Last resort: just log to console without trying to store
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Failed to store error locally:', {
          error: error instanceof Error ? error.message : error,
          originalError: errorInfo.message
        })
      }
    }
  }

  private storeMetricLocally(metric: PerformanceMetric): void {
    if (typeof window === 'undefined') return

    try {
      const metrics = JSON.parse(localStorage.getItem('monitoring_metrics') || '[]')
      metrics.push(metric)
      
      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100)
      }
      
      localStorage.setItem('monitoring_metrics', JSON.stringify(metrics))
    } catch (error) {
      console.warn('Failed to store metric locally:', error)
    }
  }

  // Get stored errors for debugging
  getStoredErrors(): ErrorInfo[] {
    if (typeof window === 'undefined') return []
    
    try {
      return JSON.parse(localStorage.getItem('monitoring_errors') || '[]')
    } catch {
      return []
    }
  }

  // Get stored metrics for debugging
  getStoredMetrics(): PerformanceMetric[] {
    if (typeof window === 'undefined') return []
    
    try {
      return JSON.parse(localStorage.getItem('monitoring_metrics') || '[]')
    } catch {
      return []
    }
  }

  // Clear stored data
  clearStoredData(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('monitoring_errors')
    localStorage.removeItem('monitoring_metrics')
    
    if (process.env.NODE_ENV === 'development') {
      console.info('🧹 Monitoring data cleared')
    }
  }

  // Temporarily disable monitoring (useful for debugging)
  disable(): void {
    this.isEnabled = false
    if (process.env.NODE_ENV === 'development') {
      console.info('⏸️ Monitoring disabled')
    }
  }

  // Re-enable monitoring
  enable(): void {
    this.isEnabled = this.shouldEnableMonitoring()
    if (process.env.NODE_ENV === 'development') {
      console.info(`▶️ Monitoring ${this.isEnabled ? 'enabled' : 'could not be enabled'}`)
    }
  }

  // Get monitoring status
  getStatus(): { enabled: boolean; sessionId: string; userId?: string; errorCount: number } {
    // Only initialize client if we're in browser environment
    if (typeof window !== 'undefined') {
      this.initializeClient() // Ensure client is initialized
    }
    return {
      enabled: this.isEnabled,
      sessionId: this.sessionId,
      userId: this.userId,
      errorCount: typeof window !== 'undefined' ? this.getStoredErrors().length : 0
    }
  }
}

// Export singleton instance
export const monitoring = new MonitoringService()

// React Error Boundary helper
export function captureComponentError(error: Error, errorInfo: { componentStack: string }): void {
  monitoring.captureError({
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
  })
}
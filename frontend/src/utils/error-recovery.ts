import { toast } from 'sonner'

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryCondition?: (error: Error, attempt: number) => boolean
  onRetry?: (error: Error, attempt: number) => void
  onMaxRetriesReached?: (error: Error) => void
}

export interface CircuitBreakerOptions {
  failureThreshold?: number
  resetTimeout?: number
  monitoringPeriod?: number
  onStateChange?: (state: CircuitBreakerState) => void
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open'

export class RetryManager {
  private options: Required<RetryOptions>

  constructor(options: RetryOptions = {}) {
    this.options = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      retryCondition: (error, attempt) => attempt < this.options.maxRetries,
      onRetry: () => {},
      onMaxRetriesReached: () => {},
      ...options
    }
  }

  // Execute function with retry logic
  public async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error
    let attempt = 0

    while (attempt <= this.options.maxRetries) {
      try {
        const result = await fn()
        
        // Success - reset any previous error state
        if (attempt > 0) {
          console.log(`✅ Operation succeeded after ${attempt} retries${context ? ` (${context})` : ''}`)
        }
        
        return result
      } catch (error) {
        lastError = error as Error
        attempt++

        // Check if we should retry
        if (attempt <= this.options.maxRetries && this.options.retryCondition(lastError, attempt)) {
          const delay = this.calculateDelay(attempt)
          
          console.log(`🔄 Retry attempt ${attempt}/${this.options.maxRetries} in ${delay}ms${context ? ` (${context})` : ''}:`, lastError.message)
          
          this.options.onRetry(lastError, attempt)
          
          await this.delay(delay)
        } else {
          break
        }
      }
    }

    // Max retries reached
    console.error(`❌ Max retries reached${context ? ` (${context})` : ''}:`, lastError.message)
    this.options.onMaxRetriesReached(lastError)
    throw lastError
  }

  // Calculate delay with exponential backoff
  private calculateDelay(attempt: number): number {
    const delay = this.options.baseDelay * Math.pow(this.options.backoffFactor, attempt - 1)
    return Math.min(delay, this.options.maxDelay)
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed'
  private failureCount = 0
  private lastFailureTime = 0
  private successCount = 0
  private options: Required<CircuitBreakerOptions>

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      onStateChange: () => {},
      ...options
    }
  }

  // Execute function with circuit breaker protection
  public async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.setState('half-open')
      } else {
        throw new Error(`Circuit breaker is open${context ? ` (${context})` : ''}`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  // Handle successful execution
  private onSuccess(): void {
    this.failureCount = 0
    
    if (this.state === 'half-open') {
      this.successCount++
      
      // Reset to closed state after successful execution in half-open state
      this.setState('closed')
      this.successCount = 0
    }
  }

  // Handle failed execution
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.state === 'half-open') {
      // Failure in half-open state - go back to open
      this.setState('open')
    } else if (this.failureCount >= this.options.failureThreshold) {
      // Too many failures - open the circuit
      this.setState('open')
    }
  }

  // Check if we should attempt to reset the circuit breaker
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.options.resetTimeout
  }

  // Set circuit breaker state
  private setState(newState: CircuitBreakerState): void {
    if (this.state !== newState) {
      console.log(`🔌 Circuit breaker state changed: ${this.state} → ${newState}`)
      this.state = newState
      this.options.onStateChange(newState)
    }
  }

  // Get current state
  public getState(): CircuitBreakerState {
    return this.state
  }

  // Get failure count
  public getFailureCount(): number {
    return this.failureCount
  }

  // Reset circuit breaker
  public reset(): void {
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
    this.setState('closed')
  }
}

// Error recovery utility class
export class ErrorRecoveryManager {
  private retryManager: RetryManager
  private circuitBreaker: CircuitBreaker
  private errorHandlers = new Map<string, (error: Error) => Promise<void> | void>()

  constructor(
    retryOptions: RetryOptions = {},
    circuitBreakerOptions: CircuitBreakerOptions = {}
  ) {
    this.retryManager = new RetryManager(retryOptions)
    this.circuitBreaker = new CircuitBreaker(circuitBreakerOptions)
  }

  // Execute function with full error recovery
  public async execute<T>(
    fn: () => Promise<T>,
    context?: string,
    options: {
      useRetry?: boolean
      useCircuitBreaker?: boolean
      customErrorHandler?: (error: Error) => Promise<void> | void
    } = {}
  ): Promise<T> {
    const {
      useRetry = true,
      useCircuitBreaker = true,
      customErrorHandler
    } = options

    try {
      const wrappedFn = async () => {
        if (useCircuitBreaker) {
          return this.circuitBreaker.execute(fn, context)
        } else {
          return fn()
        }
      }

      if (useRetry) {
        return await this.retryManager.execute(wrappedFn, context)
      } else {
        return await wrappedFn()
      }
    } catch (error) {
      const err = error as Error
      
      // Handle error with custom handler
      if (customErrorHandler) {
        await customErrorHandler(err)
      }
      
      // Handle error with registered handlers
      await this.handleError(err, context)
      
      throw err
    }
  }

  // Register error handler
  public registerErrorHandler(
    errorType: string,
    handler: (error: Error) => Promise<void> | void
  ): void {
    this.errorHandlers.set(errorType, handler)
  }

  // Handle error with registered handlers
  private async handleError(error: Error, context?: string): Promise<void> {
    const errorType = error.constructor.name
    const handler = this.errorHandlers.get(errorType) || this.errorHandlers.get('default')
    
    if (handler) {
      try {
        await handler(error)
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError)
      }
    }
    
    // Log error for monitoring
    console.error(`💥 Error in ${context || 'unknown context'}:`, error)
  }

  // Get circuit breaker state
  public getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreaker.getState()
  }

  // Reset circuit breaker
  public resetCircuitBreaker(): void {
    this.circuitBreaker.reset()
  }
}

// Utility functions for common error scenarios
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('connection') ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError'
  )
}

export function isTimeoutError(error: Error): boolean {
  return (
    error.message.includes('timeout') ||
    error.name === 'TimeoutError'
  )
}

export function isServerError(error: Error): boolean {
  return error.message.includes('5') && error.message.includes('HTTP')
}

export function isClientError(error: Error): boolean {
  return error.message.includes('4') && error.message.includes('HTTP')
}

// Create default error recovery manager
export function createErrorRecoveryManager(options: {
  retryOptions?: RetryOptions
  circuitBreakerOptions?: CircuitBreakerOptions
  enableNotifications?: boolean
} = {}): ErrorRecoveryManager {
  const { retryOptions = {}, circuitBreakerOptions = {}, enableNotifications = true } = options

  const manager = new ErrorRecoveryManager(
    {
      maxRetries: 3,
      baseDelay: 1000,
      retryCondition: (error, attempt) => {
        // Retry network errors and server errors, but not client errors
        return (isNetworkError(error) || isServerError(error)) && attempt < 3
      },
      onRetry: (error, attempt) => {
        if (enableNotifications) {
          toast.loading(`Retrying... (${attempt}/3)`)
        }
      },
      onMaxRetriesReached: (error) => {
        if (enableNotifications) {
          toast.error('Operation failed after multiple attempts')
        }
      },
      ...retryOptions
    },
    {
      failureThreshold: 5,
      resetTimeout: 60000,
      onStateChange: (state) => {
        if (enableNotifications) {
          switch (state) {
            case 'open':
              toast.error('Service temporarily unavailable')
              break
            case 'half-open':
              toast.info('Attempting to restore service...')
              break
            case 'closed':
              toast.success('Service restored')
              break
          }
        }
      },
      ...circuitBreakerOptions
    }
  )

  // Register default error handlers
  manager.registerErrorHandler('NetworkError', (error) => {
    console.log('🌐 Network error detected:', error.message)
  })

  manager.registerErrorHandler('TimeoutError', (error) => {
    console.log('⏱️ Timeout error detected:', error.message)
  })

  manager.registerErrorHandler('default', (error) => {
    console.log('❌ Unhandled error:', error.message)
  })

  return manager
}

// Global error recovery manager instance
let globalErrorRecoveryManager: ErrorRecoveryManager | null = null

export function getErrorRecoveryManager(options?: {
  retryOptions?: RetryOptions
  circuitBreakerOptions?: CircuitBreakerOptions
  enableNotifications?: boolean
}): ErrorRecoveryManager {
  if (!globalErrorRecoveryManager) {
    globalErrorRecoveryManager = createErrorRecoveryManager(options)
  }
  return globalErrorRecoveryManager
}

export type { RetryOptions, CircuitBreakerOptions, CircuitBreakerState }
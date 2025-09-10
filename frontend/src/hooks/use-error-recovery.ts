import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  ErrorRecoveryManager,
  getErrorRecoveryManager,
  RetryOptions,
  CircuitBreakerOptions,
  CircuitBreakerState,
  isNetworkError,
  isServerError,
  isTimeoutError
} from '@/utils/error-recovery'

export interface UseErrorRecoveryOptions {
  retryOptions?: RetryOptions
  circuitBreakerOptions?: CircuitBreakerOptions
  enableNotifications?: boolean
  context?: string
}

export interface UseErrorRecoveryReturn {
  execute: <T>(
    fn: () => Promise<T>,
    options?: {
      useRetry?: boolean
      useCircuitBreaker?: boolean
      customErrorHandler?: (error: Error) => Promise<void> | void
    }
  ) => Promise<T>
  circuitBreakerState: CircuitBreakerState
  resetCircuitBreaker: () => void
  isExecuting: boolean
  lastError: Error | null
  retryCount: number
  errorHistory: Array<{ error: Error; timestamp: number; context?: string }>
}

export function useErrorRecovery(
  options: UseErrorRecoveryOptions = {}
): UseErrorRecoveryReturn {
  const [circuitBreakerState, setCircuitBreakerState] = useState<CircuitBreakerState>('closed')
  const [isExecuting, setIsExecuting] = useState(false)
  const [lastError, setLastError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [errorHistory, setErrorHistory] = useState<Array<{ error: Error; timestamp: number; context?: string }>>([])

  const managerRef = useRef<ErrorRecoveryManager>()
  const { enableNotifications = true, context } = options

  // Initialize error recovery manager
  if (!managerRef.current) {
    managerRef.current = getErrorRecoveryManager({
      retryOptions: {
        onRetry: (error, attempt) => {
          setRetryCount(attempt)
          if (enableNotifications) {
            toast.loading(`Retrying... (${attempt}/${options.retryOptions?.maxRetries || 3})`)
          }
        },
        onMaxRetriesReached: (error) => {
          if (enableNotifications) {
            toast.error('Operation failed after multiple attempts')
          }
        },
        ...options.retryOptions
      },
      circuitBreakerOptions: {
        onStateChange: (state) => {
          setCircuitBreakerState(state)
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
        ...options.circuitBreakerOptions
      },
      enableNotifications
    })
  }

  // Execute function with error recovery
  const execute = useCallback(async <T>(
    fn: () => Promise<T>,
    executeOptions: {
      useRetry?: boolean
      useCircuitBreaker?: boolean
      customErrorHandler?: (error: Error) => Promise<void> | void
    } = {}
  ): Promise<T> => {
    setIsExecuting(true)
    setRetryCount(0)
    setLastError(null)

    try {
      const result = await managerRef.current!.execute(
        fn,
        context,
        executeOptions
      )
      
      // Success - clear error state
      setLastError(null)
      setRetryCount(0)
      
      return result
    } catch (error) {
      const err = error as Error
      setLastError(err)
      
      // Add to error history
      setErrorHistory(prev => [
        ...prev.slice(-9), // Keep last 10 errors
        { error: err, timestamp: Date.now(), context }
      ])
      
      // Handle specific error types
      if (enableNotifications) {
        if (isNetworkError(err)) {
          toast.error('Network connection error')
        } else if (isServerError(err)) {
          toast.error('Server error - please try again')
        } else if (isTimeoutError(err)) {
          toast.error('Request timed out')
        } else {
          toast.error(err.message || 'An error occurred')
        }
      }
      
      throw err
    } finally {
      setIsExecuting(false)
    }
  }, [context, enableNotifications])

  // Reset circuit breaker
  const resetCircuitBreaker = useCallback(() => {
    managerRef.current?.resetCircuitBreaker()
    setCircuitBreakerState('closed')
    
    if (enableNotifications) {
      toast.success('Circuit breaker reset')
    }
  }, [enableNotifications])

  return {
    execute,
    circuitBreakerState,
    resetCircuitBreaker,
    isExecuting,
    lastError,
    retryCount,
    errorHistory
  }
}

// Hook for API calls with error recovery
export function useApiWithErrorRecovery<T = any>(
  baseUrl: string,
  options: UseErrorRecoveryOptions = {}
) {
  const errorRecovery = useErrorRecovery(options)

  // GET request with error recovery
  const get = useCallback(async (
    endpoint: string,
    requestOptions?: RequestInit
  ): Promise<T> => {
    return errorRecovery.execute(async () => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        ...requestOptions
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response.json()
    })
  }, [baseUrl, errorRecovery])

  // POST request with error recovery
  const post = useCallback(async (
    endpoint: string,
    data?: any,
    requestOptions?: RequestInit
  ): Promise<T> => {
    return errorRecovery.execute(async () => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...requestOptions?.headers
        },
        body: data ? JSON.stringify(data) : undefined,
        ...requestOptions
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response.json()
    })
  }, [baseUrl, errorRecovery])

  // PUT request with error recovery
  const put = useCallback(async (
    endpoint: string,
    data?: any,
    requestOptions?: RequestInit
  ): Promise<T> => {
    return errorRecovery.execute(async () => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...requestOptions?.headers
        },
        body: data ? JSON.stringify(data) : undefined,
        ...requestOptions
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response.json()
    })
  }, [baseUrl, errorRecovery])

  // DELETE request with error recovery
  const del = useCallback(async (
    endpoint: string,
    requestOptions?: RequestInit
  ): Promise<void> => {
    return errorRecovery.execute(async () => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        ...requestOptions
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    })
  }, [baseUrl, errorRecovery])

  return {
    ...errorRecovery,
    get,
    post,
    put,
    delete: del
  }
}

// Hook for form submission with error recovery
export function useFormWithErrorRecovery<T extends Record<string, any>>(
  submitFunction: (data: T) => Promise<any>,
  options: UseErrorRecoveryOptions = {}
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<Error | null>(null)
  const [submitCount, setSubmitCount] = useState(0)
  
  const errorRecovery = useErrorRecovery(options)

  const submit = useCallback(async (data: T) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitCount(prev => prev + 1)

    try {
      const result = await errorRecovery.execute(
        () => submitFunction(data),
        {
          customErrorHandler: (error) => {
            setSubmitError(error)
          }
        }
      )
      
      setSubmitError(null)
      return result
    } catch (error) {
      setSubmitError(error as Error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [submitFunction, errorRecovery])

  return {
    submit,
    isSubmitting,
    submitError,
    submitCount,
    ...errorRecovery
  }
}

// Hook for data fetching with error recovery and caching
export function useDataWithErrorRecovery<T>(
  fetchFunction: () => Promise<T>,
  options: UseErrorRecoveryOptions & {
    cacheKey?: string
    cacheDuration?: number
    refetchOnError?: boolean
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState<number | null>(null)

  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
    refetchOnError = true,
    ...errorRecoveryOptions
  } = options

  const errorRecovery = useErrorRecovery(errorRecoveryOptions)
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())

  const fetchData = useCallback(async (force = false) => {
    // Check cache first
    if (cacheKey && !force) {
      const cached = cacheRef.current.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cacheDuration) {
        setData(cached.data)
        setError(null)
        return cached.data
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await errorRecovery.execute(fetchFunction)
      
      setData(result)
      setLastFetch(Date.now())
      
      // Cache the result
      if (cacheKey) {
        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
      }
      
      return result
    } catch (error) {
      const err = error as Error
      setError(err)
      
      // If refetch on error is enabled and we have cached data, use it
      if (refetchOnError && cacheKey) {
        const cached = cacheRef.current.get(cacheKey)
        if (cached) {
          setData(cached.data)
          return cached.data
        }
      }
      
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchFunction, cacheKey, cacheDuration, refetchOnError, errorRecovery])

  const refetch = useCallback(() => fetchData(true), [fetchData])

  return {
    data,
    isLoading,
    error,
    lastFetch,
    fetchData,
    refetch,
    ...errorRecovery
  }
}

export type { UseErrorRecoveryOptions, UseErrorRecoveryReturn }
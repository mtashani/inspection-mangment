/**
 * Performance optimization utilities for the Enhanced Maintenance system
 */

import { useCallback, useRef, useMemo } from 'react'

/**
 * Throttle function to limit the rate of function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0

  return (...args: Parameters<T>) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

/**
 * Debounce function to delay function execution until after delay has passed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

/**
 * Memoization utility for expensive computations
 */
export class MemoCache<K, V> {
  private cache = new Map<string, { value: V; timestamp: number }>()
  private maxSize: number
  private ttl: number

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) { // 5 minutes default TTL
    this.maxSize = maxSize
    this.ttl = ttl
  }

  private getKey(key: K): string {
    return typeof key === 'string' ? key : JSON.stringify(key)
  }

  get(key: K): V | undefined {
    const keyStr = this.getKey(key)
    const cached = this.cache.get(keyStr)

    if (!cached) {
      return undefined
    }

    // Check if cached value has expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(keyStr)
      return undefined
    }

    return cached.value
  }

  set(key: K, value: V): void {
    const keyStr = this.getKey(key)

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(keyStr)) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(keyStr, {
      value,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * Hook for memoizing expensive computations with dependencies
 */
export function useExpensiveMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  cacheKey?: string
): T {
  const cache = useRef(new MemoCache<string, T>(50))
  
  return useMemo(() => {
    const key = cacheKey || JSON.stringify(deps)
    const cached = cache.current.get(key)
    
    if (cached !== undefined) {
      return cached
    }

    const result = factory()
    cache.current.set(key, result)
    return result
  }, deps)
}

/**
 * Hook for throttled callbacks
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): (...args: Parameters<T>) => void {
  return useCallback(
    throttle(callback, delay),
    [delay, ...deps]
  )
}

/**
 * Hook for debounced callbacks
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): (...args: Parameters<T>) => void {
  return useCallback(
    debounce(callback, delay),
    [delay, ...deps]
  )
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [element, setElement] = useState<Element | null>(null)

  const observer = useMemo(() => {
    if (typeof window === 'undefined') return null

    return new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        ...options
      }
    )
  }, [options.threshold, options.root, options.rootMargin])

  useEffect(() => {
    if (!observer || !element) return

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [observer, element])

  const ref = useCallback((node: Element | null) => {
    setElement(node)
  }, [])

  return [ref, isIntersecting]
}

/**
 * Virtual scrolling utilities
 */
export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function calculateVirtualScrollItems(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options

  const visibleItemsCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + visibleItemsCount + overscan,
    totalItems - 1
  )

  const actualStartIndex = Math.max(0, startIndex - overscan)

  return {
    startIndex: actualStartIndex,
    endIndex,
    visibleItems: endIndex - actualStartIndex + 1,
    offsetY: actualStartIndex * itemHeight
  }
}

/**
 * Image lazy loading utility
 */
export function createLazyImageLoader() {
  const imageCache = new Set<string>()
  const loadingImages = new Map<string, Promise<void>>()

  return {
    loadImage: async (src: string): Promise<void> => {
      if (imageCache.has(src)) {
        return Promise.resolve()
      }

      if (loadingImages.has(src)) {
        return loadingImages.get(src)!
      }

      const loadPromise = new Promise<void>((resolve, reject) => {
        const img = new Image()
        
        img.onload = () => {
          imageCache.add(src)
          loadingImages.delete(src)
          resolve()
        }
        
        img.onerror = () => {
          loadingImages.delete(src)
          reject(new Error(`Failed to load image: ${src}`))
        }
        
        img.src = src
      })

      loadingImages.set(src, loadPromise)
      return loadPromise
    },

    isImageCached: (src: string): boolean => {
      return imageCache.has(src)
    },

    preloadImages: async (sources: string[]): Promise<void> => {
      const loadPromises = sources.map(src => this.loadImage(src))
      await Promise.allSettled(loadPromises)
    },

    clearCache: (): void => {
      imageCache.clear()
      loadingImages.clear()
    }
  }
}

/**
 * Bundle splitting utilities
 */
export function createDynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
) {
  let cachedModule: T | null = null
  let loadingPromise: Promise<T> | null = null

  return {
    load: async (): Promise<T> => {
      if (cachedModule) {
        return cachedModule
      }

      if (loadingPromise) {
        return loadingPromise
      }

      loadingPromise = importFn().then(module => {
        cachedModule = module.default
        loadingPromise = null
        return module.default
      }).catch(error => {
        loadingPromise = null
        if (fallback) {
          cachedModule = fallback
          return fallback
        }
        throw error
      })

      return loadingPromise
    },

    isLoaded: (): boolean => {
      return cachedModule !== null
    },

    getSync: (): T | null => {
      return cachedModule
    }
  }
}

/**
 * Memory usage monitoring
 */
export function createMemoryMonitor() {
  const measurements: number[] = []
  const maxMeasurements = 100

  return {
    measure: (): number | null => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / 1024 / 1024
        
        measurements.push(usedMB)
        if (measurements.length > maxMeasurements) {
          measurements.shift()
        }
        
        return usedMB
      }
      return null
    },

    getAverage: (): number | null => {
      if (measurements.length === 0) return null
      
      const sum = measurements.reduce((acc, val) => acc + val, 0)
      return sum / measurements.length
    },

    getPeak: (): number | null => {
      if (measurements.length === 0) return null
      return Math.max(...measurements)
    },

    clear: (): void => {
      measurements.length = 0
    }
  }
}

/**
 * Performance timing utilities
 */
export function createPerformanceTimer() {
  const timings = new Map<string, number>()

  return {
    start: (label: string): void => {
      timings.set(label, performance.now())
    },

    end: (label: string): number | null => {
      const startTime = timings.get(label)
      if (!startTime) return null

      const duration = performance.now() - startTime
      timings.delete(label)
      return duration
    },

    measure: <T>(label: string, fn: () => T): T => {
      const startTime = performance.now()
      const result = fn()
      const duration = performance.now() - startTime
      
      console.log(`Performance [${label}]: ${duration.toFixed(2)}ms`)
      return result
    },

    measureAsync: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
      const startTime = performance.now()
      const result = await fn()
      const duration = performance.now() - startTime
      
      console.log(`Performance [${label}]: ${duration.toFixed(2)}ms`)
      return result
    }
  }
}

// Import useState and useEffect for hooks
import { useState, useEffect } from 'react'
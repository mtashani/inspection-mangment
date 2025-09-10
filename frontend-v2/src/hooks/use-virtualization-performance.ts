'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Performance monitoring for virtualized lists
export interface VirtualizationMetrics {
  renderTime: number
  scrollPerformance: number
  memoryUsage: number
  itemsRendered: number
  totalItems: number
  fps: number
}

// Hook for monitoring virtualization performance
export function useVirtualizationPerformance(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<VirtualizationMetrics>({
    renderTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
    itemsRendered: 0,
    totalItems: 0,
    fps: 0
  })
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const renderStartRef = useRef(0)
  
  // Measure render performance
  const startRenderMeasurement = useCallback(() => {
    if (!enabled) return
    renderStartRef.current = performance.now()
  }, [enabled])
  
  const endRenderMeasurement = useCallback((itemsRendered: number, totalItems: number) => {
    if (!enabled) return
    
    const renderTime = performance.now() - renderStartRef.current
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      itemsRendered,
      totalItems
    }))
  }, [enabled])
  
  // Measure FPS
  useEffect(() => {
    if (!enabled) return
    
    let animationId: number
    
    const measureFPS = () => {
      frameCountRef.current++
      const now = performance.now()
      
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
        
        setMetrics(prev => ({ ...prev, fps }))
        
        frameCountRef.current = 0
        lastTimeRef.current = now
      }
      
      animationId = requestAnimationFrame(measureFPS)
    }
    
    animationId = requestAnimationFrame(measureFPS)
    
    return () => cancelAnimationFrame(animationId)
  }, [enabled])
  
  // Measure memory usage (approximate)
  const measureMemoryUsage = useCallback(() => {
    if (!enabled || !('memory' in performance)) return
    
    const memory = (performance as unknown).memory as {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
    
    if (memory) {
      const memoryUsage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      setMetrics(prev => ({ ...prev, memoryUsage }))
    }
  }, [enabled])
  
  // Measure scroll performance
  const measureScrollPerformance = useCallback((scrollTop: number) => {
    if (!enabled) return
    
    const start = performance.now()
    
    // Simulate scroll processing time
    requestAnimationFrame(() => {
      const scrollPerformance = performance.now() - start
      setMetrics(prev => ({ ...prev, scrollPerformance }))
    })
  }, [enabled])
  
  return {
    metrics,
    startRenderMeasurement,
    endRenderMeasurement,
    measureMemoryUsage,
    measureScrollPerformance
  }
}

// Hook for optimizing re-renders in virtualized lists
export function useVirtualizationOptimization<T>(
  items: T[],
  dependencies: React.DependencyList = []
) {
  // Memoize items to prevent unnecessary re-renders
  const memoizedItems = useMemo(() => items, [items, ...dependencies])
  
  // Track item changes for performance monitoring
  const previousItemsRef = useRef<T[]>([])
  const itemsChanged = useMemo(() => {
    const changed = previousItemsRef.current.length !== items.length ||
                   previousItemsRef.current.some((item, index) => item !== items[index])
    previousItemsRef.current = items
    return changed
  }, [items])
  
  // Debounce rapid changes
  const [debouncedItems, setDebouncedItems] = useState(items)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedItems(items)
    }, 100)
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [items])
  
  return {
    items: memoizedItems,
    debouncedItems,
    itemsChanged
  }
}

// Hook for managing scroll position restoration with performance optimization
export function useOptimizedScrollRestoration(key: string, threshold: number = 1000) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const lastSaveTimeRef = useRef(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Load initial scroll position
  useEffect(() => {
    const saved = sessionStorage.getItem(`scroll-${key}`)
    if (saved) {
      setScrollPosition(parseInt(saved, 10))
    }
  }, [key])
  
  // Optimized scroll position saving with throttling
  const saveScrollPosition = useCallback((position: number) => {
    const now = Date.now()
    
    // Throttle saves to avoid excessive storage writes
    if (now - lastSaveTimeRef.current < 100) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        setScrollPosition(position)
        sessionStorage.setItem(`scroll-${key}`, position.toString())
        lastSaveTimeRef.current = Date.now()
      }, 100)
      
      return
    }
    
    setScrollPosition(position)
    sessionStorage.setItem(`scroll-${key}`, position.toString())
    lastSaveTimeRef.current = now
  }, [key])
  
  // Clear scroll position
  const clearScrollPosition = useCallback(() => {
    setScrollPosition(0)
    sessionStorage.removeItem(`scroll-${key}`)
  }, [key])
  
  return { 
    scrollPosition, 
    saveScrollPosition, 
    clearScrollPosition 
  }
}

// Hook for dynamic item height calculation with caching
export function useOptimizedDynamicHeight<T extends { id: string | number }>(
  items: T[],
  estimatedHeight: number = 100,
  maxCacheSize: number = 1000
) {
  const heightCacheRef = useRef<Map<string | number, number>>(new Map())
  const [, forceUpdate] = useState({})
  
  const getItemHeight = useCallback((index: number) => {
    const item = items[index]
    if (!item) return estimatedHeight
    
    return heightCacheRef.current.get(item.id) ?? estimatedHeight
  }, [items, estimatedHeight])
  
  const setItemHeight = useCallback((index: number, height: number) => {
    const item = items[index]
    if (!item) return
    
    const cache = heightCacheRef.current
    const currentHeight = cache.get(item.id)
    
    if (currentHeight !== height) {
      // Manage cache size
      if (cache.size >= maxCacheSize) {
        const firstKey = cache.keys().next().value
        if (firstKey !== undefined) {
          cache.delete(firstKey)
        }
      }
      
      cache.set(item.id, height)
      forceUpdate({})
    }
  }, [items, maxCacheSize])
  
  const resetHeights = useCallback(() => {
    heightCacheRef.current.clear()
    forceUpdate({})
  }, [])
  
  // Clean up cache when items change significantly
  useEffect(() => {
    const cache = heightCacheRef.current
    const currentItemIds = new Set(items.map(item => item.id))
    
    // Remove cached heights for items that no longer exist
    for (const cachedId of cache.keys()) {
      if (!currentItemIds.has(cachedId)) {
        cache.delete(cachedId)
      }
    }
    
    // If cache is still too large, clear it
    if (cache.size > maxCacheSize * 1.5) {
      resetHeights()
    }
  }, [items, maxCacheSize, resetHeights])
  
  return {
    getItemHeight,
    setItemHeight,
    resetHeights,
    cacheSize: heightCacheRef.current.size
  }
}

// Hook for intersection observer-based visibility tracking
export function useVirtualizationVisibility(
  containerRef: React.RefObject<HTMLElement>,
  threshold: number = 0.1
) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleItems(prev => {
          const newSet = new Set(prev)
          
          entries.forEach(entry => {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10)
            
            if (entry.isIntersecting) {
              newSet.add(index)
            } else {
              newSet.delete(index)
            }
          })
          
          return newSet
        })
      },
      { threshold, root: containerRef.current }
    )
    
    return () => {
      observerRef.current?.disconnect()
    }
  }, [threshold, containerRef])
  
  const observeItem = useCallback((element: HTMLElement, index: number) => {
    if (observerRef.current) {
      element.setAttribute('data-index', index.toString())
      observerRef.current.observe(element)
    }
  }, [])
  
  const unobserveItem = useCallback((element: HTMLElement) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element)
    }
  }, [])
  
  return {
    visibleItems,
    observeItem,
    unobserveItem
  }
}
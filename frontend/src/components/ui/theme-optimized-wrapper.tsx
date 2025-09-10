import React, { memo, useRef, useEffect, useState } from 'react'
import { useThemeAwareComponent } from '@/hooks/use-optimized-theme'

interface ThemeOptimizedWrapperProps {
  children: React.ReactNode
  className?: string
  /**
   * Whether to use intersection observer for performance
   */
  useIntersectionObserver?: boolean
  /**
   * Threshold for intersection observer
   */
  threshold?: number
  /**
   * Whether to defer theme updates until component is idle
   */
  deferUpdates?: boolean
}

/**
 * Wrapper component that optimizes theme-related re-renders
 * Uses intersection observer and idle callbacks for better performance
 */
export const ThemeOptimizedWrapper = memo<ThemeOptimizedWrapperProps>(({
  children,
  className,
  useIntersectionObserver = true,
  threshold = 0.1,
  deferUpdates = true
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isIdle, setIsIdle] = useState(!deferUpdates)
  
  // Use theme-aware component hook if intersection observer is enabled
  const theme = useIntersectionObserver 
    ? useThemeAwareComponent(elementRef)
    : null

  // Handle idle state for deferred updates
  useEffect(() => {
    if (!deferUpdates) return

    let idleCallbackId: number

    const handleIdle = () => {
      setIsIdle(true)
    }

    if ('requestIdleCallback' in window) {
      idleCallbackId = requestIdleCallback(handleIdle, { timeout: 100 })
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(handleIdle, 16) // ~1 frame
      idleCallbackId = timeoutId as any
    }

    return () => {
      if ('cancelIdleCallback' in window) {
        cancelIdleCallback(idleCallbackId)
      } else {
        clearTimeout(idleCallbackId)
      }
    }
  }, [deferUpdates])

  // Don't render children until component is idle (if deferUpdates is true)
  if (deferUpdates && !isIdle) {
    return (
      <div 
        ref={elementRef} 
        className={className}
        style={{ 
          minHeight: '1px', // Maintain layout
          visibility: 'hidden' 
        }}
      />
    )
  }

  return (
    <div 
      ref={elementRef} 
      className={className}
      data-theme-optimized="true"
    >
      {children}
    </div>
  )
})

ThemeOptimizedWrapper.displayName = 'ThemeOptimizedWrapper'

/**
 * Higher-order component for theme optimization
 */
export function withThemeOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<ThemeOptimizedWrapperProps> = {}
) {
  const OptimizedComponent = memo((props: P) => (
    <ThemeOptimizedWrapper {...options}>
      <Component {...props} />
    </ThemeOptimizedWrapper>
  ))

  OptimizedComponent.displayName = `withThemeOptimization(${Component.displayName || Component.name})`
  
  return OptimizedComponent
}

/**
 * Hook for components that need to minimize theme-related re-renders
 */
export function useMinimalRerender() {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef(Date.now())
  
  useEffect(() => {
    renderCountRef.current++
    lastRenderTimeRef.current = Date.now()
  })

  // Throttle re-renders during rapid theme changes
  const shouldSkipRender = useRef(false)
  
  useEffect(() => {
    const now = Date.now()
    const timeSinceLastRender = now - lastRenderTimeRef.current
    
    // Skip render if less than 16ms (60fps) since last render
    if (timeSinceLastRender < 16) {
      shouldSkipRender.current = true
      
      // Schedule next render
      setTimeout(() => {
        shouldSkipRender.current = false
      }, 16 - timeSinceLastRender)
    } else {
      shouldSkipRender.current = false
    }
  })

  return {
    renderCount: renderCountRef.current,
    shouldSkipRender: shouldSkipRender.current,
    lastRenderTime: lastRenderTimeRef.current
  }
}
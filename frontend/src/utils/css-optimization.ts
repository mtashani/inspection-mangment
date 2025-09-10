/**
 * CSS Optimization Utilities
 * Provides efficient CSS variable updates and performance optimizations
 */

// CSS Variable update batching
class CSSVariableBatcher {
  private updateQueue: Map<string, string> = new Map()
  private isScheduled = false
  private rafId: number | null = null

  /**
   * Queue a CSS variable update
   */
  queueUpdate(property: string, value: string) {
    this.updateQueue.set(property, value)
    this.scheduleFlush()
  }

  /**
   * Queue multiple CSS variable updates
   */
  queueBatchUpdate(updates: Record<string, string>) {
    Object.entries(updates).forEach(([property, value]) => {
      this.updateQueue.set(property, value)
    })
    this.scheduleFlush()
  }

  /**
   * Schedule a flush of queued updates
   */
  private scheduleFlush() {
    if (this.isScheduled) return

    this.isScheduled = true
    this.rafId = requestAnimationFrame(() => {
      this.flush()
    })
  }

  /**
   * Flush all queued updates to the DOM
   */
  private flush() {
    if (this.updateQueue.size === 0) {
      this.isScheduled = false
      return
    }

    // Batch DOM writes
    const root = document.documentElement
    this.updateQueue.forEach((value, property) => {
      root.style.setProperty(property, value)
    })

    this.updateQueue.clear()
    this.isScheduled = false
  }

  /**
   * Cancel any pending updates
   */
  cancel() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.updateQueue.clear()
    this.isScheduled = false
  }
}

// Global CSS variable batcher instance
export const cssVariableBatcher = new CSSVariableBatcher()

/**
 * Efficiently update CSS variables with batching
 */
export function updateCSSVariable(property: string, value: string) {
  cssVariableBatcher.queueUpdate(property, value)
}

/**
 * Efficiently update multiple CSS variables with batching
 */
export function updateCSSVariables(updates: Record<string, string>) {
  cssVariableBatcher.queueBatchUpdate(updates)
}

/**
 * CSS containment utility for better performance
 */
export function applyCSSContainment(element: HTMLElement, containment: string[] = ['layout', 'style', 'paint']) {
  element.style.contain = containment.join(' ')
}

/**
 * Optimize CSS transitions for theme switching
 */
export function optimizeThemeTransitions() {
  const style = document.createElement('style')
  style.textContent = `
    :root {
      /* Optimize transitions for theme switching */
      --theme-transition-duration: 0.2s;
      --theme-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Optimize specific properties for theme transitions */
    * {
      transition: 
        background-color var(--theme-transition-duration) var(--theme-transition-easing),
        color var(--theme-transition-duration) var(--theme-transition-easing),
        border-color var(--theme-transition-duration) var(--theme-transition-easing),
        box-shadow var(--theme-transition-duration) var(--theme-transition-easing);
    }

    /* Disable transitions during theme switching for better performance */
    .theme-switching * {
      transition: none !important;
    }

    /* Re-enable transitions after theme switch */
    .theme-switched * {
      transition: 
        background-color var(--theme-transition-duration) var(--theme-transition-easing),
        color var(--theme-transition-duration) var(--theme-transition-easing),
        border-color var(--theme-transition-duration) var(--theme-transition-easing),
        box-shadow var(--theme-transition-duration) var(--theme-transition-easing);
    }
  `
  
  document.head.appendChild(style)
  return style
}

/**
 * Preload critical CSS variables for faster theme switching
 */
export function preloadCriticalCSSVariables(theme: string) {
  const criticalVariables = [
    '--background',
    '--foreground', 
    '--card',
    '--card-foreground',
    '--primary',
    '--primary-foreground',
    '--border'
  ]

  // Create invisible element with theme to force CSS computation
  const preloadElement = document.createElement('div')
  preloadElement.setAttribute('data-theme', theme)
  preloadElement.style.cssText = `
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `

  document.body.appendChild(preloadElement)

  // Force style computation for critical variables
  const computedStyle = getComputedStyle(preloadElement)
  criticalVariables.forEach(variable => {
    computedStyle.getPropertyValue(variable)
  })

  // Clean up
  requestAnimationFrame(() => {
    document.body.removeChild(preloadElement)
  })
}

/**
 * Minimize layout thrashing during theme changes
 */
export function minimizeLayoutThrashing(callback: () => void) {
  // Add class to disable transitions temporarily
  document.documentElement.classList.add('theme-switching')
  
  // Execute theme change
  callback()
  
  // Re-enable transitions after a frame
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('theme-switching')
    document.documentElement.classList.add('theme-switched')
    
    // Remove the switched class after transition completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-switched')
    }, 200) // Match transition duration
  })
}

/**
 * Debounce CSS variable updates for better performance
 */
export function debounceCSSUpdate(
  updateFn: () => void, 
  delay: number = 16 // ~1 frame at 60fps
): () => void {
  let timeoutId: number | null = null
  
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = window.setTimeout(() => {
      updateFn()
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle CSS variable updates to prevent excessive DOM manipulation
 */
export function throttleCSSUpdate(
  updateFn: () => void,
  limit: number = 16 // ~60fps
): () => void {
  let inThrottle = false
  
  return () => {
    if (!inThrottle) {
      updateFn()
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Monitor CSS performance and provide insights
 */
export class CSSPerformanceMonitor {
  private updateCount = 0
  private startTime = performance.now()
  private updateTimes: number[] = []

  recordUpdate() {
    this.updateCount++
    this.updateTimes.push(performance.now())
    
    // Keep only last 100 updates for analysis
    if (this.updateTimes.length > 100) {
      this.updateTimes.shift()
    }
  }

  getStats() {
    const now = performance.now()
    const totalTime = now - this.startTime
    const avgUpdateTime = this.updateTimes.length > 1 
      ? (this.updateTimes[this.updateTimes.length - 1] - this.updateTimes[0]) / (this.updateTimes.length - 1)
      : 0

    return {
      totalUpdates: this.updateCount,
      totalTime,
      updatesPerSecond: this.updateCount / (totalTime / 1000),
      averageUpdateInterval: avgUpdateTime,
      recentUpdates: this.updateTimes.slice(-10)
    }
  }

  reset() {
    this.updateCount = 0
    this.startTime = performance.now()
    this.updateTimes = []
  }
}

// Global performance monitor instance
export const cssPerformanceMonitor = new CSSPerformanceMonitor()

/**
 * Optimize CSS custom properties for better performance
 */
export function optimizeCSSCustomProperties() {
  const style = document.createElement('style')
  style.textContent = `
    /* Optimize CSS custom property inheritance */
    :root {
      /* Force layer creation for better compositing */
      will-change: background-color, color;
      transform: translateZ(0);
    }

    /* Optimize component-level custom properties */
    .design-system-component {
      /* Contain property changes to component scope */
      contain: style;
      
      /* Optimize for frequent property changes */
      will-change: background-color, color, border-color;
    }

    /* Optimize for theme switching */
    [data-theme] {
      /* Isolate theme-related changes */
      isolation: isolate;
    }
  `
  
  document.head.appendChild(style)
  return style
}

/**
 * Clean up CSS optimization resources
 */
export function cleanupCSSOptimizations() {
  cssVariableBatcher.cancel()
  cssPerformanceMonitor.reset()
}
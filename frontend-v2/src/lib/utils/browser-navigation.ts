/**
 * Browser Navigation Utilities
 * 
 * Provides utilities for handling browser navigation events,
 * back/forward button support, and navigation state management.
 */

import { useEffect, useCallback, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export interface NavigationState {
  path: string
  params: Record<string, string>
  timestamp: number
}

export interface NavigationOptions {
  /** Whether to prevent default browser back behavior */
  preventBack?: boolean
  /** Callback when user navigates back */
  onBack?: () => void
  /** Callback when user navigates forward */
  onForward?: () => void
  /** Callback when navigation state changes */
  onStateChange?: (state: NavigationState) => void
}

/**
 * Hook for managing browser navigation events
 */
export function useBrowserNavigation(options: NavigationOptions = {}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { preventBack, onBack, onForward, onStateChange } = options
  
  const navigationHistory = useRef<NavigationState[]>([])
  const currentIndex = useRef(0)
  const isNavigating = useRef(false)

  // Get current navigation state
  const getCurrentState = useCallback((): NavigationState => {
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    
    return {
      path: pathname,
      params,
      timestamp: Date.now()
    }
  }, [pathname, searchParams])

  // Handle popstate events (back/forward buttons)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (isNavigating.current) return
      
      const direction = event.state?.direction || 'back'
      
      if (preventBack && direction === 'back') {
        event.preventDefault()
        // Push current state back to prevent navigation
        window.history.pushState({ direction: 'forward' }, '', window.location.href)
        return
      }
      
      if (direction === 'back' && onBack) {
        onBack()
      } else if (direction === 'forward' && onForward) {
        onForward()
      }
      
      // Update navigation history
      const currentState = getCurrentState()
      if (direction === 'back' && currentIndex.current > 0) {
        currentIndex.current--
      } else if (direction === 'forward' && currentIndex.current < navigationHistory.current.length - 1) {
        currentIndex.current++
      }
      
      onStateChange?.(currentState)
    }

    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [preventBack, onBack, onForward, onStateChange, getCurrentState])

  // Track navigation state changes
  useEffect(() => {
    const currentState = getCurrentState()
    
    // Add to history if it's a new state
    const lastState = navigationHistory.current[navigationHistory.current.length - 1]
    if (!lastState || 
        lastState.path !== currentState.path || 
        JSON.stringify(lastState.params) !== JSON.stringify(currentState.params)) {
      
      navigationHistory.current.push(currentState)
      currentIndex.current = navigationHistory.current.length - 1
      
      // Limit history size
      if (navigationHistory.current.length > 50) {
        navigationHistory.current = navigationHistory.current.slice(-25)
        currentIndex.current = navigationHistory.current.length - 1
      }
    }
    
    onStateChange?.(currentState)
  }, [pathname, searchParams, onStateChange, getCurrentState])

  // Navigation methods
  const navigateBack = useCallback(() => {
    if (currentIndex.current > 0) {
      isNavigating.current = true
      window.history.back()
      setTimeout(() => { isNavigating.current = false }, 100)
    }
  }, [])

  const navigateForward = useCallback(() => {
    if (currentIndex.current < navigationHistory.current.length - 1) {
      isNavigating.current = true
      window.history.forward()
      setTimeout(() => { isNavigating.current = false }, 100)
    }
  }, [])

  const canGoBack = currentIndex.current > 0
  const canGoForward = currentIndex.current < navigationHistory.current.length - 1

  return {
    canGoBack,
    canGoForward,
    navigateBack,
    navigateForward,
    currentState: getCurrentState(),
    navigationHistory: navigationHistory.current,
    currentIndex: currentIndex.current
  }
}

/**
 * Hook for preserving scroll position across navigation
 */
export function useScrollRestoration(key?: string) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const scrollPositions = useRef<Map<string, number>>(new Map())

  const getScrollKey = useCallback(() => {
    return key || `${pathname}?${searchParams.toString()}`
  }, [pathname, searchParams, key])

  // Save scroll position before navigation
  const saveScrollPosition = useCallback(() => {
    const scrollKey = getScrollKey()
    const scrollY = window.scrollY
    scrollPositions.current.set(scrollKey, scrollY)
  }, [getScrollKey])

  // Restore scroll position after navigation
  const restoreScrollPosition = useCallback(() => {
    const scrollKey = getScrollKey()
    const savedPosition = scrollPositions.current.get(scrollKey)
    
    if (savedPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition)
      })
    }
  }, [getScrollKey])

  // Save scroll position on route changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      saveScrollPosition()
    }
  }, [saveScrollPosition])

  // Restore scroll position on mount
  useEffect(() => {
    restoreScrollPosition()
  }, [restoreScrollPosition])

  return {
    saveScrollPosition,
    restoreScrollPosition
  }
}

/**
 * Hook for managing navigation state persistence
 */
export function useNavigationPersistence(storageKey: string) {
  const saveState = useCallback((state: unknown) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save navigation state:', error)
    }
  }, [storageKey])

  const loadState = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.warn('Failed to load navigation state:', error)
      return null
    }
  }, [storageKey])

  const clearState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn('Failed to clear navigation state:', error)
    }
  }, [storageKey])

  return {
    saveState,
    loadState,
    clearState
  }
}

/**
 * Utility functions for browser navigation
 */
export const BrowserNavigationUtils = {
  /**
   * Check if browser supports history API
   */
  supportsHistory: (): boolean => {
    return !!(window.history && window.history.pushState)
  },

  /**
   * Get current URL without domain
   */
  getCurrentPath: (): string => {
    return window.location.pathname + window.location.search
  },

  /**
   * Check if navigation is supported
   */
  canNavigate: (): boolean => {
    return typeof window !== 'undefined' && BrowserNavigationUtils.supportsHistory()
  },

  /**
   * Safely update URL without triggering navigation
   */
  updateURL: (url: string, replace: boolean = true): void => {
    if (!BrowserNavigationUtils.canNavigate()) return
    
    try {
      if (replace) {
        window.history.replaceState(null, '', url)
      } else {
        window.history.pushState(null, '', url)
      }
    } catch (error) {
      console.warn('Failed to update URL:', error)
    }
  },

  /**
   * Get navigation direction from history state
   */
  getNavigationDirection: (): 'back' | 'forward' | 'unknown' => {
    if (typeof window === 'undefined') return 'unknown'
    
    const state = window.history.state
    return state?.direction || 'unknown'
  }
}
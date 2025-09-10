/**
 * Comprehensive URL State Management Hook
 * 
 * Provides a complete solution for URL state management including:
 * - URL synchronization
 * - Browser navigation handling
 * - State persistence
 * - Scroll position restoration
 */

import { useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useURLState, URLStateConfig } from '@/lib/utils/url-state'
import { useBrowserNavigation, useScrollRestoration } from '@/lib/utils/browser-navigation'
import { useURLStateContext } from '@/components/providers/url-state-provider'

export interface URLStateManagementOptions<T> extends URLStateConfig<T> {
  /** Unique key for state persistence */
  persistenceKey: string
  /** Whether to restore scroll position */
  restoreScroll?: boolean
  /** Whether to handle browser back/forward */
  handleNavigation?: boolean
  /** Callback when state is restored from persistence */
  onStateRestored?: (state: T) => void
  /** Callback when navigation occurs */
  onNavigate?: (direction: 'back' | 'forward') => void
}

/**
 * Comprehensive URL state management hook
 */
export function useURLStateManagement<T extends Record<string, unknown>>(
  options: URLStateManagementOptions<T>
) {
  const {
    persistenceKey,
    restoreScroll = true,
    onStateRestored,
    onNavigate,
    ...urlStateConfig
  } = options

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // URL state management
  const [state, updateState, resetState] = useURLState(urlStateConfig)
  
  // State persistence
  const { saveState, loadState, isRestored } = useURLStateContext()
  
  // Scroll restoration
  const { saveScrollPosition, restoreScrollPosition } = useScrollRestoration(
    restoreScroll ? persistenceKey : undefined
  )
  
  // Browser navigation
  const { canGoBack, canGoForward, navigateBack, navigateForward } = useBrowserNavigation({
    onBack: () => {
      onNavigate?.('back')
      if (restoreScroll) {
        restoreScrollPosition()
      }
    },
    onForward: () => {
      onNavigate?.('forward')
      if (restoreScroll) {
        restoreScrollPosition()
      }
    },
    onStateChange: () => {
      // Save current state when navigation occurs
      saveState(persistenceKey, {
        state,
        pathname,
        timestamp: Date.now()
      })
      
      if (restoreScroll) {
        saveScrollPosition()
      }
    }
  })

  // State restoration on mount
  const hasRestored = useRef(false)
  useEffect(() => {
    if (isRestored && !hasRestored.current) {
      const savedData = loadState(persistenceKey)
      
      if (savedData?.state && savedData.pathname === pathname) {
        // Only restore if we're on the same path
        const restoredState = { ...urlStateConfig.defaultState, ...savedData.state }
        
        // Check if current URL state is different from saved state
        const currentUrlState = urlStateConfig.deserialize(searchParams)
        const currentState = { ...urlStateConfig.defaultState, ...currentUrlState }
        
        if (JSON.stringify(restoredState) !== JSON.stringify(currentState)) {
          updateState(restoredState)
          onStateRestored?.(restoredState)
        }
      }
      
      hasRestored.current = true
    }
  }, [isRestored, pathname, persistenceKey, loadState, onStateRestored, updateState, urlStateConfig, searchParams])

  // Enhanced update function with persistence
  const updateStateWithPersistence = useCallback((
    newState: Partial<T> | ((prev: T) => Partial<T>)
  ) => {
    updateState(newState)
    
    // Save to persistence after state update
    setTimeout(() => {
      const currentState = typeof newState === 'function' 
        ? { ...state, ...newState(state) }
        : { ...state, ...newState }
      
      saveState(persistenceKey, {
        state: currentState,
        pathname,
        timestamp: Date.now()
      })
    }, 100)
  }, [updateState, state, saveState, persistenceKey, pathname])

  // Enhanced reset function with persistence cleanup
  const resetStateWithPersistence = useCallback(() => {
    resetState()
    saveState(persistenceKey, {
      state: urlStateConfig.defaultState,
      pathname,
      timestamp: Date.now()
    })
  }, [resetState, saveState, persistenceKey, pathname, urlStateConfig.defaultState])

  // Navigation helpers
  const navigateToPath = useCallback((path: string, newState?: Partial<T>) => {
    if (newState) {
      const serialized = urlStateConfig.serialize({ ...state, ...newState })
      const params = new URLSearchParams()
      
      Object.entries(serialized).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.set(key, value)
        }
      })
      
      const queryString = params.toString()
      const fullPath = queryString ? `${path}?${queryString}` : path
      router.push(fullPath)
    } else {
      router.push(path)
    }
  }, [router, state, urlStateConfig])

  // Get current URL with state
  const getCurrentURL = useCallback(() => {
    const serialized = urlStateConfig.serialize(state)
    const params = new URLSearchParams()
    
    Object.entries(serialized).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        params.set(key, value)
      }
    })
    
    const queryString = params.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }, [pathname, state, urlStateConfig])

  // Check if state has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const savedData = loadState(persistenceKey)
    if (!savedData?.state) return false
    
    return JSON.stringify(state) !== JSON.stringify(savedData.state)
  }, [state, loadState, persistenceKey])

  return {
    // State management
    state,
    updateState: updateStateWithPersistence,
    resetState: resetStateWithPersistence,
    
    // Navigation
    canGoBack,
    canGoForward,
    navigateBack,
    navigateForward,
    navigateToPath,
    
    // URL utilities
    getCurrentURL,
    
    // Persistence
    hasUnsavedChanges,
    isRestored,
    
    // Scroll management
    saveScrollPosition,
    restoreScrollPosition
  }
}

/**
 * Hook for managing filter state with URL persistence
 */
export function useFilterStateManagement<T extends Record<string, unknown>>(
  config: URLStateManagementOptions<T>
) {
  const stateManagement = useURLStateManagement(config)
  
  // Additional filter-specific methods
  const clearFilters = useCallback(() => {
    stateManagement.resetState()
  }, [stateManagement])
  
  const hasActiveFilters = useCallback(() => {
    const { defaultState } = config
    return Object.keys(stateManagement.state).some(key => 
      stateManagement.state[key] !== defaultState[key] &&
      stateManagement.state[key] !== undefined &&
      stateManagement.state[key] !== null &&
      stateManagement.state[key] !== ''
    )
  }, [stateManagement.state, config])
  
  const getActiveFilters = useCallback(() => {
    const { defaultState } = config
    const activeFilters: Partial<T> = {}
    
    Object.keys(stateManagement.state).forEach(key => {
      const value = stateManagement.state[key]
      if (value !== defaultState[key] && 
          value !== undefined && 
          value !== null && 
          value !== '') {
        activeFilters[key as keyof T] = value
      }
    })
    
    return activeFilters
  }, [stateManagement.state, config])
  
  return {
    ...stateManagement,
    clearFilters,
    hasActiveFilters,
    getActiveFilters
  }
}
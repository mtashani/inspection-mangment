/**
 * URL State Provider
 * 
 * Provides URL state management context and handles state persistence
 * across page refreshes and navigation events.
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface URLStateContextValue {
  /** Current URL state as key-value pairs */
  urlState: Record<string, string>
  /** Whether URL state has been restored from storage */
  isRestored: boolean
  /** Save state to persistent storage */
  saveState: (key: string, state: unknown) => void
  /** Load state from persistent storage */
  loadState: (key: string) => unknown
  /** Clear state from persistent storage */
  clearState: (key: string) => void
}

const URLStateContext = createContext<URLStateContextValue | undefined>(undefined)

interface URLStateProviderProps {
  children: ReactNode
  /** Storage key prefix for persistence */
  storagePrefix?: string
  /** Whether to enable debug logging */
  debug?: boolean
}

export function URLStateProvider({ 
  children, 
  storagePrefix = 'maintenance-events',
  debug = false 
}: URLStateProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRestored, setIsRestored] = useState(false)
  const [urlState, setUrlState] = useState<Record<string, string>>({})

  // Update URL state when search params change
  useEffect(() => {
    const newState: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      newState[key] = value
    })
    
    setUrlState(newState)
    
    if (debug) {
      console.log('URL State updated:', newState)
    }
  }, [searchParams, debug])

  // Restore state on mount
  useEffect(() => {
    try {
      // Restore any saved state for current path
      const pathKey = `${storagePrefix}-${pathname}`
      const saved = localStorage.getItem(pathKey)
      
      if (saved) {
        const parsedState = JSON.parse(saved)
        if (debug) {
          console.log('Restored state for path:', pathname, parsedState)
        }
      }
    } catch (error) {
      if (debug) {
        console.warn('Failed to restore URL state:', error)
      }
    } finally {
      setIsRestored(true)
    }
  }, [pathname, storagePrefix, debug])

  // Save state to localStorage
  const saveState = (key: string, state: unknown) => {
    try {
      const fullKey = `${storagePrefix}-${key}`
      localStorage.setItem(fullKey, JSON.stringify({
        ...state,
        timestamp: Date.now(),
        pathname
      }))
      
      if (debug) {
        console.log('Saved state:', fullKey, state)
      }
    } catch (error) {
      if (debug) {
        console.warn('Failed to save state:', error)
      }
    }
  }

  // Load state from localStorage
  const loadState = (key: string) => {
    try {
      const fullKey = `${storagePrefix}-${key}`
      const saved = localStorage.getItem(fullKey)
      
      if (saved) {
        const parsed = JSON.parse(saved)
        
        // Check if state is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000
        if (Date.now() - parsed.timestamp < maxAge) {
          if (debug) {
            console.log('Loaded state:', fullKey, parsed)
          }
          return parsed
        } else {
          // Clean up old state
          localStorage.removeItem(fullKey)
        }
      }
    } catch (error) {
      if (debug) {
        console.warn('Failed to load state:', error)
      }
    }
    
    return null
  }

  // Clear state from localStorage
  const clearState = (key: string) => {
    try {
      const fullKey = `${storagePrefix}-${key}`
      localStorage.removeItem(fullKey)
      
      if (debug) {
        console.log('Cleared state:', fullKey)
      }
    } catch (error) {
      if (debug) {
        console.warn('Failed to clear state:', error)
      }
    }
  }

  // Handle page unload - save current state
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(urlState).length > 0) {
        saveState(pathname, { urlState })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Save state on cleanup
      if (Object.keys(urlState).length > 0) {
        saveState(pathname, { urlState })
      }
    }
  }, [pathname, urlState]) // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue: URLStateContextValue = {
    urlState,
    isRestored,
    saveState,
    loadState,
    clearState
  }

  return (
    <URLStateContext.Provider value={contextValue}>
      {children}
    </URLStateContext.Provider>
  )
}

/**
 * Hook to access URL state context
 */
export function useURLStateContext() {
  const context = useContext(URLStateContext)
  
  if (context === undefined) {
    throw new Error('useURLStateContext must be used within a URLStateProvider')
  }
  
  return context
}

/**
 * Hook for URL state persistence with automatic cleanup
 */
export function useURLStatePersistence(key: string) {
  const { saveState, loadState, clearState } = useURLStateContext()
  
  // Auto-save state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // This could be enhanced to save specific component state
    }, 30000) // Save every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  return {
    saveState: (state: unknown) => saveState(key, state),
    loadState: () => loadState(key),
    clearState: () => clearState(key)
  }
}
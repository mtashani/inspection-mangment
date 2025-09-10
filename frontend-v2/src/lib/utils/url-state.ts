/**
 * URL State Management Utilities
 * 
 * Provides comprehensive URL state synchronization, browser navigation handling,
 * and state persistence across page refreshes.
 */

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export interface URLStateOptions {
  /** Whether to replace the current history entry instead of pushing a new one */
  replace?: boolean
  /** Whether to scroll to top when URL changes */
  scroll?: boolean
  /** Debounce delay for URL updates in milliseconds */
  debounceMs?: number
}

export interface URLStateConfig<T> {
  /** Function to serialize state to URL search params */
  serialize: (state: T) => Record<string, string>
  /** Function to deserialize URL search params to state */
  deserialize: (params: URLSearchParams) => Partial<T>
  /** Default state values */
  defaultState: T
  /** Options for URL updates */
  options?: URLStateOptions
}

/**
 * Custom hook for managing state synchronized with URL search parameters
 */
export function useURLState<T extends Record<string, unknown>>(
  config: URLStateConfig<T>
): [T, (newState: Partial<T> | ((prev: T) => Partial<T>)) => void, () => void] {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const { serialize, deserialize, defaultState, options = {} } = config
  const { replace = true, scroll = false, debounceMs = 300 } = options

  // Initialize state from URL or default
  const [state, setState] = useState<T>(() => {
    const urlState = deserialize(searchParams)
    return { ...defaultState, ...urlState }
  })

  // Debounced URL update
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null)

  const updateURL = useCallback((newState: T) => {
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }

    const timeout = setTimeout(() => {
      const serialized = serialize(newState)
      const params = new URLSearchParams()
      
      // Only add non-empty values to URL
      Object.entries(serialized).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.set(key, value)
        }
      })
      
      const queryString = params.toString()
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname
      
      // Only update if URL would actually change
      const currentUrl = `${pathname}?${searchParams.toString()}`
      if (newUrl !== currentUrl) {
        if (replace) {
          router.replace(newUrl, { scroll })
        } else {
          router.push(newUrl, { scroll })
        }
      }
    }, debounceMs)

    setUpdateTimeout(timeout)
  }, [router, pathname, searchParams, serialize, replace, scroll, debounceMs, updateTimeout])

  // Update state and URL
  const updateState = useCallback((
    newState: Partial<T> | ((prev: T) => Partial<T>)
  ) => {
    setState(prev => {
      const updated = typeof newState === 'function' 
        ? { ...prev, ...newState(prev) }
        : { ...prev, ...newState }
      
      updateURL(updated)
      return updated
    })
  }, [updateURL])

  // Reset to default state
  const resetState = useCallback(() => {
    setState(defaultState)
    updateURL(defaultState)
  }, [defaultState, updateURL])

  // Sync with URL changes (browser back/forward)
  useEffect(() => {
    const urlState = deserialize(searchParams)
    const newState = { ...defaultState, ...urlState }
    
    // Only update if state actually changed
    setState(prevState => {
      if (JSON.stringify(newState) !== JSON.stringify(prevState)) {
        return newState
      }
      return prevState
    })
  }, [searchParams, deserialize, defaultState])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
    }
  }, [updateTimeout])

  return [state, updateState, resetState]
}

/**
 * Hook for managing tab state with URL persistence
 */
export function useTabState(
  tabs: string[],
  defaultTab?: string,
  paramName: string = 'tab'
) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const initialTab = searchParams.get(paramName) || defaultTab || tabs[0]
  const [activeTab, setActiveTab] = useState(initialTab)

  const updateTab = useCallback((tab: string) => {
    if (!tabs.includes(tab)) {
      console.warn(`Tab "${tab}" is not in the allowed tabs list`)
      return
    }

    setActiveTab(tab)
    
    const params = new URLSearchParams(searchParams.toString())
    
    if (tab === defaultTab || tab === tabs[0]) {
      params.delete(paramName)
    } else {
      params.set(paramName, tab)
    }
    
    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    
    router.replace(newUrl, { scroll: false })
  }, [tabs, defaultTab, paramName, searchParams, router, pathname])

  // Sync with URL changes
  useEffect(() => {
    const urlTab = searchParams.get(paramName)
    if (urlTab && tabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams, paramName, tabs, activeTab])

  return [activeTab, updateTab] as const
}

/**
 * Hook for managing search state with URL persistence and debouncing
 */
export function useSearchState(
  paramName: string = 'search',
  debounceMs: number = 300
) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const initialSearch = searchParams.get(paramName) || ''
  const [search, setSearch] = useState(initialSearch)
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null)

  const updateSearch = useCallback((newSearch: string) => {
    setSearch(newSearch)
    
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (newSearch.trim() === '') {
        params.delete(paramName)
      } else {
        params.set(paramName, newSearch.trim())
      }
      
      const queryString = params.toString()
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname
      
      router.replace(newUrl, { scroll: false })
    }, debounceMs)

    setUpdateTimeout(timeout)
  }, [searchParams, router, pathname, paramName, debounceMs, updateTimeout])

  // Sync with URL changes
  useEffect(() => {
    const urlSearch = searchParams.get(paramName) || ''
    setSearch(prevSearch => {
      if (urlSearch !== prevSearch) {
        return urlSearch
      }
      return prevSearch
    })
  }, [searchParams, paramName])

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
    }
  }, [updateTimeout])

  return [search, updateSearch] as const
}

/**
 * Utility functions for URL state management
 */
export const URLStateUtils = {
  /**
   * Serialize filters object to URL-safe strings
   */
  serializeFilters: <T extends Record<string, unknown>>(filters: T): Record<string, string> => {
    const result: Record<string, string> = {}
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          result[key] = JSON.stringify(value)
        } else {
          result[key] = String(value)
        }
      }
    })
    
    return result
  },

  /**
   * Deserialize URL params to filters object
   */
  deserializeFilters: <T>(params: URLSearchParams, schema: Record<keyof T, 'string' | 'number' | 'boolean' | 'object'>): Partial<T> => {
    const result: Partial<T> = {}
    
    Object.entries(schema).forEach(([key, type]) => {
      const value = params.get(key)
      if (value !== null) {
        try {
          switch (type) {
            case 'string':
              (result as Record<string, unknown>)[key] = value
              break
            case 'number':
              (result as Record<string, unknown>)[key] = Number(value)
              break
            case 'boolean':
              (result as Record<string, unknown>)[key] = value === 'true'
              break
            case 'object':
              (result as Record<string, unknown>)[key] = JSON.parse(value)
              break
          }
        } catch (error) {
          console.warn(`Failed to deserialize URL param "${key}":`, error)
        }
      }
    })
    
    return result
  },

  /**
   * Get current URL state as object
   */
  getCurrentState: (searchParams: URLSearchParams): Record<string, string> => {
    const state: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      state[key] = value
    })
    return state
  },

  /**
   * Check if URL has any state parameters
   */
  hasState: (searchParams: URLSearchParams): boolean => {
    return searchParams.toString().length > 0
  }
}
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseDebouncedSearchOptions {
  delay?: number
  minLength?: number
  immediate?: boolean
}

interface UseDebouncedSearchResult {
  searchQuery: string
  debouncedQuery: string
  isSearching: boolean
  setSearchQuery: (query: string) => void
  clearSearch: () => void
}

/**
 * Custom hook for debounced search functionality
 * Optimizes search performance by delaying API calls until user stops typing
 */
export function useDebouncedSearch(
  initialQuery: string = '',
  options: UseDebouncedSearchOptions = {}
): UseDebouncedSearchResult {
  const {
    delay = 300,
    minLength = 0,
    immediate = false
  } = options

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set searching state
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true)
    }

    // If query is shorter than minimum length, clear debounced query immediately
    if (searchQuery.length < minLength) {
      setDebouncedQuery('')
      setIsSearching(false)
      return
    }

    // If immediate is true and this is the first search, don't debounce
    if (immediate && debouncedQuery === initialQuery) {
      setDebouncedQuery(searchQuery)
      setIsSearching(false)
      return
    }

    // Set up debounced update
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setIsSearching(false)
    }, delay)

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchQuery, delay, minLength, immediate, debouncedQuery, initialQuery])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedQuery('')
    setIsSearching(false)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    searchQuery,
    debouncedQuery,
    isSearching,
    setSearchQuery,
    clearSearch
  }
}

/**
 * Hook for debounced API search with caching
 */
interface UseDebouncedApiSearchOptions<T> extends UseDebouncedSearchOptions {
  searchFn: (query: string) => Promise<T[]>
  cacheResults?: boolean
  maxCacheSize?: number
}

interface UseDebouncedApiSearchResult<T> {
  searchQuery: string
  results: T[]
  isLoading: boolean
  error: string | null
  setSearchQuery: (query: string) => void
  clearSearch: () => void
  refetch: () => Promise<void>
}

export function useDebouncedApiSearch<T>(
  initialQuery: string = '',
  options: UseDebouncedApiSearchOptions<T>
): UseDebouncedApiSearchResult<T> {
  const {
    searchFn,
    cacheResults = true,
    maxCacheSize = 100,
    ...debouncedOptions
  } = options

  const { searchQuery, debouncedQuery, isSearching, setSearchQuery, clearSearch } = 
    useDebouncedSearch(initialQuery, debouncedOptions)

  const [results, setResults] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache for search results
  const cacheRef = useRef<Map<string, T[]>>(new Map())
  const abortControllerRef = useRef<AbortController | null>(null)

  const performSearch = useCallback(async (query: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Check cache first
    if (cacheResults && cacheRef.current.has(query)) {
      const cachedResults = cacheRef.current.get(query)!
      setResults(cachedResults)
      setIsLoading(false)
      setError(null)
      return
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      const searchResults = await searchFn(query)
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      setResults(searchResults)

      // Cache results
      if (cacheResults) {
        // Implement LRU cache behavior
        if (cacheRef.current.size >= maxCacheSize) {
          const firstKey = cacheRef.current.keys().next().value
          cacheRef.current.delete(firstKey)
        }
        cacheRef.current.set(query, searchResults)
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [searchFn, cacheResults, maxCacheSize])

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery)
    } else {
      setResults([])
      setIsLoading(false)
      setError(null)
    }
  }, [debouncedQuery, performSearch])

  // Set loading state when user is typing
  useEffect(() => {
    if (isSearching && debouncedQuery.trim()) {
      setIsLoading(true)
    }
  }, [isSearching, debouncedQuery])

  const refetch = useCallback(async () => {
    if (debouncedQuery.trim()) {
      // Clear cache for current query
      if (cacheResults) {
        cacheRef.current.delete(debouncedQuery)
      }
      await performSearch(debouncedQuery)
    }
  }, [debouncedQuery, performSearch, cacheResults])

  const clearSearchWithResults = useCallback(() => {
    clearSearch()
    setResults([])
    setError(null)
    setIsLoading(false)
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [clearSearch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    searchQuery,
    results,
    isLoading,
    error,
    setSearchQuery,
    clearSearch: clearSearchWithResults,
    refetch
  }
}

/**
 * Hook for multi-field search with individual debouncing
 */
interface UseMultiFieldSearchOptions {
  delay?: number
  fields: string[]
}

interface UseMultiFieldSearchResult {
  searchFields: Record<string, string>
  debouncedFields: Record<string, string>
  isSearching: boolean
  setSearchField: (field: string, value: string) => void
  clearSearchField: (field: string) => void
  clearAllFields: () => void
}

export function useMultiFieldSearch(
  options: UseMultiFieldSearchOptions
): UseMultiFieldSearchResult {
  const { delay = 300, fields } = options

  const [searchFields, setSearchFields] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {})
  )
  
  const [debouncedFields, setDebouncedFields] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {})
  )
  
  const [isSearching, setIsSearching] = useState(false)
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})

  const setSearchField = useCallback((field: string, value: string) => {
    setSearchFields(prev => ({ ...prev, [field]: value }))
    
    // Clear existing timeout for this field
    if (timeoutsRef.current[field]) {
      clearTimeout(timeoutsRef.current[field])
    }

    // Set searching state
    setIsSearching(true)

    // Set up debounced update for this field
    timeoutsRef.current[field] = setTimeout(() => {
      setDebouncedFields(prev => ({ ...prev, [field]: value }))
      
      // Check if any other fields are still being debounced
      const hasActiveTimeouts = Object.values(timeoutsRef.current).some(timeout => timeout !== null)
      if (!hasActiveTimeouts) {
        setIsSearching(false)
      }
    }, delay)
  }, [delay])

  const clearSearchField = useCallback((field: string) => {
    setSearchFields(prev => ({ ...prev, [field]: '' }))
    setDebouncedFields(prev => ({ ...prev, [field]: '' }))
    
    if (timeoutsRef.current[field]) {
      clearTimeout(timeoutsRef.current[field])
      delete timeoutsRef.current[field]
    }
  }, [])

  const clearAllFields = useCallback(() => {
    const emptyFields = fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {})
    setSearchFields(emptyFields)
    setDebouncedFields(emptyFields)
    setIsSearching(false)
    
    // Clear all timeouts
    Object.values(timeoutsRef.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout)
    })
    timeoutsRef.current = {}
  }, [fields])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout)
      })
    }
  }, [])

  return {
    searchFields,
    debouncedFields,
    isSearching,
    setSearchField,
    clearSearchField,
    clearAllFields
  }
}
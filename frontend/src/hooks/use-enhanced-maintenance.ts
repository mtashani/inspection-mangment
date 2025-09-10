'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback, useExpensiveMemo } from '@/utils/performance-optimizations'

import {
  EnhancedMaintenanceEvent,
  FilterOptions,
  DailyReportsSummary,
  InspectionPlan,
  InspectionPlanCreateRequest,
  InspectionPlanUpdateRequest,
  UseMaintenanceEventsOptions,
  UseMaintenanceEventsResult,
  UseInspectionPlanningOptions,
  UseInspectionPlanningResult
} from '@/types/enhanced-maintenance'

import {
  inspectionPlanningApi,
  enhancedReportingApi,
  filteringSearchApi,
  enhancedInspectionsApi,
  apiUtils
} from '@/api/enhanced-maintenance'
import { MaintenanceEventStatus } from '@/types/maintenance'

// Hook for managing maintenance events with filtering and search
export function useEnhancedMaintenanceEvents(
  options: UseMaintenanceEventsOptions = {}
): UseMaintenanceEventsResult {
  const { filters = {}, autoRefresh = false, refreshInterval = 30000 } = options
  
  const [events, setEvents] = useState<EnhancedMaintenanceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setError(null)
      
      // In real implementation, call the API
      // const response = await filteringSearchApi.getFilteredInspections({
      //   dateFrom: filters.dateRange?.from,
      //   dateTo: filters.dateRange?.to,
      //   status: filters.status,
      //   inspector: filters.inspectors,
      //   equipmentTag: filters.equipmentTag,
      //   requester: filters.requester
      // })
      
      // Mock data for now
      const mockEvents: EnhancedMaintenanceEvent[] = []
      setEvents(mockEvents)
    } catch (err) {
      const errorMessage = apiUtils.formatError(err as Error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    await fetchEvents()
  }, [fetchEvents])

  const createEvent = useCallback(async (data: Partial<EnhancedMaintenanceEvent>): Promise<EnhancedMaintenanceEvent> => {
    try {
      // In real implementation, call API
      // const newEvent = await maintenanceApi.createEvent(data)
      
      // Mock implementation
      const newEvent: EnhancedMaintenanceEvent = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subEvents: [],
        completionPercentage: 0,
        plannedInspections: [],
        activeInspections: [],
        completedInspections: [],
        statistics: {
          totalPlannedInspections: 0,
          activeInspections: 0,
          completedInspections: 0,
          firstTimeInspectionsCount: 0,
          equipmentStatusBreakdown: {
            planned: 0,
            underInspection: 0,
            completed: 0
          }
        },
        requesterBreakdown: []
      }
      
      setEvents(prev => [newEvent, ...prev])
      return newEvent
    } catch (err) {
      throw new Error(apiUtils.formatError(err as Error))
    }
  }, [])

  const updateEvent = useCallback(async (id: string, data: Partial<EnhancedMaintenanceEvent>): Promise<EnhancedMaintenanceEvent> => {
    try {
      // In real implementation, call API
      // const updatedEvent = await maintenanceApi.updateEvent(id, data)
      
      // Mock implementation
      const updatedEvent = { ...data, id, updatedAt: new Date().toISOString() }
      
      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...updatedEvent } : event
      ))
      
      return updatedEvent as EnhancedMaintenanceEvent
    } catch (err) {
      throw new Error(apiUtils.formatError(err as Error))
    }
  }, [])

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      // In real implementation, call API
      // await maintenanceApi.deleteEvent(id)
      
      setEvents(prev => prev.filter(event => event.id !== id))
    } catch (err) {
      throw new Error(apiUtils.formatError(err as Error))
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchEvents, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchEvents])

  return {
    events,
    loading,
    error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent
  }
}

// Hook for managing inspection planning
export function useInspectionPlanning(
  options: UseInspectionPlanningOptions = {}
): UseInspectionPlanningResult {
  const { eventId, subEventId, autoRefresh = false } = options
  
  const [plans, setPlans] = useState<InspectionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    if (!eventId && !subEventId) {
      setPlans([])
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      const targetId = subEventId || eventId!
      const isSubEvent = !!subEventId
      
      const fetchedPlans = await apiUtils.withRetry(() =>
        inspectionPlanningApi.getPlannedInspections(targetId, isSubEvent)
      )
      
      setPlans(fetchedPlans)
    } catch (err) {
      const errorMessage = apiUtils.formatError(err as Error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [eventId, subEventId])

  const createPlan = useCallback(async (data: InspectionPlanCreateRequest): Promise<InspectionPlan> => {
    try {
      const newPlan = await apiUtils.withRetry(() =>
        inspectionPlanningApi.createInspectionPlan(data)
      )
      
      setPlans(prev => [newPlan, ...prev])
      return newPlan
    } catch (err) {
      throw new Error(apiUtils.formatError(err as Error))
    }
  }, [])

  const updatePlan = useCallback(async (id: string, data: InspectionPlanUpdateRequest): Promise<InspectionPlan> => {
    try {
      const updatedPlan = await apiUtils.withRetry(() =>
        inspectionPlanningApi.updateInspectionPlan(id, data)
      )
      
      setPlans(prev => prev.map(plan => 
        plan.id === id ? updatedPlan : plan
      ))
      
      return updatedPlan
    } catch (err) {
      throw new Error(apiUtils.formatError(err as Error))
    }
  }, [])

  const deletePlan = useCallback(async (id: string): Promise<void> => {
    try {
      await apiUtils.withRetry(() =>
        inspectionPlanningApi.deleteInspectionPlan(id)
      )
      
      setPlans(prev => prev.filter(plan => plan.id !== id))
    } catch (err) {
      throw new Error(apiUtils.formatError(err as Error))
    }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    await fetchPlans()
  }, [fetchPlans])

  // Initial fetch
  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchPlans, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchPlans])

  return {
    plans,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    refetch
  }
}

// Hook for managing URL-based filters
export function useFilterState(initialFilters: FilterOptions = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<FilterOptions>(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')

  // Parse filters from URL on mount
  useEffect(() => {
    const urlFilters: FilterOptions = {}
    
    // Parse date range
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')
    if (fromDate && toDate) {
      urlFilters.dateRange = { from: fromDate, to: toDate }
    }
    
    // Parse status array
    const statusParam = searchParams.get('status')
    if (statusParam) {
      urlFilters.status = statusParam.split(',') as MaintenanceEventStatus[]
    }
    
    // Parse other filters
    const equipmentTag = searchParams.get('equipment')
    if (equipmentTag) {
      urlFilters.equipmentTag = equipmentTag
    }
    
    const inspectors = searchParams.get('inspectors')
    if (inspectors) {
      urlFilters.inspectors = inspectors.split(',')
    }
    
    const search = searchParams.get('q')
    if (search) {
      setSearchQuery(search)
    }
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }))
    }
  }, [searchParams])

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
    
    const params = new URLSearchParams()
    
    // Add date range
    if (newFilters.dateRange) {
      params.set('from', newFilters.dateRange.from)
      params.set('to', newFilters.dateRange.to)
    }
    
    // Add status
    if (newFilters.status && newFilters.status.length > 0) {
      params.set('status', newFilters.status.join(','))
    }
    
    // Add equipment tag
    if (newFilters.equipmentTag) {
      params.set('equipment', newFilters.equipmentTag)
    }
    
    // Add inspectors
    if (newFilters.inspectors && newFilters.inspectors.length > 0) {
      params.set('inspectors', newFilters.inspectors.join(','))
    }
    
    // Add search query
    if (searchQuery) {
      params.set('q', searchQuery)
    }
    
    // Update URL without page reload
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(newUrl, { scroll: false })
  }, [router, searchQuery])

  const updateSearch = useCallback((query: string) => {
    setSearchQuery(query)
    
    const params = new URLSearchParams(searchParams.toString())
    
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(newUrl, { scroll: false })
  }, [router, searchParams])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
    router.replace('', { scroll: false })
  }, [router])

  return {
    filters,
    searchQuery,
    updateFilters,
    updateSearch,
    clearFilters
  }
}

// Hook for managing summary statistics
export function useDailyReportsSummary() {
  const [summary, setSummary] = useState<DailyReportsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      setError(null)
      
      // In real implementation, call API
      // const summaryData = await enhancedReportingApi.getSummary()
      
      // Mock data
      const mockSummary: DailyReportsSummary = {
        activeInspections: 15,
        completedInspections: 45,
        activeMaintenanceEvents: 3,
        completedMaintenanceEvents: 12,
        reportsThisMonth: 128,
        activeInspectors: 8,
        overdueItems: 2,
        upcomingDeadlines: 6
      }
      
      setSummary(mockSummary)
    } catch (err) {
      const errorMessage = apiUtils.formatError(err as Error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    await fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return {
    summary,
    loading,
    error,
    refetch
  }
}

// Hook for managing local storage preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = useState({
    defaultView: 'hierarchical' as 'hierarchical' | 'timeline' | 'analytics',
    itemsPerPage: 20,
    autoRefresh: false,
    refreshInterval: 30000,
    showCompletedItems: true,
    showCancelledItems: false
  })

  useEffect(() => {
    const stored = localStorage.getItem('enhanced-daily-reports-preferences')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setPreferences(prev => ({ ...prev, ...parsed }))
      } catch (err) {
        console.warn('Failed to parse stored preferences:', err)
      }
    }
  }, [])

  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates }
      localStorage.setItem('enhanced-daily-reports-preferences', JSON.stringify(newPreferences))
      return newPreferences
    })
  }, [])

  return {
    preferences,
    updatePreferences
  }
}
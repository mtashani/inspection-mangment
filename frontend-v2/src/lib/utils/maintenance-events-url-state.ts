/**
 * URL State Management for Maintenance Events
 * 
 * Provides specific configurations and utilities for managing URL state
 * in the maintenance events pages.
 */

import { EventsFilters, MaintenanceEventStatus, MaintenanceEventType } from '@/types/maintenance-events'
import { URLStateConfig, URLStateUtils } from './url-state'

/**
 * Configuration for Events Overview page URL state
 */
export const eventsOverviewURLConfig: URLStateConfig<EventsFilters> = {
  serialize: (state: EventsFilters) => {
    return URLStateUtils.serializeFilters(state)
  },
  
  deserialize: (params: URLSearchParams) => {
    return URLStateUtils.deserializeFilters<EventsFilters>(params, {
      search: 'string',
      status: 'string',
      eventType: 'string',
      dateFrom: 'string',
      dateTo: 'string'
    })
  },
  
  defaultState: {
    search: '',
    status: undefined,
    eventType: undefined,
    dateFrom: undefined,
    dateTo: undefined
  },
  
  options: {
    replace: true,
    scroll: false,
    debounceMs: 300
  }
}

/**
 * Event Details page state interface
 */
export interface EventDetailsState {
  tab: string
  search: string
  inspectionStatus?: string
  equipmentTag?: string
  dateFrom?: string
  dateTo?: string
  dateField?: string
}

/**
 * Configuration for Event Details page URL state
 */
export const eventDetailsURLConfig: URLStateConfig<EventDetailsState> = {
  serialize: (state: EventDetailsState) => {
    const result: Record<string, string> = {}
    
    // Only include non-default values
    if (state.tab && state.tab !== 'direct-inspections') {
      result.tab = state.tab
    }
    
    if (state.search) {
      result.search = state.search
    }
    
    if (state.inspectionStatus) {
      result.inspectionStatus = state.inspectionStatus
    }
    
    if (state.equipmentTag) {
      result.equipmentTag = state.equipmentTag
    }
    
    if (state.dateFrom) {
      result.dateFrom = state.dateFrom
    }
    
    if (state.dateTo) {
      result.dateTo = state.dateTo
    }
    
    if (state.dateField && state.dateField !== 'actual_start_date') {
      result.dateField = state.dateField
    }
    
    return result
  },
  
  deserialize: (params: URLSearchParams) => {
    return {
      tab: params.get('tab') || 'direct-inspections',
      search: params.get('search') || '',
      inspectionStatus: params.get('inspectionStatus') || undefined,
      equipmentTag: params.get('equipmentTag') || undefined,
      dateFrom: params.get('dateFrom') || undefined,
      dateTo: params.get('dateTo') || undefined,
      dateField: params.get('dateField') || undefined
    }
  },
  
  defaultState: {
    tab: 'direct-inspections',
    search: '',
    inspectionStatus: undefined,
    equipmentTag: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    dateField: undefined
  },
  
  options: {
    replace: true,
    scroll: false,
    debounceMs: 300
  }
}

/**
 * Utility functions specific to maintenance events URL state
 */
export const MaintenanceEventsURLUtils = {
  /**
   * Validate and normalize event status from URL
   */
  normalizeEventStatus: (status: string | undefined): MaintenanceEventStatus | undefined => {
    if (!status) return undefined
    
    const validStatuses: MaintenanceEventStatus[] = [
      'Planned',
      'InProgress', 
      'Completed',
      'Cancelled',
      'Postponed'
    ]
    
    return validStatuses.find(s => s.toLowerCase() === status.toLowerCase())
  },

  /**
   * Validate and normalize event type from URL
   */
  normalizeEventType: (type: string | undefined): MaintenanceEventType | undefined => {
    if (!type) return undefined
    
    const validTypes: MaintenanceEventType[] = [
      'Overhaul',
      'Inspection',
      'Repair', 
      'Preventive',
      'Emergency'
    ]
    
    return validTypes.find(t => t.toLowerCase() === type.toLowerCase())
  },

  /**
   * Generate breadcrumb-friendly URL for event details
   */
  getEventDetailsURL: (eventId: string, state?: Partial<EventDetailsState>): string => {
    const baseUrl = `/maintenance-events/${eventId}`
    
    if (!state) return baseUrl
    
    const params = new URLSearchParams()
    
    if (state.tab && state.tab !== 'direct-inspections') {
      params.set('tab', state.tab)
    }
    
    if (state.search) {
      params.set('search', state.search)
    }
    
    if (state.inspectionStatus) {
      params.set('inspectionStatus', state.inspectionStatus)
    }
    
    if (state.equipmentTag) {
      params.set('equipmentTag', state.equipmentTag)
    }
    
    if (state.dateFrom) {
      params.set('dateFrom', state.dateFrom)
    }
    
    if (state.dateTo) {
      params.set('dateTo', state.dateTo)
    }
    
    if (state.dateField && state.dateField !== 'actual_start_date') {
      params.set('dateField', state.dateField)
    }
    
    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  },

  /**
   * Generate events overview URL with filters
   */
  getEventsOverviewURL: (filters?: Partial<EventsFilters>): string => {
    const baseUrl = '/maintenance-events'
    
    if (!filters) return baseUrl
    
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    })
    
    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  },

  /**
   * Parse tab ID to extract sub-event information
   */
  parseTabId: (tabId: string): { type: 'direct' | 'sub-event', subEventId?: number } => {
    if (tabId === 'direct-inspections') {
      return { type: 'direct' }
    }
    
    if (tabId.startsWith('sub-event-')) {
      const subEventId = parseInt(tabId.replace('sub-event-', ''))
      return { type: 'sub-event', subEventId }
    }
    
    return { type: 'direct' }
  },

  /**
   * Generate tab ID from sub-event information
   */
  generateTabId: (subEventId?: number): string => {
    return subEventId ? `sub-event-${subEventId}` : 'direct-inspections'
  },

  /**
   * Check if current URL state indicates filtered view
   */
  isFilteredView: (state: EventsFilters): boolean => {
    return !!(
      state.search ||
      state.status ||
      state.eventType ||
      state.dateFrom ||
      state.dateTo
    )
  },

  /**
   * Get filter summary for display
   */
  getFilterSummary: (state: EventsFilters): string[] => {
    const summary: string[] = []
    
    if (state.search) {
      summary.push(`Search: "${state.search}"`)
    }
    
    if (state.status) {
      summary.push(`Status: ${state.status}`)
    }
    
    if (state.eventType) {
      summary.push(`Type: ${state.eventType}`)
    }
    
    if (state.dateFrom || state.dateTo) {
      const dateRange = [state.dateFrom, state.dateTo].filter(Boolean).join(' - ')
      summary.push(`Date: ${dateRange}`)
    }
    
    return summary
  }
}

/**
 * Hook for managing events overview URL state
 */
export function useEventsOverviewURLState(initialFilters: EventsFilters = {}) {
  // This will be implemented in the container components
  return { initialFilters }
}

/**
 * Hook for managing event details URL state  
 */
export function useEventDetailsURLState(
  eventId: string,
  initialTab?: string,
  initialSearch?: string
) {
  // This will be implemented in the container components
  return { eventId, initialTab, initialSearch }
}
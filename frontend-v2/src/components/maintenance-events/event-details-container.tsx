'use client'

import { useCallback, useMemo, useState } from 'react'
import { useMaintenanceEvent, useMaintenanceSubEvents } from '@/hooks/use-maintenance-events'
import { eventDetailsURLConfig, MaintenanceEventsURLUtils } from '@/lib/utils/maintenance-events-url-state'
import { useURLStateManagement } from '@/hooks/use-url-state-management'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { UnifiedEventDashboard } from './unified-event-dashboard'
import { EventTabs } from './event-tabs'
import { EventDetailsSkeleton } from './event-details-skeleton'
import { EventNotFound } from './event-not-found'

interface EventDetailsContainerProps {
  eventId: string
  initialTab?: string
  initialSearch?: string
}

export function EventDetailsContainer({ 
  eventId, 
  initialTab, 
  initialSearch 
}: EventDetailsContainerProps) {
  // Remove the separate dashboard tab state - we'll combine everything
  
  // Comprehensive URL state management with persistence
  const {
    state,
    updateState
  } = useURLStateManagement({
    ...eventDetailsURLConfig,
    defaultState: {
      ...eventDetailsURLConfig.defaultState,
      tab: initialTab || 'direct-inspections',
      search: initialSearch || ''
    },
    persistenceKey: `event-details-${eventId}`,
    restoreScroll: true,
    handleNavigation: true,
    onStateRestored: (restoredState) => {
      console.log('Event details state restored:', restoredState)
    },
    onNavigate: (direction) => {
      console.log('Navigation detected:', direction)
    }
  })
  
  const { data: event, isLoading: eventLoading, error: eventError } = useMaintenanceEvent(eventId)
  const { data: subEvents, isLoading: subEventsLoading } = useMaintenanceSubEvents(eventId)

  // Memoized handlers to prevent unnecessary re-renders
  const handleTabChange = useCallback((tab: string) => {
    updateState({ tab })
  }, [updateState])

  const handleSearchChange = useCallback((newSearch: string) => {
    updateState({ search: newSearch })
  }, [updateState])

  // Additional state handlers for enhanced filtering
  const handleInspectionStatusChange = useCallback((status: string | undefined) => {
    updateState({ inspectionStatus: status })
  }, [updateState])

  const handleEquipmentTagFilter = useCallback((tag: string | undefined) => {
    updateState({ equipmentTag: tag })
  }, [updateState])

  // Date range handlers - FIXED: Use format() from date-fns to avoid timezone issues
  const handleDateRangeChange = useCallback((dateRange: DateRange | undefined) => {
    const dateFrom = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
    const dateTo = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🗓️ Event details date filter change:', { dateRange, dateFrom, dateTo })
    }
    
    updateState({ dateFrom, dateTo })
  }, [updateState])

  const handleDateFieldChange = useCallback((field: string) => {
    updateState({ dateField: field })
  }, [updateState])

  const handleResetFilters = useCallback(() => {
    updateState({ 
      search: '', 
      inspectionStatus: undefined, 
      equipmentTag: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      dateField: undefined
    })
  }, [updateState])

  // Parse current tab information
  const tabInfo = useMemo(() => {
    return MaintenanceEventsURLUtils.parseTabId(state.tab)
  }, [state.tab])

  if (eventLoading || subEventsLoading) {
    return <EventDetailsSkeleton />
  }

  if (eventError || !event) {
    return <EventNotFound eventId={eventId} />
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Unified View: Overview & Analytics at the top */}
      <UnifiedEventDashboard event={event} />
      
      {/* Inspections & Reports below */}
      <EventTabs 
        event={event}
        subEvents={subEvents}
        activeTab={state.tab}
        onTabChange={handleTabChange}
        search={state.search}
        onSearchChange={handleSearchChange}
        inspectionStatus={state.inspectionStatus}
        onInspectionStatusChange={handleInspectionStatusChange}
        equipmentTag={state.equipmentTag}
        onEquipmentTagChange={handleEquipmentTagFilter}
        dateFrom={state.dateFrom}
        dateTo={state.dateTo}
        dateField={state.dateField}
        onDateRangeChange={handleDateRangeChange}
        onDateFieldChange={handleDateFieldChange}
        onResetFilters={handleResetFilters}
        tabInfo={tabInfo}
      />
    </div>
  )
}
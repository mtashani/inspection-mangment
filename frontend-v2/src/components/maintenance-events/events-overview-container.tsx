'use client'

import { useCallback, useState } from 'react'
import { useMaintenanceEvents, useEventsSummary, useInspections } from '@/hooks/use-maintenance-events'
import { EventsFilters, InspectionsFilters, MaintenanceEventStatus } from '@/types/maintenance-events'
import { eventsOverviewURLConfig, MaintenanceEventsURLUtils } from '@/lib/utils/maintenance-events-url-state'
import { useFilterStateManagement } from '@/hooks/use-url-state-management'
import { EventsHeader } from './events-header'
import { SummaryCards } from './summary-cards'
import { GlobalSearchAndFilters } from './global-search-filters'
import { EventsList } from './events-list'
import { InspectionsList } from './inspections-list'
import { EventInspectionsList } from './event-inspections-list'
import { ProgressiveLoading } from '@/components/ui/progressive-loading'
import { StatsGridSkeleton } from '@/components/ui/advanced-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Package, FileText, Wrench } from 'lucide-react'
import { format } from 'date-fns'

interface EventsOverviewContainerProps {
  initialFilters?: EventsFilters
}

type SearchMode = 'events' | 'inspections'

export function EventsOverviewContainer({ initialFilters = {} }: EventsOverviewContainerProps) {
  // Search mode state
  const [searchMode, setSearchMode] = useState<SearchMode>('events')
  
  // Separate filters for events and inspections
  const [eventsFilters, setEventsFilters] = useState<EventsFilters>(initialFilters)
  const [inspectionsFilters, setInspectionsFilters] = useState<InspectionsFilters>({})
  
  // Fetch data based on current mode
  const { data: events, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useMaintenanceEvents(eventsFilters)
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useEventsSummary(eventsFilters)
  const { data: inspections, isLoading: inspectionsLoading, error: inspectionsError } = useInspections(inspectionsFilters)

  const handleEventsFiltersChange = useCallback((newFilters: EventsFilters) => {
    setEventsFilters(newFilters)
  }, [])
  
  const handleInspectionsFiltersChange = useCallback((newFilters: InspectionsFilters) => {
    setInspectionsFilters(newFilters)
  }, [])

  const handleClearFilters = useCallback(() => {
    if (searchMode === 'events') {
      setEventsFilters({})
    } else {
      setInspectionsFilters({})
    }
  }, [searchMode])
  
  const handleSearchModeChange = useCallback((mode: SearchMode) => {
    setSearchMode(mode)
    // Clear filters when switching modes for better UX
    setEventsFilters({})
    setInspectionsFilters({})
  }, [])

  const handleSummaryCardClick = useCallback((metric: string) => {
    // Apply filters based on clicked metric (only for events mode)
    if (searchMode === 'events') {
      switch (metric) {
        case 'active-events':
          setEventsFilters(prev => ({ ...prev, status: MaintenanceEventStatus.InProgress }))
          break
        case 'completed-events':
          setEventsFilters(prev => ({ ...prev, status: MaintenanceEventStatus.Completed }))
          break
        case 'total-events':
          // Clear status filter to show all events
          setEventsFilters(prev => ({ ...prev, status: undefined }))
          break
        default:
          break
      }
    }
  }, [searchMode])
  
  const handleEventUpdated = useCallback(() => {
    // Refetch data when an event is updated
    refetchEvents()
    refetchSummary()
  }, [refetchEvents, refetchSummary])

  const handleEventDeleted = useCallback(() => {
    // Refetch data when an event is deleted
    refetchEvents()
    refetchSummary()
  }, [refetchEvents, refetchSummary])

  return (
    <div className="flex flex-col gap-6">
      <EventsHeader />
      
      <ProgressiveLoading
        isLoading={summaryLoading}
        skeleton={<StatsGridSkeleton count={8} />}
        delay={100}
      >
        <SummaryCards 
          summary={summary} 
          loading={false} 
          onCardClick={handleSummaryCardClick}
        />
      </ProgressiveLoading>
      
      <div className="space-y-4">
        <GlobalSearchAndFilters 
          searchMode={searchMode}
          onSearchModeChange={handleSearchModeChange}
          eventsFilters={eventsFilters}
          onEventsFiltersChange={handleEventsFiltersChange}
          inspectionsFilters={inspectionsFilters}
          onInspectionsFiltersChange={handleInspectionsFiltersChange}
          onClearFilters={handleClearFilters}
        />
        
        {/* Results based on search mode */}
        {searchMode === 'events' ? (
          <EventsList 
            events={events} 
            loading={eventsLoading} 
            error={eventsError}
            onEventUpdated={handleEventUpdated}
            onEventDeleted={handleEventDeleted}
          />
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Inspections Results
                    {inspectionsFilters.equipmentTag && (
                      <Badge variant="secondary" className="ml-2">
                        Equipment: {inspectionsFilters.equipmentTag}
                      </Badge>
                    )}
                  </h3>
                </div>
                
                {/* Use event inspections list for consistency with detail pages */}
                <EventInspectionsList
                  eventId="" // Empty for global search across all events
                  search={inspectionsFilters.search}
                  inspectionStatus={inspectionsFilters.status}
                  equipmentTag={inspectionsFilters.equipmentTag}
                  dateFrom={inspectionsFilters.dateFrom}
                  dateTo={inspectionsFilters.dateTo}
                  dateField={inspectionsFilters.dateField}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
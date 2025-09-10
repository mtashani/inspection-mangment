'use client'

import { MaintenanceEvent } from '@/types/maintenance-events'
import { EnhancedEventsList } from './enhanced-events-list'
import { VirtualizedEventsList } from './virtualized-events-list'
import { shouldVirtualize, getVirtualizationConfig } from '@/lib/virtualization-config'

interface EventsListProps {
  events?: MaintenanceEvent[]
  loading?: boolean
  error?: Error | null
  enableVirtualization?: boolean
  enablePagination?: boolean
  onEventUpdated?: () => void
  onEventDeleted?: () => void
}

export function EventsList({ 
  events, 
  loading, 
  error, 
  enableVirtualization = true,
  enablePagination = true,
  onEventUpdated,
  onEventDeleted
}: EventsListProps) {
  // Determine if we should use virtualization
  const useVirtualization = enableVirtualization && 
    events && 
    shouldVirtualize(events.length, 'eventsOverview')

  // Use virtualized list for very large datasets (when virtualization threshold is met)
  if (useVirtualization) {
    const config = getVirtualizationConfig('eventsOverview')
    
    return (
      <VirtualizedEventsList
        events={events}
        loading={loading}
        error={error}
        enableVirtualization={true}
        height={config.containerHeight}
        threshold={config.threshold}
        onEventUpdated={onEventUpdated}
        onEventDeleted={onEventDeleted}
      />
    )
  }

  // Use enhanced list with pagination and column selection for normal datasets
  return (
    <EnhancedEventsList
      events={events}
      loading={loading}
      error={error}
      onEventUpdated={onEventUpdated}
      onEventDeleted={onEventDeleted}
    />
  )
}
'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import { MaintenanceEvent } from '@/types/maintenance-events'
import { EventCard } from './event-card'
import { 
  VirtualizedList, 
  VirtualizedListRef, 
  useScrollRestoration,
  useVirtualizedListOptimization,
  useDynamicItemHeight
} from '@/components/ui/virtualized-list'
import { Card, CardContent } from '@/components/ui/card'
import { Wrench, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VirtualizedEventsListProps {
  events?: MaintenanceEvent[]
  loading?: boolean
  error?: Error | null
  hasNextPage?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => Promise<void>
  onRetry?: () => void
  className?: string
  height?: number
  enableVirtualization?: boolean
  threshold?: number
  onEventUpdated?: () => void
  onEventDeleted?: () => void
}

// Estimated height for event cards (will be dynamically calculated)
const ESTIMATED_ITEM_HEIGHT = 200
const CONTAINER_HEIGHT = 600
const VIRTUALIZATION_THRESHOLD = 50 // Only virtualize if more than 50 items

// Loading skeleton for virtualized items
const EventCardSkeleton = React.memo(() => (
  <Card className="animate-pulse">
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-5 bg-muted rounded w-16" />
      </div>
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="flex items-center justify-between">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>
      <div className="h-16 bg-muted rounded" />
    </div>
  </Card>
))

EventCardSkeleton.displayName = 'EventCardSkeleton'

// Error state component
const EventsListError = React.memo(({ error, onRetry }: { error: Error; onRetry?: () => void }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
      <AlertCircle className="h-16 w-16 text-destructive" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Failed to load events</h3>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An error occurred while loading maintenance events.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="mt-4">
            Try Again
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
))

EventsListError.displayName = 'EventsListError'

// Empty state component
const EventsListEmpty = React.memo(() => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
      <Wrench className="h-16 w-16 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">No maintenance events found</h3>
        <p className="text-sm text-muted-foreground">
          No maintenance events match your current filters.
        </p>
      </div>
    </CardContent>
  </Card>
))

EventsListEmpty.displayName = 'EventsListEmpty'

// Loading state with skeletons
const EventsListLoading = React.memo(({ count = 6 }: { count?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <EventCardSkeleton key={i} />
    ))}
  </div>
))

EventsListLoading.displayName = 'EventsListLoading'

export function VirtualizedEventsList({
  events = [],
  loading = false,
  error = null,
  hasNextPage = false,
  isLoadingMore = false,
  onLoadMore,
  onRetry,
  className,
  height = CONTAINER_HEIGHT,
  enableVirtualization = true,
  threshold = VIRTUALIZATION_THRESHOLD,
  onEventUpdated,
  onEventDeleted
}: VirtualizedEventsListProps) {
  const listRef = useRef<VirtualizedListRef>(null)
  
  // Scroll restoration
  const { scrollPosition, saveScrollPosition } = useScrollRestoration('events-list')
  
  // Performance optimization
  const { items: optimizedEvents } = useVirtualizedListOptimization(events, [events.length])
  
  // Dynamic height calculation
  const { getItemHeight, setItemHeight } = useDynamicItemHeight(optimizedEvents, ESTIMATED_ITEM_HEIGHT)
  
  // Determine if we should use virtualization
  const shouldVirtualize = enableVirtualization && events.length > threshold
  
  // Handle scroll position saving
  const handleScroll = useCallback((scrollTop: number) => {
    saveScrollPosition(scrollTop)
  }, [saveScrollPosition])
  
  // Memoized item renderer for virtualized list
  const renderVirtualizedItem = useCallback((props: any) => {
    const { item, index, style } = props
    return (
      <div style={style} className="p-2">
        <EventCard 
          event={item}
          onHeightChange={(height) => setItemHeight(index, height + 16)} // +16 for padding
          onEventUpdated={onEventUpdated}
          onEventDeleted={onEventDeleted}
        />
      </div>
    )
  }, [setItemHeight, onEventUpdated, onEventDeleted])
  
  // Memoized grid layout for non-virtualized list
  const gridEvents = useMemo(() => {
    if (shouldVirtualize) return []
    return optimizedEvents
  }, [optimizedEvents, shouldVirtualize])
  
  // Handle loading more items
  const handleLoadMore = useCallback(async () => {
    if (onLoadMore && !isLoadingMore) {
      await onLoadMore()
    }
  }, [onLoadMore, isLoadingMore])
  
  // Show loading state
  if (loading && events.length === 0) {
    return <EventsListLoading />
  }
  
  // Show error state
  if (error && events.length === 0) {
    return <EventsListError error={error} onRetry={onRetry} />
  }
  
  // Show empty state
  if (!loading && events.length === 0) {
    return <EventsListEmpty />
  }
  
  // Render virtualized list for large datasets
  if (shouldVirtualize) {
    return (
      <div className={className}>
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {events.length} events (virtualized for performance)
        </div>
        
        <VirtualizedList
          ref={listRef}
          items={optimizedEvents as unknown}
          renderItem={renderVirtualizedItem}
          height={height}
          itemHeight={getItemHeight}
          hasNextPage={hasNextPage}
          isNextPageLoading={isLoadingMore}
          loadNextPage={handleLoadMore}
          onScroll={handleScroll}
          scrollToIndex={scrollPosition > 0 ? Math.floor(scrollPosition / ESTIMATED_ITEM_HEIGHT) : undefined}
          overscan={5}
          threshold={15}
        />
      </div>
    )
  }
  
  // Render regular grid layout for smaller datasets
  return (
    <div className={className}>
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {events.length} events
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gridEvents.map((event) => (
          <EventCard 
            key={event.id} 
            event={event}
            onEventUpdated={onEventUpdated}
            onEventDeleted={onEventDeleted}
          />
        ))}
      </div>
      
      {/* Load more button for non-virtualized lists */}
      {hasNextPage && !shouldVirtualize && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="min-w-32"
          >
            {isLoadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Loading...
              </>
            ) : (
              'Load More Events'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Hook for managing virtualized events list state
export function useVirtualizedEventsList(
  events: MaintenanceEvent[],
  options: {
    pageSize?: number
    enableVirtualization?: boolean
    threshold?: number
  } = {}
) {
  const {
    pageSize = 20,
    enableVirtualization = true,
    threshold = VIRTUALIZATION_THRESHOLD
  } = options
  
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  
  // Calculate pagination
  const totalPages = Math.ceil(events.length / pageSize)
  const hasNextPage = currentPage < totalPages
  const displayedEvents = events.slice(0, currentPage * pageSize)
  
  // Load more function
  const loadMore = useCallback(async () => {
    if (hasNextPage && !isLoadingMore) {
      setIsLoadingMore(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setCurrentPage(prev => prev + 1)
      setIsLoadingMore(false)
    }
  }, [hasNextPage, isLoadingMore])
  
  // Reset pagination when events change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [events.length])
  
  return {
    displayedEvents,
    hasNextPage,
    isLoadingMore,
    loadMore,
    currentPage,
    totalPages,
    shouldVirtualize: enableVirtualization && events.length > threshold
  }
}
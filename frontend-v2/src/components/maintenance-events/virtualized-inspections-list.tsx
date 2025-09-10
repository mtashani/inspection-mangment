'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import { Inspection } from '@/types/maintenance-events'
import { InspectionCard } from './inspection-card'
import { 
  VirtualizedList, 
  VirtualizedListRef, 
  useScrollRestoration,
  useVirtualizedListOptimization,
  useDynamicItemHeight
} from '@/components/ui/virtualized-list'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VirtualizedInspectionsListProps {
  inspections: Inspection[]
  loading?: boolean
  error?: Error | null
  searchTerm?: string
  hasNextPage?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => Promise<void>
  onRetry?: () => void
  className?: string
  height?: number
  enableVirtualization?: boolean
  threshold?: number
}

// Estimated height for inspection cards (they can vary significantly due to expansion)
const ESTIMATED_ITEM_HEIGHT = 120 // Collapsed state
const EXPANDED_ITEM_HEIGHT = 400 // Expanded state (approximate)
const CONTAINER_HEIGHT = 600
const VIRTUALIZATION_THRESHOLD = 20

// Loading skeleton for inspection cards
const InspectionCardSkeleton = React.memo(() => (
  <Card className="animate-pulse">
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-5 bg-muted rounded w-64" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-muted rounded w-16" />
          <div className="h-6 bg-muted rounded w-20" />
        </div>
      </div>
      
      {/* Badges */}
      <div className="flex gap-2">
        <div className="h-5 bg-muted rounded w-20" />
        <div className="h-5 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded w-12" />
      </div>
      
      {/* Actions */}
      <div className="flex justify-end gap-2">
        <div className="h-8 bg-muted rounded w-24" />
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    </div>
  </Card>
))

InspectionCardSkeleton.displayName = 'InspectionCardSkeleton'

// Error state component
const InspectionsListError = React.memo(({ error, onRetry }: { error: Error; onRetry?: () => void }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
      <AlertCircle className="h-16 w-16 text-destructive" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Failed to load inspections</h3>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An error occurred while loading inspections.'}
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

InspectionsListError.displayName = 'InspectionsListError'

// Empty state component
const InspectionsListEmpty = React.memo(({ searchTerm }: { searchTerm?: string }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
      <ClipboardList className="h-16 w-16 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">
          {searchTerm ? 'No matching inspections found' : 'No inspections found'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {searchTerm 
            ? `No inspections match your search for "${searchTerm}".`
            : 'No inspections have been created for this event yet.'
          }
        </p>
      </div>
    </CardContent>
  </Card>
))

InspectionsListEmpty.displayName = 'InspectionsListEmpty'

// Loading state with skeletons
const InspectionsListLoading = React.memo(({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }, (_, i) => (
      <InspectionCardSkeleton key={i} />
    ))}
  </div>
))

InspectionsListLoading.displayName = 'InspectionsListLoading'

export function VirtualizedInspectionsList({
  inspections = [],
  loading = false,
  error = null,
  searchTerm,
  hasNextPage = false,
  isLoadingMore = false,
  onLoadMore,
  onRetry,
  className,
  height = CONTAINER_HEIGHT,
  enableVirtualization = true,
  threshold = VIRTUALIZATION_THRESHOLD
}: VirtualizedInspectionsListProps) {
  const listRef = useRef<VirtualizedListRef>(null)
  
  // Scroll restoration
  const { scrollPosition, saveScrollPosition } = useScrollRestoration('inspections-list')
  
  // Performance optimization
  const { items: optimizedInspections } = useVirtualizedListOptimization(inspections, [inspections.length])
  
  // Dynamic height calculation - inspections can expand/collapse
  const { getItemHeight, setItemHeight } = useDynamicItemHeight(optimizedInspections, ESTIMATED_ITEM_HEIGHT)
  
  // Determine if we should use virtualization
  const shouldVirtualize = enableVirtualization && inspections.length > threshold
  
  // Handle scroll position saving
  const handleScroll = useCallback((scrollTop: number) => {
    saveScrollPosition(scrollTop)
  }, [saveScrollPosition])
  
  // Memoized item renderer for virtualized list
  const renderVirtualizedItem = useCallback((props: any) => {
    const { item, index, style } = props
    return (
      <div style={style} className="p-2">
        <InspectionCard 
          inspection={item}
          searchTerm={searchTerm}
          onHeightChange={(height) => setItemHeight(index, height + 16)} // +16 for padding
        />
      </div>
    )
  }, [searchTerm, setItemHeight])
  
  // Memoized list for non-virtualized rendering
  const listInspections = useMemo(() => {
    if (shouldVirtualize) return []
    return optimizedInspections
  }, [optimizedInspections, shouldVirtualize])
  
  // Handle loading more items
  const handleLoadMore = useCallback(async () => {
    if (onLoadMore && !isLoadingMore) {
      await onLoadMore()
    }
  }, [onLoadMore, isLoadingMore])
  
  // Show loading state
  if (loading && inspections.length === 0) {
    return <InspectionsListLoading />
  }
  
  // Show error state
  if (error && inspections.length === 0) {
    return <InspectionsListError error={error} onRetry={onRetry} />
  }
  
  // Show empty state
  if (!loading && inspections.length === 0) {
    return <InspectionsListEmpty searchTerm={searchTerm} />
  }
  
  // Render virtualized list for large datasets
  if (shouldVirtualize) {
    return (
      <div className={className}>
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {inspections.length} inspection{inspections.length !== 1 ? 's' : ''} (virtualized for performance)
          {searchTerm && (
            <span className="ml-2 font-medium">
              matching &quot;{searchTerm}&quot;
            </span>
          )}
        </div>
        
        <VirtualizedList
          ref={listRef}
          items={optimizedInspections as unknown}
          renderItem={renderVirtualizedItem}
          height={height}
          itemHeight={getItemHeight}
          hasNextPage={hasNextPage}
          isNextPageLoading={isLoadingMore}
          loadNextPage={handleLoadMore}
          onScroll={handleScroll}
          scrollToIndex={scrollPosition > 0 ? Math.floor(scrollPosition / estimatedHeight) : undefined}
          overscan={3}
          threshold={10}
        />
      </div>
    )
  }
  
  // Render regular list layout for smaller datasets
  return (
    <div className={className}>
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {inspections.length} inspection{inspections.length !== 1 ? 's' : ''}
        {searchTerm && (
          <span className="ml-2 font-medium">
            matching &quot;{searchTerm}&quot;
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {listInspections.map((inspection) => (
          <InspectionCard 
            key={inspection.id} 
            inspection={inspection}
            searchTerm={searchTerm}
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
              'Load More Inspections'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Hook for managing virtualized inspections list state
export function useVirtualizedInspectionsList(
  inspections: Inspection[],
  options: {
    pageSize?: number
    enableVirtualization?: boolean
    threshold?: number
    searchTerm?: string
  } = {}
) {
  const {
    pageSize = 15,
    enableVirtualization = true,
    threshold = VIRTUALIZATION_THRESHOLD,
    searchTerm
  } = options
  
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set())
  
  // Filter inspections based on search term
  const filteredInspections = useMemo(() => {
    if (!searchTerm) return inspections
    
    const term = searchTerm.toLowerCase()
    return inspections.filter(inspection => 
      inspection.title.toLowerCase().includes(term) ||
      inspection.inspection_number.toLowerCase().includes(term) ||
      inspection.equipment_tag?.toLowerCase().includes(term) ||
      inspection.equipment_description?.toLowerCase().includes(term)
    )
  }, [inspections, searchTerm])
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredInspections.length / pageSize)
  const hasNextPage = currentPage < totalPages
  const displayedInspections = filteredInspections.slice(0, currentPage * pageSize)
  
  // Load more function
  const loadMore = useCallback(async () => {
    if (hasNextPage && !isLoadingMore) {
      setIsLoadingMore(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400))
      
      setCurrentPage(prev => prev + 1)
      setIsLoadingMore(false)
    }
  }, [hasNextPage, isLoadingMore])
  
  // Reset pagination when inspections or search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filteredInspections.length, searchTerm])
  
  // Manage expanded items
  const toggleExpanded = useCallback((inspectionId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(inspectionId)) {
        newSet.delete(inspectionId)
      } else {
        newSet.add(inspectionId)
      }
      return newSet
    })
  }, [])
  
  return {
    displayedInspections,
    filteredInspections,
    hasNextPage,
    isLoadingMore,
    loadMore,
    currentPage,
    totalPages,
    shouldVirtualize: enableVirtualization && filteredInspections.length > threshold,
    expandedItems,
    toggleExpanded
  }
}
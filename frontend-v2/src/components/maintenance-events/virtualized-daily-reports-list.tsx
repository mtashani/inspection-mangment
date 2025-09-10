'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import { DailyReport } from '@/types/maintenance-events'
import { DailyReportCard } from './daily-report-card'
import { 
  VirtualizedList, 
  VirtualizedListRef, 
  useScrollRestoration,
  useVirtualizedListOptimization,
  useDynamicItemHeight
} from '@/components/ui/virtualized-list'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VirtualizedDailyReportsListProps {
  reports: DailyReport[]
  loading?: boolean
  error?: Error | null
  compact?: boolean
  showInspectionInfo?: boolean
  hasNextPage?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => Promise<void>
  onEdit?: (report: DailyReport) => void
  onView?: (report: DailyReport) => void
  onDelete?: (report: DailyReport) => void
  onRetry?: () => void
  className?: string
  height?: number
  enableVirtualization?: boolean
  threshold?: number
}

// Estimated heights for different card types
const COMPACT_ITEM_HEIGHT = 80
const FULL_ITEM_HEIGHT = 200
const CONTAINER_HEIGHT = 500
const VIRTUALIZATION_THRESHOLD = 30

// Loading skeleton for daily report cards
const DailyReportCardSkeleton = React.memo(({ compact = false }: { compact?: boolean }) => (
  <Card className="animate-pulse">
    <div className={compact ? "p-3 space-y-2" : "p-6 space-y-4"}>
      <div className="flex items-center justify-between">
        <div className={`h-4 bg-muted rounded ${compact ? 'w-1/2' : 'w-3/4'}`} />
        <div className="h-4 bg-muted rounded w-16" />
      </div>
      {!compact && (
        <>
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded" />
        </>
      )}
      <div className="flex justify-end gap-2">
        <div className="h-6 bg-muted rounded w-12" />
        <div className="h-6 bg-muted rounded w-12" />
      </div>
    </div>
  </Card>
))

DailyReportCardSkeleton.displayName = 'DailyReportCardSkeleton'

// Error state component
const DailyReportsListError = React.memo(({ error, onRetry }: { error: Error; onRetry?: () => void }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center space-y-2">
        <h3 className="text-base font-semibold">Failed to load daily reports</h3>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An error occurred while loading daily reports.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
))

DailyReportsListError.displayName = 'DailyReportsListError'

// Empty state component
const DailyReportsListEmpty = React.memo(() => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
      <FileText className="h-12 w-12 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h3 className="text-base font-semibold">No daily reports found</h3>
        <p className="text-sm text-muted-foreground">
          No daily reports have been created yet for this inspection.
        </p>
      </div>
    </CardContent>
  </Card>
))

DailyReportsListEmpty.displayName = 'DailyReportsListEmpty'

// Loading state with skeletons
const DailyReportsListLoading = React.memo(({ 
  count = 4, 
  compact = false 
}: { 
  count?: number
  compact?: boolean 
}) => (
  <div className={compact ? "space-y-2" : "space-y-4"}>
    {Array.from({ length: count }, (_, i) => (
      <DailyReportCardSkeleton key={i} compact={compact} />
    ))}
  </div>
))

DailyReportsListLoading.displayName = 'DailyReportsListLoading'

export function VirtualizedDailyReportsList({
  reports = [],
  loading = false,
  error = null,
  compact = false,
  showInspectionInfo = false,
  hasNextPage = false,
  isLoadingMore = false,
  onLoadMore,
  onEdit,
  onView,
  onDelete,
  onRetry,
  className,
  height = CONTAINER_HEIGHT,
  enableVirtualization = true,
  threshold = VIRTUALIZATION_THRESHOLD
}: VirtualizedDailyReportsListProps) {
  const listRef = useRef<VirtualizedListRef>(null)
  
  // Scroll restoration
  const { scrollPosition, saveScrollPosition } = useScrollRestoration('daily-reports-list')
  
  // Performance optimization
  const { items: optimizedReports } = useVirtualizedListOptimization(reports, [reports.length])
  
  // Dynamic height calculation based on compact mode
  const estimatedHeight = compact ? COMPACT_ITEM_HEIGHT : FULL_ITEM_HEIGHT
  const { getItemHeight, setItemHeight } = useDynamicItemHeight(optimizedReports, estimatedHeight)
  
  // Determine if we should use virtualization
  const shouldVirtualize = enableVirtualization && reports.length > threshold
  
  // Handle scroll position saving
  const handleScroll = useCallback((scrollTop: number) => {
    saveScrollPosition(scrollTop)
  }, [saveScrollPosition])
  
  // Memoized item renderer for virtualized list
  const renderVirtualizedItem = useCallback((props: any) => {
    const { item, index, style } = props
    return (
      <div style={style} className={compact ? "p-1" : "p-2"}>
        <DailyReportCard 
          report={item}
          compact={compact}
          showInspectionInfo={showInspectionInfo}
          onEdit={onEdit ? () => onEdit(item) : undefined}
          onView={onView ? () => onView(item) : undefined}
          onDelete={onDelete ? () => onDelete(item) : undefined}
          onHeightChange={(height) => setItemHeight(index, height + (compact ? 8 : 16))}
        />
      </div>
    )
  }, [compact, showInspectionInfo, onEdit, onView, onDelete, setItemHeight])
  
  // Memoized list for non-virtualized rendering
  const listReports = useMemo(() => {
    if (shouldVirtualize) return []
    return optimizedReports
  }, [optimizedReports, shouldVirtualize])
  
  // Handle loading more items
  const handleLoadMore = useCallback(async () => {
    if (onLoadMore && !isLoadingMore) {
      await onLoadMore()
    }
  }, [onLoadMore, isLoadingMore])
  
  // Show loading state
  if (loading && reports.length === 0) {
    return <DailyReportsListLoading compact={compact} />
  }
  
  // Show error state
  if (error && reports.length === 0) {
    return <DailyReportsListError error={error} onRetry={onRetry} />
  }
  
  // Show empty state
  if (!loading && reports.length === 0) {
    return <DailyReportsListEmpty />
  }
  
  // Render virtualized list for large datasets
  if (shouldVirtualize) {
    return (
      <div className={className}>
        {/* Reports Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <FileText className="h-4 w-4" />
          <span>
            {reports.length} report{reports.length !== 1 ? 's' : ''} found (virtualized for performance)
          </span>
        </div>
        
        <VirtualizedList
          ref={listRef}
          items={optimizedReports as unknown}
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
      {/* Reports Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <FileText className="h-4 w-4" />
        <span>
          {reports.length} report{reports.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Reports List */}
      <div className={compact ? "space-y-2" : "space-y-4"}>
        {listReports.map((report) => (
          <DailyReportCard
            key={report.id}
            report={report}
            compact={compact}
            showInspectionInfo={showInspectionInfo}
            onEdit={onEdit ? () => onEdit(report) : undefined}
            onView={onView ? () => onView(report) : undefined}
            onDelete={onDelete ? () => onDelete(report) : undefined}
          />
        ))}
      </div>
      
      {/* Load more button for non-virtualized lists */}
      {hasNextPage && !shouldVirtualize && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="sm"
            className="min-w-28"
          >
            {isLoadingMore ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// Hook for managing virtualized daily reports list state
export function useVirtualizedDailyReportsList(
  reports: DailyReport[],
  options: {
    pageSize?: number
    enableVirtualization?: boolean
    threshold?: number
    compact?: boolean
  } = {}
) {
  const {
    pageSize = 20,
    enableVirtualization = true,
    threshold = VIRTUALIZATION_THRESHOLD,
    compact = false
  } = options
  
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  
  // Calculate pagination
  const totalPages = Math.ceil(reports.length / pageSize)
  const hasNextPage = currentPage < totalPages
  const displayedReports = reports.slice(0, currentPage * pageSize)
  
  // Load more function
  const loadMore = useCallback(async () => {
    if (hasNextPage && !isLoadingMore) {
      setIsLoadingMore(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setCurrentPage(prev => prev + 1)
      setIsLoadingMore(false)
    }
  }, [hasNextPage, isLoadingMore])
  
  // Reset pagination when reports change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [reports.length])
  
  return {
    displayedReports,
    hasNextPage,
    isLoadingMore,
    loadMore,
    currentPage,
    totalPages,
    shouldVirtualize: enableVirtualization && reports.length > threshold,
    estimatedHeight: compact ? COMPACT_ITEM_HEIGHT : FULL_ITEM_HEIGHT
  }
}
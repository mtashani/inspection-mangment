'use client'

import * as React from 'react'
import { MaintenanceEvent } from '@/types/maintenance-events'
import { SimpleEventCard } from './simple-event-card'
import { EventsListSkeleton } from './events-list-skeleton'
import { EventsListError } from './events-list-error'
import { EventsListEmpty } from './events-list-empty'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { Grid, LayoutGrid, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedEventsListProps {
  events?: MaintenanceEvent[]
  loading?: boolean
  error?: Error | null
  className?: string
  onEventUpdated?: () => void
  onEventDeleted?: () => void
}

type ColumnCount = 2 | 3 | 4

const ROWS_PER_PAGE = 3
const COLUMN_OPTIONS = [
  { value: 2, label: '2 Columns', icon: LayoutGrid },  // LayoutGrid for 2 columns (swapped)
  { value: 3, label: '3 Columns', icon: Grid },        // Grid for 3 columns (swapped)
  { value: 4, label: '4 Columns', icon: Maximize2 },   // Maximize2 for 4 columns (unchanged)
] as const

export function EnhancedEventsList({ 
  events, 
  loading, 
  error, 
  className,
  onEventUpdated,
  onEventDeleted
}: EnhancedEventsListProps) {
  // Load column count from localStorage or use default
  const [columnCount, setColumnCount] = React.useState<ColumnCount>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('events-column-count')
      return saved ? (Number(saved) as ColumnCount) : 4
    }
    return 4
  })
  const [currentPage, setCurrentPage] = React.useState(1)

  // Calculate pagination
  const itemsPerPage = columnCount * ROWS_PER_PAGE
  const totalPages = events ? Math.ceil(events.length / itemsPerPage) : 0
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEvents = events?.slice(startIndex, endIndex) || []

  // Reset to first page when column count changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [columnCount])

  // Reset to first page when events change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [events?.length])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleColumnCountChange = (value: string) => {
    const newColumnCount = Number(value) as ColumnCount
    setColumnCount(newColumnCount)
    // Save to localStorage
    localStorage.setItem('events-column-count', newColumnCount.toString())
  }

  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    
    return pages
  }

  if (loading) {
    return <EventsListSkeleton />
  }

  if (error) {
    return <EventsListError error={error} />
  }

  if (!events || events.length === 0) {
    return <EventsListEmpty />
  }

  const gridColsClass = {
    2: 'sm:grid-cols-1 md:grid-cols-2',
    3: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, events.length)} of {events.length} events
          </div>
          
          {totalPages > 1 && (
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Column Selection */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <Select value={columnCount.toString()} onValueChange={handleColumnCountChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMN_OPTIONS.map((option) => {
                const IconComponent = option.icon
                return (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events Grid */}
      <div className={cn(
        'grid gap-4',
        gridColsClass[columnCount]
      )}>
        {currentEvents.map((event) => (
          <SimpleEventCard 
            key={event.id} 
            event={event}
            onEventUpdated={onEventUpdated}
            onEventDeleted={onEventDeleted}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) handlePageChange(currentPage - 1)
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {generatePageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === '...' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(page as number)
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) handlePageChange(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* Quick Navigation */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Quick jump:</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
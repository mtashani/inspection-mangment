'use client'

import React, { useState, useCallback } from 'react'
import { usePaginatedInspections } from '@/hooks/use-maintenance-events'
import { InspectionsFilters } from '@/types/maintenance-events'
import { InspectionCard } from './inspection-card'
import { InspectionsListSkeleton } from './inspections-list-skeleton'
import { InspectionsListError } from './inspections-list-error'
import { InspectionsListEmpty } from './inspections-list-empty'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface EventInspectionsListProps {
  eventId: string
  subEventId?: number
  search?: string
  inspectionStatus?: string
  equipmentTag?: string
  dateFrom?: string
  dateTo?: string
  dateField?: string
  className?: string
}

export function EventInspectionsList({ 
  eventId, 
  subEventId, 
  search, 
  inspectionStatus, 
  equipmentTag,
  dateFrom,
  dateTo,
  dateField,
  className 
}: EventInspectionsListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10) // Smaller page size for event details

  const filters: InspectionsFilters = {
    // Only include eventId if it's provided and not empty
    ...(eventId && eventId.trim() !== '' && { eventId }),
    subEventId,
    search,
    status: inspectionStatus ? inspectionStatus as any : undefined,
    equipmentTag,
    dateFrom,
    dateTo,
    dateField,
    skip: (currentPage - 1) * pageSize,
    limit: pageSize
  }

  const { data: response, isLoading, error, refetch } = usePaginatedInspections(filters)
  
  const inspections = response?.data || []
  const pagination = response?.pagination

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((newPageSize: string) => {
    setPageSize(Number(newPageSize))
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [eventId, subEventId, search, inspectionStatus, equipmentTag, dateFrom, dateTo, dateField])

  const generatePageNumbers = () => {
    if (!pagination) return []
    
    const { current_page, total_pages } = pagination
    const pages = []
    const maxVisiblePages = 5
    
    if (total_pages <= maxVisiblePages) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i)
      }
    } else {
      const start = Math.max(1, current_page - 2)
      const end = Math.min(total_pages, start + maxVisiblePages - 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (start > 1) {
        pages.unshift('...')
        pages.unshift(1)
      }
      
      if (end < total_pages) {
        pages.push('...')
        pages.push(total_pages)
      }
    }
    
    return pages
  }

  if (isLoading) {
    return <InspectionsListSkeleton />
  }

  if (error) {
    return <InspectionsListError error={error} />
  }

  if (!inspections.length) {
    return <InspectionsListEmpty eventId={eventId} subEventId={subEventId} />
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Header with pagination info and controls */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {pagination && (
              <span>
                Showing {((pagination.current_page - 1) * pagination.page_size) + 1} to {Math.min(pagination.current_page * pagination.page_size, pagination.total_count)} of {pagination.total_count} inspections
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            
            {pagination && (
              <Badge variant="outline" className="text-xs">
                {pagination.total_count} total
              </Badge>
            )}
          </div>
        </div>

        {/* Inspections list */}
        <div className="space-y-4">
          {inspections.map(inspection => (
            <InspectionCard 
              key={inspection.id} 
              inspection={inspection}
              searchTerm={search}
            />
          ))}
        </div>

        {/* Pagination controls */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (pagination.has_previous) handlePageChange(currentPage - 1)
                    }}
                    className={!pagination.has_previous ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
                        isActive={pagination.current_page === page}
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
                      if (pagination.has_next) handlePageChange(currentPage + 1)
                    }}
                    className={!pagination.has_next ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {/* Quick navigation for larger datasets */}
            {pagination.total_pages > 10 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Quick jump:</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.current_page === 1}
                    className="h-7 px-2 text-xs"
                  >
                    First
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.total_pages)}
                    disabled={pagination.current_page === pagination.total_pages}
                    className="h-7 px-2 text-xs"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EventInspectionsList
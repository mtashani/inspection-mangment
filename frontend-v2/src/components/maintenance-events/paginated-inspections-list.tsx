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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'

interface PaginatedInspectionsListProps {
  eventId?: string
  subEventId?: number
  search?: string
  inspectionStatus?: string
  equipmentTag?: string
  className?: string
}

export function PaginatedInspectionsList({ 
  eventId, 
  subEventId, 
  search, 
  inspectionStatus, 
  equipmentTag,
  className 
}: PaginatedInspectionsListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const filters: InspectionsFilters = {
    eventId,
    subEventId,
    search,
    status: inspectionStatus ? inspectionStatus as any : undefined,
    equipmentTag,
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
    return <InspectionsListEmpty eventId={eventId || ''} />
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Inspections List
              {equipmentTag && (
                <Badge variant="secondary" className="ml-2">
                  Equipment: {equipmentTag}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-4">
              {/* Page size selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
              
              {/* Results info */}
              {pagination && (
                <Badge variant="outline" className="text-sm">
                  {pagination.total_count} total
                </Badge>
              )}
            </div>
          </div>
          
          {/* Pagination info */}
          {pagination && (
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.current_page - 1) * pagination.page_size) + 1} to {Math.min(pagination.current_page * pagination.page_size, pagination.total_count)} of {pagination.total_count} inspections
              {equipmentTag && (
                <span className="font-medium text-primary ml-1">
                  for equipment {equipmentTag}
                </span>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Inspections list */}
          <div className="space-y-4">
            {inspections.map((inspection) => (
              <InspectionCard 
                key={inspection.id} 
                inspection={inspection}
              />
            ))}
          </div>
          
          {/* Pagination controls */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-6">
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

              {/* Quick navigation */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Quick jump:</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.current_page === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.total_pages)}
                    disabled={pagination.current_page === pagination.total_pages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PaginatedInspectionsList
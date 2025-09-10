'use client'

import { useState } from 'react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'

export interface MobileOptimizedTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  onRowClick?: (item: T) => void
  onEdit?: (item: T) => void
  onView?: (item: T) => void
  searchable?: boolean
  filterable?: boolean
  isLoading?: boolean
  emptyMessage?: string
  className?: string
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
  mobileHidden?: boolean
  mobileOrder?: number
}

export function MobileOptimizedTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  onEdit,
  onView,
  searchable = true,
  filterable = false,
  isLoading = false,
  emptyMessage = 'No data available',
  className
}: MobileOptimizedTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Filter data based on search
  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    
    return columns.some(column => {
      if (!column.searchable) return false
      const value = item[column.key]
      return String(value).toLowerCase().includes(searchQuery.toLowerCase())
    })
  })

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    )
  }

  // Get mobile visible columns (primary columns)
  const mobileColumns = columns
    .filter(col => !col.mobileHidden)
    .sort((a, b) => (a.mobileOrder || 0) - (b.mobileOrder || 0))
    .slice(0, 2) // Show max 2 columns on mobile

  // Get desktop hidden columns (secondary columns)
  const secondaryColumns = columns.filter(col => col.mobileHidden || !mobileColumns.includes(col))

  // Render cell value
  const renderCellValue = (column: TableColumn<T>, item: T) => {
    const value = item[column.key]
    return column.render ? column.render(value, item) : String(value)
  }

  if (isLoading) {
    return <MobileTableSkeleton />
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {searchable && (
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-10"
                  />
                </div>
              )}
              {filterable && (
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FunnelIcon className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Filter the data based on your criteria.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      {/* Filter content would go here */}
                      <p className="text-sm text-muted-foreground">
                        Filter options will be implemented based on column types.
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    {columns.map((column) => (
                      <th key={String(column.key)} className="text-left p-4 font-medium">
                        {column.label}
                      </th>
                    ))}
                    {(onEdit || onView) && (
                      <th className="text-left p-4 font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b hover:bg-gray-50 transition-colors',
                        onRowClick && 'cursor-pointer'
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((column) => (
                        <td key={String(column.key)} className="p-4">
                          {renderCellValue(column, item)}
                        </td>
                      ))}
                      {(onEdit || onView) && (
                        <td className="p-4">
                          <div className="flex items-center space-x-1">
                            {onView && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onView(item)
                                }}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(item)
                                }}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredData.length > 0 ? (
          filteredData.map((item) => {
            const isExpanded = expandedRows.includes(item.id)
            
            return (
              <Card key={item.id} className="transition-all duration-200">
                <CardContent className="p-4">
                  {/* Primary Information */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      {mobileColumns.map((column) => (
                        <div key={String(column.key)}>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            {column.label}
                          </div>
                          <div className="font-medium">
                            {renderCellValue(column, item)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-1 ml-2">
                      {secondaryColumns.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      {(onEdit || onView) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <EllipsisVerticalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(item)}>
                                <EyeIcon className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(item)}>
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  
                  {/* Secondary Information (Expandable) */}
                  {isExpanded && secondaryColumns.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        {secondaryColumns.map((column) => (
                          <div key={String(column.key)} className="flex justify-between items-start">
                            <div className="text-sm text-muted-foreground">
                              {column.label}
                            </div>
                            <div className="text-sm font-medium text-right">
                              {renderCellValue(column, item)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchQuery ? `No results found for "${searchQuery}"` : emptyMessage}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Summary */}
      {filteredData.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredData.length} of {data.length} items
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}
    </div>
  )
}

// Loading Skeleton Component
function MobileTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search Skeleton */}
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>

      {/* Desktop Table Skeleton */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export type { MobileOptimizedTableProps, TableColumn }
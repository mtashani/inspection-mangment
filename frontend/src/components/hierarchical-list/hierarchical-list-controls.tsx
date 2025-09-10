'use client'

import React, { useState, useCallback } from 'react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ChevronUpDownIcon,
  CheckIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

// Filter and search interfaces
export interface FilterOption {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number' | 'boolean'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  defaultValue?: any
}

export interface SortOption {
  key: string
  label: string
  direction?: 'asc' | 'desc'
}

export interface HierarchicalListControlsProps {
  // Search
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string
  
  // Filters
  filters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
  filterOptions: FilterOption[]
  
  // Sorting
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  sortOptions: SortOption[]
  
  // Selection
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  enableBulkActions?: boolean
  bulkActions?: Array<{
    key: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: 'default' | 'destructive' | 'outline'
    disabled?: boolean
  }>
  onBulkAction?: (actionKey: string) => void
  
  // View options
  expandedCount: number
  onExpandAll: () => void
  onCollapseAll: () => void
  
  // Additional controls
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

export function HierarchicalListControls({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search items...',
  filters,
  onFiltersChange,
  filterOptions,
  sortBy,
  sortOrder,
  onSortChange,
  sortOptions,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  enableBulkActions = true,
  bulkActions = [],
  onBulkAction,
  expandedCount,
  onExpandAll,
  onCollapseAll,
  isLoading = false,
  onRefresh,
  className
}: HierarchicalListControlsProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'boolean') return value
    return value != null
  }).length

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }, [filters, onFiltersChange])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const clearedFilters: Record<string, any> = {}
    filterOptions.forEach(option => {
      switch (option.type) {
        case 'multiselect':
          clearedFilters[option.key] = []
          break
        case 'boolean':
          clearedFilters[option.key] = false
          break
        default:
          clearedFilters[option.key] = ''
      }
    })
    onFiltersChange(clearedFilters)
  }, [filterOptions, onFiltersChange])

  // Render filter control based on type
  const renderFilterControl = (option: FilterOption) => {
    const value = filters[option.key]

    switch (option.type) {
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(newValue) => handleFilterChange(option.key, newValue)}
          >
            <SelectTrigger className=\"w-full\">
              <SelectValue placeholder={option.placeholder || `Select ${option.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=\"\">All</SelectItem>
              {option.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className=\"space-y-2\">
            {option.options?.map(opt => (
              <div key={opt.value} className=\"flex items-center space-x-2\">
                <Checkbox
                  id={`${option.key}-${opt.value}`}
                  checked={selectedValues.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, opt.value]
                      : selectedValues.filter(v => v !== opt.value)
                    handleFilterChange(option.key, newValues)
                  }}
                />
                <Label htmlFor={`${option.key}-${opt.value}`} className=\"text-sm\">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        )

      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFilterChange(option.key, e.target.value)}
            placeholder={option.placeholder || `Enter ${option.label}`}
          />
        )

      case 'date':
        return (
          <Input
            type=\"date\"
            value={value || ''}
            onChange={(e) => handleFilterChange(option.key, e.target.value)}
          />
        )

      case 'daterange':
        const dateRange = value || { from: '', to: '' }
        return (
          <div className=\"space-y-2\">
            <div>
              <Label className=\"text-xs text-muted-foreground\">From</Label>
              <Input
                type=\"date\"
                value={dateRange.from || ''}
                onChange={(e) => handleFilterChange(option.key, {
                  ...dateRange,
                  from: e.target.value
                })}
              />
            </div>
            <div>
              <Label className=\"text-xs text-muted-foreground\">To</Label>
              <Input
                type=\"date\"
                value={dateRange.to || ''}
                onChange={(e) => handleFilterChange(option.key, {
                  ...dateRange,
                  to: e.target.value
                })}
              />
            </div>
          </div>
        )

      case 'boolean':
        return (
          <div className=\"flex items-center space-x-2\">
            <Checkbox
              id={option.key}
              checked={value || false}
              onCheckedChange={(checked) => handleFilterChange(option.key, checked)}
            />
            <Label htmlFor={option.key} className=\"text-sm\">
              {option.label}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className={cn('mb-4', className)}>
      <CardContent className=\"p-4\">
        <div className=\"flex flex-col space-y-4\">
          {/* Top row: Search and main controls */}
          <div className=\"flex items-center space-x-4\">
            {/* Search */}
            <div className=\"flex-1 relative\">
              <MagnifyingGlassIcon className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground\" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className=\"pl-10\"
              />
            </div>

            {/* Filter button */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant=\"outline\" className=\"relative\">
                  <FunnelIcon className=\"h-4 w-4 mr-2\" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant=\"secondary\" className=\"ml-2 h-5 w-5 p-0 text-xs\">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className=\"w-80\" align=\"end\">
                <div className=\"space-y-4\">
                  <div className=\"flex items-center justify-between\">
                    <h4 className=\"font-medium\">Filters</h4>
                    {activeFilterCount > 0 && (
                      <Button
                        variant=\"ghost\"
                        size=\"sm\"
                        onClick={handleClearFilters}
                        className=\"h-auto p-1 text-xs\"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className=\"space-y-4 max-h-96 overflow-y-auto\">
                    {filterOptions.map(option => (
                      <div key={option.key} className=\"space-y-2\">
                        <Label className=\"text-sm font-medium\">{option.label}</Label>
                        {renderFilterControl(option)}
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort button */}
            <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
              <PopoverTrigger asChild>
                <Button variant=\"outline\">
                  <ArrowsUpDownIcon className=\"h-4 w-4 mr-2\" />
                  Sort
                </Button>
              </PopoverTrigger>
              <PopoverContent className=\"w-64\" align=\"end\">
                <div className=\"space-y-4\">
                  <h4 className=\"font-medium\">Sort by</h4>
                  <Separator />
                  <div className=\"space-y-2\">
                    {sortOptions.map(option => (
                      <div key={option.key} className=\"flex items-center justify-between\">
                        <Button
                          variant={sortBy === option.key ? \"default\" : \"ghost\"}
                          size=\"sm\"
                          className=\"flex-1 justify-start\"
                          onClick={() => {
                            const newOrder = sortBy === option.key && sortOrder === 'asc' ? 'desc' : 'asc'
                            onSortChange(option.key, newOrder)
                          }}
                        >
                          {option.label}
                          {sortBy === option.key && (
                            <ChevronUpDownIcon className=\"h-4 w-4 ml-2\" />
                          )}
                        </Button>
                        {sortBy === option.key && (
                          <Badge variant=\"secondary\" className=\"ml-2\">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Refresh button */}
            {onRefresh && (
              <Button
                variant=\"outline\"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <AdjustmentsHorizontalIcon className={cn(
                  'h-4 w-4',
                  isLoading && 'animate-spin'
                )} />
              </Button>
            )}
          </div>

          {/* Second row: Selection and view controls */}
          <div className=\"flex items-center justify-between\">
            {/* Selection info and bulk actions */}
            <div className=\"flex items-center space-x-4\">
              {/* Selection summary */}
              <div className=\"text-sm text-muted-foreground\">
                {selectedCount > 0 ? (
                  <span>
                    {selectedCount} of {totalCount} selected
                  </span>
                ) : (
                  <span>{totalCount} items</span>
                )}
              </div>

              {/* Selection controls */}
              {totalCount > 0 && (
                <div className=\"flex items-center space-x-2\">
                  <Button
                    variant=\"ghost\"
                    size=\"sm\"
                    onClick={onSelectAll}
                    className=\"h-auto p-1 text-xs\"
                  >
                    <CheckIcon className=\"h-3 w-3 mr-1\" />
                    Select all
                  </Button>
                  {selectedCount > 0 && (
                    <Button
                      variant=\"ghost\"
                      size=\"sm\"
                      onClick={onClearSelection}
                      className=\"h-auto p-1 text-xs\"
                    >
                      <XMarkIcon className=\"h-3 w-3 mr-1\" />
                      Clear
                    </Button>
                  )}
                </div>
              )}

              {/* Bulk actions */}
              {enableBulkActions && selectedCount > 0 && bulkActions.length > 0 && (
                <>
                  <Separator orientation=\"vertical\" className=\"h-4\" />
                  <div className=\"flex items-center space-x-2\">
                    {bulkActions.map(action => {
                      const Icon = action.icon
                      return (
                        <Button
                          key={action.key}
                          variant={action.variant || 'outline'}
                          size=\"sm\"
                          disabled={action.disabled}
                          onClick={() => onBulkAction?.(action.key)}
                        >
                          {Icon && <Icon className=\"h-4 w-4 mr-1\" />}
                          {action.label}
                        </Button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* View controls */}
            <div className=\"flex items-center space-x-2\">
              <Button
                variant=\"ghost\"
                size=\"sm\"
                onClick={onExpandAll}
                className=\"h-auto p-1 text-xs\"
              >
                Expand all
              </Button>
              <Button
                variant=\"ghost\"
                size=\"sm\"
                onClick={onCollapseAll}
                className=\"h-auto p-1 text-xs\"
              >
                Collapse all
              </Button>
              {expandedCount > 0 && (
                <span className=\"text-xs text-muted-foreground\">
                  ({expandedCount} expanded)
                </span>
              )}
            </div>
          </div>

          {/* Active filters display */}
          {activeFilterCount > 0 && (
            <div className=\"flex items-center space-x-2 flex-wrap\">
              <span className=\"text-sm text-muted-foreground\">Active filters:</span>
              {Object.entries(filters).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null
                
                const option = filterOptions.find(opt => opt.key === key)
                if (!option) return null

                let displayValue: string
                if (Array.isArray(value)) {
                  displayValue = value.length === 1 ? value[0] : `${value.length} selected`
                } else if (typeof value === 'object' && value.from && value.to) {
                  displayValue = `${value.from} - ${value.to}`
                } else if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No'
                } else {
                  displayValue = String(value)
                }

                return (
                  <Badge
                    key={key}
                    variant=\"secondary\"
                    className=\"cursor-pointer\"
                    onClick={() => {
                      const clearedValue = Array.isArray(value) ? [] : 
                                         typeof value === 'boolean' ? false : ''
                      handleFilterChange(key, clearedValue)
                    }}
                  >
                    {option.label}: {displayValue}
                    <XMarkIcon className=\"h-3 w-3 ml-1\" />
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Export types
export type {
  FilterOption,
  SortOption,
  HierarchicalListControlsProps
}
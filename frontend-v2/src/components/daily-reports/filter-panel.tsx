'use client'

// Filter Panel Component
// Comprehensive filtering interface for Daily Reports

import React, { useState, useCallback } from 'react'
import { 
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  User,
  Building,
  Tag,
  RotateCcw
} from 'lucide-react'

import {
  DailyReportsFilters,
  InspectionStatus,
  MaintenanceEventStatus,
  RefineryDepartment
} from '@/types/daily-reports'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { format, isValid } from 'date-fns'

// Helper function for safe date formatting
function safeFormatDate(date: Date | undefined, formatStr: string = 'MMM dd, yyyy'): string {
  if (!date) return 'N/A'
  
  try {
    if (!isValid(date)) return 'Invalid Date'
    return format(date, formatStr)
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', date)
    return 'Invalid Date'
  }
}

interface FilterPanelProps {
  filters: DailyReportsFilters
  onFiltersChange: (filters: DailyReportsFilters) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onClearFilters: () => void
  availableOptions?: {
    inspectors?: string[]
    requesters?: string[]
    equipmentTags?: string[]
  }
  className?: string
}

/**
 * Filter Panel Component
 * 
 * Provides comprehensive filtering options for Daily Reports including:
 * - Text search
 * - Status filters
 * - Date range selection
 * - Inspector and requester filters
 * - Equipment tag filters
 * - Advanced options
 */
export function FilterPanel({
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  onClearFilters,
  availableOptions = {},
  className
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => {
    if (value === undefined || value === null || value === '') return false
    if (typeof value === 'object' && Object.keys(value).length === 0) return false
    return true
  }).length + (searchQuery ? 1 : 0)

  const handleFilterChange = useCallback((key: keyof DailyReportsFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }, [filters, onFiltersChange])

  const handleDateRangeChange = useCallback((field: 'from' | 'to', date: Date | undefined) => {
    const dateRange = filters.dateRange || {}
    const newDateRange = {
      ...dateRange,
      [field]: date ? format(date, 'yyyy-MM-dd') : undefined
    }
    
    // Remove empty date range
    if (!newDateRange.from && !newDateRange.to) {
      handleFilterChange('dateRange', undefined)
    } else {
      handleFilterChange('dateRange', newDateRange)
    }
  }, [filters.dateRange, handleFilterChange])

  const clearAllFilters = useCallback(() => {
    onClearFilters()
    onSearchChange('')
  }, [onClearFilters, onSearchChange])

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input - Always Visible */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by equipment tag, inspection number, or description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick Filters - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickFilterButton
            active={filters.status === InspectionStatus.IN_PROGRESS}
            onClick={() => handleFilterChange('status', 
              filters.status === InspectionStatus.IN_PROGRESS ? undefined : InspectionStatus.IN_PROGRESS
            )}
            icon={<User className="h-3 w-3" />}
            label="Active"
          />
          
          <QuickFilterButton
            active={filters.status === InspectionStatus.COMPLETED}
            onClick={() => handleFilterChange('status', 
              filters.status === InspectionStatus.COMPLETED ? undefined : InspectionStatus.COMPLETED
            )}
            icon={<User className="h-3 w-3" />}
            label="Completed"
          />
          
          <QuickFilterButton
            active={filters.hasReports === true}
            onClick={() => handleFilterChange('hasReports', 
              filters.hasReports === true ? undefined : true
            )}
            icon={<Tag className="h-3 w-3" />}
            label="Has Reports"
          />
          
          <QuickFilterButton
            active={filters.showCompleted === false}
            onClick={() => handleFilterChange('showCompleted', 
              filters.showCompleted === false ? undefined : false
            )}
            icon={<Building className="h-3 w-3" />}
            label="Hide Completed"
          />
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-2">
            <Separator />
            
            {/* Status and Department Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => handleFilterChange('status', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value={InspectionStatus.PLANNED}>Planned</SelectItem>
                    <SelectItem value={InspectionStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={InspectionStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={InspectionStatus.ON_HOLD}>On Hold</SelectItem>
                    <SelectItem value={InspectionStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Department</Label>
                <Select
                  value={filters.department || ''}
                  onValueChange={(value) => handleFilterChange('department', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    <SelectItem value={RefineryDepartment.OPERATIONS}>Operations</SelectItem>
                    <SelectItem value={RefineryDepartment.MAINTENANCE}>Maintenance</SelectItem>
                    <SelectItem value={RefineryDepartment.ENGINEERING}>Engineering</SelectItem>
                    <SelectItem value={RefineryDepartment.SAFETY}>Safety</SelectItem>
                    <SelectItem value={RefineryDepartment.QUALITY}>Quality</SelectItem>
                    <SelectItem value={RefineryDepartment.INSPECTION}>Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Inspector and Requester Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Inspector</Label>
                <Select
                  value={filters.inspector || ''}
                  onValueChange={(value) => handleFilterChange('inspector', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select inspector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Inspectors</SelectItem>
                    {availableOptions.inspectors?.map((inspector) => (
                      <SelectItem key={inspector} value={inspector}>
                        {inspector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Requester</Label>
                <Select
                  value={filters.requester || ''}
                  onValueChange={(value) => handleFilterChange('requester', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select requester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Requesters</SelectItem>
                    {availableOptions.requesters?.map((requester) => (
                      <SelectItem key={requester} value={requester}>
                        {requester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Equipment Tag Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Equipment Tag</Label>
              <Select
                value={filters.equipmentTag || ''}
                onValueChange={(value) => handleFilterChange('equipmentTag', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Equipment</SelectItem>
                  {availableOptions.equipmentTags?.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <DatePickerField
                  placeholder="From date"
                  value={filters.dateRange?.from}
                  onChange={(date) => handleDateRangeChange('from', date)}
                />
                <DatePickerField
                  placeholder="To date"
                  value={filters.dateRange?.to}
                  onChange={(date) => handleDateRangeChange('to', date)}
                />
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="flex items-center justify-between pt-2">
              <Label className="text-sm font-medium">Advanced Options</Label>
              <Switch
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasReports"
                      checked={filters.hasReports === true}
                      onCheckedChange={(checked) => 
                        handleFilterChange('hasReports', checked ? true : undefined)
                      }
                    />
                    <Label htmlFor="hasReports" className="text-sm">
                      Only items with reports
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showCompleted"
                      checked={filters.showCompleted !== false}
                      onCheckedChange={(checked) => 
                        handleFilterChange('showCompleted', checked ? undefined : false)
                      }
                    />
                    <Label htmlFor="showCompleted" className="text-sm">
                      Show completed items
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="safetyIssues"
                      checked={filters.safetyIssues === true}
                      onCheckedChange={(checked) => 
                        handleFilterChange('safetyIssues', checked ? true : undefined)
                      }
                    />
                    <Label htmlFor="safetyIssues" className="text-sm">
                      Items with safety issues
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="findingsPresent"
                      checked={filters.findingsPresent === true}
                      onCheckedChange={(checked) => 
                        handleFilterChange('findingsPresent', checked ? true : undefined)
                      }
                    />
                    <Label htmlFor="findingsPresent" className="text-sm">
                      Reports with findings
                    </Label>
                  </div>
                </div>

                {/* Additional Text Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Inspection Number</Label>
                    <Input
                      placeholder="Enter inspection number"
                      value={filters.inspectionNumber || ''}
                      onChange={(e) => handleFilterChange('inspectionNumber', e.target.value || undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Event Number</Label>
                    <Input
                      placeholder="Enter event number"
                      value={filters.eventNumber || ''}
                      onChange={(e) => handleFilterChange('eventNumber', e.target.value || undefined)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="pt-2">
            <Separator className="mb-3" />
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <FilterBadge
                  label={`Search: "${searchQuery}"`}
                  onRemove={() => onSearchChange('')}
                />
              )}
              
              {filters.status && (
                <FilterBadge
                  label={`Status: ${filters.status}`}
                  onRemove={() => handleFilterChange('status', undefined)}
                />
              )}
              
              {filters.department && (
                <FilterBadge
                  label={`Department: ${filters.department}`}
                  onRemove={() => handleFilterChange('department', undefined)}
                />
              )}
              
              {filters.inspector && (
                <FilterBadge
                  label={`Inspector: ${filters.inspector}`}
                  onRemove={() => handleFilterChange('inspector', undefined)}
                />
              )}
              
              {filters.dateRange && (
                <FilterBadge
                  label={`Date: ${filters.dateRange.from || '...'} - ${filters.dateRange.to || '...'}`}
                  onRemove={() => handleFilterChange('dateRange', undefined)}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Quick Filter Button Component
 */
function QuickFilterButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="flex items-center space-x-1 text-xs"
    >
      {icon}
      <span>{label}</span>
    </Button>
  )
}

/**
 * Date Picker Field Component
 */
function DatePickerField({
  placeholder,
  value,
  onChange
}: {
  placeholder: string
  value?: string
  onChange: (date: Date | undefined) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedDate = value ? new Date(value) : undefined

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {selectedDate ? safeFormatDate(selectedDate) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onChange(date)
            setIsOpen(false)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Filter Badge Component
 */
function FilterBadge({
  label,
  onRemove
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <Badge variant="secondary" className="flex items-center space-x-1 text-xs">
      <span>{label}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-3 w-3 p-0 hover:bg-transparent"
      >
        <X className="h-2 w-2" />
      </Button>
    </Badge>
  )
}
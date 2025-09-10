'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Search, Filter, X, Calendar, Package, Wrench, Settings, FileText } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { EventsFilters, MaintenanceEventStatus, MaintenanceEventType, InspectionsFilters } from '@/types/maintenance-events'
import { useInspections } from '@/hooks/use-maintenance-events'

type SearchMode = 'events' | 'inspections'

interface GlobalSearchFiltersProps {
  // Mode selection
  searchMode: SearchMode
  onSearchModeChange: (mode: SearchMode) => void
  
  // Events filters
  eventsFilters: EventsFilters
  onEventsFiltersChange: (filters: EventsFilters) => void
  
  // Inspections filters
  inspectionsFilters: InspectionsFilters
  onInspectionsFiltersChange: (filters: InspectionsFilters) => void
  
  // Common actions
  onClearFilters: () => void
}

export function GlobalSearchAndFilters({ 
  searchMode,
  onSearchModeChange,
  eventsFilters,
  onEventsFiltersChange,
  inspectionsFilters,
  onInspectionsFiltersChange,
  onClearFilters
}: GlobalSearchFiltersProps) {
  // Get current filters based on mode
  const currentFilters = searchMode === 'events' ? eventsFilters : inspectionsFilters
  const onCurrentFiltersChange = searchMode === 'events' ? onEventsFiltersChange : onInspectionsFiltersChange

  const handleSearchChange = (value: string) => {
    if (searchMode === 'events') {
      onEventsFiltersChange({ ...eventsFilters, search: value || undefined })
    } else {
      onInspectionsFiltersChange({ ...inspectionsFilters, search: value || undefined })
    }
  }
  
  const handleEquipmentTagSearch = (value: string) => {
    onInspectionsFiltersChange({ ...inspectionsFilters, equipmentTag: value || undefined })
  }

  const handleStatusChange = (value: string) => {
    if (searchMode === 'events') {
      onEventsFiltersChange({ 
        ...eventsFilters, 
        status: value === 'all' ? undefined : value as MaintenanceEventStatus 
      })
    } else {
      onInspectionsFiltersChange({ 
        ...inspectionsFilters, 
        status: value === 'all' ? undefined : value as any
      })
    }
  }

  const handleEventTypeChange = (value: string) => {
    if (searchMode === 'events') {
      onEventsFiltersChange({ 
        ...eventsFilters, 
        eventType: value === 'all' ? undefined : value as MaintenanceEventType 
      })
    }
  }

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    const dateFrom = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined
    const dateTo = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
    
    console.log('🗓️ Date filter change:', { dateRange, dateFrom, dateTo, searchMode })
    
    if (searchMode === 'events') {
      onEventsFiltersChange({ 
        ...eventsFilters, 
        dateFrom,
        dateTo
      })
    } else {
      onInspectionsFiltersChange({ 
        ...inspectionsFilters, 
        dateFrom,
        dateTo
      })
    }
  }

  const handleDateFieldChange = (value: string) => {
    console.log('📅 Date field change:', { value, currentFilters: inspectionsFilters })
    onInspectionsFiltersChange({ 
      ...inspectionsFilters, 
      dateField: value as any
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (currentFilters.search) count++
    if (currentFilters.status) count++
    if (searchMode === 'events' && eventsFilters.eventType) count++
    if (searchMode === 'inspections' && inspectionsFilters.equipmentTag) count++
    if (currentFilters.dateFrom) count++
    if (currentFilters.dateTo) count++
    if (searchMode === 'inspections' && inspectionsFilters.dateField && inspectionsFilters.dateField !== 'actual_start_date') count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Search and Quick Filters */}
        <div className="space-y-4">
          {/* Search Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={searchMode === 'events' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSearchModeChange('events')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Events
          </Button>
          <Button
            variant={searchMode === 'inspections' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSearchModeChange('inspections')}
            className="gap-2"
          >
            <Wrench className="h-4 w-4" />
            Inspections
          </Button>
        </div>
        
        {/* Search Fields - Different for each mode */}
        <div className="space-y-3">
          {searchMode === 'events' ? (
            // Events Search
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events by title, number, or description..."
                value={eventsFilters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          ) : (
            // Inspections Search
            <>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inspections by title, number, or description... (try: inspection, tower, valve)"
                  value={inspectionsFilters.search || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Equipment Tag Search - Main feature for inspections */}
              <div className="relative">
                <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by equipment tag (e.g., CV-302, P-101) - Find all related inspections"
                  value={inspectionsFilters.equipmentTag || ''}
                  onChange={(e) => handleEquipmentTagSearch(e.target.value)}
                  className="pl-9 font-medium"
                />
              </div>
            </>
          )}
        </div>
          
          {/* Filters Row - Different for each mode */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex flex-1 gap-2">
              {/* Status Filter */}
              <Select value={currentFilters.status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="flex-1 sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {searchMode === 'events' ? (
                    // Event statuses
                    <>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="InProgress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Postponed">Postponed</SelectItem>
                    </>
                  ) : (
                    // Inspection statuses
                    <>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="InProgress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              
              {/* Event Type Filter (Events mode only) */}
              {searchMode === 'events' && (
                <Select value={eventsFilters.eventType || 'all'} onValueChange={handleEventTypeChange}>
                  <SelectTrigger className="flex-1 sm:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Overhaul">Overhaul</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Preventive">Preventive</SelectItem>
                    <SelectItem value="Corrective">Corrective</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Date Range Filter - Always Visible */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {searchMode === 'events' ? 'Event Date Range' : 'Inspection Date Range'}
            </label>
            <div className="flex gap-2">
              <DateRangePicker
                dateRange={{
                  from: currentFilters.dateFrom ? new Date(currentFilters.dateFrom) : undefined,
                  to: currentFilters.dateTo ? new Date(currentFilters.dateTo) : undefined
                }}
                onDateRangeChange={handleDateRangeChange}
                placeholder={`Select ${searchMode} date range`}
                disableFuture={false}
                modal={true}
                className="flex-1"
              />
              
              {/* Date Field Selector - Only for Inspections */}
              {searchMode === 'inspections' && (
                <Select
                  value={inspectionsFilters.dateField || 'actual_start_date'}
                  onValueChange={handleDateFieldChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Date field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned_start_date">📅 Planned Start</SelectItem>
                    <SelectItem value="planned_end_date">📅 Planned End</SelectItem>
                    <SelectItem value="actual_start_date">🏁 Actual Start</SelectItem>
                    <SelectItem value="actual_end_date">🏁 Actual End</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        

        

        
        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            <div className="flex flex-wrap gap-1">
              {currentFilters.search && (
                <Badge variant="secondary" className="gap-1">
                  Search: {currentFilters.search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleSearchChange('')}
                  />
                </Badge>
              )}
              {searchMode === 'inspections' && inspectionsFilters.equipmentTag && (
                <Badge variant="secondary" className="gap-1">
                  Equipment: {inspectionsFilters.equipmentTag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleEquipmentTagSearch('')}
                  />
                </Badge>
              )}
              {currentFilters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {currentFilters.status}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleStatusChange('all')}
                  />
                </Badge>
              )}
              {searchMode === 'events' && eventsFilters.eventType && (
                <Badge variant="secondary" className="gap-1">
                  Type: {eventsFilters.eventType}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleEventTypeChange('all')}
                  />
                </Badge>
              )}
              {(currentFilters.dateFrom || currentFilters.dateTo) && (
                <Badge variant="secondary" className="gap-1">
                  Date: {currentFilters.dateFrom && format(new Date(currentFilters.dateFrom), 'MMM dd')}
                  {currentFilters.dateFrom && currentFilters.dateTo && ' - '}
                  {currentFilters.dateTo && format(new Date(currentFilters.dateTo), 'MMM dd')}
                  {searchMode === 'inspections' && inspectionsFilters.dateField && (
                    <span className="text-xs ml-1">({inspectionsFilters.dateField?.replace('_', ' ')})</span>
                  )}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleDateRangeChange(undefined)}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
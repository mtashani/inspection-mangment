'use client'

import React, { useMemo } from 'react'
import { MaintenanceEvent, MaintenanceSubEvent, TabItem, InspectionStatus } from '@/types/maintenance-events'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Search, Filter, X, Calendar } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { InspectionsList } from './inspections-list'
import { EventInspectionsList } from './event-inspections-list'
import { InspectionProgressTracker } from './inspection-progress-tracker'
import { DailyReportsSummary } from './daily-reports-summary'
import { SubEventHeader } from './sub-event-header'
import { ModernTabNavigation } from './modern-tab-navigation'

// Component to handle rendering for each tab
function TabContentWithData({ 
  event,
  subEventId, 
  subEvents,
  search, 
  inspectionStatus, 
  equipmentTag,
  dateFrom,
  dateTo,
  dateField,
  onSearchChange,
  onInspectionStatusChange,
  onEquipmentTagChange,
  onDateRangeChange,
  onDateFieldChange,
  onResetFilters
}: {
  event: MaintenanceEvent
  subEventId?: number
  subEvents?: MaintenanceSubEvent[]
  search?: string
  inspectionStatus?: string
  equipmentTag?: string
  dateFrom?: string
  dateTo?: string
  dateField?: string
  onSearchChange?: (search: string) => void
  onInspectionStatusChange?: (status: string | undefined) => void
  onEquipmentTagChange?: (tag: string | undefined) => void
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  onDateFieldChange?: (field: string) => void
  onResetFilters?: () => void
}) {
  const eventId = event.id.toString()
  
  // Find the sub-event for this tab
  const currentSubEvent = subEventId && subEvents ? 
    subEvents.find(se => se.id === subEventId) : undefined

  // Check if any filters are active for this tab
  const hasActiveFilters = search || (inspectionStatus && inspectionStatus !== 'all') || equipmentTag || dateFrom || dateTo

  // Handle date range changes
  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    if (onDateRangeChange) {
      onDateRangeChange(newRange)
    }
  }
  
  return (
    <>
      {/* Sub-event Header - only for sub-event tabs, with parent event for inheritance */}
      {currentSubEvent && (
        <div className="mb-6">
          <SubEventHeader 
            subEvent={currentSubEvent}
            parentEvent={event}
          />
        </div>
      )}
      
      {/* Tab-specific Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${subEventId ? 'sub-event' : 'direct'} inspections...`}
              value={search || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          {onInspectionStatusChange && (
            <Select value={inspectionStatus || 'all'} onValueChange={(value) => onInspectionStatusChange(value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-full sm:w-48">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="All Statuses" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="InProgress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
                <SelectItem value="OnHold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Equipment Tag Filter */}
          {onEquipmentTagChange && (
            <div className="relative">
              <Input
                placeholder="Equipment tag..."
                value={equipmentTag || ''}
                onChange={(e) => onEquipmentTagChange(e.target.value || undefined)}
                className="w-full sm:w-48"
              />
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && onResetFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Date Range Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date Field Selector */}
          {onDateFieldChange && (
            <Select value={dateField || 'actual_start_date'} onValueChange={onDateFieldChange}>
              <SelectTrigger className="w-full sm:w-52">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue placeholder="Select Date Field" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actual_start_date">📅 Actual Start Date</SelectItem>
                <SelectItem value="actual_end_date">🏁 Actual End Date</SelectItem>
                <SelectItem value="planned_start_date">📋 Planned Start Date</SelectItem>
                <SelectItem value="planned_end_date">🎯 Planned End Date</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Date Range Picker */}
          {onDateRangeChange && (
            <div className="flex-1">
              <DateRangePicker
                dateRange={{
                  from: dateFrom ? new Date(dateFrom) : undefined,
                  to: dateTo ? new Date(dateTo) : undefined
                }}
                onDateRangeChange={handleDateRangeChange}
                placeholder="Select date range"
                disableFuture={false}
                modal={true}
                className="flex-1"
              />
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {search && (
              <Badge variant="secondary" className="gap-1">
                Search: &quot;{search}&quot;
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onSearchChange?.('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {inspectionStatus && inspectionStatus !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {inspectionStatus}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onInspectionStatusChange?.(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {equipmentTag && (
              <Badge variant="secondary" className="gap-1">
                Equipment: {equipmentTag}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onEquipmentTagChange?.(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {(dateFrom || dateTo) && (
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                Date: {dateFrom && new Date(dateFrom).toLocaleDateString()} 
                {dateFrom && dateTo && ' - '}
                {dateTo && new Date(dateTo).toLocaleDateString()}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onDateRangeChange?.(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Enhanced Progress and Summary Cards - removed temporarily to focus on pagination */}
      {/* TODO: Add back progress tracking with paginated data */}
      
      {/* Inspections List with Pagination */}
      <EventInspectionsList 
        eventId={eventId}
        subEventId={subEventId}
        search={search}
        inspectionStatus={(inspectionStatus && inspectionStatus !== 'all') ? inspectionStatus : undefined}
        equipmentTag={equipmentTag}
        dateFrom={dateFrom}
        dateTo={dateTo}
        dateField={dateField || 'actual_start_date'}
      />
    </>
  )
}

interface EventTabsProps {
  event: MaintenanceEvent
  subEvents?: MaintenanceSubEvent[]
  activeTab: string
  onTabChange: (tab: string) => void
  search: string
  onSearchChange: (search: string) => void
  inspectionStatus?: string
  onInspectionStatusChange?: (status: string | undefined) => void
  equipmentTag?: string
  onEquipmentTagChange?: (tag: string | undefined) => void
  dateFrom?: string
  dateTo?: string
  dateField?: string
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  onDateFieldChange?: (field: string) => void
  onResetFilters?: () => void
  tabInfo?: { type: 'direct' | 'sub-event', subEventId?: number }
}

export function EventTabs({ 
  event, 
  subEvents, 
  activeTab, 
  onTabChange, 
  search, 
  onSearchChange,
  inspectionStatus,
  onInspectionStatusChange,
  equipmentTag,
  onEquipmentTagChange,
  dateFrom,
  dateTo,
  dateField,
  onDateRangeChange,
  onDateFieldChange,
  onResetFilters
}: EventTabsProps) {
  const tabs = useMemo(() => {
    const tabList: TabItem[] = [
      // Direct inspections tab (always present and first)
      {
        id: 'direct-inspections',
        label: 'Direct Inspections',
        badge: (event.direct_inspections_count && event.direct_inspections_count > 0) ? event.direct_inspections_count : undefined
      }
    ]
    
    // Sub-event tabs (if any exist) - add after direct inspections
    if (subEvents?.length) {
      // Add a clear separator for sub-events section
      tabList.push({
        id: 'sub-events-header',
        label: `— Sub-Events (${subEvents.length}) —`,
        badge: undefined,
        isHeader: true
      })
      
      subEvents.forEach(subEvent => {
        tabList.push({
          id: `sub-event-${subEvent.id}`,
          label: subEvent.title,
          badge: (subEvent.inspections_count && subEvent.inspections_count > 0) ? subEvent.inspections_count : undefined
        })
      })
    }
    
    return tabList
  }, [event, subEvents])

  return (
    <div className="space-y-4">
      {/* Modern Tab Navigation */}
      <ModernTabNavigation
        event={event}
        subEvents={subEvents}
        activeTab={activeTab}
        onTabChange={onTabChange}
        maxVisibleTabs={4}
      />

      {/* Content Container - seamlessly connected to tabs */}
      <div className="bg-background border border-t-0 rounded-b-lg shadow-sm">
        <div className="p-6 space-y-8">
          {tabs.map(tab => {
            // Only render content for the active tab to prevent hook order issues
            if (tab.id !== activeTab) {
              return null;
            }
            
            // Skip header tabs (they don't have content)
            if (tab.isHeader) {
              return null;
            }
            
            const subEventId = tab.id.startsWith('sub-event-') ? 
              parseInt(tab.id.replace('sub-event-', '')) : 
              undefined
            
            // Create component key that forces re-render on tab changes but NOT on date filter changes
            // FIXED: Removed date fields to prevent DateRangePicker remounting
            const componentKey = subEventId 
              ? `sub-event-${subEventId}-${search || 'no-search'}-${inspectionStatus || 'all'}-${equipmentTag || 'no-tag'}-${dateField || 'actual_start_date'}`
              : `direct-inspections-${search || 'no-search'}-${inspectionStatus || 'all'}-${equipmentTag || 'no-tag'}-${dateField || 'actual_start_date'}`
            
            return (
              <div key={tab.id} className="animate-in fade-in-50 duration-300">
                <TabContentWithData 
                  key={componentKey}
                  event={event}
                  subEventId={subEventId}
                  subEvents={subEvents}
                  search={search}
                  inspectionStatus={inspectionStatus}
                  equipmentTag={equipmentTag}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  dateField={dateField}
                  onSearchChange={onSearchChange}
                  onInspectionStatusChange={onInspectionStatusChange}
                  onEquipmentTagChange={onEquipmentTagChange}
                  onDateRangeChange={onDateRangeChange}
                  onDateFieldChange={onDateFieldChange}
                  onResetFilters={onResetFilters}
                />
              </div>
            )
          })}
        </div>
      </div>
      
    </div>
  )
}
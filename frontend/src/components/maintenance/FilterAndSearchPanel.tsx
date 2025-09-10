'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

import {
  FilterAndSearchPanelProps,
  FilterOptions,
  InspectionStatus,
  InspectionPriority,
  RefineryDepartment
} from '@/types/enhanced-maintenance'

import { MaintenanceEventStatus, MaintenanceEventType, MaintenanceEventStatusEnum, MaintenanceEventTypeEnum } from '@/types/maintenance'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  value?: { from: string; to: string }
  onChange: (range?: { from: string; to: string }) => void
  placeholder?: string
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date range"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({})

  const formatDateRange = (range?: { from: string; to: string }): string => {
    if (!range) return placeholder
    
    const fromDate = new Date(range.from)
    const toDate = new Date(range.to)
    
    return `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`
  }

  const handleApply = () => {
    if (tempRange.from && tempRange.to) {
      onChange({
        from: tempRange.from.toISOString().split('T')[0],
        to: tempRange.to.toISOString().split('T')[0]
      })
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempRange({})
    onChange(undefined)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">From</label>
              <Calendar
                mode="single"
                selected={tempRange.from}
                onSelect={(date) => setTempRange(prev => ({ ...prev, from: date }))}
                initialFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To</label>
              <Calendar
                mode="single"
                selected={tempRange.to}
                onSelect={(date) => setTempRange(prev => ({ ...prev, to: date }))}
              />
            </div>
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button 
              size="sm" 
              onClick={handleApply}
              disabled={!tempRange.from || !tempRange.to}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface MultiSelectProps<T extends string> {
  options: { value: T; label: string; color?: string }[]
  value: T[]
  onChange: (value: T[]) => void
  placeholder: string
  icon?: React.ComponentType<{ className?: string }>
}

function MultiSelect<T extends string>({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedLabels = useMemo(() => {
    return options
      .filter(option => value.includes(option.value))
      .map(option => option.label)
  }, [options, value])

  const handleToggle = (optionValue: T) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="justify-between"
        >
          <div className="flex items-center">
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            <span className="truncate">
              {selectedLabels.length > 0
                ? selectedLabels.length === 1
                  ? selectedLabels[0]
                  : `${selectedLabels.length} selected`
                : placeholder
              }
            </span>
          </div>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleToggle(option.value)}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    checked={value.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                  />
                  <span className="flex-1">{option.label}</span>
                  {option.color && (
                    <div 
                      className={cn("w-3 h-3 rounded-full", option.color)}
                    />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const FilterAndSearchPanel: React.FC<FilterAndSearchPanelProps> = ({
  filters,
  onFiltersChange,
  searchQuery = '',
  onSearchChange,
  onClearFilters,
  availableInspectors = [],
  availableRequesters = [],
  availableDepartments = Object.values(RefineryDepartment)
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(localSearchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchQuery, onSearchChange])

  // Filter options
  const statusOptions = Object.values(InspectionStatus).map(status => ({
    value: status,
    label: status.replace(/([A-Z])/g, ' $1').trim(),
    color: getStatusColor(status)
  }))

  const priorityOptions = Object.values(InspectionPriority).map(priority => ({
    value: priority,
    label: priority,
    color: getPriorityColor(priority)
  }))

  const departmentOptions = availableDepartments.map(dept => ({
    value: dept,
    label: dept,
    color: getDepartmentColor(dept)
  }))

  const eventTypeOptions = Object.values(MaintenanceEventTypeEnum).map(type => ({
    value: type,
    label: type.replace(/_/g, ' '),
    color: getEventTypeColor(type)
  }))

  const eventStatusOptions = Object.values(MaintenanceEventStatusEnum).map(status => ({
    value: status,
    label: status.replace(/_/g, ' '),
    color: getEventStatusColor(status)
  }))

  const inspectorOptions = availableInspectors.map(inspector => ({
    value: inspector,
    label: inspector
  }))

  const requesterOptions = availableRequesters.map(requester => ({
    value: requester,
    label: requester
  }))

  function getStatusColor(status: InspectionStatus): string {
    switch (status) {
      case InspectionStatus.Planned: return 'bg-blue-500'
      case InspectionStatus.InProgress: return 'bg-yellow-500'
      case InspectionStatus.Completed: return 'bg-green-500'
      case InspectionStatus.Cancelled: return 'bg-red-500'
      case InspectionStatus.OnHold: return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  function getPriorityColor(priority: InspectionPriority): string {
    switch (priority) {
      case InspectionPriority.Critical: return 'bg-red-500'
      case InspectionPriority.High: return 'bg-orange-500'
      case InspectionPriority.Medium: return 'bg-yellow-500'
      case InspectionPriority.Low: return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  function getDepartmentColor(department: RefineryDepartment): string {
    switch (department) {
      case RefineryDepartment.Operations: return 'bg-blue-500'
      case RefineryDepartment.Maintenance: return 'bg-orange-500'
      case RefineryDepartment.Engineering: return 'bg-purple-500'
      case RefineryDepartment.Safety: return 'bg-red-500'
      case RefineryDepartment.Quality: return 'bg-green-500'
      case RefineryDepartment.Inspection: return 'bg-teal-500'
      default: return 'bg-gray-500'
    }
  }

  function getEventTypeColor(type: MaintenanceEventType): string {
    switch (type) {
      case 'OVERHAUL': return 'bg-purple-500'
      case 'REPAIR': return 'bg-red-500'
      case 'PREVENTIVE': return 'bg-blue-500'
      case 'CORRECTIVE': return 'bg-orange-500'
      case 'INSPECTION': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  function getEventStatusColor(status: MaintenanceEventStatus): string {
    switch (status) {
      case MaintenanceEventStatusEnum.PLANNED: return 'bg-blue-500'
      case MaintenanceEventStatusEnum.IN_PROGRESS: return 'bg-yellow-500'
      case MaintenanceEventStatusEnum.COMPLETED: return 'bg-green-500'
      case MaintenanceEventStatusEnum.CANCELLED: return 'bg-red-500'
      case MaintenanceEventStatusEnum.POSTPONED: return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const updateFilters = (key: keyof FilterOptions, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const getActiveFiltersCount = (): number => {
    let count = 0
    if (filters.dateRange) count++
    if (filters.status && filters.status.length > 0) count++
    if (filters.inspectors && filters.inspectors.length > 0) count++
    if (filters.equipmentTag) count++
    if (filters.requester && filters.requester.length > 0) count++
    if (filters.department && filters.department.length > 0) count++
    if (filters.priority && filters.priority.length > 0) count++
    if (filters.eventType && filters.eventType.length > 0) count++
    if (filters.eventStatus && filters.eventStatus.length > 0) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Search Bar and Toggle */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by equipment tag, inspection number, or description..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.dateRange && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <CalendarIcon className="h-3 w-3" />
                <span>
                  {new Date(filters.dateRange.from).toLocaleDateString()} - 
                  {new Date(filters.dateRange.to).toLocaleDateString()}
                </span>
                <XMarkIcon 
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => updateFilters('dateRange', undefined)}
                />
              </Badge>
            )}

            {filters.status?.map(status => (
              <Badge key={status} variant="outline" className="flex items-center space-x-1">
                <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
                <span>{status}</span>
                <XMarkIcon 
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => updateFilters('status', filters.status?.filter(s => s !== status))}
                />
              </Badge>
            ))}

            {filters.inspectors?.map(inspector => (
              <Badge key={inspector} variant="outline" className="flex items-center space-x-1">
                <UserIcon className="h-3 w-3" />
                <span>{inspector}</span>
                <XMarkIcon 
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => updateFilters('inspectors', filters.inspectors?.filter(i => i !== inspector))}
                />
              </Badge>
            ))}

            {filters.equipmentTag && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <TagIcon className="h-3 w-3" />
                <span>{filters.equipmentTag}</span>
                <XMarkIcon 
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => updateFilters('equipmentTag', undefined)}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Expanded Filters */}
        {isExpanded && (
          <>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <DateRangePicker
                  value={filters.dateRange}
                  onChange={(range) => updateFilters('dateRange', range)}
                  placeholder="Select date range"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Inspection Status</label>
                <MultiSelect
                  options={statusOptions}
                  value={filters.status || []}
                  onChange={(value) => updateFilters('status', value)}
                  placeholder="Select status"
                  icon={AdjustmentsHorizontalIcon}
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <MultiSelect
                  options={priorityOptions}
                  value={filters.priority || []}
                  onChange={(value) => updateFilters('priority', value)}
                  placeholder="Select priority"
                />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <MultiSelect
                  options={departmentOptions}
                  value={filters.department || []}
                  onChange={(value) => updateFilters('department', value)}
                  placeholder="Select departments"
                  icon={BuildingOfficeIcon}
                />
              </div>

              {/* Inspectors */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Inspectors</label>
                <MultiSelect
                  options={inspectorOptions}
                  value={filters.inspectors || []}
                  onChange={(value) => updateFilters('inspectors', value)}
                  placeholder="Select inspectors"
                  icon={UserIcon}
                />
              </div>

              {/* Equipment Tag */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Equipment Tag</label>
                <Input
                  placeholder="Enter equipment tag"
                  value={filters.equipmentTag || ''}
                  onChange={(e) => updateFilters('equipmentTag', e.target.value || undefined)}
                />
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <MultiSelect
                  options={eventTypeOptions}
                  value={filters.eventType || []}
                  onChange={(value) => updateFilters('eventType', value)}
                  placeholder="Select event types"
                />
              </div>

              {/* Event Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Status</label>
                <MultiSelect
                  options={eventStatusOptions}
                  value={filters.eventStatus || []}
                  onChange={(value) => updateFilters('eventStatus', value)}
                  placeholder="Select event status"
                />
              </div>

              {/* Requesters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Requesters</label>
                <MultiSelect
                  options={requesterOptions}
                  value={filters.requester || []}
                  onChange={(value) => updateFilters('requester', value)}
                  placeholder="Select requesters"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default FilterAndSearchPanel
'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TemplateFilters as TemplateFiltersType, ReportType } from '@/types/admin'

interface TemplateFiltersProps {
  filters: TemplateFiltersType
  onFiltersChange: (filters: TemplateFiltersType) => void
}

export function TemplateFilters({ filters, onFiltersChange }: TemplateFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const reportTypes: { value: ReportType; label: string }[] = [
    { value: 'PSV', label: 'PSV' },
    { value: 'CRANE', label: 'Crane' },
    { value: 'CORROSION', label: 'Corrosion' },
    { value: 'GENERAL', label: 'General' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
  ]

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== ''
  ).length

  const handleFilterChange = (key: keyof TemplateFiltersType, value: string | boolean | undefined) => {
    const newFilters = { ...filters }
    
    if (value === undefined || value === '' || value === 'all') {
      delete newFilters[key]
    } else {
      newFilters[key] = value as never
    }
    
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Filter Templates
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-auto p-1 text-xs"
              >
                Clear All
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="p-4 space-y-4">
            {/* Report Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select
                value={filters.reportType || 'all'}
                onValueChange={(value) => handleFilterChange('reportType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={
                  filters.isActive === undefined 
                    ? 'all' 
                    : filters.isActive 
                      ? 'active' 
                      : 'inactive'
                }
                onValueChange={(value) => {
                  if (value === 'all') {
                    handleFilterChange('isActive', undefined)
                  } else {
                    handleFilterChange('isActive', value === 'active')
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Created By Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Created By</label>
              <Select
                value={filters.createdBy || 'all'}
                onValueChange={(value) => handleFilterChange('createdBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All creators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  {/* Add more creators as needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.reportType && (
            <Badge variant="secondary" className="text-xs">
              Type: {reportTypes.find(t => t.value === filters.reportType)?.label}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('reportType', undefined)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
          {filters.isActive !== undefined && (
            <Badge variant="secondary" className="text-xs">
              Status: {filters.isActive ? 'Active' : 'Inactive'}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('isActive', undefined)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
          {filters.createdBy && (
            <Badge variant="secondary" className="text-xs">
              Creator: {filters.createdBy}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => handleFilterChange('createdBy', undefined)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
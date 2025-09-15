'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

import { InspectorFilters } from '@/types/admin'

interface InspectorFiltersComponentProps {
  filters: InspectorFilters
  onFiltersChange: (filters: InspectorFilters) => void
}

export function InspectorFiltersComponent({ filters, onFiltersChange }: InspectorFiltersComponentProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleStatusChange = (status: 'active' | 'canLogin', checked: boolean) => {
    onFiltersChange({
      ...filters,
      [status]: checked ? true : undefined
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.active !== undefined) count++
    if (filters.canLogin !== undefined) count++
    if (filters.yearsExperience) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
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
        <DropdownMenuContent className="w-80" align="end">
          <div className="flex items-center justify-between p-2">
            <DropdownMenuLabel className="p-0">Filter Inspectors</DropdownMenuLabel>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-1 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          
          {/* Status Filters */}
          <div className="p-3">
            <Label className="text-sm font-medium mb-2 block">Status</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active-filter"
                  checked={filters.active === true}
                  onCheckedChange={(checked) => 
                    handleStatusChange('active', checked as boolean)
                  }
                />
                <Label 
                  htmlFor="active-filter"
                  className="text-sm font-normal cursor-pointer"
                >
                  Active Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="login-filter"
                  checked={filters.canLogin === true}
                  onCheckedChange={(checked) => 
                    handleStatusChange('canLogin', checked as boolean)
                  }
                />
                <Label 
                  htmlFor="login-filter"
                  className="text-sm font-normal cursor-pointer"
                >
                  Can Login Only
                </Label>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.active && (
            <Badge variant="secondary" className="text-xs">
              Active
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => onFiltersChange({ ...filters, active: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.canLogin && (
            <Badge variant="secondary" className="text-xs">
              Can Login
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => onFiltersChange({ ...filters, canLogin: undefined })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { DailyReportsFilters } from '@/types/maintenance-events'
import { DailyReportsFilters as DailyReportsFiltersV2 } from '@/types/daily-reports'
import { FilterPanel } from '../daily-reports/filter-panel'

interface DailyReportsFilterProps {
  filters: DailyReportsFilters
  onFiltersChange: (filters: DailyReportsFilters) => void
  onClearFilters: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

/**
 * Adapter component that bridges between the maintenance-events DailyReportsFilters
 * and the daily-reports FilterPanel component
 */
export function DailyReportsFilter({
  filters,
  onFiltersChange,
  onClearFilters,
  searchQuery,
  onSearchChange
}: DailyReportsFilterProps) {
  // Convert from maintenance-events filters to daily-reports filters
  const adaptedFilters: DailyReportsFiltersV2 = {
    search: filters.search,
    dateRange: filters.dateFrom && filters.dateTo ? {
      from: filters.dateFrom,
      to: filters.dateTo
    } : undefined,
    inspectionIds: filters.inspectionId ? [filters.inspectionId] : undefined,
  }

  // Convert from daily-reports filters back to maintenance-events filters
  const handleAdaptedFiltersChange = (newFilters: DailyReportsFiltersV2) => {
    const convertedFilters: DailyReportsFilters = {
      search: newFilters.search,
      dateFrom: newFilters.dateRange?.from,
      dateTo: newFilters.dateRange?.to,
      inspectionId: newFilters.inspectionIds?.[0],
    }
    onFiltersChange(convertedFilters)
  }

  return (
    <FilterPanel
      filters={adaptedFilters}
      onFiltersChange={handleAdaptedFiltersChange}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onClearFilters={onClearFilters}
    />
  )
}
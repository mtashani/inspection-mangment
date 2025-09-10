'use client'

// Daily Reports Header Component
// Header component with title, breadcrumbs, and action buttons

import React from 'react'
import { RefreshCw, Download, Settings, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface DailyReportsHeaderProps {
  totalItems?: number
  filteredItems?: number
  isRefreshing?: boolean
  onRefresh?: () => void
  onExport?: () => void
  onSettings?: () => void
  hasActiveFilters?: boolean
}

/**
 * Daily Reports Header Component
 * 
 * Displays the page title, breadcrumb navigation, and action buttons.
 * Responsive design that adapts to mobile screens.
 */
export function DailyReportsHeader({
  totalItems = 0,
  filteredItems = 0,
  isRefreshing = false,
  onRefresh,
  onExport,
  onSettings,
  hasActiveFilters = false
}: DailyReportsHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Daily Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        {/* Title and Description */}
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">Daily Reports</h1>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Filtered
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Comprehensive view of maintenance events, inspections, and daily reports
          </p>
          {totalItems > 0 && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>
                Showing {filteredItems.toLocaleString()} of {totalItems.toLocaleString()} items
              </span>
              {hasActiveFilters && filteredItems !== totalItems && (
                <Badge variant="outline" className="text-xs">
                  {((filteredItems / totalItems) * 100).toFixed(0)}% visible
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onSettings}>
                <Settings className="h-4 w-4 mr-2" />
                View Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Options
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Documentation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile-specific info bar */}
      <div className="md:hidden">
        {totalItems > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">{filteredItems.toLocaleString()}</span>
              <span className="text-muted-foreground"> of {totalItems.toLocaleString()} items</span>
            </div>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Filtered View
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Compact Header for Mobile/Embedded Views
 */
export function CompactDailyReportsHeader({
  title = "Daily Reports",
  itemCount,
  onRefresh,
  isRefreshing = false
}: {
  title?: string
  itemCount?: number
  onRefresh?: () => void
  isRefreshing?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {itemCount !== undefined && (
          <p className="text-sm text-muted-foreground">
            {itemCount.toLocaleString()} items
          </p>
        )}
      </div>
      
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  )
}

/**
 * Header Actions Component (can be used separately)
 */
export function DailyReportsHeaderActions({
  onRefresh,
  onExport,
  onSettings,
  isRefreshing = false,
  showLabels = true
}: {
  onRefresh?: () => void
  onExport?: () => void
  onSettings?: () => void
  isRefreshing?: boolean
  showLabels?: boolean
}) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        {showLabels && <span className="ml-2">Refresh</span>}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
      >
        <Download className="h-4 w-4" />
        {showLabels && <span className="ml-2">Export</span>}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onSettings}
      >
        <Settings className="h-4 w-4" />
        {showLabels && <span className="ml-2">Settings</span>}
      </Button>
    </div>
  )
}
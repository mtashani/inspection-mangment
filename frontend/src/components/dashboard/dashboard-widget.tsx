'use client'

import { useState, ReactNode } from 'react'
import {
  EllipsisVerticalIcon,
  Cog6ToothIcon,
  EyeSlashIcon,
  TrashIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export interface DashboardWidgetProps {
  title: string
  children: ReactNode
  config?: Record<string, any>
  isLoading?: boolean
  error?: string | null
  lastUpdated?: Date
  refreshInterval?: number
  className?: string
  headerActions?: ReactNode
  onRefresh?: () => void
  onConfigChange?: (config: Record<string, any>) => void
  onRemove?: () => void
  onHide?: () => void
}

export function DashboardWidget({
  title,
  children,
  config = {},
  isLoading = false,
  error = null,
  lastUpdated,
  refreshInterval,
  className,
  headerActions,
  onRefresh,
  onConfigChange,
  onRemove,
  onHide
}: DashboardWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Format last updated time
  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          
          {/* Status Indicators */}
          {isLoading && (
            <Badge variant="secondary" className="text-xs">
              <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
              Loading
            </Badge>
          )}
          
          {error && (
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          )}
          
          {refreshInterval && (
            <Badge variant="outline" className="text-xs">
              Auto: {Math.floor(refreshInterval / 60000)}m
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {/* Custom Header Actions */}
          {headerActions}

          {/* Collapse/Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0"
          >
            {isCollapsed ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </Button>

          {/* Widget Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onRefresh && (
                <DropdownMenuItem
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <ArrowPathIcon className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
                  Refresh
                </DropdownMenuItem>
              )}
              
              {onConfigChange && (
                <DropdownMenuItem onClick={() => {}}>
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Configure
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {onHide && (
                <DropdownMenuItem onClick={onHide}>
                  <EyeSlashIcon className="h-4 w-4 mr-2" />
                  Hide Widget
                </DropdownMenuItem>
              )}
              
              {onRemove && (
                <DropdownMenuItem
                  onClick={onRemove}
                  className="text-destructive focus:text-destructive"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Remove Widget
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="flex-1 pt-0">
          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center h-32 text-center">
              <div>
                <div className="text-destructive text-sm font-medium mb-1">
                  Failed to load data
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {error}
                </div>
                {onRefresh && (
                  <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    size="sm"
                    variant="outline"
                  >
                    <ArrowPathIcon className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && children}

          {/* Footer with Last Updated */}
          {lastUpdated && !isLoading && !error && (
            <div className="mt-4 pt-2 border-t text-xs text-muted-foreground text-right">
              Updated {formatLastUpdated(lastUpdated)}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Widget wrapper with common functionality
export function useWidgetData<T>(
  fetchData: () => Promise<T>,
  refreshInterval?: number
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = async () => {
    try {
      setError(null)
      const result = await fetchData()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = async () => {
    setIsLoading(true)
    await loadData()
  }

  // Initial load
  useState(() => {
    loadData()
  })

  // Auto refresh
  useState(() => {
    if (!refreshInterval) return

    const interval = setInterval(loadData, refreshInterval)
    return () => clearInterval(interval)
  })

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh
  }
}

export type { DashboardWidgetProps }
'use client'

import { useState, useEffect } from 'react'
import {
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useOffline } from '@/hooks/use-offline'
import { toast } from 'sonner'

export interface OfflineStatusProps {
  className?: string
  showDetails?: boolean
  showActions?: boolean
}

export function OfflineStatus({
  className,
  showDetails = false,
  showActions = true
}: OfflineStatusProps) {
  const {
    isOnline,
    isOffline,
    offlineActionsCount,
    isSyncing,
    syncOfflineActions,
    clearOfflineActions,
    retryFailedActions,
    getOfflineActions
  } = useOffline()

  const [failedActionsCount, setFailedActionsCount] = useState(0)
  const [syncProgress, setSyncProgress] = useState(0)

  // Update failed actions count
  useEffect(() => {
    const updateFailedCount = async () => {
      try {
        const actions = await getOfflineActions()
        const failed = actions.filter(action => action.retryCount > 0).length
        setFailedActionsCount(failed)
      } catch (error) {
        console.error('Failed to get offline actions:', error)
      }
    }

    updateFailedCount()
    const interval = setInterval(updateFailedCount, 5000)
    return () => clearInterval(interval)
  }, [getOfflineActions, offlineActionsCount])

  // Simulate sync progress (in real app, this would come from the sync process)
  useEffect(() => {
    if (isSyncing) {
      setSyncProgress(0)
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 20
        })
      }, 500)

      return () => clearInterval(interval)
    } else {
      setSyncProgress(0)
    }
  }, [isSyncing])

  // Handle sync action
  const handleSync = async () => {
    try {
      await syncOfflineActions()
      toast.success('Sync completed successfully')
    } catch (error) {
      toast.error('Sync failed')
    }
  }

  // Handle clear actions
  const handleClear = async () => {
    try {
      await clearOfflineActions()
      toast.success('Offline actions cleared')
    } catch (error) {
      toast.error('Failed to clear offline actions')
    }
  }

  // Handle retry failed actions
  const handleRetry = async () => {
    try {
      await retryFailedActions()
      toast.info('Retrying failed actions...')
    } catch (error) {
      toast.error('Failed to retry actions')
    }
  }

  if (!showDetails && isOnline && offlineActionsCount === 0) {
    return null
  }

  return (
    <Card className={cn('border-l-4', className, {
      'border-l-green-500': isOnline && offlineActionsCount === 0,
      'border-l-yellow-500': isOnline && offlineActionsCount > 0,
      'border-l-red-500': isOffline,
    })}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <WifiIcon className="h-5 w-5 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            )}
            <span>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {offlineActionsCount > 0 && (
              <Badge variant={isOnline ? 'default' : 'secondary'}>
                {offlineActionsCount} queued
              </Badge>
            )}
            {failedActionsCount > 0 && (
              <Badge variant="destructive">
                {failedActionsCount} failed
              </Badge>
            )}
            {isSyncing && (
              <div className="flex items-center space-x-1">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span className="text-sm">Syncing...</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Description */}
        <div className="text-sm text-muted-foreground">
          {isOffline && (
            <div className="flex items-center space-x-2 text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>
                You're working offline. Changes will be synced when connection is restored.
              </span>
            </div>
          )}
          
          {isOnline && offlineActionsCount > 0 && (
            <div className="flex items-center space-x-2 text-yellow-600">
              <CloudArrowUpIcon className="h-4 w-4" />
              <span>
                {offlineActionsCount} offline action{offlineActionsCount !== 1 ? 's' : ''} waiting to sync.
              </span>
            </div>
          )}
          
          {isOnline && offlineActionsCount === 0 && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircleIcon className="h-4 w-4" />
              <span>All changes are synced.</span>
            </div>
          )}
        </div>

        {/* Sync Progress */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Syncing offline changes...</span>
              <span>{Math.round(syncProgress)}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        {/* Failed Actions Warning */}
        {failedActionsCount > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <XCircleIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {failedActionsCount} action{failedActionsCount !== 1 ? 's' : ''} failed to sync
              </span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              These actions have exceeded the maximum retry attempts.
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-2">
            {isOnline && offlineActionsCount > 0 && (
              <Button
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                Sync Now
              </Button>
            )}
            
            {failedActionsCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                disabled={isSyncing}
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Retry Failed
              </Button>
            )}
            
            {offlineActionsCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
                disabled={isSyncing}
              >
                Clear Queue
              </Button>
            )}
          </div>
        )}

        {/* Detailed Information */}
        {showDetails && (
          <div className="pt-3 border-t space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className={cn('ml-2 font-medium', {
                  'text-green-600': isOnline,
                  'text-red-600': isOffline
                })}>
                  {isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div>
                <span className="text-muted-foreground">Queued Actions:</span>
                <span className="ml-2 font-medium">{offlineActionsCount}</span>
              </div>
              
              <div>
                <span className="text-muted-foreground">Failed Actions:</span>
                <span className="ml-2 font-medium text-red-600">{failedActionsCount}</span>
              </div>
              
              <div>
                <span className="text-muted-foreground">Sync Status:</span>
                <span className="ml-2 font-medium">
                  {isSyncing ? 'In Progress' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact offline indicator for navigation bar
export function OfflineIndicator({ className }: { className?: string }) {
  const { isOnline, offlineActionsCount, isSyncing } = useOffline()

  if (isOnline && offlineActionsCount === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {!isOnline && (
        <Badge variant="destructive" className="text-xs">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}
      
      {offlineActionsCount > 0 && (
        <Badge variant={isOnline ? 'default' : 'secondary'} className="text-xs">
          <CloudArrowUpIcon className="h-3 w-3 mr-1" />
          {offlineActionsCount}
        </Badge>
      )}
      
      {isSyncing && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <ArrowPathIcon className="h-3 w-3 animate-spin" />
          <span>Syncing</span>
        </div>
      )}
    </div>
  )
}

export type { OfflineStatusProps }
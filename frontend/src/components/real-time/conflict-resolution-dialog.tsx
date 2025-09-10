'use client'

import { useState } from 'react'
import {
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ConflictData } from '@/hooks/use-real-time-sync'

export interface ConflictResolutionDialogProps<T> {
  isOpen: boolean
  onClose: () => void
  conflicts: ConflictData<T>[]
  onResolve: (conflict: ConflictData<T>, resolution: 'client' | 'server' | T) => void
  onResolveAll: (resolution: 'client' | 'server') => void
  className?: string
}

export function ConflictResolutionDialog<T extends Record<string, any>>({
  isOpen,
  onClose,
  conflicts,
  onResolve,
  onResolveAll,
  className
}: ConflictResolutionDialogProps<T>) {
  const [selectedConflict, setSelectedConflict] = useState<ConflictData<T> | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isResolving, setIsResolving] = useState(false)

  // Handle individual conflict resolution
  const handleResolveConflict = async (
    conflict: ConflictData<T>, 
    resolution: 'client' | 'server' | T
  ) => {
    setIsResolving(true)
    try {
      await onResolve(conflict, resolution)
      
      // If this was the selected conflict, clear selection
      if (selectedConflict?.entityId === conflict.entityId) {
        setSelectedConflict(null)
      }
    } finally {
      setIsResolving(false)
    }
  }

  // Handle resolve all conflicts
  const handleResolveAll = async (resolution: 'client' | 'server') => {
    setIsResolving(true)
    try {
      await onResolveAll(resolution)
      setSelectedConflict(null)
    } finally {
      setIsResolving(false)
    }
  }

  // Get field differences
  const getFieldDifferences = (conflict: ConflictData<T>) => {
    const differences: Array<{
      field: string
      clientValue: any
      serverValue: any
      isDifferent: boolean
    }> = []

    const allFields = new Set([
      ...Object.keys(conflict.clientData),
      ...Object.keys(conflict.serverData)
    ])

    allFields.forEach(field => {
      const clientValue = conflict.clientData[field]
      const serverValue = conflict.serverData[field]
      const isDifferent = JSON.stringify(clientValue) !== JSON.stringify(serverValue)

      differences.push({
        field,
        clientValue,
        serverValue,
        isDifferent
      })
    })

    return differences.sort((a, b) => {
      if (a.isDifferent && !b.isDifferent) return -1
      if (!a.isDifferent && b.isDifferent) return 1
      return a.field.localeCompare(b.field)
    })
  }

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...'
    }
    return String(value)
  }

  // Get conflict type display
  const getConflictTypeDisplay = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'equipment':
        return { icon: '🔧', label: 'Equipment' }
      case 'inspection':
        return { icon: '📋', label: 'Inspection' }
      case 'report':
        return { icon: '📄', label: 'Report' }
      case 'maintenance':
        return { icon: '🔨', label: 'Maintenance' }
      default:
        return { icon: '📊', label: entityType }
    }
  }

  if (conflicts.length === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn('max-w-6xl max-h-[90vh] overflow-hidden', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            <span>Data Conflicts Detected</span>
            <Badge variant="destructive" className="ml-2">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Data conflicts have been detected between your local changes and server updates. 
            Please review and resolve these conflicts.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Detailed Comparison</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => handleResolveAll('client')}
                      disabled={isResolving}
                      className="flex-1"
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      Keep All My Changes
                    </Button>
                    <Button
                      onClick={() => handleResolveAll('server')}
                      disabled={isResolving}
                      variant="outline"
                      className="flex-1"
                    >
                      <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                      Accept All Server Changes
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Or review each conflict individually below
                  </p>
                </CardContent>
              </Card>

              {/* Conflicts List */}
              <div className="space-y-3">
                {conflicts.map((conflict, index) => {
                  const typeDisplay = getConflictTypeDisplay(conflict.entityType)
                  const differences = getFieldDifferences(conflict)
                  const changedFields = differences.filter(d => d.isDifferent).length

                  return (
                    <Card 
                      key={`${conflict.entityType}-${conflict.entityId}`}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedConflict?.entityId === conflict.entityId && 'ring-2 ring-primary'
                      )}
                      onClick={() => {
                        setSelectedConflict(conflict)
                        setActiveTab('details')
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{typeDisplay.icon}</div>
                            <div>
                              <h4 className="font-medium">
                                {typeDisplay.label} - {conflict.entityId}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {changedFields} field{changedFields !== 1 ? 's' : ''} changed
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              v{conflict.clientVersion} → v{conflict.serverVersion}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResolveConflict(conflict, 'client')
                                }}
                                disabled={isResolving}
                              >
                                <UserIcon className="h-3 w-3 mr-1" />
                                Keep Mine
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleResolveConflict(conflict, 'server')
                                }}
                                disabled={isResolving}
                              >
                                <ComputerDesktopIcon className="h-3 w-3 mr-1" />
                                Accept Server
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="flex-1 overflow-y-auto space-y-4">
              {selectedConflict ? (
                <div className="space-y-4">
                  {/* Conflict Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <span className="text-2xl">
                            {getConflictTypeDisplay(selectedConflict.entityType).icon}
                          </span>
                          <span>
                            {getConflictTypeDisplay(selectedConflict.entityType).label} - {selectedConflict.entityId}
                          </span>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Client v{selectedConflict.clientVersion}
                          </Badge>
                          <ArrowPathIcon className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">
                            Server v{selectedConflict.serverVersion}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Field Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Field Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-0">
                        {getFieldDifferences(selectedConflict).map((diff, index) => (
                          <div
                            key={diff.field}
                            className={cn(
                              'grid grid-cols-3 gap-4 p-4 border-b last:border-b-0',
                              diff.isDifferent && 'bg-yellow-50'
                            )}
                          >
                            <div className="font-medium">
                              <div className="flex items-center space-x-2">
                                <span>{diff.field}</span>
                                {diff.isDifferent && (
                                  <ExclamationTriangleIcon className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground flex items-center space-x-1">
                                <UserIcon className="h-3 w-3" />
                                <span>Your Version</span>
                              </div>
                              <div className={cn(
                                'text-sm p-2 rounded border',
                                diff.isDifferent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                              )}>
                                <pre className="whitespace-pre-wrap text-xs">
                                  {formatValue(diff.clientValue)}
                                </pre>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground flex items-center space-x-1">
                                <ComputerDesktopIcon className="h-3 w-3" />
                                <span>Server Version</span>
                              </div>
                              <div className={cn(
                                'text-sm p-2 rounded border',
                                diff.isDifferent ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                              )}>
                                <pre className="whitespace-pre-wrap text-xs">
                                  {formatValue(diff.serverValue)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resolution Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Resolution Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <Button
                          onClick={() => handleResolveConflict(selectedConflict, 'client')}
                          disabled={isResolving}
                          className="flex-1"
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          Keep My Changes
                        </Button>
                        <Button
                          onClick={() => handleResolveConflict(selectedConflict, 'server')}
                          disabled={isResolving}
                          variant="outline"
                          className="flex-1"
                        >
                          <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                          Accept Server Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Conflict</h3>
                    <p className="text-muted-foreground">
                      Choose a conflict from the overview tab to see detailed comparison
                    </p>
                    <Button
                      onClick={() => setActiveTab('overview')}
                      className="mt-4"
                    >
                      Go to Overview
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} remaining
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isResolving}
            >
              Cancel
            </Button>
            {conflicts.length > 1 && (
              <Button
                onClick={() => handleResolveAll('server')}
                disabled={isResolving}
              >
                {isResolving ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resolving...</span>
                  </div>
                ) : (
                  'Accept All Server Changes'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { ConflictResolutionDialogProps }
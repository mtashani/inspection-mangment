'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Pause,
  Play,
  Square,
  RotateCcw,
  Download,
  Eye,
  Trash2,
  Loader2,
  TrendingUp,
  Users,
  Calendar,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { 
  getBulkOperations,
  getBulkOperationById,
  getBulkOperationProgress,
  getBulkOperationErrors,
  cancelBulkOperation,
  retryBulkOperation,
  deleteBulkOperation,
  downloadBulkOperationResult
} from '@/lib/api/admin/bulk-operations'

interface OperationProgress {
  id: string
  status: string
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  progress: number
  estimatedTimeRemaining?: number
  currentStep?: string
  startedAt: string
  completedAt?: string
}

interface OperationError {
  row: number
  field?: string
  message: string
  value?: unknown
}

export function OperationProgressTracker() {
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showErrorsDialog, setShowErrorsDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const queryClient = useQueryClient()

  // Get all operations with filters
  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['bulk-operations', statusFilter, typeFilter, searchTerm],
    queryFn: () => getBulkOperations(1, 50, {
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
    }),
    refetchInterval: 3000, // Refresh every 3 seconds for real-time updates
  })

  // Get selected operation details
  const { data: selectedOperation } = useQuery({
    queryKey: ['bulk-operation', selectedOperationId],
    queryFn: () => selectedOperationId ? getBulkOperationById(selectedOperationId) : null,
    enabled: !!selectedOperationId,
  })

  // Get progress for running operations
  const { data: progressData } = useQuery({
    queryKey: ['bulk-operation-progress', selectedOperationId],
    queryFn: () => selectedOperationId ? getBulkOperationProgress(selectedOperationId) : null,
    enabled: !!selectedOperationId && selectedOperation?.status === 'RUNNING',
    refetchInterval: 2000, // Update every 2 seconds for running operations
  })

  // Get errors for failed operations
  const { data: operationErrors } = useQuery({
    queryKey: ['bulk-operation-errors', selectedOperationId],
    queryFn: () => selectedOperationId ? getBulkOperationErrors(selectedOperationId) : null,
    enabled: !!selectedOperationId && (selectedOperation?.status === 'FAILED' || selectedOperation?.status === 'COMPLETED'),
  })

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: (operationId: string) => cancelBulkOperation(operationId),
    onSuccess: () => {
      toast.success('Operation cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] })
      queryClient.invalidateQueries({ queryKey: ['bulk-operation', selectedOperationId] })
    },
    onError: (error) => {
      toast.error(`Failed to cancel operation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const retryMutation = useMutation({
    mutationFn: (operationId: string) => retryBulkOperation(operationId),
    onSuccess: () => {
      toast.success('Operation retry started')
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] })
      queryClient.invalidateQueries({ queryKey: ['bulk-operation', selectedOperationId] })
    },
    onError: (error) => {
      toast.error(`Failed to retry operation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (operationId: string) => deleteBulkOperation(operationId),
    onSuccess: () => {
      toast.success('Operation deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] })
      if (selectedOperationId === selectedOperationId) {
        setSelectedOperationId(null)
        setShowDetailsDialog(false)
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete operation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const downloadMutation = useMutation({
    mutationFn: (operationId: string) => downloadBulkOperationResult(operationId),
    onSuccess: (blob, operationId) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bulk-operation-${operationId}-result.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Operation result downloaded')
    },
    onError: (error) => {
      toast.error(`Failed to download result: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING': return Loader2
      case 'COMPLETED': return CheckCircle
      case 'FAILED': return XCircle
      case 'CANCELLED': return Square
      case 'PENDING': return Clock
      default: return Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'text-blue-600'
      case 'COMPLETED': return 'text-green-600'
      case 'FAILED': return 'text-red-600'
      case 'CANCELLED': return 'text-gray-600'
      case 'PENDING': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INSPECTOR_IMPORT':
      case 'INSPECTOR_UPDATE':
      case 'INSPECTOR_DELETE':
        return Users
      case 'ATTENDANCE_IMPORT':
      case 'ATTENDANCE_UPDATE':
        return Calendar
      case 'TEMPLATE_IMPORT':
      case 'TEMPLATE_UPDATE':
        return FileText
      default:
        return Activity
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
  }

  const formatEstimatedTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const filteredOperations = operations?.data.filter(op => {
    if (searchTerm && !op.type.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  }) || []

  const runningOperations = filteredOperations.filter(op => op.status === 'RUNNING')
  const completedOperations = filteredOperations.filter(op => op.status === 'COMPLETED')
  const failedOperations = filteredOperations.filter(op => op.status === 'FAILED')

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{runningOperations.length}</div>
            <p className="text-xs text-muted-foreground">Active operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedOperations.length}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedOperations.length}</div>
            <p className="text-xs text-muted-foreground">Failed operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOperations.length}</div>
            <p className="text-xs text-muted-foreground">All operations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="INSPECTOR">Inspector Operations</SelectItem>
                  <SelectItem value="ATTENDANCE">Attendance Operations</SelectItem>
                  <SelectItem value="TEMPLATE">Template Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search operations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Operation Progress Tracking
          </CardTitle>
          <CardDescription>
            Monitor real-time progress of bulk operations with detailed tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {operationsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No operations found matching your filters
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperations.map((operation) => {
                  const StatusIcon = getStatusIcon(operation.status)
                  const TypeIcon = getTypeIcon(operation.type)
                  const statusColor = getStatusColor(operation.status)
                  
                  return (
                    <TableRow key={operation.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{operation.type.replace(/_/g, ' ')}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {operation.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`flex items-center gap-1 w-fit ${statusColor}`}>
                          <StatusIcon className={`w-3 h-3 ${operation.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                          {operation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {operation.progress !== undefined ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Progress value={operation.progress} className="w-20" />
                              <span className="text-sm font-medium">{Math.round(operation.progress)}%</span>
                            </div>
                            {operation.status === 'RUNNING' && operation.estimatedTimeRemaining && (
                              <div className="text-xs text-muted-foreground">
                                ~{formatEstimatedTime(operation.estimatedTimeRemaining)} remaining
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{operation.processedRecords || 0} / {operation.totalRecords || 0}</div>
                          {operation.successfulRecords !== undefined && operation.failedRecords !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              <span className="text-green-600">{operation.successfulRecords} success</span>
                              {operation.failedRecords > 0 && (
                                <span className="text-red-600 ml-2">{operation.failedRecords} failed</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDuration(operation.createdAt, operation.completedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOperationId(operation.id)
                              setShowDetailsDialog(true)
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          
                          {operation.status === 'RUNNING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelMutation.mutate(operation.id)}
                              disabled={cancelMutation.isPending}
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {operation.status === 'FAILED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => retryMutation.mutate(operation.id)}
                              disabled={retryMutation.isPending}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {(operation.status === 'COMPLETED' || operation.status === 'FAILED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadMutation.mutate(operation.id)}
                              disabled={downloadMutation.isPending}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                          
                          {(operation.status === 'COMPLETED' || operation.status === 'FAILED' || operation.status === 'CANCELLED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(operation.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Operation Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Operation Details
            </DialogTitle>
            <DialogDescription>
              Detailed information and progress for operation {selectedOperationId?.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          {selectedOperation && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="errors">Errors</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Operation Type</Label>
                      <div className="text-sm">{selectedOperation.type.replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="flex items-center gap-2">
                        {React.createElement(getStatusIcon(selectedOperation.status), { 
                          className: `w-4 h-4 ${getStatusColor(selectedOperation.status)} ${selectedOperation.status === 'RUNNING' ? 'animate-spin' : ''}` 
                        })}
                        <span className={getStatusColor(selectedOperation.status)}>
                          {selectedOperation.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <div className="text-sm">{new Date(selectedOperation.createdAt).toLocaleString()}</div>
                    </div>
                    {selectedOperation.completedAt && (
                      <div>
                        <Label className="text-sm font-medium">Completed</Label>
                        <div className="text-sm">{new Date(selectedOperation.completedAt).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Total Records</Label>
                      <div className="text-sm">{selectedOperation.totalRecords || 0}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Processed</Label>
                      <div className="text-sm">{selectedOperation.processedRecords || 0}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Successful</Label>
                      <div className="text-sm text-green-600">{selectedOperation.successfulRecords || 0}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Failed</Label>
                      <div className="text-sm text-red-600">{selectedOperation.failedRecords || 0}</div>
                    </div>
                  </div>
                </div>

                {selectedOperation.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <div className="text-sm text-muted-foreground">{selectedOperation.description}</div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                {progressData ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{Math.round(progressData.progress)}%</span>
                      </div>
                      <Progress value={progressData.progress} className="w-full" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{progressData.totalRecords}</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{progressData.processedRecords}</div>
                          <div className="text-sm text-muted-foreground">Processed</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-green-600">{progressData.successfulRecords}</div>
                          <div className="text-sm text-muted-foreground">Success</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-red-600">{progressData.failedRecords}</div>
                          <div className="text-sm text-muted-foreground">Failed</div>
                        </CardContent>
                      </Card>
                    </div>

                    {progressData.currentStep && (
                      <div>
                        <Label className="text-sm font-medium">Current Step</Label>
                        <div className="text-sm">{progressData.currentStep}</div>
                      </div>
                    )}

                    {progressData.estimatedTimeRemaining && (
                      <div>
                        <Label className="text-sm font-medium">Estimated Time Remaining</Label>
                        <div className="text-sm">{formatEstimatedTime(progressData.estimatedTimeRemaining)}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No progress data available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                {operationErrors && operationErrors.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Operation Errors</h4>
                        <p className="text-sm text-muted-foreground">
                          {operationErrors.length} error(s) found
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowErrorsDialog(true)}
                      >
                        View All Errors
                      </Button>
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Field</TableHead>
                            <TableHead>Error</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {operationErrors.slice(0, 10).map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.row}</TableCell>
                              <TableCell>{error.field || '-'}</TableCell>
                              <TableCell className="text-red-600">{error.message}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {error.value ? String(error.value).substring(0, 30) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {operationErrors.length > 10 && (
                        <div className="p-2 text-center text-sm text-muted-foreground border-t">
                          ... and {operationErrors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No errors found for this operation
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Errors Dialog */}
      <Dialog open={showErrorsDialog} onOpenChange={setShowErrorsDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Operation Errors
            </DialogTitle>
            <DialogDescription>
              Complete list of errors for operation {selectedOperationId?.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          {operationErrors && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {operationErrors.length} error(s)
              </div>
              
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Error Message</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operationErrors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell>{error.field || '-'}</TableCell>
                        <TableCell className="text-red-600">{error.message}</TableCell>
                        <TableCell className="font-mono text-xs max-w-32 truncate">
                          {error.value ? String(error.value) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
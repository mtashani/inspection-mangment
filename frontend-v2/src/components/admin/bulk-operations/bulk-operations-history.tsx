'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  History, 
  Calendar, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  FileText,
  AlertTriangle,
  RotateCcw,
  Search
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'

import { 
  getBulkOperations,
  getBulkOperationById,
  deleteBulkOperation,
  downloadBulkOperationResult,
  retryBulkOperation
} from '@/lib/api/admin/bulk-operations'

interface HistoryFilters {
  status: string
  type: string
  dateRange: {
    start?: Date
    end?: Date
  }
  createdBy?: string
  searchTerm: string
}

export function BulkOperationsHistory() {
  const [filters, setFilters] = useState<HistoryFilters>({
    status: 'ALL',
    type: 'ALL',
    dateRange: {},
    searchTerm: ''
  })
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedOperations, setSelectedOperations] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const queryClient = useQueryClient()

  // Get operations with pagination and filters
  const { data: operations, isLoading } = useQuery({
    queryKey: ['bulk-operations-history', currentPage, pageSize, filters],
    queryFn: () => getBulkOperations(currentPage, pageSize, {
      status: filters.status !== 'ALL' ? filters.status : undefined,
      type: filters.type !== 'ALL' ? filters.type : undefined,
      createdBy: filters.createdBy,
      startDate: filters.dateRange.start?.toISOString(),
      endDate: filters.dateRange.end?.toISOString(),
      search: filters.searchTerm || undefined
    }),
  })

  // Get selected operation details
  const { data: selectedOperation } = useQuery({
    queryKey: ['bulk-operation-details', selectedOperationId],
    queryFn: () => selectedOperationId ? getBulkOperationById(selectedOperationId) : null,
    enabled: !!selectedOperationId,
  })

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (operationId: string) => deleteBulkOperation(operationId),
    onSuccess: () => {
      toast.success('Operation deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['bulk-operations-history'] })
      setSelectedOperations(prev => prev.filter(id => id !== selectedOperationId))
    },
    onError: (error) => {
      toast.error(`Failed to delete operation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (operationIds: string[]) => {
      await Promise.all(operationIds.map(id => deleteBulkOperation(id)))
    },
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedOperations.length} operations`)
      queryClient.invalidateQueries({ queryKey: ['bulk-operations-history'] })
      setSelectedOperations([])
    },
    onError: (error) => {
      toast.error(`Failed to delete operations: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  const retryMutation = useMutation({
    mutationFn: (operationId: string) => retryBulkOperation(operationId),
    onSuccess: () => {
      toast.success('Operation retry started')
      queryClient.invalidateQueries({ queryKey: ['bulk-operations-history'] })
    },
    onError: (error) => {
      toast.error(`Failed to retry operation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return CheckCircle
      case 'FAILED': return XCircle
      case 'CANCELLED': return XCircle
      case 'RUNNING': return Clock
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600'
      case 'FAILED': return 'text-red-600'
      case 'CANCELLED': return 'text-gray-600'
      case 'RUNNING': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    if (type.includes('INSPECTOR')) return Users
    if (type.includes('ATTENDANCE')) return Calendar
    if (type.includes('TEMPLATE')) return FileText
    return History
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOperations(operations?.data.map(op => op.id) || [])
    } else {
      setSelectedOperations([])
    }
  }

  const handleSelectOperation = (operationId: string, checked: boolean) => {
    if (checked) {
      setSelectedOperations(prev => [...prev, operationId])
    } else {
      setSelectedOperations(prev => prev.filter(id => id !== operationId))
    }
  }

  const handleBulkDelete = () => {
    if (selectedOperations.length === 0) {
      toast.error('Please select operations to delete')
      return
    }
    
    if (confirm(`Are you sure you want to delete ${selectedOperations.length} operations? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedOperations)
    }
  }

  const clearFilters = () => {
    setFilters({
      status: 'ALL',
      type: 'ALL',
      dateRange: {},
      searchTerm: ''
    })
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Filter and search through operation history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="RUNNING">Running</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Operation Type</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
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
              <Label>Start Date</Label>
              <DatePicker
                date={filters.dateRange.start}
                onSelect={(date) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, start: date || undefined }
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker
                date={filters.dateRange.end}
                onSelect={(date) => setFilters(prev => ({ 
                  ...prev, 
                  dateRange: { ...prev.dateRange, end: date || undefined }
                }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search operations..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOperations.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedOperations.length} selected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Bulk actions available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operations History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Operations History
          </CardTitle>
          <CardDescription>
            Complete history of all bulk operations with detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !operations?.data.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No operations found matching your filters
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOperations.length === operations.data.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.data.map((operation) => {
                    const StatusIcon = getStatusIcon(operation.status)
                    const TypeIcon = getTypeIcon(operation.type)
                    const statusColor = getStatusColor(operation.status)
                    const isSelected = selectedOperations.includes(operation.id)
                    
                    return (
                      <TableRow key={operation.id} className={isSelected ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOperation(operation.id, !!checked)}
                          />
                        </TableCell>
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
                            <StatusIcon className="w-3 h-3" />
                            {operation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{operation.totalRecords || 0} total</div>
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
                          <div className="text-sm">
                            {new Date(operation.createdAt).toLocaleDateString()}
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

              {/* Pagination */}
              {operations.pagination && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, operations.pagination.total)} of {operations.pagination.total} operations
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {operations.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(operations.pagination.totalPages, prev + 1))}
                      disabled={currentPage === operations.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Operation Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 w-5" />
              Operation Details
            </DialogTitle>
            <DialogDescription>
              Detailed information for operation {selectedOperationId?.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          {selectedOperation && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Operation ID</Label>
                    <div className="text-sm font-mono">{selectedOperation.id}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <div className="text-sm">{selectedOperation.type.replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-2">
                      {React.createElement(getStatusIcon(selectedOperation.status), { 
                        className: `w-4 h-4 ${getStatusColor(selectedOperation.status)}` 
                      })}
                      <span className={getStatusColor(selectedOperation.status)}>
                        {selectedOperation.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created By</Label>
                    <div className="text-sm">{selectedOperation.createdBy || 'System'}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Total Records</Label>
                    <div className="text-sm">{selectedOperation.totalRecords || 0}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Successful</Label>
                    <div className="text-sm text-green-600">{selectedOperation.successfulRecords || 0}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Failed</Label>
                    <div className="text-sm text-red-600">{selectedOperation.failedRecords || 0}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <div className="text-sm">
                      {formatDuration(selectedOperation.createdAt, selectedOperation.completedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <div className="text-sm">{new Date(selectedOperation.createdAt).toLocaleString()}</div>
                </div>
                {selectedOperation.completedAt && (
                  <div>
                    <Label className="text-sm font-medium">Completed At</Label>
                    <div className="text-sm">{new Date(selectedOperation.completedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedOperation.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    {selectedOperation.description}
                  </div>
                </div>
              )}

              {/* Error Summary */}
              {selectedOperation.status === 'FAILED' && selectedOperation.failedRecords > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Operation Failed</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {selectedOperation.failedRecords} out of {selectedOperation.totalRecords} records failed to process.
                    You can download the error report or retry the operation.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t">
                {(selectedOperation.status === 'COMPLETED' || selectedOperation.status === 'FAILED') && (
                  <Button
                    variant="outline"
                    onClick={() => downloadMutation.mutate(selectedOperation.id)}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Result
                  </Button>
                )}
                
                {selectedOperation.status === 'FAILED' && (
                  <Button
                    variant="outline"
                    onClick={() => retryMutation.mutate(selectedOperation.id)}
                    disabled={retryMutation.isPending}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry Operation
                  </Button>
                )}
                
                {(selectedOperation.status === 'COMPLETED' || selectedOperation.status === 'FAILED' || selectedOperation.status === 'CANCELLED') && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this operation? This action cannot be undone.')) {
                        deleteMutation.mutate(selectedOperation.id)
                        setShowDetailsDialog(false)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Operation
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
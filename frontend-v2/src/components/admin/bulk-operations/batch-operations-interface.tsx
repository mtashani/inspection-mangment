'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Settings, 
  Users, 
  Calendar, 
  Template, 
  Play, 
  Pause, 
  Square,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Filter,
  Edit,
  Trash2,
  Copy,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DatePicker } from '@/components/ui/date-picker'

import { 
  bulkUpdateInspectors,
  bulkDeleteInspectors,
  bulkUpdateAttendance,
  getBulkOperations,
  cancelBulkOperation
} from '@/lib/api/admin/bulk-operations'
import { getInspectors } from '@/lib/api/admin/inspectors'
import React from 'react'

type BatchOperationType = 'INSPECTOR_UPDATE' | 'INSPECTOR_DELETE' | 'ATTENDANCE_UPDATE' | 'STATUS_CHANGE'

interface BatchOperation {
  id: string
  type: BatchOperationType
  name: string
  description: string
  targetCount: number
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  scheduledAt?: string
  createdAt: string
  completedAt?: string
  progress?: number
}

interface InspectorBatchUpdate {
  inspectorIds: number[]
  updates: {
    active?: boolean
    canLogin?: boolean
    attendanceTrackingEnabled?: boolean
    inspectorType?: string
    specialties?: string[]
    baseHourlyRate?: number
    overtimeMultiplier?: number
  }
}

interface AttendanceBatchUpdate {
  dateRange: {
    start: string
    end: string
  }
  inspectorIds: number[]
  updates: {
    status?: string
    workHours?: number
    overtimeHours?: number
    notes?: string
  }
}

interface BatchOperationConfig {
  type: BatchOperationType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const BATCH_OPERATION_CONFIGS: Record<BatchOperationType, BatchOperationConfig> = {
  INSPECTOR_UPDATE: {
    type: 'INSPECTOR_UPDATE',
    name: 'Update Inspectors',
    description: 'Bulk update inspector information and settings',
    icon: Users,
    color: 'blue'
  },
  INSPECTOR_DELETE: {
    type: 'INSPECTOR_DELETE',
    name: 'Delete Inspectors',
    description: 'Bulk delete selected inspectors',
    icon: Trash2,
    color: 'red'
  },
  ATTENDANCE_UPDATE: {
    type: 'ATTENDANCE_UPDATE',
    name: 'Update Attendance',
    description: 'Bulk update attendance records for date ranges',
    icon: Calendar,
    color: 'green'
  },
  STATUS_CHANGE: {
    type: 'STATUS_CHANGE',
    name: 'Change Status',
    description: 'Bulk change inspector or record status',
    icon: Settings,
    color: 'orange'
  }
}

export function BatchOperationsInterface() {
  const [selectedOperation, setSelectedOperation] = useState<BatchOperationType | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [inspectorBatchConfig, setInspectorBatchConfig] = useState<InspectorBatchUpdate>({
    inspectorIds: [],
    updates: {}
  })
  const [attendanceBatchConfig, setAttendanceBatchConfig] = useState<AttendanceBatchUpdate>({
    dateRange: { start: '', end: '' },
    inspectorIds: [],
    updates: {}
  })
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>()
  const [selectedInspectors, setSelectedInspectors] = useState<number[]>([])

  const queryClient = useQueryClient()

  // Get inspectors for selection
  const { data: inspectors } = useQuery({
    queryKey: ['inspectors'],
    queryFn: () => getInspectors(1, 1000), // Get all for selection
  })

  // Get batch operations
  const { data: batchOperations, isLoading: operationsLoading } = useQuery({
    queryKey: ['batch-operations'],
    queryFn: () => getBulkOperations(1, 50),
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  // Mutations
  const inspectorUpdateMutation = useMutation({
    mutationFn: ({ inspectorIds, updates }: { inspectorIds: number[], updates: Record<string, unknown> }) =>
      bulkUpdateInspectors(inspectorIds, updates),
    onSuccess: () => {
      toast.success('Batch inspector update started')
      queryClient.invalidateQueries({ queryKey: ['batch-operations'] })
      setShowConfigDialog(false)
    },
    onError: (error) => {
      toast.error(`Failed to start batch update: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const inspectorDeleteMutation = useMutation({
    mutationFn: (inspectorIds: number[]) => bulkDeleteInspectors(inspectorIds),
    onSuccess: () => {
      toast.success('Batch inspector deletion started')
      queryClient.invalidateQueries({ queryKey: ['batch-operations'] })
      setShowConfigDialog(false)
    },
    onError: (error) => {
      toast.error(`Failed to start batch deletion: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const attendanceUpdateMutation = useMutation({
    mutationFn: (records: Array<{ id?: number, inspectorId: number, date: string, status: string, workHours: number, overtimeHours?: number }>) =>
      bulkUpdateAttendance(records),
    onSuccess: () => {
      toast.success('Batch attendance update started')
      queryClient.invalidateQueries({ queryKey: ['batch-operations'] })
      setShowConfigDialog(false)
    },
    onError: (error) => {
      toast.error(`Failed to start batch attendance update: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const cancelOperationMutation = useMutation({
    mutationFn: (operationId: string) => cancelBulkOperation(operationId),
    onSuccess: () => {
      toast.success('Operation cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['batch-operations'] })
    },
    onError: (error) => {
      toast.error(`Failed to cancel operation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  const handleStartOperation = (type: BatchOperationType) => {
    setSelectedOperation(type)
    setShowConfigDialog(true)
  }

  const handleExecuteOperation = () => {
    if (!selectedOperation) return

    switch (selectedOperation) {
      case 'INSPECTOR_UPDATE':
        inspectorUpdateMutation.mutate({
          inspectorIds: inspectorBatchConfig.inspectorIds,
          updates: inspectorBatchConfig.updates
        })
        break
      case 'INSPECTOR_DELETE':
        inspectorDeleteMutation.mutate(inspectorBatchConfig.inspectorIds)
        break
      case 'ATTENDANCE_UPDATE':
        // Generate attendance records for the date range and selected inspectors
        const records = generateAttendanceRecords(attendanceBatchConfig)
        attendanceUpdateMutation.mutate(records)
        break
    }
  }

  const generateAttendanceRecords = (config: AttendanceBatchUpdate) => {
    const records: Array<{ inspectorId: number, date: string, status: string, workHours: number, overtimeHours?: number }> = []
    
    const startDate = new Date(config.dateRange.start)
    const endDate = new Date(config.dateRange.end)
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      config.inspectorIds.forEach(inspectorId => {
        records.push({
          inspectorId,
          date: date.toISOString().split('T')[0],
          status: config.updates.status || 'WORKING',
          workHours: config.updates.workHours || 8,
          overtimeHours: config.updates.overtimeHours || 0
        })
      })
    }
    
    return records
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default'
      case 'RUNNING': return 'secondary'
      case 'FAILED': return 'destructive'
      case 'CANCELLED': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return CheckCircle
      case 'RUNNING': return Loader2
      case 'FAILED': return AlertTriangle
      case 'CANCELLED': return Square
      default: return Clock
    }
  }

  const isLoading = inspectorUpdateMutation.isPending || 
                   inspectorDeleteMutation.isPending || 
                   attendanceUpdateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Operation Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(BATCH_OPERATION_CONFIGS).map((config) => {
          const IconComponent = config.icon
          return (
            <Card key={config.type} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconComponent className={`h-5 w-5 text-${config.color}-600`} />
                  {config.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {config.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleStartOperation(config.type)}
                  className="w-full"
                  variant="outline"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Operation
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Active Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Batch Operations Queue
          </CardTitle>
          <CardDescription>
            Monitor and manage running batch operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {operationsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : batchOperations?.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No batch operations found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchOperations?.data.map((operation) => {
                  const StatusIcon = getStatusIcon(operation.status)
                  return (
                    <TableRow key={operation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{operation.type.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {operation.targetCount} items
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(operation.status)} className="flex items-center gap-1 w-fit">
                          <StatusIcon className={`w-3 h-3 ${operation.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                          {operation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {operation.progress !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${operation.progress}%` }}
                              />
                            </div>
                            <span className="text-sm">{Math.round(operation.progress)}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(operation.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {operation.status === 'RUNNING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelOperationMutation.mutate(operation.id)}
                              disabled={cancelOperationMutation.isPending}
                            >
                              <Pause className="w-3 h-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="w-3 h-3" />
                          </Button>
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

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOperation && (
                <>
                  {React.createElement(BATCH_OPERATION_CONFIGS[selectedOperation].icon, { className: "w-5 h-5" })}
                  Configure {BATCH_OPERATION_CONFIGS[selectedOperation].name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedOperation && BATCH_OPERATION_CONFIGS[selectedOperation].description}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="selection" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="selection">Selection</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="selection" className="space-y-4">
              {/* Inspector Selection */}
              <div className="space-y-3">
                <Label>Select Inspectors</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Checkbox
                        checked={selectedInspectors.length === inspectors?.data.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedInspectors(inspectors?.data.map(i => i.id) || [])
                          } else {
                            setSelectedInspectors([])
                          }
                        }}
                      />
                      <Label className="text-sm font-medium">Select All ({inspectors?.data.length || 0})</Label>
                    </div>
                    {inspectors?.data.map((inspector) => (
                      <div key={inspector.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedInspectors.includes(inspector.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedInspectors(prev => [...prev, inspector.id])
                            } else {
                              setSelectedInspectors(prev => prev.filter(id => id !== inspector.id))
                            }
                          }}
                        />
                        <Label className="text-sm">
                          {inspector.name} ({inspector.employeeId})
                        </Label>
                        <div className="flex gap-1 ml-auto">
                          {inspector.specialties.map(specialty => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedInspectors.length} inspector(s) selected
                </div>
              </div>
            </TabsContent>

            <TabsContent value="configuration" className="space-y-4">
              {selectedOperation === 'INSPECTOR_UPDATE' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Update Fields</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="update-active"
                        checked={inspectorBatchConfig.updates.active === true}
                        onCheckedChange={(checked) => 
                          setInspectorBatchConfig(prev => ({
                            ...prev,
                            updates: { ...prev.updates, active: checked ? true : undefined }
                          }))
                        }
                      />
                      <Label htmlFor="update-active">Set as Active</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="update-login"
                        checked={inspectorBatchConfig.updates.canLogin === true}
                        onCheckedChange={(checked) => 
                          setInspectorBatchConfig(prev => ({
                            ...prev,
                            updates: { ...prev.updates, canLogin: checked ? true : undefined }
                          }))
                        }
                      />
                      <Label htmlFor="update-login">Enable Login</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="update-attendance"
                        checked={inspectorBatchConfig.updates.attendanceTrackingEnabled === true}
                        onCheckedChange={(checked) => 
                          setInspectorBatchConfig(prev => ({
                            ...prev,
                            updates: { ...prev.updates, attendanceTrackingEnabled: checked ? true : undefined }
                          }))
                        }
                      />
                      <Label htmlFor="update-attendance">Enable Attendance Tracking</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inspector-type">Inspector Type</Label>
                    <Select 
                      value={inspectorBatchConfig.updates.inspectorType || ''} 
                      onValueChange={(value) => 
                        setInspectorBatchConfig(prev => ({
                          ...prev,
                          updates: { ...prev.updates, inspectorType: value || undefined }
                        }))
                      }
                    >
                      <SelectTrigger id="inspector-type">
                        <SelectValue placeholder="Select inspector type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No change</SelectItem>
                        <SelectItem value="INTERNAL">Internal</SelectItem>
                        <SelectItem value="EXTERNAL">External</SelectItem>
                        <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourly-rate">Base Hourly Rate</Label>
                      <Input
                        id="hourly-rate"
                        type="number"
                        placeholder="Leave empty for no change"
                        value={inspectorBatchConfig.updates.baseHourlyRate || ''}
                        onChange={(e) => 
                          setInspectorBatchConfig(prev => ({
                            ...prev,
                            updates: { 
                              ...prev.updates, 
                              baseHourlyRate: e.target.value ? parseFloat(e.target.value) : undefined 
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overtime-multiplier">Overtime Multiplier</Label>
                      <Input
                        id="overtime-multiplier"
                        type="number"
                        step="0.1"
                        placeholder="Leave empty for no change"
                        value={inspectorBatchConfig.updates.overtimeMultiplier || ''}
                        onChange={(e) => 
                          setInspectorBatchConfig(prev => ({
                            ...prev,
                            updates: { 
                              ...prev.updates, 
                              overtimeMultiplier: e.target.value ? parseFloat(e.target.value) : undefined 
                            }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedOperation === 'ATTENDANCE_UPDATE' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Attendance Configuration</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <DatePicker
                        date={attendanceBatchConfig.dateRange.start ? new Date(attendanceBatchConfig.dateRange.start) : undefined}
                        onSelect={(date) => 
                          setAttendanceBatchConfig(prev => ({
                            ...prev,
                            dateRange: { 
                              ...prev.dateRange, 
                              start: date ? date.toISOString().split('T')[0] : '' 
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <DatePicker
                        date={attendanceBatchConfig.dateRange.end ? new Date(attendanceBatchConfig.dateRange.end) : undefined}
                        onSelect={(date) => 
                          setAttendanceBatchConfig(prev => ({
                            ...prev,
                            dateRange: { 
                              ...prev.dateRange, 
                              end: date ? date.toISOString().split('T')[0] : '' 
                            }
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendance-status">Status</Label>
                    <Select 
                      value={attendanceBatchConfig.updates.status || ''} 
                      onValueChange={(value) => 
                        setAttendanceBatchConfig(prev => ({
                          ...prev,
                          updates: { ...prev.updates, status: value }
                        }))
                      }
                    >
                      <SelectTrigger id="attendance-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WORKING">Working</SelectItem>
                        <SelectItem value="RESTING">Resting</SelectItem>
                        <SelectItem value="OVERTIME">Overtime</SelectItem>
                        <SelectItem value="ABSENT">Absent</SelectItem>
                        <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                        <SelectItem value="VACATION">Vacation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="work-hours">Work Hours</Label>
                      <Input
                        id="work-hours"
                        type="number"
                        min="0"
                        max="24"
                        value={attendanceBatchConfig.updates.workHours || ''}
                        onChange={(e) => 
                          setAttendanceBatchConfig(prev => ({
                            ...prev,
                            updates: { 
                              ...prev.updates, 
                              workHours: e.target.value ? parseFloat(e.target.value) : undefined 
                            }
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overtime-hours">Overtime Hours</Label>
                      <Input
                        id="overtime-hours"
                        type="number"
                        min="0"
                        max="24"
                        value={attendanceBatchConfig.updates.overtimeHours || ''}
                        onChange={(e) => 
                          setAttendanceBatchConfig(prev => ({
                            ...prev,
                            updates: { 
                              ...prev.updates, 
                              overtimeHours: e.target.value ? parseFloat(e.target.value) : undefined 
                            }
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendance-notes">Notes</Label>
                    <Textarea
                      id="attendance-notes"
                      placeholder="Optional notes for attendance records"
                      value={attendanceBatchConfig.updates.notes || ''}
                      onChange={(e) => 
                        setAttendanceBatchConfig(prev => ({
                          ...prev,
                          updates: { ...prev.updates, notes: e.target.value }
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {selectedOperation === 'INSPECTOR_DELETE' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Warning: Permanent Deletion</span>
                    </div>
                    <p className="text-sm text-red-700">
                      This action will permanently delete {selectedInspectors.length} inspector(s) and all their associated data including:
                    </p>
                    <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                      <li>Personal information and settings</li>
                      <li>Attendance records</li>
                      <li>Inspection reports</li>
                      <li>Payroll data</li>
                    </ul>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Update the config with selected inspectors
                if (selectedOperation === 'INSPECTOR_UPDATE' || selectedOperation === 'INSPECTOR_DELETE') {
                  setInspectorBatchConfig(prev => ({ ...prev, inspectorIds: selectedInspectors }))
                } else if (selectedOperation === 'ATTENDANCE_UPDATE') {
                  setAttendanceBatchConfig(prev => ({ ...prev, inspectorIds: selectedInspectors }))
                }
                handleExecuteOperation()
              }}
              disabled={selectedInspectors.length === 0 || isLoading}
              variant={selectedOperation === 'INSPECTOR_DELETE' ? 'destructive' : 'default'}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Execute Operation ({selectedInspectors.length} items)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
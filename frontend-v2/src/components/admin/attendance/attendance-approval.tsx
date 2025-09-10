'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  X, 
  Clock,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Eye,
  MessageSquare
} from 'lucide-react'
import { AttendanceStatus, Inspector } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface AttendanceApprovalProps {
  pendingApprovals: PendingApproval[]
  onApprove: (id: string, comments?: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
  loading?: boolean
  className?: string
}

interface PendingApproval {
  id: string
  inspectorId: number
  inspector: Pick<Inspector, 'id' | 'name' | 'employeeId'>
  date: string
  originalStatus: AttendanceStatus
  newStatus: AttendanceStatus
  originalWorkHours: number
  newWorkHours: number
  originalOvertimeHours: number
  newOvertimeHours: number
  reason: string
  notes?: string
  requestedBy: string
  requestedAt: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  type: 'OVERRIDE' | 'ADJUSTMENT' | 'CORRECTION'
}

const APPROVAL_PRIORITIES = {
  LOW: { label: 'Low', color: 'bg-gray-500' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-500' },
  HIGH: { label: 'High', color: 'bg-red-500' }
}

const APPROVAL_TYPES = {
  OVERRIDE: { label: 'Override', icon: AlertTriangle, color: 'text-orange-600' },
  ADJUSTMENT: { label: 'Adjustment', icon: Clock, color: 'text-blue-600' },
  CORRECTION: { label: 'Correction', icon: FileText, color: 'text-green-600' }
}

const ATTENDANCE_STATUS_CONFIG = {
  WORKING: { label: 'Working', color: 'bg-green-500' },
  RESTING: { label: 'Resting', color: 'bg-blue-500' },
  OVERTIME: { label: 'Overtime', color: 'bg-orange-500' },
  ABSENT: { label: 'Absent', color: 'bg-red-500' },
  SICK_LEAVE: { label: 'Sick Leave', color: 'bg-purple-500' },
  VACATION: { label: 'Vacation', color: 'bg-yellow-500' }
}

export function AttendanceApproval({
  pendingApprovals,
  onApprove,
  onReject,
  loading = false,
  className
}: AttendanceApprovalProps) {
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [approvalComments, setApprovalComments] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  // Mock data - in real implementation, this would come from API
  const mockPendingApprovals: PendingApproval[] = [
    {
      id: '1',
      inspectorId: 1,
      inspector: { id: 1, name: 'John Doe', employeeId: 'EMP001' },
      date: '2024-01-15',
      originalStatus: 'WORKING',
      newStatus: 'OVERTIME',
      originalWorkHours: 8,
      newWorkHours: 8,
      originalOvertimeHours: 0,
      newOvertimeHours: 4,
      reason: 'Emergency maintenance work',
      notes: 'Critical equipment failure required immediate attention',
      requestedBy: 'Supervisor Smith',
      requestedAt: '2024-01-15T14:30:00Z',
      priority: 'HIGH',
      type: 'OVERRIDE'
    },
    {
      id: '2',
      inspectorId: 2,
      inspector: { id: 2, name: 'Jane Smith', employeeId: 'EMP002' },
      date: '2024-01-14',
      originalStatus: 'ABSENT',
      newStatus: 'SICK_LEAVE',
      originalWorkHours: 0,
      newWorkHours: 0,
      originalOvertimeHours: 0,
      newOvertimeHours: 0,
      reason: 'Sick leave documentation received',
      notes: 'Medical certificate provided for flu symptoms',
      requestedBy: 'HR Manager',
      requestedAt: '2024-01-14T09:15:00Z',
      priority: 'MEDIUM',
      type: 'CORRECTION'
    }
  ]

  const handleApprove = async (approval: PendingApproval) => {
    try {
      await onApprove(approval.id, approvalComments)
      setApprovalComments('')
      setSelectedApproval(null)
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleReject = async (approval: PendingApproval) => {
    if (!rejectionReason.trim()) return
    
    try {
      await onReject(approval.id, rejectionReason)
      setRejectionReason('')
      setSelectedApproval(null)
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  const getStatusConfig = (status: AttendanceStatus) => {
    return ATTENDANCE_STATUS_CONFIG[status] || ATTENDANCE_STATUS_CONFIG.ABSENT
  }

  const getPriorityConfig = (priority: PendingApproval['priority']) => {
    return APPROVAL_PRIORITIES[priority]
  }

  const getTypeConfig = (type: PendingApproval['type']) => {
    return APPROVAL_TYPES[type]
  }

  const approvals = pendingApprovals.length > 0 ? pendingApprovals : mockPendingApprovals

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve pending attendance overrides and adjustments
          </p>
        </div>
        
        <Badge variant="secondary" className="text-sm">
          {approvals.length} Pending
        </Badge>
      </div>

      {approvals.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-medium">No Pending Approvals</h3>
              <p className="text-muted-foreground">
                All attendance records are up to date
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending ({approvals.length})</TabsTrigger>
            <TabsTrigger value="high-priority">
              High Priority ({approvals.filter(a => a.priority === 'HIGH').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {approvals.map((approval) => {
              const TypeIcon = getTypeConfig(approval.type).icon;
              
              return (
              <Card key={approval.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{approval.inspector.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {approval.inspector.employeeId} • {format(new Date(approval.date), 'PPP')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={cn('text-white', getPriorityConfig(approval.priority).color)}
                      >
                        {getPriorityConfig(approval.priority).label}
                      </Badge>
                      
                      <Badge variant="outline" className={getTypeConfig(approval.type).color}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {getTypeConfig(approval.type).label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Change Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Status Change</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <div className={cn('w-3 h-3 rounded', getStatusConfig(approval.originalStatus).color)} />
                          <span className="text-sm">{getStatusConfig(approval.originalStatus).label}</span>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex items-center gap-1">
                          <div className={cn('w-3 h-3 rounded', getStatusConfig(approval.newStatus).color)} />
                          <span className="text-sm font-medium">{getStatusConfig(approval.newStatus).label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">Work Hours</p>
                      <p className="text-sm mt-1">
                        {approval.originalWorkHours}h → <span className="font-medium">{approval.newWorkHours}h</span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground">Overtime Hours</p>
                      <p className="text-sm mt-1">
                        {approval.originalOvertimeHours}h → <span className="font-medium">{approval.newOvertimeHours}h</span>
                      </p>
                    </div>
                  </div>

                  {/* Reason and Notes */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">{approval.reason}</p>
                    </div>
                    
                    {approval.notes && (
                      <div>
                        <p className="text-sm font-medium">Notes:</p>
                        <p className="text-sm text-muted-foreground">{approval.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Request Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Requested by {approval.requestedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(approval.requestedAt), 'PPp')}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetails(showDetails === approval.id ? null : approval.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showDetails === approval.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval)
                          setRejectionReason('')
                        }}
                        disabled={loading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval)
                          setApprovalComments('')
                        }}
                        disabled={loading}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {showDetails === approval.id && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/25">
                      <h4 className="font-medium mb-3">Detailed Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Original Record:</p>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>Status: {getStatusConfig(approval.originalStatus).label}</li>
                            <li>Work Hours: {approval.originalWorkHours}</li>
                            <li>Overtime: {approval.originalOvertimeHours}</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium">Proposed Changes:</p>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            <li>Status: {getStatusConfig(approval.newStatus).label}</li>
                            <li>Work Hours: {approval.newWorkHours}</li>
                            <li>Overtime: {approval.newOvertimeHours}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="high-priority" className="space-y-4">
            {approvals
              .filter(approval => approval.priority === 'HIGH')
              .map((approval) => (
                <Card key={approval.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium">
                            High Priority: {approval.inspector.name} - {format(new Date(approval.date), 'PPP')}
                          </p>
                          <p>{approval.reason}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button size="sm" onClick={() => setSelectedApproval(approval)}>
                              Review Now
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Approval/Rejection Dialog */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {rejectionReason !== '' ? (
                  <>
                    <X className="w-5 h-5 text-red-500" />
                    Reject Approval Request
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Approve Attendance Change
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedApproval.inspector.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedApproval.date), 'PPP')} • {selectedApproval.reason}
                </p>
              </div>

              {rejectionReason !== '' ? (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Please provide a reason for rejecting this request..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="approval-comments">Approval Comments (Optional)</Label>
                  <Textarea
                    id="approval-comments"
                    placeholder="Add any comments or notes about this approval..."
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                {rejectionReason !== '' ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedApproval)}
                      disabled={loading || !rejectionReason.trim()}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject Request
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectionReason('')
                        setSelectedApproval(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleApprove(selectedApproval)}
                      disabled={loading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRejectionReason('temp')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedApproval(null)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
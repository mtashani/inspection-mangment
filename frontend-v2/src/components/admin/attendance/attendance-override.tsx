'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Edit2, 
  Calendar as CalendarIcon, 
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  History,
  User,
  FileText
} from 'lucide-react'
import { AttendanceRecord, AttendanceStatus, Inspector } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface AttendanceOverrideProps {
  inspector: Inspector
  attendanceRecord?: AttendanceRecord
  onOverride: (data: OverrideData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  className?: string
}

interface OverrideData {
  date: string
  status: AttendanceStatus
  workHours: number
  overtimeHours: number
  reason: string
  notes?: string
  requiresApproval?: boolean
}

interface AuditEntry {
  id: string
  timestamp: string
  userId: number
  userName: string
  action: 'CREATE' | 'UPDATE' | 'OVERRIDE' | 'APPROVE' | 'REJECT'
  previousValue?: Partial<AttendanceRecord>
  newValue: Partial<AttendanceRecord>
  reason: string
  approvedBy?: string
  approvedAt?: string
}

const OVERRIDE_REASONS = [
  'Sick leave documentation received',
  'Emergency leave approved',
  'Training attendance',
  'Administrative correction',
  'System error correction',
  'Late clock-in/out adjustment',
  'Holiday work compensation',
  'Other (specify in notes)'
]

const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'WORKING', label: 'Working', color: 'bg-green-500' },
  { value: 'RESTING', label: 'Resting', color: 'bg-blue-500' },
  { value: 'OVERTIME', label: 'Overtime', color: 'bg-orange-500' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-500' },
  { value: 'SICK_LEAVE', label: 'Sick Leave', color: 'bg-purple-500' },
  { value: 'VACATION', label: 'Vacation', color: 'bg-yellow-500' }
]

export function AttendanceOverride({
  inspector,
  attendanceRecord,
  onOverride,
  onCancel,
  loading = false,
  className
}: AttendanceOverrideProps) {
  const [formData, setFormData] = useState<OverrideData>({
    date: attendanceRecord?.date || new Date().toISOString().split('T')[0],
    status: attendanceRecord?.status || 'WORKING',
    workHours: attendanceRecord?.workHours || 8,
    overtimeHours: attendanceRecord?.overtimeHours || 0,
    reason: '',
    notes: attendanceRecord?.notes || '',
    requiresApproval: false
  })
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(
    attendanceRecord ? new Date(attendanceRecord.date) : new Date()
  )

  // Mock audit trail data - in real implementation, this would come from API
  const mockAuditTrail: AuditEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      userId: 1,
      userName: 'Admin User',
      action: 'CREATE',
      newValue: {
        status: 'WORKING',
        workHours: 8,
        overtimeHours: 0
      },
      reason: 'Initial attendance record'
    },
    {
      id: '2',
      timestamp: '2024-01-15T14:45:00Z',
      userId: 2,
      userName: 'Supervisor',
      action: 'OVERRIDE',
      previousValue: {
        status: 'WORKING',
        workHours: 8
      },
      newValue: {
        status: 'OVERTIME',
        workHours: 8,
        overtimeHours: 4
      },
      reason: 'Emergency maintenance work',
      approvedBy: 'Manager',
      approvedAt: '2024-01-15T15:00:00Z'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.reason) {
      return
    }

    try {
      await onOverride(formData)
    } catch (error) {
      console.error('Failed to override attendance:', error)
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setFormData(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0]
      }))
    }
  }

  const getStatusConfig = (status: AttendanceStatus) => {
    return ATTENDANCE_STATUS_OPTIONS.find(option => option.value === status) || ATTENDANCE_STATUS_OPTIONS[0]
  }

  const getActionIcon = (action: AuditEntry['action']) => {
    switch (action) {
      case 'CREATE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'UPDATE':
        return <Edit2 className="w-4 h-4 text-blue-500" />
      case 'OVERRIDE':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'APPROVE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'REJECT':
        return <X className="w-4 h-4 text-red-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const requiresApproval = formData.status === 'OVERTIME' || 
                          (attendanceRecord && attendanceRecord.status !== formData.status)

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Attendance Override
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Dialog open={showAuditTrail} onOpenChange={setShowAuditTrail}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="w-4 h-4 mr-2" />
                    Audit Trail
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Attendance Audit Trail</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {mockAuditTrail.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getActionIcon(entry.action)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{entry.action}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.timestamp), 'PPp')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{entry.reason}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{entry.userName}</span>
                            {entry.approvedBy && (
                              <>
                                <span>•</span>
                                <span>Approved by {entry.approvedBy}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Inspector Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{inspector.name}</p>
                <p className="text-sm text-muted-foreground">
                  {inspector.employeeId}
                </p>
              </div>
            </div>

            {/* Current Record Info */}
            {attendanceRecord && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p>Current record: <strong>{getStatusConfig(attendanceRecord.status).label}</strong></p>
                    <p>Work Hours: {attendanceRecord.workHours}h • Overtime: {attendanceRecord.overtimeHours}h</p>
                    {attendanceRecord.isOverride && (
                      <p className="text-orange-600">
                        This record was previously overridden: {attendanceRecord.overrideReason}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Attendance Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: AttendanceStatus) =>
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn('w-3 h-3 rounded', option.color)} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
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
                      step="0.5"
                      value={formData.workHours}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          workHours: parseFloat(e.target.value) || 0
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
                      step="0.5"
                      value={formData.overtimeHours}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          overtimeHours: parseFloat(e.target.value) || 0
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Override Reason *</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, reason: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {OVERRIDE_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Provide additional context or documentation..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, notes: e.target.value }))
                    }
                    rows={4}
                  />
                </div>

                {requiresApproval && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This override requires supervisor approval due to overtime hours or status change.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Override Summary</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(selectedDate, 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded', getStatusConfig(formData.status).color)} />
                    <span className="font-medium">{getStatusConfig(formData.status).label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="font-medium">
                    {formData.workHours}h work
                    {formData.overtimeHours > 0 && ` + ${formData.overtimeHours}h overtime`}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading || !formData.reason}>
                <Save className="w-4 h-4 mr-2" />
                {requiresApproval ? 'Submit for Approval' : 'Apply Override'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {requiresApproval && (
                <Badge variant="secondary" className="ml-auto">
                  <Clock className="w-3 h-3 mr-1" />
                  Requires Approval
                </Badge>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
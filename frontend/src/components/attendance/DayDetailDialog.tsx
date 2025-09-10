'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Moon, Phone, Save, X } from 'lucide-react'
import { AttendanceStatus } from './AttendanceCalendar'
import { Inspector } from '@/types/inspector'

export interface DayDetails {
  date: Date
  status: AttendanceStatus
  is_override: boolean
  override_reason?: string
  // New fields for payroll calculation
  overtime_hours?: number // ساعات اضافه کاری عادی
  night_shift_hours?: number // ساعات کار شب
  on_call_hours?: number // ساعات آن کال
  notes?: string
}

interface DayDetailDialogProps {
  inspector: Inspector
  dayDetails: DayDetails | null
  isOpen: boolean
  onClose: () => void
  onSave: (details: DayDetails) => void
  readOnly?: boolean
}

const statusConfig = {
  WORKING: { label: 'Working Day', color: 'bg-green-100 text-green-800' },
  OVERTIME: { label: 'Overtime Work', color: 'bg-orange-100 text-orange-800' },
  RESTING: { label: 'Resting', color: 'bg-blue-100 text-blue-800' },
  LEAVE: { label: 'Leave', color: 'bg-yellow-100 text-yellow-800' },
  SICK_LEAVE: { label: 'Sick Leave', color: 'bg-red-100 text-red-800' },
  EMERGENCY: { label: 'Emergency', color: 'bg-purple-100 text-purple-800' },
  UNAVAILABLE: { label: 'Unavailable', color: 'bg-gray-100 text-gray-800' }
}

export function DayDetailDialog({
  inspector,
  dayDetails,
  isOpen,
  onClose,
  onSave,
  readOnly = false
}: DayDetailDialogProps) {
  const [status, setStatus] = useState<AttendanceStatus>(dayDetails?.status || 'WORKING')
  const [overtime_hours, setOvertimeHours] = useState(dayDetails?.overtime_hours?.toString() ?? '0')
  const [night_shift_hours, setNightShiftHours] = useState(dayDetails?.night_shift_hours?.toString() ?? '0')
  const [on_call_hours, setOnCallHours] = useState(dayDetails?.on_call_hours?.toString() ?? '0')
  const [notes, setNotes] = useState(dayDetails?.notes || '')
  const [override_reason, setOverrideReason] = useState(dayDetails?.override_reason || '')
  const [error, setError] = useState<string | null>(null)

  if (!dayDetails) return null

  const handleSave = () => {
    // Only allow overtime for WORKING or OVERTIME days
    const hasOvertime = (parseFloat(overtime_hours) || 0) > 0 || (parseFloat(night_shift_hours) || 0) > 0 || (parseFloat(on_call_hours) || 0) > 0;
    if (hasOvertime && status !== 'WORKING' && status !== 'OVERTIME') {
      setError('You can only add overtime for WORKING or OVERTIME days.');
      return;
    }
    const updatedDetails: DayDetails = {
      ...dayDetails,
      status,
      is_override: status !== dayDetails.status || !!override_reason,
      override_reason: override_reason || undefined,
      overtime_hours: overtime_hours ? parseFloat(overtime_hours) : 0,
      night_shift_hours: night_shift_hours ? parseFloat(night_shift_hours) : 0,
      on_call_hours: on_call_hours ? parseFloat(on_call_hours) : 0,
      notes: notes || undefined
    }
    
    onSave(updatedDetails)
    onClose()
  }

  // Clear error on dialog close
  const handleClose = () => {
    setStatus(dayDetails?.status || 'WORKING')
    setOvertimeHours(dayDetails?.overtime_hours?.toString() ?? '0')
    setNightShiftHours(dayDetails?.night_shift_hours?.toString() ?? '0')
    setOnCallHours(dayDetails?.on_call_hours?.toString() ?? '0')
    setNotes(dayDetails?.notes || '')
    setOverrideReason(dayDetails?.override_reason || '')
    setError(null)
    onClose()
  }

  const formatPersianDate = (date: Date) => {
    return date.toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const totalExtraHours = 
    (parseFloat(overtime_hours) || 0) + 
    (parseFloat(night_shift_hours) || 0) + 
    (parseFloat(on_call_hours) || 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Work Day Details - {inspector.name}
          </DialogTitle>
          <div className="text-sm text-gray-600">
            📅 {formatPersianDate(dayDetails.date)}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>
          )}
          {/* Current Status */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Current Status:</Label>
              <Badge className={`mt-1 ${statusConfig[dayDetails.status].color}`}>
                {statusConfig[dayDetails.status].label}
              </Badge>
            </div>
            {dayDetails.is_override && (
              <Badge variant="outline" className="border-orange-300 text-orange-600">
                Manual Override
              </Badge>
            )}
          </div>

          {/* Status Change */}
          {!readOnly && (
            <div>
              <Label className="text-sm font-medium">Change Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as AttendanceStatus)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {status !== dayDetails.status && (
                <div className="mt-2">
                  <Label className="text-xs text-orange-600">Change Reason (Optional)</Label>
                  <Input
                    value={override_reason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter reason for status change..."
                    className="mt-1 text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Payroll Information */}
          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-800">Additional Hours</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overtime Hours */}
              <div>
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Overtime Hours
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={overtime_hours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  placeholder="0"
                  disabled={readOnly}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Extra work hours during regular time
                </p>
              </div>

              {/* Night Shift Hours */}
              <div>
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Moon className="w-4 h-4" />
                  Night Shift Hours
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={night_shift_hours}
                  onChange={(e) => setNightShiftHours(e.target.value)}
                  placeholder="0"
                  disabled={readOnly}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Night work hours (18:00-06:00)
                </p>
              </div>

              {/* On-Call Hours */}
              <div>
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="w-4 h-4" />
                  On-Call Hours
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={on_call_hours}
                  onChange={(e) => setOnCallHours(e.target.value)}
                  placeholder="0"
                  disabled={readOnly}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Standby and on-call hours
                </p>
              </div>
            </div>

            {/* Total Summary */}
            {totalExtraHours > 0 && (
              <div className="mt-4 p-3 bg-white rounded border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">
                    Total Extra Hours:
                  </span>
                  <Badge className="bg-green-600 text-white">
                    {totalExtraHours.toFixed(1)} hours
                  </Badge>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  These hours will be included in monthly payroll calculation
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes, explanations, or important remarks..."
              disabled={readOnly}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Existing Override Reason */}
          {dayDetails.override_reason && (
            <div className="p-3 bg-orange-50 rounded border border-orange-200">
              <Label className="text-sm font-medium text-orange-800">Previous Change Reason:</Label>
              <p className="text-sm text-orange-700 mt-1">{dayDetails.override_reason}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          {!readOnly && (
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p className="font-medium mb-1">Help:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Overtime Hours: Work beyond regular daily hours</li>
            <li>Night Shift Hours: Work during 18:00 to 06:00 period</li>
            <li>On-Call Hours: Standby mode for emergency situations</li>
            <li>This information will be used in monthly payroll calculations</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
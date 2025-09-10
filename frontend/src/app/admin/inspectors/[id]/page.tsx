'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useInspectors } from '@/contexts/inspectors-context'
import { AdminOnly, AccessDenied } from '@/components/auth/permission-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  IdCard, 
  Calendar, 
  Shield, 
  Award,
  Phone,
  Building,
  Clock,
  Settings,
  FileText,
  Camera,
  Download
} from 'lucide-react'
import { Inspector } from '@/types/inspector'
import { DayDetailDialog, DayDetails } from '@/components/attendance/DayDetailDialog'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { toast } from 'sonner'
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar'
import { MonthlyPayrollReport } from '@/components/attendance/MonthlyPayrollReport'
import { LeaveList, Leave } from '@/components/leave/LeaveList'
import { getLeaves, deleteLeave, approveLeave, rejectLeave } from '@/api/leave'
import { useNotifications } from '@/contexts/notifications-context'
import { useWorkCycle } from '@/contexts/work-cycle-context';
import jalaali from 'jalaali-js';

interface InspectorDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Enhanced Linear Attendance Component with Jalali dates and overtime tracking
function LinearAttendanceView({ inspector }: { inspector: Inspector }) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedDayDetails, setSelectedDayDetails] = useState<DayDetails | null>(null)
  const [showDayDialog, setShowDayDialog] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(10) // دی ماه
  const [currentYear, setCurrentYear] = useState(1403)
  const [showCycleDialog, setShowCycleDialog] = useState(false)
  
  // Calculate days in current Jalali month
  const daysInJalaliMonth = currentMonth <= 6 ? 31 : (currentMonth <= 11 ? 30 : 29)
  
  const jalaliMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]

  // Generate sample attendance data with different statuses
  const attendanceData = Array.from({ length: daysInJalaliMonth }, (_, i) => {
    const day = i + 1
    const cycleDay = (day - 1) % 28
    
    // 14+14 pattern with variations
    if (cycleDay < 14) {
      const rand = Math.random()
      if (rand > 0.75) return 'OVERTIME' // اضافه کاری
      if (rand > 0.85) return 'LEAVE'
      if (rand > 0.92) return 'SICK_LEAVE'
      if (rand > 0.95) return 'EMERGENCY'
      if (rand > 0.98) return 'UNAVAILABLE'
      return 'WORKING'
    } else {
      return 'RESTING'
    }
  })

  // Sample overtime data
  const overtimeData: Record<number, {
    overtime: number
    nightShift: number
    onCall: number
    notes?: string
  }> = {
    3: { overtime: 4, nightShift: 0, onCall: 2, notes: 'Project deadline' },
    7: { overtime: 2, nightShift: 8, onCall: 0, notes: 'Night maintenance' },
    12: { overtime: 6, nightShift: 0, onCall: 4, notes: 'Emergency repair' },
    18: { overtime: 3, nightShift: 4, onCall: 0 },
    25: { overtime: 5, nightShift: 0, onCall: 6, notes: 'Weekend project' }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'WORKING': return { text: 'W', color: 'bg-green-500 text-white', title: 'Working Day' }
      case 'OVERTIME': return { text: 'O', color: 'bg-orange-500 text-white', title: 'Overtime Work' }
      case 'RESTING': return { text: 'R', color: 'bg-blue-500 text-white', title: 'Resting Day' }
      case 'LEAVE': return { text: 'L', color: 'bg-yellow-500 text-white', title: 'Leave' }
      case 'SICK_LEAVE': return { text: 'S', color: 'bg-red-500 text-white', title: 'Sick Leave' }
      case 'EMERGENCY': return { text: 'E', color: 'bg-purple-500 text-white', title: 'Emergency Leave' }
      case 'UNAVAILABLE': return { text: 'U', color: 'bg-gray-500 text-white', title: 'Unavailable' }
      default: return { text: '-', color: 'bg-gray-300 text-gray-600', title: 'Unknown' }
    }
  }

  const handleDayClick = (day: number) => {
    const status = attendanceData[day - 1]
    // Create Jalali date for دی ماه 1403 - start from actual day 1 of Dey month
    const jalaliToGregorianOffset = 21 // دی ماه starts around 21 December
    const currentDate = new Date(2024, 11, jalaliToGregorianOffset + day - 1) // December 2024 + offset
    
    const dayDetails: DayDetails = {
      date: currentDate,
      status: status as 'WORKING' | 'RESTING' | 'LEAVE' | 'SICK_LEAVE' | 'EMERGENCY' | 'UNAVAILABLE',
      isOverride: false,
      overtimeHours: overtimeData[day]?.overtime || 0,
      nightShiftHours: overtimeData[day]?.nightShift || 0,
      onCallHours: overtimeData[day]?.onCall || 0,
      notes: overtimeData[day]?.notes || ''
    }
    
    setSelectedDay(day)
    setSelectedDayDetails(dayDetails)
    setShowDayDialog(true)
  }

  const handleSaveDayDetails = (details: DayDetails) => {
    // Here you would save to your state/API
    console.log('Saving day details:', details)
    toast.success('Day details saved successfully')
  }

  const hasOvertime = (day: number) => {
    const overtime = overtimeData[day]
    return overtime && (overtime.overtime > 0 || overtime.nightShift > 0 || overtime.onCall > 0)
  }

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleSetCycleStart = () => {
    setShowCycleDialog(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Attendance Schedule - {jalaliMonths[currentMonth - 1]} {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white text-xs font-bold">W</div>
              <span className="text-sm font-medium">WORKING</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-orange-500 flex items-center justify-center text-white text-xs font-bold">O</div>
              <span className="text-sm font-medium">OVERTIME</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold">R</div>
              <span className="text-sm font-medium">RESTING</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">L</div>
              <span className="text-sm font-medium">LEAVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center text-white text-xs font-bold">S</div>
              <span className="text-sm font-medium">SICK_LEAVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center text-white text-xs font-bold">E</div>
              <span className="text-sm font-medium">EMERGENCY</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-500 flex items-center justify-center text-white text-xs font-bold">U</div>
              <span className="text-sm font-medium">UNAVAILABLE</span>
            </div>
          </div>

          {/* Month Navigation & Settings */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h4 className="text-sm font-medium text-blue-800">Month Navigation:</h4>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handlePreviousMonth}>← Previous</Button>
                  <span className="text-sm font-medium px-3 py-1 bg-white rounded border">
                    {jalaliMonths[currentMonth - 1]} {currentYear}
                  </span>
                  <Button size="sm" variant="outline" onClick={handleNextMonth}>Next →</Button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-blue-700">14+14 Cycle Start:</span>
                <Button size="sm" variant="outline" className="text-xs" onClick={handleSetCycleStart}>
                  📅 Set Start Date
                </Button>
              </div>
            </div>
          </div>

          {/* Linear Single Row Calendar */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Month Overview - Click on any day to add overtime</h4>
            <div className="flex flex-wrap gap-1 p-3 bg-white border rounded-lg overflow-x-auto">
              {Array.from({ length: daysInJalaliMonth }, (_, i) => {
                const day = i + 1
                const status = attendanceData[i]
                const statusDisplay = getStatusDisplay(status)
                const hasOvertimeToday = hasOvertime(day)

                return (
                  <div
                    key={day}
                    className="relative group flex-shrink-0"
                    title={`Day ${day} - ${statusDisplay.title}`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-gray-600 mb-1">{day}</div>
                      <div
                        className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                          transition-all duration-200 border relative cursor-pointer hover:scale-110
                          ${statusDisplay.color}
                        `}
                        onClick={() => handleDayClick(day)}
                      >
                        {statusDisplay.text}
                        {hasOvertimeToday && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center">
                            +
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-green-600">
                  {attendanceData.filter(s => s === 'WORKING').length}
                </div>
                <div className="text-xs text-gray-600">Working</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600">
                  {attendanceData.filter(s => s === 'OVERTIME').length}
                </div>
                <div className="text-xs text-gray-600">Overtime</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {attendanceData.filter(s => s === 'RESTING').length}
                </div>
                <div className="text-xs text-gray-600">Resting</div>
              </div>
              <div>
                <div className="text-xl font-bold text-yellow-600">
                  {attendanceData.filter(s => s === 'LEAVE').length}
                </div>
                <div className="text-xs text-gray-600">Leave</div>
              </div>
              <div>
                <div className="text-xl font-bold text-red-600">
                  {attendanceData.filter(s => s === 'SICK_LEAVE').length}
                </div>
                <div className="text-xs text-gray-600">Sick</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-600">
                  {attendanceData.filter(s => s === 'EMERGENCY').length}
                </div>
                <div className="text-xs text-gray-600">Emergency</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-600">
                  {Math.round(((attendanceData.filter(s => s === 'WORKING').length + attendanceData.filter(s => s === 'OVERTIME').length) / daysInJalaliMonth) * 100)}%
                </div>
                <div className="text-xs text-gray-600">Work Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Overtime & Additional Hours Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(overtimeData).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(overtimeData).map(([day, data]) => (
                <div key={day} className="p-3 border rounded-lg bg-orange-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-orange-800">Day {day}</span>
                    <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs">
                      Total: {data.overtime + data.nightShift + data.onCall} hours
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    {data.overtime > 0 && (
                      <span className="text-blue-600">Overtime: {data.overtime} hours</span>
                    )}
                    {data.nightShift > 0 && (
                      <span className="text-purple-600">Night Shift: {data.nightShift} hours</span>
                    )}
                    {data.onCall > 0 && (
                      <span className="text-green-600">On-Call: {data.onCall} hours</span>
                    )}
                  </div>
                  {data.notes && (
                    <div className="mt-1 text-xs text-gray-600 truncate">
                      {data.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No overtime hours recorded for this month</p>
              <p className="text-xs mt-1">Click on working days above to add overtime hours</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <DayDetailDialog
        inspector={inspector}
        dayDetails={selectedDayDetails}
        isOpen={showDayDialog}
        onClose={() => setShowDayDialog(false)}
        onSave={handleSaveDayDetails}
      />

      {/* Cycle Start Date Dialog */}
      {showCycleDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Set 14+14 Cycle Start Date</h3>
            <p className="text-gray-600 mb-4">
              Choose the start date for the 14 working days + 14 resting days cycle.
            </p>
            <div className="mb-4">
              <label htmlFor="cycle-start-date" className="block text-sm font-medium mb-2">
                Cycle Start Date:
              </label>
              <input
                id="cycle-start-date"
                type="date"
                className="w-full p-2 border rounded"
                defaultValue="2025-01-01"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCycleDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowCycleDialog(false)
                  toast.success('Cycle start date updated')
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple Payroll Report Component
function SimplePayrollReport({ inspector }: { inspector: Inspector }) {
  const baseHourlyRate = 50000 // Sample base rate in Rials
  const presentDays = 20 // Sample data
  const overtimeHours = 15
  const nightShiftHours = 8
  const onCallHours = 12

  const calculations = {
    regularPay: presentDays * 8 * baseHourlyRate,
    overtimePay: overtimeHours * baseHourlyRate * 1.5,
    nightShiftPay: nightShiftHours * baseHourlyRate * 2.0,
    onCallPay: onCallHours * baseHourlyRate * 1.25,
  }

  const totalPay = Object.values(calculations).reduce((sum, val) => sum + val, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-green-600" />
          Payroll Report - Current Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pay Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-3">Regular Hours</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Present Days:</span>
                <span className="font-medium">{presentDays} days</span>
              </div>
              <div className="flex justify-between">
                <span>Regular Hours:</span>
                <span className="font-medium">{presentDays * 8} hours</span>
              </div>
              <div className="flex justify-between">
                <span>Rate:</span>
                <span className="font-medium">{baseHourlyRate.toLocaleString()} Rials/hr</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-blue-600">{calculations.regularPay.toLocaleString()} Rials</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-3">Extra Hours</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Overtime (×1.5):</span>
                <span className="font-medium">{calculations.overtimePay.toLocaleString()} Rials</span>
              </div>
              <div className="flex justify-between">
                <span>Night Shift (×2.0):</span>
                <span className="font-medium">{calculations.nightShiftPay.toLocaleString()} Rials</span>
              </div>
              <div className="flex justify-between">
                <span>On-Call (×1.25):</span>
                <span className="font-medium">{calculations.onCallPay.toLocaleString()} Rials</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total Monthly Pay:</span>
            <span className="text-2xl font-bold text-green-600">{totalPay.toLocaleString()} Rials</span>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => toast.info('Export functionality coming soon')}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


export default function InspectorDetailPage({ params }: InspectorDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { inspectors, loading } = useInspectors()
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'attendance' | 'payroll' | 'leave'>('profile')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear] = useState(new Date().getFullYear())
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const { addNotification } = useNotifications()
  const { setWorkCycleChanged, setLastChanged } = useWorkCycle();

  useEffect(() => {
    if (inspectors && resolvedParams.id) {
      const foundInspector = inspectors.find(i => i.id.toString() === resolvedParams.id)
      setInspector(foundInspector || null)
    }
  }, [inspectors, resolvedParams.id])

  useEffect(() => {
    if (inspector && activeTab === 'leave') {
      setLeaveLoading(true)
      setLeaveError(null)
      getLeaves(inspector.id)
        .then(data => setLeaves(Array.isArray(data) ? data : []))
        .catch(err => setLeaveError(err.message))
        .finally(() => setLeaveLoading(false))
    }
  }, [inspector, activeTab])

  const handleEdit = () => {
    router.push(`/admin/inspectors/${resolvedParams.id}/edit`)
  }

  const handleDeleteInspector = async () => {
    if (!inspector) return
    
    setIsDeleting(true)
    try {
      // TODO: API call to delete inspector
      console.log('Deleting inspector:', inspector.id)
      
      toast.success(`Inspector "${inspector.name}" has been deleted`)
      setDeleteDialogOpen(false)
      router.push('/admin/inspectors')
      
    } catch (error) {
      console.error('Error deleting inspector:', error)
      toast.error('Error deleting inspector. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true)
  }

  const handleBack = () => {
    router.push('/admin/inspectors')
  }

  const handleFileUpload = (files: File[]) => {
    // فرض: اینجا آپلود فیش حقوقی انجام می‌شود
    try {
      // TODO: API call to upload files
      addNotification({
        title: 'آپلود فیش حقوقی',
        message: `${files.length} فایل با موفقیت آپلود شد.`,
        type: 'system_alert',
        priority: 'medium',
      })
    } catch (err: unknown) {
      addNotification({
        title: 'خطا در آپلود فیش حقوقی',
        message: err instanceof Error ? err.message : 'خطا در آپلود فایل. لطفاً مجدداً تلاش کنید.',
        type: 'system_alert',
        priority: 'high',
      })
    }
  }

  // متدهای مدیریت مرخصی توسط ادمین
  const handleApprove = async (id: number) => {
    try {
      await approveLeave(id)
      setLeaves(leaves => leaves.map(l => l.id === id ? { ...l, status: 'approved' } : l))
      addNotification({
        title: 'مرخصی تایید شد',
        message: 'درخواست مرخصی با موفقیت تایید شد.',
        type: 'system_alert',
        priority: 'medium',
      })
    } catch (err: unknown) {
      addNotification({
        title: 'خطا در تایید مرخصی',
        message: err instanceof Error ? err.message : 'خطا در تایید مرخصی. لطفاً مجدداً تلاش کنید.',
        type: 'system_alert',
        priority: 'high',
      })
    }
  }
  const handleReject = async (id: number) => {
    try {
      await rejectLeave(id)
      setLeaves(leaves => leaves.map(l => l.id === id ? { ...l, status: 'rejected' } : l))
      addNotification({
        title: 'مرخصی رد شد',
        message: 'درخواست مرخصی با موفقیت رد شد.',
        type: 'system_alert',
        priority: 'medium',
      })
    } catch (err: unknown) {
      addNotification({
        title: 'خطا در رد مرخصی',
        message: err instanceof Error ? err.message : 'خطا در رد مرخصی. لطفاً مجدداً تلاش کنید.',
        type: 'system_alert',
        priority: 'high',
      })
    }
  }
  const handleDeleteLeave = async (id: number) => {
    try {
      await deleteLeave(id)
      setLeaves(leaves => leaves.filter(l => l.id !== id))
      addNotification({
        title: 'مرخصی حذف شد',
        message: 'درخواست مرخصی با موفقیت حذف شد.',
        type: 'system_alert',
        priority: 'medium',
      })
    } catch (err: unknown) {
      addNotification({
        title: 'خطا در حذف مرخصی',
        message: err instanceof Error ? err.message : 'خطا در حذف مرخصی. لطفاً مجدداً تلاش کنید.',
        type: 'system_alert',
        priority: 'high',
      })
    }
  }

  // فرض کنید updateWorkCycle را اینجا یا در یک متد دارید:
  const handleWorkCycleUpdate = async (inspectorId: number, newStartDate: string | Date) => {
    // ... کد ارسال به API ...
    // بعد از موفقیت:
    const { jy, jm } = jalaali.toJalaali(new Date(newStartDate));
    setWorkCycleChanged(true);
    setLastChanged({ inspectorId, jy, jm });
  }
  // این تابع را بعد از موفقیت تغییر سیکل کاری صدا بزنید:
  // await handleWorkCycleUpdate(inspectorId, newStartDate)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!inspector) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Inspector Not Found
            </h3>
            <p className="text-gray-500 mb-4">
              The inspector with ID {resolvedParams.id} could not be found.
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Inspectors
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AdminOnly fallback={<AccessDenied />}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{inspector.name}</h1>
              <p className="text-gray-600">Inspector Details & Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={openDeleteDialog}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          <Button variant={activeTab === 'profile' ? 'default' : 'ghost'} onClick={() => setActiveTab('profile')}>Profile</Button>
          <Button variant={activeTab === 'documents' ? 'default' : 'ghost'} onClick={() => setActiveTab('documents')}>Documents</Button>
          {inspector.attendance_tracking_enabled && (
            <Button variant={activeTab === 'attendance' ? 'default' : 'ghost'} onClick={() => setActiveTab('attendance')}>Attendance</Button>
          )}
          <Button variant={activeTab === 'payroll' ? 'default' : 'ghost'} onClick={() => setActiveTab('payroll')}>Payroll</Button>
          <Button variant={activeTab === 'leave' ? 'default' : 'ghost'} onClick={() => setActiveTab('leave')}>Leave</Button>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'attendance' && inspector && inspector.attendance_tracking_enabled && (
            <AttendanceCalendar inspector={inspector} />
          )}
          {activeTab === 'payroll' && inspector && (
            <MonthlyPayrollReport inspector={inspector} month={currentMonth} year={currentYear} attendanceData={[]} />
          )}
          {activeTab === 'leave' && inspector && (
            leaveLoading ? (
              <div className="p-8 text-center text-blue-600">در حال بارگذاری...</div>
            ) : leaveError ? (
              <div className="p-8 text-center text-red-600">خطا: {leaveError}</div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold mb-4">درخواست‌های مرخصی بازرس</h2>
                <LeaveList leaves={leaves} isAdmin onApprove={handleApprove} onReject={handleReject} onDelete={handleDeleteLeave} />
              </div>
            )
          )}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-blue-600" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {inspector.profile_image_url ? (
                      <img
                        src={inspector.profile_image_url}
                        alt={inspector.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{inspector.name}</p>
                  <Badge variant="outline">{inspector.inspector_type}</Badge>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Full Name</p>
                      <p className="text-gray-900 font-medium">{inspector.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <IdCard className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Employee ID</p>
                      <p className="text-gray-900 font-medium">{inspector.employee_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-gray-900">{inspector.email}</p>
                    </div>
                  </div>

                  {inspector.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-gray-900">{inspector.phone}</p>
                      </div>
                    </div>
                  )}

                  {inspector.department && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Building className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Department</p>
                        <p className="text-gray-900">{inspector.department}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Experience</p>
                      <p className="text-gray-900">{inspector.years_experience} years</p>
                    </div>
                  </div>

                  {inspector.date_of_birth && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                        <p className="text-gray-900">
                          {new Date(inspector.date_of_birth).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Inspector Type</p>
                    <Badge variant="outline">{inspector.inspector_type}</Badge>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Account Status</p>
                    <div className="flex gap-2">
                      <Badge variant={inspector.active ? "default" : "destructive"}>
                        {inspector.active ? "Active" : "Inactive"}
                      </Badge>
                      {inspector.can_login && (
                        <Badge variant="outline">Login Access</Badge>
                      )}
                      {inspector.available && (
                        <Badge variant="secondary">Available</Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {inspector.specialties && inspector.specialties.length > 0 ? (
                        inspector.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {specialty}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No specialties assigned</span>
                      )}
                    </div>
                  </div>

                  {inspector.roles && inspector.roles.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {inspector.roles.map((role, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {typeof role === 'string' ? role : role.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Account Dates</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Created: {new Date(inspector.created_at).toLocaleDateString('fa-IR')}</p>
                      <p>Updated: {new Date(inspector.updated_at).toLocaleDateString('fa-IR')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Documents & Certificates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onFileSelect={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                    multiple={true}
                    maxSize={10}
                    maxFiles={10}
                    existingFiles={[
                      {
                        name: 'Inspector_Certificate.pdf',
                        url: '/docs/sample.pdf',
                        type: 'application/pdf',
                        size: 1024000
                      },
                      {
                        name: 'Training_Record.docx',
                        url: '/docs/training.docx',
                        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        size: 512000
                      }
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmationDialog
            isOpen={deleteDialogOpen}
            setIsOpen={setDeleteDialogOpen}
            title="Delete Inspector"
            description={`Are you sure you want to delete inspector "${inspector.name}"? This action cannot be undone and will permanently remove all data associated with this inspector.`}
            onConfirm={handleDeleteInspector}
            isDeleting={isDeleting}
            confirmationText="delete"
          />
        </div>
      </div>
    </AdminOnly>
  )
}
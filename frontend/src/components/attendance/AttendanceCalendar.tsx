'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Settings, Clock, Pencil } from 'lucide-react'
import { Inspector } from '@/types/inspector'
import { DayDetailDialog, DayDetails } from './DayDetailDialog'
import { getAttendance, saveAttendanceDay, getWorkCycle, updateWorkCycle } from '@/api/attendance'
import jalaali from 'jalaali-js'
import { JalaliDatePicker, jalaliDateToJSDate } from '@/components/ui/jalali-date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWorkCycle } from '@/contexts/work-cycle-context';

export type AttendanceStatus = 'WORKING' | 'OVERTIME' | 'RESTING' | 'LEAVE' | 'SICK_LEAVE' | 'EMERGENCY' | 'UNAVAILABLE'

export interface AttendanceDay {
  date: Date
  status: AttendanceStatus
  is_override: boolean
  override_reason?: string
  // Extended fields for payroll
  overtime_hours?: number
  night_shift_hours?: number
  on_call_hours?: number
  notes?: string
}

export interface AttendanceCycle {
  id: number
  inspectorId: number
  startDate: Date
  endDate: Date
  cycleType: '14_14' | '20_8' | 'custom'
  days: AttendanceDay[]
  isActive: boolean
  jalali_start_date?: string // اضافه شد
}

interface AttendanceCalendarProps {
  inspector?: Inspector
  showControls?: boolean
  readOnly?: boolean
  onDateClick?: (date: Date, status: AttendanceStatus) => void
}

// Status colors and info
const statusConfig = {
  WORKING: {
    color: 'bg-green-500',
    lightColor: 'bg-green-100',
    textColor: 'text-green-800',
    label: 'Working',
    icon: '💼',
    description: 'روز کاری'
  },
  OVERTIME: {
    color: 'bg-orange-500',
    lightColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    label: 'Overtime',
    icon: '⏰',
    description: 'اضافه کاری'
  },
  RESTING: {
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    label: 'Resting',
    icon: '🏠',
    description: 'استراحت'
  },
  LEAVE: {
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    label: 'Leave',
    icon: '🏖️',
    description: 'مرخصی'
  },
  SICK_LEAVE: {
    color: 'bg-red-500',
    lightColor: 'bg-red-100',
    textColor: 'text-red-800',
    label: 'Sick Leave',
    icon: '🏥',
    description: 'مرخصی استعلاجی'
  },
  EMERGENCY: {
    color: 'bg-purple-500',
    lightColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    label: 'Emergency',
    icon: '🚨',
    description: 'اضطراری'
  },
  UNAVAILABLE: {
    color: 'bg-gray-500',
    lightColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    label: 'Unavailable',
    icon: '❌',
    description: 'عدم دسترسی'
  }
}

export function AttendanceCalendar({
  inspector,
  showControls = true,
  readOnly = false,
  onDateClick
}: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DayDetails | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [attendanceData, setAttendanceData] = useState<AttendanceDay[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workCycle, setWorkCycle] = useState<{ jalali_start_date: string } | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { workCycleChanged, setWorkCycleChanged, lastChanged, setLastChanged } = useWorkCycle();

  useEffect(() => {
    if (editDialogOpen) {
      const today = new Date();
      const { jy, jm, jd } = jalaali.toJalaali(today);
      setPendingDate(jalaliDateToJSDate(jy, jm, jd));
    }
  }, [editDialogOpen]);

  // Jalali month names
  const jalaliMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']
  // Convert currentDate to Jalali
  const { jy: jalaliYear, jm: jalaliMonth } = jalaali.toJalaali(currentDate)

  // گرفتن داده حضور و غیاب از API
  useEffect(() => {
    if (!inspector) return
    setLoading(true)
    setError(null)
    getAttendance(inspector.id, jalaliMonth, jalaliYear)
      .then(data => {
        setAttendanceData(data.map((d: AttendanceDay) => ({
          ...d,
          date: new Date(d.date),
        })))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
    // گرفتن work cycle واقعی
    getWorkCycle(inspector.id)
      .then(data => {
        console.log('workCycle:', data);
        setWorkCycle(data)
      })
      .catch(() => setWorkCycle(null))
  }, [inspector, jalaliMonth, jalaliYear])

  // واکشی مجدد اگر سیکل کاری همین ماه یا قبل‌تر تغییر کرد
  useEffect(() => {
    if (
      workCycleChanged &&
      lastChanged &&
      inspector &&
      lastChanged.inspectorId === inspector.id &&
      (
        lastChanged.jy < jalaliYear ||
        (lastChanged.jy === jalaliYear && lastChanged.jm <= jalaliMonth)
      )
    ) {
      setLoading(true)
      setError(null)
      getAttendance(inspector.id, jalaliMonth, jalaliYear)
        .then(data => {
          setAttendanceData(data.map((d: AttendanceDay) => ({
            ...d,
            date: new Date(d.date),
          })))
        })
        .catch(err => setError(err.message))
        .finally(() => {
          setLoading(false)
          setWorkCycleChanged(false)
          setLastChanged(null)
        })
    }
  }, [workCycleChanged, lastChanged, inspector, jalaliMonth, jalaliYear, setWorkCycleChanged, setLastChanged])

  // حذف generateSampleCycle و ساخت cycle از داده واقعی
  const currentCycle = useMemo(() => {
    if (!inspector || !attendanceData) return null
    // فرض: attendanceData شامل روزهای ماه جاری است
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    return {
      id: 1,
      inspectorId: inspector.id,
      startDate,
      endDate: new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0),
      cycleType: 'custom' as const,
      days: attendanceData,
      isActive: true,
      jalali_start_date: undefined // Initialize with undefined
    }
  }, [inspector, attendanceData, currentDate])

  const handleDateClick = (date: Date, attendanceData?: AttendanceDay) => {
    if (readOnly || !attendanceData) return
    
    // Convert AttendanceDay to DayDetails for the dialog
    const dayDetails: DayDetails = {
      date,
      status: attendanceData.status,
      is_override: attendanceData.is_override,
      override_reason: attendanceData.override_reason,
      overtime_hours: attendanceData.overtime_hours ?? 0,
      night_shift_hours: attendanceData.night_shift_hours ?? 0,
      on_call_hours: attendanceData.on_call_hours ?? 0,
      notes: attendanceData.notes
    }
    
    setSelectedDay(dayDetails)
    setIsDialogOpen(true)
    
    // Also call the original callback if provided
    if (onDateClick) {
      onDateClick(date, attendanceData.status)
    }
  }

  function getJalaliDateString(date: Date) {
    const { jy, jm, jd } = jalaali.toJalaali(date);
    return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
  }

  const handleSaveDay = async (details: DayDetails) => {
    if (!inspector) return
    setLoading(true)
    setError(null)
    try {
      // تبدیل فیلدها به snake_case برای هماهنگی با بک‌اند
      await saveAttendanceDay(
        inspector.id,
        details.date.toISOString().slice(0, 10),
        {
          ...details,
          jalali_date: getJalaliDateString(details.date),
        }
      )
      const data = await getAttendance(inspector.id, jalaliMonth, jalaliYear)
      setAttendanceData(data.map(d => ({ ...d, date: new Date(d.date) })))
      setIsDialogOpen(false)
      setSelectedDay(null)
    } catch (err: unknown) {
      console.error('Attendance save error:', err);
      if (typeof err === 'string') {
        setError(err);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(JSON.stringify(err));
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedDay(null)
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  if (!inspector) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select an inspector to view attendance calendar</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <div className="p-8 text-center text-blue-600">Loading...</div>
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Attendance Schedule - {inspector.name}
          </CardTitle>
          {showControls && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {jalaliMonths[jalaliMonth - 1]} {jalaliYear}
              </span>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Current Cycle Info */}
        {currentCycle && (
          <div className="flex items-center gap-4 mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Work Cycle Start Date:
              </span>
            </div>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {workCycle?.jalali_start_date || 'N/A'}
            </Badge>
            {!readOnly && (
              <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(true)}>
                <Pencil className="w-4 h-4 text-blue-600" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Status Types (Legend) - move above Month Overview, compact and no scroll */}
        <div className="space-y-1 mb-2 py-2 px-2 bg-gray-50 rounded-lg">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Status Types:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1">
                  <div className={`w-5 h-5 rounded ${config.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {status === 'WORKING' ? 'W' :
                     status === 'OVERTIME' ? 'O' :
                     status === 'RESTING' ? 'R' :
                     status === 'LEAVE' ? 'L' :
                     status === 'SICK_LEAVE' ? 'S' :
                     status === 'EMERGENCY' ? 'E' : 'U'}
                  </div>
                  <span className="text-xs font-medium">{status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-gray-400 italic mt-1">
            💡 Click on any day to view and edit details including overtime hours
          </div>
        </div>

        {/* Month Overview - Click on any day to add overtime */}
        <div className="mb-6">
          {currentCycle && (
            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <h4 className="text-sm font-medium text-blue-800 mb-3">
                Month Overview - Click on any day to add overtime
              </h4>
              <div className="flex flex-wrap gap-1 p-3 bg-white border rounded-lg overflow-x-auto">
                {currentCycle.days.slice(0, 30).map((dayData, i) => {
                  const day = i + 1
                  const statusInfo = statusConfig[dayData.status]
                  const hasOvertimeToday = (dayData.overtime_hours ?? 0) > 0 ||
                                         (dayData.night_shift_hours ?? 0) > 0 ||
                                         (dayData.on_call_hours ?? 0) > 0

                  return (
                    <div
                      key={day}
                      className="relative group flex-shrink-0"
                      title={`Day ${day} - ${statusInfo.description}`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-600 mb-1">{day}</div>
                        <div
                          className={`
                            w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                            transition-all duration-200 border relative cursor-pointer hover:scale-110
                            ${statusInfo.color} text-white
                          `}
                          onClick={() => handleDateClick(dayData.date, dayData)}
                        >
                          {dayData.status === 'WORKING' ? 'W' :
                           dayData.status === 'OVERTIME' ? 'O' :
                           dayData.status === 'RESTING' ? 'R' :
                           dayData.status === 'LEAVE' ? 'L' :
                           dayData.status === 'SICK_LEAVE' ? 'S' :
                           dayData.status === 'EMERGENCY' ? 'E' : 'U'}
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
          )}
        </div>

        {/* Cycle Summary - Moved up and made English */}
        {currentCycle && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = currentCycle.days.filter(d => d.status === status).length
              if (count === 0) return null
              
              return (
                <div key={status} className={`p-3 rounded-lg ${config.lightColor}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded ${config.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {status === 'WORKING' ? 'W' :
                       status === 'OVERTIME' ? 'O' :
                       status === 'RESTING' ? 'R' :
                       status === 'LEAVE' ? 'L' :
                       status === 'SICK_LEAVE' ? 'S' :
                       status === 'EMERGENCY' ? 'E' : 'U'}
                    </div>
                    <span className={`text-sm font-medium ${config.textColor}`}>
                      {status}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${config.textColor}`}>
                    {count}
                  </div>
                  <div className="text-xs text-gray-600">
                    days
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Overtime Information */}
        {currentCycle && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Overtime & Additional Hours Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const overtimeDays = currentCycle.days.filter(d =>
                  (d.overtime_hours ?? 0) > 0 ||
                  (d.night_shift_hours ?? 0) > 0 ||
                  (d.on_call_hours ?? 0) > 0
                )
                
                return overtimeDays.length > 0 ? (
                  <div className="space-y-2">
                    {overtimeDays.map((dayData, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-orange-50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-orange-800">
                            Day {jalaali.toJalaali(dayData.date).jd}
                          </span>
                          <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs">
                            Total: {(dayData.overtime_hours ?? 0) + (dayData.night_shift_hours ?? 0) + (dayData.on_call_hours ?? 0)} hours
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          {Number(dayData.overtime_hours) > 0 && (
                            <span className="text-blue-600">Overtime: {dayData.overtime_hours} hours</span>
                          )}
                          {Number(dayData.night_shift_hours) > 0 && (
                            <span className="text-purple-600">Night Shift: {dayData.night_shift_hours} hours</span>
                          )}
                          {Number(dayData.on_call_hours) > 0 && (
                            <span className="text-green-600">On-Call: {dayData.on_call_hours} hours</span>
                          )}
                        </div>
                        {dayData.notes && (
                          <div className="mt-1 text-xs text-gray-600 truncate">
                            {dayData.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No overtime hours recorded for this cycle</p>
                    <p className="text-xs mt-1">Click on working days above to add overtime hours</p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </CardContent>

      {/* Day Detail Dialog */}
      {inspector && (
        <DayDetailDialog
          inspector={inspector}
          dayDetails={selectedDay}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveDay}
          readOnly={readOnly}
        />
      )}
      {/* Dialog for editing work cycle start date */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Work Cycle Start Date</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {(() => {
              const today = new Date();
              const { jy, jm, jd } = jalaali.toJalaali(today);
              return (
                <JalaliDatePicker
                  value={pendingDate ?? jalaliDateToJSDate(jy, jm, jd)}
                  onChange={setPendingDate}
                />
              );
            })()}
          </div>
          {editError && <div className="text-red-500 text-xs mt-2">{editError}</div>}
          <DialogFooter>
            <Button
              size="sm"
              onClick={async () => {
                if (!pendingDate || !inspector || !currentCycle) return;
                setEditLoading(true);
                setEditError(null);
                try {
                  const jalali = pendingDate;
                  const { jy: jyPending, jm: jmPending, jd: jdPending } = jalaali.toJalaali(jalali);
                  const jalaliStr = `${jyPending}-${String(jmPending).padStart(2, '0')}-${String(jdPending).padStart(2, '0')}`;
                  const data = {
                    jalali_start_date: jalaliStr
                  };
                  console.log('Sending to backend (updateWorkCycle):', { cycleId: currentCycle.id, data });
                  const updateResult = await updateWorkCycle(currentCycle.id, data);
                  console.log('Update result:', updateResult);
                  const updatedWorkCycle = await getWorkCycle(inspector.id);
                  setWorkCycle(updatedWorkCycle);
                  // Use the currently viewed Jalali month/year, not the system date
                  const updatedAttendance = await getAttendance(inspector.id, jalaliMonth, jalaliYear);
                  console.log('Attendance after update:', updatedAttendance);
                  setAttendanceData(updatedAttendance);
                  setEditDialogOpen(false);
                } catch (e: unknown) {
                  console.error('Error during work cycle update:', e);
                  setEditError(e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Failed to update work cycle start date'));
                } finally {
                  setEditLoading(false);
                }
              }}
              disabled={editLoading || !pendingDate}
            >
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
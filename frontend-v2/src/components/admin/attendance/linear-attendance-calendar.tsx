'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, Edit2, Settings } from 'lucide-react'
import { AttendanceRecord, AttendanceStatus, Inspector } from '@/types/admin'
import { cn } from '@/lib/utils'
import { 
  getJalaliMonthName, 
  getDaysInJalaliMonth, 
  getPreviousJalaliMonth, 
  getNextJalaliMonth, 
  jalaliToGregorian 
} from '@/lib/utils/jalali'

interface LinearAttendanceCalendarProps {
  inspector: Inspector
  month: number
  year: number
  attendanceData: AttendanceRecord[]
  onDateClick: (date: Date) => void
  onStatusChange: (date: Date, status: AttendanceStatus) => void
  onMonthChange: (month: number, year: number) => void
  loading?: boolean
  className?: string
}

const ATTENDANCE_STATUS_CONFIG = {
  WORKING: {
    label: 'Working',
    shortLabel: 'W',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  RESTING: {
    label: 'Resting',
    shortLabel: 'R',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  OVERTIME: {
    label: 'Overtime',
    shortLabel: 'O',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  ABSENT: {
    label: 'Absent',
    shortLabel: 'A',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  SICK_LEAVE: {
    label: 'Sick Leave',
    shortLabel: 'S',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  VACATION: {
    label: 'Vacation',
    shortLabel: 'V',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  }
} as const

export function LinearAttendanceCalendar({
  inspector,
  month,
  year,
  attendanceData,
  onDateClick,
  onStatusChange,
  onMonthChange,
  loading = false,
  className
}: LinearAttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingDate, setEditingDate] = useState<Date | null>(null)
  const [showCycleDialog, setShowCycleDialog] = useState(false)

  // Get days in current Jalali month - fixed parameter order
  const daysInJalaliMonth = getDaysInJalaliMonth(year, month)

  // Create attendance map for quick lookup
  const attendanceMap = useMemo(() => {
    return attendanceData.reduce((map, record) => {
      const dateKey = new Date(record.date).toDateString()
      map[dateKey] = record
      return map
    }, {} as Record<string, AttendanceRecord>)
  }, [attendanceData])

  // Generate linear calendar data with mock data
  const calendarDays = useMemo(() => {
    return Array.from({ length: daysInJalaliMonth }, (_, i) => {
      const day = i + 1
      // Create proper Gregorian equivalent for this Jalali date
      const gregorianDate = jalaliToGregorian(year, month, day)
      const dateKey = gregorianDate.toDateString()
      
      // Generate mock attendance data if no real data exists
      let attendance = attendanceMap[dateKey]
      if (!attendance) {
        // Generate realistic mock data based on 14+14 work cycle
        const cycleDay = (day - 1) % 28
        let status: AttendanceStatus
        
        if (cycleDay < 14) {
          // Working period
          const rand = Math.random()
          if (rand > 0.9) status = 'OVERTIME'
          else if (rand > 0.95) status = 'SICK_LEAVE'
          else if (rand > 0.98) status = 'VACATION'
          else status = 'WORKING'
        } else {
          // Resting period
          status = 'RESTING'
        }
        
        // Create mock attendance record
        attendance = {
          id: `mock-${inspector.id}-${day}`,
          inspectorId: inspector.id,
          date: gregorianDate.toISOString().split('T')[0],
          status,
          workHours: status === 'WORKING' ? 8 : status === 'OVERTIME' ? 12 : 0,
          overtimeHours: status === 'OVERTIME' ? Math.floor(Math.random() * 4) + 1 : 0,
          isOverride: false,
          notes: status === 'OVERTIME' ? 'Extra work needed' : undefined,
          overrideReason: undefined
        }
      }
      
      return {
        day,
        date: gregorianDate,
        attendance
      }
    })
  }, [daysInJalaliMonth, year, month, attendanceMap, inspector.id])

  // Calculate statistics
  const stats = useMemo(() => {
    const statusCounts = Object.keys(ATTENDANCE_STATUS_CONFIG).reduce((acc, status) => {
      acc[status as AttendanceStatus] = calendarDays.filter(
        day => day.attendance?.status === status
      ).length
      return acc
    }, {} as Record<AttendanceStatus, number>)

    const workingDays = statusCounts.WORKING + statusCounts.OVERTIME
    const workRate = Math.round((workingDays / daysInJalaliMonth) * 100)

    return { ...statusCounts, workingDays, workRate }
  }, [calendarDays, daysInJalaliMonth])

  const handleDateClick = (day: number, date: Date) => {
    setSelectedDate(date)
    onDateClick(date)
  }

  const handleStatusChange = (date: Date, status: AttendanceStatus) => {
    onStatusChange(date, status)
    setEditingDate(null)
  }

  const navigateMonth = (direction: number) => {
    if (direction > 0) {
      const { year: newYear, month: newMonth } = getNextJalaliMonth(year, month)
      onMonthChange(newMonth, newYear)
    } else {
      const { year: newYear, month: newMonth } = getPreviousJalaliMonth(year, month)
      onMonthChange(newMonth, newYear)
    }
  }

  const getStatusConfig = (status: AttendanceStatus) => {
    return ATTENDANCE_STATUS_CONFIG[status] || ATTENDANCE_STATUS_CONFIG.ABSENT
  }

  const hasOvertime = (dayData: typeof calendarDays[0]) => {
    return dayData.attendance && (
      dayData.attendance.overtimeHours > 0 ||
      dayData.attendance.status === 'OVERTIME'
    )
  }

  const renderDayCell = (dayData: typeof calendarDays[0]) => {
    const { day, date, attendance } = dayData
    const statusConfig = attendance ? getStatusConfig(attendance.status) : null
    const isSelected = selectedDate?.toDateString() === date.toDateString()
    const isToday = new Date().toDateString() === date.toDateString()
    const hasOvertimeToday = hasOvertime(dayData)

    return (
      <TooltipProvider key={day}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative group flex-shrink-0">
              <div className="flex flex-col items-center">
                {/* Day number */}
                <div className="text-xs text-muted-foreground mb-1 font-medium">
                  {day}
                </div>
                
                {/* Status indicator */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                    'transition-all duration-200 border relative cursor-pointer hover:scale-110',
                    'hover:shadow-md',
                    statusConfig ? [
                      statusConfig.color,
                      'text-white'
                    ] : [
                      'bg-muted',
                      'text-muted-foreground',
                      'border-border'
                    ],
                    isSelected && 'ring-2 ring-primary ring-offset-1',
                    isToday && 'ring-2 ring-orange-400 ring-offset-1'
                  )}
                  onClick={() => handleDateClick(day, date)}
                >
                  {statusConfig ? statusConfig.shortLabel : '-'}
                  
                  {/* Overtime indicator */}
                  {hasOvertimeToday && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center">
                      +
                    </div>
                  )}
                </div>
                
                {/* Work hours indicator */}
                {attendance && attendance.workHours > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="w-2 h-2" />
                    <span>{attendance.workHours}h</span>
                  </div>
                )}
              </div>
              
              {/* Edit button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-1 -right-1 w-4 h-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingDate(date)
                }}
              >
                <Edit2 className="w-2 h-2" />
              </Button>
            </div>
          </TooltipTrigger>
          
          <TooltipContent side="top">
            <div className="space-y-1">
              <p className="font-medium">
                Day {day} - {getJalaliMonthName(month)} {year}
              </p>
              {attendance ? (
                <div className="space-y-1 text-sm">
                  <p>Status: {getStatusConfig(attendance.status).label}</p>
                  {attendance.workHours > 0 && (
                    <p>Work Hours: {attendance.workHours}</p>
                  )}
                  {attendance.overtimeHours > 0 && (
                    <p>Overtime: {attendance.overtimeHours}h</p>
                  )}
                  {attendance.notes && (
                    <p>Notes: {attendance.notes}</p>
                  )}
                  {attendance.isOverride && (
                    <p className="text-amber-600">Override: {attendance.overrideReason}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attendance record</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Attendance Schedule - {inspector.name}</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(-1)}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {getJalaliMonthName(month)} {year}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth(1)}
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
            {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn('w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold', config.color)}>
                  {config.shortLabel}
                </div>
                <span className="text-sm font-medium">{config.label}</span>
              </div>
            ))}
          </div>

          {/* Month Navigation & Settings */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h4 className="text-sm font-medium text-blue-800">Work Cycle Settings:</h4>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100" 
                  onClick={() => setShowCycleDialog(true)}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Configure 14+14 Cycle
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span>Work Rate: {stats.workRate}%</span>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {stats.workingDays}/{daysInJalaliMonth} days
                </Badge>
              </div>
            </div>
          </div>

          {/* Linear Calendar */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Month Overview - Click on any day to edit attendance
                </h4>
                <div className="flex flex-wrap gap-1 p-3 bg-background border rounded-lg overflow-x-auto min-h-[100px]">
                  {calendarDays.map(renderDayCell)}
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {stats.WORKING}
                    </div>
                    <div className="text-xs text-muted-foreground">Working</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-orange-600">
                      {stats.OVERTIME}
                    </div>
                    <div className="text-xs text-muted-foreground">Overtime</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {stats.RESTING}
                    </div>
                    <div className="text-xs text-muted-foreground">Resting</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-yellow-600">
                      {stats.VACATION}
                    </div>
                    <div className="text-xs text-muted-foreground">Vacation</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-600">
                      {stats.SICK_LEAVE}
                    </div>
                    <div className="text-xs text-muted-foreground">Sick</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-600">
                      {stats.ABSENT}
                    </div>
                    <div className="text-xs text-muted-foreground">Absent</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-muted-foreground">
                      {stats.workRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Work Rate</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Overtime Summary Card */}
      {calendarDays.some(day => hasOvertime(day)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Overtime & Additional Hours Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {calendarDays
                .filter(day => hasOvertime(day))
                .map(day => (
                  <div key={day.day} className="p-3 border rounded-lg bg-orange-50 border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-orange-800">Day {day.day}</span>
                      <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs">
                        {day.attendance?.overtimeHours || 0} hours
                      </Badge>
                    </div>
                    {day.attendance?.notes && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {day.attendance.notes}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Status Change Dialog */}
      {editingDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Change Attendance Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                Day {editingDate.getDate()} - {getJalaliMonthName(month)} {year}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([status, config]) => (
                  <Button
                    key={status}
                    variant="outline"
                    className={cn(
                      'w-full justify-start gap-2',
                      config.textColor,
                      config.borderColor
                    )}
                    onClick={() => handleStatusChange(editingDate, status as AttendanceStatus)}
                  >
                    <div className={cn('w-3 h-3 rounded', config.color)} />
                    {config.label}
                  </Button>
                ))}
                
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setEditingDate(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Work Cycle Configuration Dialog */}
      {showCycleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Set 14+14 Work Cycle</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure the 14 working days + 14 resting days cycle start date.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="cycle-start-date" className="block text-sm font-medium mb-2">
                    Cycle Start Date:
                  </label>
                  <input
                    id="cycle-start-date"
                    type="date"
                    className="w-full p-2 border rounded-md"
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
                      // In real implementation, save the cycle configuration
                    }}
                  >
                    Save Configuration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
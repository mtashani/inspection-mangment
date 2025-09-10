'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, Edit2 } from 'lucide-react'
import { AttendanceRecord, AttendanceStatus, Inspector } from '@/types/admin'
import { cn } from '@/lib/utils'

interface AttendanceCalendarProps {
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

interface CalendarDay {
  date: Date
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  attendance?: AttendanceRecord
}

const ATTENDANCE_STATUS_CONFIG = {
  WORKING: {
    label: 'Working',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  RESTING: {
    label: 'Resting',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  OVERTIME: {
    label: 'Overtime',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  ABSENT: {
    label: 'Absent',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  SICK_LEAVE: {
    label: 'Sick Leave',
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  VACATION: {
    label: 'Vacation',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  }
} as const

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']

export function AttendanceCalendar({
  inspector,
  month,
  year,
  attendanceData,
  onDateClick,
  onStatusChange,
  onMonthChange,
  loading = false,
  className
}: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingDate, setEditingDate] = useState<Date | null>(null)

  // Create attendance map for quick lookup
  const attendanceMap = useMemo(() => {
    return attendanceData.reduce((map, record) => {
      const dateKey = new Date(record.date).toDateString()
      map[dateKey] = record
      return map
    }, {} as Record<string, AttendanceRecord>)
  }, [attendanceData])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)
    
    // Adjust to start from Saturday (Persian week starts on Saturday)
    const startDayOfWeek = (firstDay.getDay() + 1) % 7 // Convert to Persian week
    startDate.setDate(startDate.getDate() - startDayOfWeek)
    
    // Adjust to end on Friday
    const endDayOfWeek = (lastDay.getDay() + 1) % 7
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek))

    const days: CalendarDay[] = []
    const currentDate = new Date(startDate)
    const today = new Date()

    while (currentDate <= endDate) {
      const dateKey = currentDate.toDateString()
      const isCurrentMonth = currentDate.getMonth() === month - 1
      
      days.push({
        date: new Date(currentDate),
        dayNumber: currentDate.getDate(),
        isCurrentMonth,
        isToday: currentDate.toDateString() === today.toDateString(),
        attendance: attendanceMap[dateKey]
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }, [year, month, attendanceMap])

  const handleDateClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return
    
    setSelectedDate(day.date)
    onDateClick(day.date)
  }

  const handleStatusChange = (date: Date, status: AttendanceStatus) => {
    onStatusChange(date, status)
    setEditingDate(null)
  }

  const navigateMonth = (direction: number) => {
    let newMonth = month + direction
    let newYear = year

    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    } else if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }

    onMonthChange(newMonth, newYear)
  }

  const getStatusConfig = (status: AttendanceStatus) => {
    return ATTENDANCE_STATUS_CONFIG[status] || ATTENDANCE_STATUS_CONFIG.ABSENT
  }

  const renderDayCell = (day: CalendarDay) => {
    const statusConfig = day.attendance ? getStatusConfig(day.attendance.status) : null
    const isSelected = selectedDate?.toDateString() === day.date.toDateString()
    const isEditing = editingDate?.toDateString() === day.date.toDateString()

    return (
      <TooltipProvider key={day.date.toISOString()}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'relative min-h-[60px] p-2 border cursor-pointer transition-all duration-200',
                'hover:bg-muted/50',
                day.isCurrentMonth ? 'bg-background' : 'bg-muted/20 text-muted-foreground',
                day.isToday && 'ring-2 ring-primary ring-offset-1',
                isSelected && 'ring-2 ring-blue-500 ring-offset-1',
                statusConfig && [
                  statusConfig.bgColor,
                  statusConfig.borderColor,
                  statusConfig.textColor
                ],
                !day.isCurrentMonth && 'cursor-not-allowed'
              )}
              onClick={() => handleDateClick(day)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'text-sm font-medium',
                  day.isToday && 'font-bold'
                )}>
                  {day.dayNumber}
                </span>
                
                {day.attendance?.isOverride && (
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                )}
              </div>

              {/* Status indicator */}
              {day.attendance && day.isCurrentMonth && (
                <div className="space-y-1">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs px-1 py-0',
                      statusConfig.color,
                      'text-white'
                    )}
                  >
                    {statusConfig.label}
                  </Badge>
                  
                  {day.attendance.workHours > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{day.attendance.workHours}h</span>
                      {day.attendance.overtimeHours > 0 && (
                        <span className="text-orange-600">
                          +{day.attendance.overtimeHours}h
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Edit button for current month days */}
              {day.isCurrentMonth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingDate(day.date)
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">
                {day.date.toLocaleDateString('fa-IR')}
              </p>
              {day.attendance ? (
                <div className="space-y-1 text-sm">
                  <p>Status: {getStatusConfig(day.attendance.status).label}</p>
                  {day.attendance.workHours > 0 && (
                    <p>Work Hours: {day.attendance.workHours}</p>
                  )}
                  {day.attendance.overtimeHours > 0 && (
                    <p>Overtime: {day.attendance.overtimeHours}</p>
                  )}
                  {day.attendance.notes && (
                    <p>Notes: {day.attendance.notes}</p>
                  )}
                  {day.attendance.isOverride && (
                    <p className="text-amber-600">Override: {day.attendance.overrideReason}</p>
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
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>Attendance Calendar - {inspector.name}</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(-1)}
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2 min-w-[200px] justify-center">
              <span className="text-sm font-medium">
                {PERSIAN_MONTHS[month - 1]} {year}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth(1)}
              disabled={loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday headers */}
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50 rounded-t"
                >
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day) => renderDayCell(day))}
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <span className="text-sm font-medium text-muted-foreground">Legend:</span>
              {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1">
                  <div className={cn('w-3 h-3 rounded', config.color)} />
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Quick Status Change Dialog */}
      {editingDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Change Attendance Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                {editingDate.toLocaleDateString('fa-IR')}
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
    </Card>
  )
}
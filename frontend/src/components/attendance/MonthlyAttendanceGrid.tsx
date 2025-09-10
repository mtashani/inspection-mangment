'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Users, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Inspector } from '@/types/inspector'
import { getAttendance } from '@/api/attendance'
// @ts-expect-error: No types for jalaali-js
import jalaali from 'jalaali-js'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface MonthlyAttendanceGridProps {
  inspectors: Inspector[]
  month: number // 0-11
  year: number
  onPrevMonth?: () => void
  onNextMonth?: () => void
}

// Persian/Jalali months
const jalaliMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']

// نوع داده دریافتی از API
interface AttendanceDayApi {
  date: string
  status: string
  jalali_date?: string
}

export function MonthlyAttendanceGrid({ 
  inspectors, 
  month, 
  year, 
  onPrevMonth, 
  onNextMonth 
}: MonthlyAttendanceGridProps) {
  // حذف داده mock و افزودن state برای داده واقعی
  const [attendanceDaysByInspector, setAttendanceDaysByInspector] = useState<Record<number, AttendanceDayApi[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store previous maxDays and inspectors for skeleton
  const [prevMaxDays, setPrevMaxDays] = useState<number>(31)
  const [prevInspectors, setPrevInspectors] = useState<typeof inspectors>(inspectors)

  const gDate = new Date(year, month, 1)
  const { jy: jalaliYear, jm: jalaliMonth } = jalaali.toJalaali(gDate)

  const tableScrollRef = useRef<HTMLDivElement>(null)
  const scrollPos = useRef<{ left: number; top: number }>({ left: 0, top: 0 })

  // Expose a method to parent if needed (for now, just document usage)
  // Usage: before changing month/year, call saveScrollPosition()
  const saveScrollPosition = () => {
    if (tableScrollRef.current) {
      scrollPos.current = {
        left: tableScrollRef.current.scrollLeft,
        top: tableScrollRef.current.scrollTop,
      }
    }
  }

  // Restore scroll after loading
  React.useEffect(() => {
    if (!loading && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = scrollPos.current.left
      tableScrollRef.current.scrollTop = scrollPos.current.top
    }
  }, [loading])

  useEffect(() => {
    if (!inspectors || inspectors.length === 0) return
    setLoading(true)
    setError(null)
    Promise.all(
      inspectors.map(inspector =>
        getAttendance(inspector.id, jalaliMonth, jalaliYear)
          .then(days => ({ inspectorId: inspector.id, days: (days as unknown as AttendanceDayApi[]) }))
          .catch(() => ({ inspectorId: inspector.id, days: [] as AttendanceDayApi[] }))
      )
    ).then(results => {
      const data: Record<number, AttendanceDayApi[]> = {}
      results.forEach(({ inspectorId, days }) => {
        data[inspectorId] = days
      })
      setAttendanceDaysByInspector(data)
    }).catch(() => {
      setError('خطا در دریافت داده حضور و غیاب')
    }).finally(() => {
      setLoading(false)
      // Update previous values after data loaded
      setPrevMaxDays(maxDays || 31)
      setPrevInspectors(inspectors)
    })
  }, [inspectors, jalaliMonth, jalaliYear])

  // Find the max days count among all inspectors for column headers
  const maxDays = Math.max(...Object.values(attendanceDaysByInspector).map(days => days?.length || 0), 0)

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'WORKING': return { text: 'W', color: 'bg-green-500 text-white' }
      case 'OVERTIME': return { text: 'O', color: 'bg-orange-500 text-white' }
      case 'RESTING': return { text: 'R', color: 'bg-blue-500 text-white' }
      case 'LEAVE': return { text: 'L', color: 'bg-yellow-500 text-white' }
      case 'SICK_LEAVE': return { text: 'S', color: 'bg-red-500 text-white' }
      case 'EMERGENCY': return { text: 'E', color: 'bg-purple-500 text-white' }
      case 'UNAVAILABLE': return { text: 'U', color: 'bg-gray-500 text-white' }
      default: return { text: '-', color: 'bg-gray-300 text-gray-600' }
    }
  }

  // Helper: Check if a day is today in Jalali
  const today = new Date()
  const { jy: todayJy, jm: todayJm, jd: todayJd } = jalaali.toJalaali(today)
  const isCurrentMonth = jalaliYear === todayJy && jalaliMonth === todayJm

  if (loading) {
    return <div className="p-8 text-center text-blue-600">در حال بارگذاری داده حضور و غیاب...</div>
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>
  }

  const renderHeader = () => (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center space-x-4">
        <div className="p-2.5 rounded-lg bg-primary/10 dark:bg-primary/20">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg text-foreground">Attendance Overview</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Track attendance and schedules</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onPrevMonth}
          className="hover:bg-accent/50"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-[140px] px-4 py-1.5 rounded-md bg-accent/50 text-center">
          <span className="text-sm font-medium text-foreground">
            {jalaliMonths[jalaliMonth - 1]} {jalaliYear}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onNextMonth}
          className="hover:bg-accent/50"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  const renderLegend = () => (
    <ScrollArea className="w-full">
      <div className="flex flex-wrap gap-2 mb-6 p-3 bg-muted/30 rounded-lg">
        {[
          { label: 'WORKING', color: 'bg-emerald-500 dark:bg-emerald-600', text: 'W' },
          { label: 'OVERTIME', color: 'bg-orange-500 dark:bg-orange-600', text: 'O' },
          { label: 'RESTING', color: 'bg-blue-500 dark:bg-blue-600', text: 'R' },
          { label: 'LEAVE', color: 'bg-amber-500 dark:bg-amber-600', text: 'L' },
          { label: 'SICK_LEAVE', color: 'bg-rose-500 dark:bg-rose-600', text: 'S' },
          { label: 'EMERGENCY', color: 'bg-purple-500 dark:bg-purple-600', text: 'E' },
          { label: 'UNAVAILABLE', color: 'bg-slate-500 dark:bg-slate-600', text: 'U' }
        ].map(item => (
          <Tooltip key={item.label}>
            <TooltipTrigger>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-background hover:bg-accent/20 transition-colors">
                <div className={`w-4 h-4 rounded-sm flex items-center justify-center text-white text-xs font-medium ${item.color}`}>
                  {item.text}
                </div>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">{item.label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-popover">
              {`${item.label} Status`}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </ScrollArea>
  )

  return (
    <Card className="bg-background">
      <CardHeader className="border-b border-border/50">
        {renderHeader()}
      </CardHeader>
      <CardContent className="pt-6">
        {renderLegend()}

        {/* Attendance Grid */}
        <div className="overflow-x-auto rounded-lg border bg-card" ref={tableScrollRef}>
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-8">
                <Skeleton className="h-8 w-[140px]" />
                <div className="flex-1 flex justify-end">
                  <Skeleton className="h-8 w-[200px]" />
                </div>
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-[180px]" />
                  <div className="flex-1 flex gap-2">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Skeleton key={j} className="h-8 w-8" />
                    ))}
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-medium sticky left-0 bg-card border-r border-border/50 w-[160px]">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground">Inspector</span>
                    </div>
                  </th>
                  {Array.from({ length: maxDays }, (_, i) => {
                    const day = i + 1
                    const isToday = isCurrentMonth && day === todayJd
                    return (
                      <th
                        key={day}
                        className={`text-center py-2 px-0.5 font-medium w-[28px] ${
                          isToday ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        <span className="text-[10px]">{day}</span>
                      </th>
                    )
                  })}
                  <th className="text-center py-2 px-2 font-medium bg-muted/20 border-l border-border/50 w-[60px]">
                    <span className="text-[10px] text-foreground">Total</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {inspectors.map((inspector, inspectorIndex) => (
                  <tr 
                    key={inspector.id} 
                    className={`border-b border-border/50 hover:bg-accent/5 transition-colors ${
                      inspectorIndex % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                    }`}
                  >
                    <td className="py-1.5 px-3 sticky left-0 bg-inherit border-r border-border/50">
                      <div>
                        <div className="font-medium text-xs text-foreground">{inspector.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{inspector.employee_id}</div>
                      </div>
                    </td>
                    {Array.from({ length: maxDays }, (_, i) => {
                      const dayObj = attendanceDaysByInspector[inspector.id]?.[i]
                      const status = dayObj?.status || 'absent'
                      const { text, color } = getStatusDisplay(status)
                      return (
                        <td key={i + 1} className="p-0.5 text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium mx-auto ${color} hover:opacity-90 transition-opacity`}
                              >
                                {text}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {`Day ${i + 1}: ${status}`}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      )
                    })}
                    <td className="text-center py-1.5 px-2 bg-muted/20 border-l border-border/50">
                      <Badge variant="secondary" className="font-medium text-[10px] px-1.5 py-0.5">
                        {attendanceDaysByInspector[inspector.id]?.filter(d => 
                          d.status === 'WORKING' || d.status === 'OVERTIME'
                        ).length || 0}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {/* Summary Row */}
                <tr className="border-t-2 border-border bg-muted/20">
                  <td className="py-2 px-3 font-medium sticky left-0 bg-muted/20 border-r border-border/50">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs text-foreground">Daily Total</span>
                    </div>
                  </td>
                  {Array.from({ length: maxDays }, (_, i) => (
                    <td key={i + 1} className="p-0.5 text-center">
                      <div className="w-5 h-5 bg-accent/40 flex items-center justify-center text-[10px] font-medium">
                        {inspectors.reduce((count, inspector) => {
                          const status = attendanceDaysByInspector[inspector.id]?.[i]?.status
                          return count + (status === 'WORKING' || status === 'OVERTIME' ? 1 : 0)
                        }, 0)}
                      </div>
                    </td>
                  ))}
                  <td className="text-center py-1.5 px-2 bg-primary/10 border-l border-border/50">
                    <div className="bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 inline-block min-w-[1.5rem]">
                      {inspectors.reduce((sum, inspector) => 
                        sum + (attendanceDaysByInspector[inspector.id]?.filter(d => 
                          d.status === 'WORKING' || d.status === 'OVERTIME'
                        ).length || 0), 0
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 p-4 bg-card border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Inspectors</div>
                <div className="text-lg font-semibold text-foreground">{inspectors.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Days in Month</div>
                <div className="text-lg font-semibold text-foreground">{maxDays}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Overall Attendance</div>
                <div className="text-lg font-semibold text-foreground">
                  {inspectors.length > 0 && maxDays > 0 ? 
                    Math.round((inspectors.reduce((sum, inspector) => 
                      sum + (attendanceDaysByInspector[inspector.id]?.filter(d => 
                        d.status === 'WORKING' || d.status === 'OVERTIME'
                      ).length || 0), 0
                    ) / (inspectors.length * maxDays)) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
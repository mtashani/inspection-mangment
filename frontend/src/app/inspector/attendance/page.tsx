'use client'

import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getAttendance } from '@/api/attendance'
import type { AttendanceDay } from '@/components/attendance/AttendanceCalendar'
// @ts-expect-error: No types for jalaali-js
import jalaali from 'jalaali-js'

export default function InspectorAttendancePage() {
  const { inspector } = useAuth()
  const [currentDate] = useState(new Date())
  const { jy: jalaliYear, jm: jalaliMonth } = jalaali.toJalaali(currentDate)
  const [attendanceData, setAttendanceData] = useState<AttendanceDay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inspector) return
    setLoading(true)
    setError(null)
    getAttendance(inspector.id, jalaliMonth, jalaliYear)
      .then(data => setAttendanceData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [inspector, jalaliMonth, jalaliYear])

  const jalaliMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]

  const daysInJalaliMonth = jalaliMonth <= 6 ? 31 : (jalaliMonth <= 11 ? 30 : 29)

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'WORKING': return { text: 'W', color: 'bg-green-500 text-white', title: 'Working Day' }
      case 'OVERTIME': return { text: 'O', color: 'bg-orange-500 text-white', title: 'Overtime Work' }
      case 'RESTING': return { text: 'R', color: 'bg-blue-500 text-white', title: 'Resting Day' }
      case 'LEAVE': return { text: 'L', color: 'bg-yellow-500 text-white', title: 'Leave' }
      case 'SICK_LEAVE': return { text: 'S', color: 'bg-red-500 text-white', title: 'Sick Leave' }
      default: return { text: '-', color: 'bg-gray-300 text-gray-600', title: 'Unknown' }
    }
  }

  if (!inspector) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your attendance.</p>
        </div>
      </div>
    )
  }
  if (loading) {
    return <div className="p-8 text-center text-blue-600">Loading...</div>
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>
  }
  if (!attendanceData || attendanceData.length === 0) {
    return <div className="p-8 text-center text-gray-600">داده‌ای برای نمایش وجود ندارد.</div>
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Attendance Schedule</h1>
        <p className="text-gray-600 mt-2">View your work schedule and attendance (Read-Only)</p>
      </div>

      {/* Inspector Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium">{inspector.name}</h2>
              <p className="text-gray-600">Employee ID: {inspector.employee_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Attendance Schedule - {jalaliMonths[jalaliMonth - 1]} {jalaliYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Read-Only Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              📋 <strong>Read-Only View:</strong> This is your attendance schedule for reference only. 
              Contact your administrator for any changes or corrections.
            </p>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
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
          </div>

          {/* Calendar Grid */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Month Overview</h4>
            <div className="flex flex-wrap gap-1 p-3 bg-white border rounded-lg">
              {Array.from({ length: daysInJalaliMonth }, (_, i) => {
                const day = i + 1
                const status = attendanceData[i]?.status
                const statusDisplay = getStatusDisplay(status)

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
                          transition-all duration-200 border
                          ${statusDisplay.color}
                        `}
                      >
                        {statusDisplay.text}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-green-600">
                  {attendanceData ? attendanceData.filter(s => s.status === 'WORKING').length : 0}
                </div>
                <div className="text-xs text-gray-600">Working</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-600">
                  {attendanceData ? attendanceData.filter(s => s.status === 'OVERTIME').length : 0}
                </div>
                <div className="text-xs text-gray-600">Overtime</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {attendanceData ? attendanceData.filter(s => s.status === 'RESTING').length : 0}
                </div>
                <div className="text-xs text-gray-600">Resting</div>
              </div>
              <div>
                <div className="text-xl font-bold text-yellow-600">
                  {attendanceData ? attendanceData.filter(s => s.status === 'LEAVE').length : 0}
                </div>
                <div className="text-xs text-gray-600">Leave</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-600">
                  {attendanceData ? Math.round(((attendanceData.filter(s => s.status === 'WORKING').length + attendanceData.filter(s => s.status === 'OVERTIME').length) / daysInJalaliMonth) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-600">Work Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
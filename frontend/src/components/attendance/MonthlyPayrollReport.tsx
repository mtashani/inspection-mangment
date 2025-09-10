'use client'

import { useMemo, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, Download, Calendar, Clock, Moon, Phone, Calculator } from 'lucide-react'
import { Inspector } from '@/types/inspector'
import { AttendanceDay } from './AttendanceCalendar'
import { getPayroll } from '@/api/payroll'

interface MonthlyPayrollReportProps {
  inspector: Inspector
  month: number // 0-11
  year: number
  attendanceData: AttendanceDay[]
  onExport?: () => void
}

interface PayrollSummary {
  totalWorkingDays: number
  totalRestingDays: number
  totalLeaveDays: number
  totalSickLeaveDays: number
  totalEmergencyDays: number
  totalUnavailableDays: number
  totalOvertimeHours: number
  totalNightShiftHours: number
  totalOnCallHours: number
  totalExtraHours: number
  daysWithExtraHours: number
}

export function MonthlyPayrollReport({
  inspector,
  month,
  year,
  attendanceData,
  onExport
}: MonthlyPayrollReportProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payrollData, setPayrollData] = useState<unknown>(null)

  useEffect(() => {
    if (!inspector) return
    setLoading(true)
    setError(null)
    getPayroll(inspector.id, month, year)
      .then(data => setPayrollData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [inspector, month, year])

  if (loading) {
    return <div className="p-8 text-center text-blue-600">در حال بارگذاری...</div>
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">خطا: {error}</div>
  }

  // اگر داده payrollData آماده است، از آن استفاده کن، وگرنه از attendanceData (برای سازگاری موقت)
  let data: any[] = []
  if (Array.isArray(payrollData)) {
    data = payrollData
  } else if (Array.isArray(attendanceData)) {
    data = attendanceData
  }

  const monthName = new Date(year, month).toLocaleDateString('fa-IR', { 
    month: 'long', 
    year: 'numeric' 
  })

  // Calculate payroll summary
  const payrollSummary = useMemo((): PayrollSummary => {
    const summary = {
      totalWorkingDays: 0,
      totalRestingDays: 0,
      totalLeaveDays: 0,
      totalSickLeaveDays: 0,
      totalEmergencyDays: 0,
      totalUnavailableDays: 0,
      totalOvertimeHours: 0,
      totalNightShiftHours: 0,
      totalOnCallHours: 0,
      totalExtraHours: 0,
      daysWithExtraHours: 0
    }

    data.forEach((day: any) => {
      // Count days by status
      switch (day.status) {
        case 'WORKING':
          summary.totalWorkingDays++
          break
        case 'RESTING':
          summary.totalRestingDays++
          break
        case 'LEAVE':
          summary.totalLeaveDays++
          break
        case 'SICK_LEAVE':
          summary.totalSickLeaveDays++
          break
        case 'EMERGENCY':
          summary.totalEmergencyDays++
          break
        case 'UNAVAILABLE':
          summary.totalUnavailableDays++
          break
      }
      // Count extra hours
      const overtime_hours = day.overtime_hours || 0
      const night_shift_hours = day.night_shift_hours || 0
      const on_call_hours = day.on_call_hours || 0
      summary.totalOvertimeHours += overtime_hours
      summary.totalNightShiftHours += night_shift_hours
      summary.totalOnCallHours += on_call_hours
      if (overtime_hours > 0 || night_shift_hours > 0 || on_call_hours > 0) {
        summary.daysWithExtraHours++
      }
    })

    summary.totalExtraHours = summary.totalOvertimeHours + summary.totalNightShiftHours + summary.totalOnCallHours

    return summary
  }, [data])

  // Sample rates (these would come from settings/config)
  const rates = {
    overtimeMultiplier: 1.5, // ضریب اضافه کاری
    nightShiftMultiplier: 2.0, // ضریب کار شب
    onCallMultiplier: 1.25, // ضریب آن کال
    baseSalary: 50000000 // حقوق پایه (ریال)
  }

  const calculateExtraPayment = () => {
    const hourlyRate = rates.baseSalary / (30 * 8) // حقوق ساعتی بر اساس 30 روز کاری 8 ساعته
    
    const overtimePay = payrollSummary.totalOvertimeHours * hourlyRate * rates.overtimeMultiplier
    const nightShiftPay = payrollSummary.totalNightShiftHours * hourlyRate * rates.nightShiftMultiplier
    const onCallPay = payrollSummary.totalOnCallHours * hourlyRate * rates.onCallMultiplier

    return {
      hourlyRate,
      overtimePay,
      nightShiftPay,
      onCallPay,
      totalExtraPay: overtimePay + nightShiftPay + onCallPay
    }
  }

  const payment = calculateExtraPayment()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount)) + ' ریال'
  }

  return (
    <Card className="border-2 border-green-200">
      <CardHeader className="bg-green-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <DollarSign className="w-5 h-5" />
            گزارش حقوق و دستمزد - {monthName}
          </CardTitle>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
          )}
        </div>
        <div className="text-sm text-green-600">
          {inspector.name} - {inspector.employee_id}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Days Summary */}
          <div>
            <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              خلاصه روزهای کاری
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-sm text-green-700">روزهای کاری</span>
                <Badge className="bg-green-600">{payrollSummary.totalWorkingDays} روز</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-sm text-blue-700">روزهای استراحت</span>
                <Badge className="bg-blue-600">{payrollSummary.totalRestingDays} روز</Badge>
              </div>
              
              {payrollSummary.totalLeaveDays > 0 && (
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span className="text-sm text-yellow-700">مرخصی</span>
                  <Badge className="bg-yellow-600">{payrollSummary.totalLeaveDays} روز</Badge>
                </div>
              )}
              
              {payrollSummary.totalSickLeaveDays > 0 && (
                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <span className="text-sm text-red-700">مرخصی استعلاجی</span>
                  <Badge className="bg-red-600">{payrollSummary.totalSickLeaveDays} روز</Badge>
                </div>
              )}

              {payrollSummary.totalEmergencyDays > 0 && (
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="text-sm text-purple-700">اضطراری</span>
                  <Badge className="bg-purple-600">{payrollSummary.totalEmergencyDays} روز</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Hours Summary */}
          <div>
            <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              خلاصه ساعات اضافی
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <span className="text-sm text-yellow-700 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  اضافه کاری
                </span>
                <Badge className="bg-yellow-600">{payrollSummary.totalOvertimeHours.toFixed(1)} ساعت</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="text-sm text-purple-700 flex items-center gap-2">
                  <Moon className="w-3 h-3" />
                  کار شب
                </span>
                <Badge className="bg-purple-600">{payrollSummary.totalNightShiftHours.toFixed(1)} ساعت</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                <span className="text-sm text-red-700 flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  آن کال
                </span>
                <Badge className="bg-red-600">{payrollSummary.totalOnCallHours.toFixed(1)} ساعت</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded border-2 border-gray-300">
                <span className="text-sm font-medium text-gray-800">مجموع ساعات اضافی</span>
                <Badge className="bg-gray-700 text-white font-bold">
                  {payrollSummary.totalExtraHours.toFixed(1)} ساعت
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Calculation */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
          <h3 className="font-medium text-green-800 mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            محاسبه پرداختی اضافی
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>نرخ ساعتی:</span>
                <span className="font-medium">{formatCurrency(payment.hourlyRate)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>اضافه کاری ({rates.overtimeMultiplier}x):</span>
                <span className="font-medium">{formatCurrency(payment.overtimePay)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>کار شب ({rates.nightShiftMultiplier}x):</span>
                <span className="font-medium">{formatCurrency(payment.nightShiftPay)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>آن کال ({rates.onCallMultiplier}x):</span>
                <span className="font-medium">{formatCurrency(payment.onCallPay)}</span>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="p-4 bg-white rounded border-2 border-green-300">
                <div className="text-center">
                  <div className="text-sm text-green-600 mb-1">مجموع پرداختی اضافی</div>
                  <div className="text-2xl font-bold text-green-800">
                    {formatCurrency(payment.totalExtraPay)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{data.length}</div>
            <div className="text-xs text-blue-600">کل روزها</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">{payrollSummary.daysWithExtraHours}</div>
            <div className="text-xs text-yellow-600">روز با ساعت اضافی</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">
              {payrollSummary.totalWorkingDays > 0 ? 
                Math.round((payrollSummary.totalExtraHours / payrollSummary.totalWorkingDays) * 10) / 10 : 0}
            </div>
            <div className="text-xs text-green-600">میانگین ساعت اضافی/روز</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((payrollSummary.totalExtraHours / (payrollSummary.totalExtraHours + (payrollSummary.totalWorkingDays * 8))) * 100)}%
            </div>
            <div className="text-xs text-purple-600">درصد ساعات اضافی</div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p className="font-medium mb-1">نکات:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>محاسبات بر اساس نرخ‌های تعریف شده در سیستم</li>
            <li>ساعات اضافه کاری شامل ضریب {rates.overtimeMultiplier} برابری</li>
            <li>ساعات کار شب شامل ضریب {rates.nightShiftMultiplier} برابری</li>
            <li>ساعات آن کال شامل ضریب {rates.onCallMultiplier} برابری</li>
            <li>این گزارش قابل export به Excel می‌باشد</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
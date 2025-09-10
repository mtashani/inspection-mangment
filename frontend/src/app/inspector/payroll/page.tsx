'use client'

import { useAuth } from '@/contexts/auth-context'
import { MonthlyPayrollReport } from '@/components/attendance/MonthlyPayrollReport'
import { getPayroll } from '@/api/payroll'
import { useEffect, useState } from 'react'

export default function InspectorPayrollPage() {
  const { inspector } = useAuth()
  const [currentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear] = useState(new Date().getFullYear())
  const [payrollData, setPayrollData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inspector) return
    setLoading(true)
    setError(null)
    getPayroll(inspector.id, currentMonth, currentYear)
      .then(data => setPayrollData(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [inspector, currentMonth, currentYear])

  if (!inspector) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to view your payroll.</p>
        </div>
      </div>
    )
  }
  if (loading) {
    return <div className="p-8 text-center text-blue-600">در حال بارگذاری...</div>
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">خطا: {error}</div>
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <MonthlyPayrollReport inspector={inspector} month={currentMonth} year={currentYear} attendanceData={payrollData} />
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useInspectors } from '@/contexts/inspectors-context'
import { AdminOnly, AccessDenied } from '@/components/auth/permission-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Users, Settings, Clock } from 'lucide-react'
import { CycleStartDatePicker, CycleType } from '@/components/attendance/CycleStartDatePicker'
import { Inspector } from '@/types/inspector'
import { MonthlyAttendanceGrid } from '@/components/attendance/MonthlyAttendanceGrid'
import { getInspectors } from '@/api/inspectors'

export default function AttendanceManagementPage() {
  const [inspectors, setInspectors] = useState<Inspector[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(null)
  const [showCycleManager, setShowCycleManager] = useState(false)
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }
  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  // Auto-select first inspector if available
  useEffect(() => {
    setLoading(true)
    getInspectors(true)
      .then(data => setInspectors(data))
      .finally(() => setLoading(false))
  }, [])

  const handleInspectorChange = (inspectorId: string) => {
    const inspector = inspectors?.find(i => i.id.toString() === inspectorId)
    setSelectedInspector(inspector || null)
    setShowCycleManager(false)
  }

  const handleDateSelect = (date: Date, cycleType: CycleType) => {
    // TODO: API call to create new cycle
    console.log('Creating new cycle:', { 
      inspectorId: selectedInspector?.id,
      startDate: date,
      cycleType 
    })
    
    // For now, just hide the cycle manager
    setShowCycleManager(false)
    
    // Show success message
    alert(`New cycle created for ${selectedInspector?.name} starting from ${date.toLocaleDateString('fa-IR')}`)
  }

  const handlePreview = (date: Date, cycleType: CycleType) => {
    // TODO: Generate preview data
    console.log('Previewing cycle:', { 
      inspectorId: selectedInspector?.id,
      startDate: date,
      cycleType 
    })
  }

  const handleReset = (inspector: Inspector) => {
    // TODO: API call to reset cycle
    console.log('Resetting cycle for inspector:', inspector.id)
    
    if (confirm(`Are you sure you want to reset work cycle for ${inspector.name}?`)) {
      alert(`Work cycle for ${inspector.name} has been reset`)
      setShowCycleManager(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  if (!inspectors || inspectors.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">هیچ بازرس فعالی یافت نشد.</div>
      </div>
    )
  }

  return (
    <AdminOnly fallback={<AccessDenied />}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-2">
            Manage inspector work schedules and attendance cycles
          </p>
        </div>

        {/* Inspector Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Inspector Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <Select
                  value={selectedInspector?.id.toString() || ''}
                  onValueChange={handleInspectorChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select inspector for attendance management" />
                  </SelectTrigger>
                  <SelectContent>
                    {(inspectors || []).map((inspector) => (
                      <SelectItem key={inspector.id} value={inspector.id.toString()}>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{inspector.name}</span>
                          <span className="text-sm text-gray-500">({inspector.employee_id})</span>
                          <div className="flex gap-1">
                            {inspector.specialties?.map(specialty => (
                              <Badge key={specialty} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedInspector && (
                <Button
                  onClick={() => setShowCycleManager(!showCycleManager)}
                  variant={showCycleManager ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {showCycleManager ? 'Hide Cycle Manager' : 'Manage Cycle'}
                </Button>
              )}
            </div>
            
            {selectedInspector && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Selected Inspector</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium ml-2">{selectedInspector.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="font-medium ml-2">{selectedInspector.employee_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={selectedInspector.active ? "default" : "secondary"} className="ml-2">
                      {selectedInspector.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cycle Manager */}
        {selectedInspector && showCycleManager && (
          <div className="mb-6">
            <CycleStartDatePicker
              inspector={selectedInspector}
              onDateSelect={handleDateSelect}
              onPreview={handlePreview}
              onReset={handleReset}
            />
          </div>
        )}

        {/* جدول حضور و غیاب */}
        <div className="mt-8">
          <MonthlyAttendanceGrid inspectors={inspectors} month={month} year={year} onPrevMonth={goToPrevMonth} onNextMonth={goToNextMonth} />
        </div>

      </div>
    </AdminOnly>
  )
}
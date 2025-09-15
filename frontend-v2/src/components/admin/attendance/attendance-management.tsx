'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Calendar, 
  Settings, 
  Download, 
  Upload,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { AttendanceCalendar } from './attendance-calendar'
import { LinearAttendanceCalendar } from './linear-attendance-calendar'
import { WorkCycleManager } from './work-cycle-manager'
import { AttendanceReports } from './attendance-reports'
import { AttendanceAnalytics } from './attendance-analytics'
import { AttendanceOverride } from './attendance-override'
import { AttendanceApproval } from './attendance-approval'
import { Inspector, AttendanceRecord, WorkCycle, AttendanceStatus } from '@/types/admin'
import { 
  getInspectorAttendance, 
  getJalaliMonthlyAttendance,  // Changed: Use Jalali API
  updateAttendanceRecord,
  createAttendanceRecord,
  getInspectorWorkCycle,
  createWorkCycle,
  updateWorkCycle,
  resetWorkCycle,
  deleteWorkCycle
} from '@/lib/api/admin/attendance'
import { getInspectors } from '@/lib/api/admin/inspectors'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  getCurrentJalaliDate,
  getPreviousJalaliMonth,
  getNextJalaliMonth
} from '@/lib/utils/jalali'

interface AttendanceManagementProps {
  className?: string
}

export function AttendanceManagement({ className }: AttendanceManagementProps) {
  const [inspectors, setInspectors] = useState<Inspector[]>([])
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [workCycle, setWorkCycle] = useState<WorkCycle | null>(null)
  
  // Changed: Use Jalali calendar
  const currentJalali = getCurrentJalaliDate()
  const [currentJalaliMonth, setCurrentJalaliMonth] = useState(currentJalali.jm)
  const [currentJalaliYear, setCurrentJalaliYear] = useState(currentJalali.jy)
  
  const [loading, setLoading] = useState(false)
  const [inspectorsLoading, setInspectorsLoading] = useState(true)
  const [showOverride, setShowOverride] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const { toast } = useToast()

  const loadInspectors = async () => {
    try {
      setInspectorsLoading(true)
      const response = await getInspectors(1, 100, { active: true })
      setInspectors(response.data)
      
      // Auto-select first inspector if available
      if (response.data.length > 0 && !selectedInspector) {
        setSelectedInspector(response.data[0])
      }
    } catch (error) {
      console.error('Failed to load inspectors:', error)
      toast({
        title: 'Error',
        description: 'Failed to load inspectors',
        variant: 'destructive'
      })
    } finally {
      setInspectorsLoading(false)
    }
  }

  const loadAttendanceData = async () => {
    if (!selectedInspector) return

    try {
      setLoading(true)
      // Changed: Use Jalali API
      const data = await getJalaliMonthlyAttendance(
        selectedInspector.id,
        currentJalaliYear,
        currentJalaliMonth
      )
      setAttendanceData(data.map(day => ({
        id: Math.random(), // Temporary ID for calendar days
        inspectorId: selectedInspector.id,
        date: day.date,
        status: day.status,
        workHours: day.workHours,
        overtimeHours: day.overtimeHours,
        notes: '',
        isOverride: day.isOverride,
        overrideReason: day.overrideReason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })))
    } catch (error) {
      console.error('Failed to load attendance data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadWorkCycle = async () => {
    if (!selectedInspector) return

    try {
      const cycle = await getInspectorWorkCycle(selectedInspector.id)
      setWorkCycle(cycle)
    } catch (error) {
      console.error('Failed to load work cycle:', error)
      // Don't show error toast for missing work cycle as it's optional
    }
  }

  // Load inspectors on component mount
  useEffect(() => {
    loadInspectors()
  }, [])

  // Load attendance data when inspector or Jalali month changes
  useEffect(() => {
    if (selectedInspector) {
      loadAttendanceData()
      loadWorkCycle()
    }
  }, [selectedInspector, currentJalaliMonth, currentJalaliYear])

  const handleInspectorChange = (inspectorId: string) => {
    const inspector = inspectors.find(i => i.id.toString() === inspectorId)
    if (inspector) {
      setSelectedInspector(inspector)
    }
  }

  const handleDateClick = (date: Date) => {
    // Find existing record for this date
    const dateString = date.toISOString().split('T')[0]
    const existingRecord = attendanceData.find(record => record.date === dateString)
    
    setSelectedRecord(existingRecord || null)
    setShowOverride(true)
  }

  const handleStatusChange = async (date: Date, status: AttendanceStatus) => {
    if (!selectedInspector) return

    try {
      const dateString = date.toISOString().split('T')[0]
      
      // Find existing record for this date
      const existingRecord = attendanceData.find(
        record => record.date === dateString
      )

      if (existingRecord) {
        // Update existing record
        await updateAttendanceRecord(existingRecord.id, {
          status,
          isOverride: true,
          overrideReason: 'Manual status change'
        })
      } else {
        // Create new record
        await createAttendanceRecord({
          inspectorId: selectedInspector.id,
          date: dateString,
          status,
          workHours: status === 'WORKING' ? 8 : 0,
          overtimeHours: 0,
          notes: 'Manual entry'
        })
      }

      // Reload attendance data
      await loadAttendanceData()
      
      toast({
        title: 'Success',
        description: 'Attendance status updated successfully'
      })
    } catch (error) {
      console.error('Failed to update attendance:', error)
      toast({
        title: 'Error',
        description: 'Failed to update attendance status',
        variant: 'destructive'
      })
    }
  }

  const handleMonthChange = (jalaliMonth: number, jalaliYear: number) => {
    setCurrentJalaliMonth(jalaliMonth)
    setCurrentJalaliYear(jalaliYear)
  }

  const handleCreateWorkCycle = async (data: any) => {
    if (!selectedInspector) return

    try {
      const newCycle = await createWorkCycle(selectedInspector.id, data)
      setWorkCycle(newCycle)
      toast({
        title: 'Success',
        description: 'Work cycle created successfully'
      })
    } catch (error) {
      console.error('Failed to create work cycle:', error)
      toast({
        title: 'Error',
        description: 'Failed to create work cycle',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateWorkCycle = async (id: number, data: any) => {
    try {
      const updatedCycle = await updateWorkCycle(id, data)
      setWorkCycle(updatedCycle)
      toast({
        title: 'Success',
        description: 'Work cycle updated successfully'
      })
    } catch (error) {
      console.error('Failed to update work cycle:', error)
      toast({
        title: 'Error',
        description: 'Failed to update work cycle',
        variant: 'destructive'
      })
    }
  }

  const handleResetWorkCycle = async (inspectorId: number, newStartDate: string) => {
    try {
      const newCycle = await resetWorkCycle(inspectorId, newStartDate)
      setWorkCycle(newCycle)
      toast({
        title: 'Success',
        description: 'Work cycle reset successfully'
      })
    } catch (error) {
      console.error('Failed to reset work cycle:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset work cycle',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteWorkCycle = async (id: number) => {
    try {
      await deleteWorkCycle(id)
      setWorkCycle(null)
      toast({
        title: 'Success',
        description: 'Work cycle deleted successfully'
      })
    } catch (error) {
      console.error('Failed to delete work cycle:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete work cycle',
        variant: 'destructive'
      })
    }
  }

  const getAttendanceStats = () => {
    if (!attendanceData.length) return null

    const totalDays = attendanceData.length
    const workingDays = attendanceData.filter(r => r.status === 'WORKING').length
    const restingDays = attendanceData.filter(r => r.status === 'RESTING').length
    const overtimeDays = attendanceData.filter(r => r.status === 'OVERTIME').length
    const absentDays = attendanceData.filter(r => 
      ['ABSENT', 'SICK_LEAVE', 'VACATION'].includes(r.status)
    ).length
    const totalWorkHours = attendanceData.reduce((sum, r) => sum + r.workHours, 0)
    const totalOvertimeHours = attendanceData.reduce((sum, r) => sum + r.overtimeHours, 0)

    return {
      totalDays,
      workingDays,
      restingDays,
      overtimeDays,
      absentDays,
      totalWorkHours,
      totalOvertimeHours,
      attendanceRate: totalDays > 0 ? (workingDays / totalDays) * 100 : 0
    }
  }

  const stats = getAttendanceStats()

  if (inspectorsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">
            Manage inspector attendance, work cycles, and schedules
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Inspector Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Inspector Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspectors.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select
                  value={selectedInspector?.id.toString() || ''}
                  onValueChange={handleInspectorChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an inspector" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectors.map((inspector) => (
                      <SelectItem key={inspector.id} value={inspector.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{inspector.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({inspector.employeeId})
                          </span>
                          {inspector.attendanceTrackingEnabled && (
                            <Badge variant="secondary" className="text-xs">
                              Tracking Enabled
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Specialties section removed - no longer applicable */}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active inspectors found. Please create inspectors first.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      {selectedInspector ? (
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="work-cycle" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Work Cycle
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Statistics Summary */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.workingDays}</div>
                  <p className="text-xs text-muted-foreground">Working Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.restingDays}</div>
                  <p className="text-xs text-muted-foreground">Resting Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.overtimeDays}</div>
                  <p className="text-xs text-muted-foreground">Overtime Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.absentDays}</div>
                  <p className="text-xs text-muted-foreground">Absent Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.totalWorkHours}</div>
                  <p className="text-xs text-muted-foreground">Work Hours</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.totalOvertimeHours}</div>
                  <p className="text-xs text-muted-foreground">Overtime Hours</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Attendance Rate</p>
                </CardContent>
              </Card>
            </div>
          )}

          <TabsContent value="calendar" className="space-y-6">
            <LinearAttendanceCalendar
              inspector={selectedInspector}
              month={currentJalaliMonth}     // Use Jalali month but keep prop name for compatibility
              year={currentJalaliYear}       // Use Jalali year but keep prop name for compatibility
              attendanceData={attendanceData}
              onDateClick={handleDateClick}
              onStatusChange={handleStatusChange}
              onMonthChange={handleMonthChange}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="work-cycle" className="space-y-6">
            <WorkCycleManager
              inspector={selectedInspector}
              workCycle={workCycle}
              onCreateCycle={handleCreateWorkCycle}
              onUpdateCycle={handleUpdateWorkCycle}
              onResetCycle={handleResetWorkCycle}
              onDeleteCycle={handleDeleteWorkCycle}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <AttendanceReports
              inspectors={inspectors}
              onGenerateReport={async (filters) => {
                console.log('Generate report with filters:', filters)
                toast({
                  title: 'Report Generated',
                  description: 'Attendance report has been generated successfully'
                })
              }}
              onExportData={async (filters, format) => {
                console.log('Export data:', filters, format)
                toast({
                  title: 'Export Started',
                  description: `Exporting attendance data as ${format}`
                })
              }}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AttendanceAnalytics
              inspectors={inspectors}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <AttendanceApproval
              pendingApprovals={[]}
              onApprove={async (id, comments) => {
                console.log('Approve:', id, comments)
                toast({
                  title: 'Approved',
                  description: 'Attendance override has been approved'
                })
              }}
              onReject={async (id, reason) => {
                console.log('Reject:', id, reason)
                toast({
                  title: 'Rejected',
                  description: 'Attendance override has been rejected',
                  variant: 'destructive'
                })
              }}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Export & Import</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bulk operations will be implemented in task 7 (Bulk Operations System)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <Users className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">No Inspector Selected</h3>
              <p className="text-muted-foreground">
                Please select an inspector to manage their attendance
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Override Dialog */}
      {showOverride && selectedInspector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <AttendanceOverride
              inspector={selectedInspector}
              attendanceRecord={selectedRecord || undefined}
              onOverride={async (data) => {
                console.log('Override data:', data)
                
                // In real implementation, this would call the API
                if (selectedRecord) {
                  await updateAttendanceRecord(selectedRecord.id, {
                    status: data.status,
                    workHours: data.workHours,
                    overtimeHours: data.overtimeHours,
                    isOverride: true,
                    overrideReason: data.reason
                  })
                } else {
                  await createAttendanceRecord({
                    inspectorId: selectedInspector.id,
                    date: data.date,
                    status: data.status,
                    workHours: data.workHours,
                    overtimeHours: data.overtimeHours,
                    notes: data.notes || ''
                  })
                }

                await loadAttendanceData()
                setShowOverride(false)
                setSelectedRecord(null)
                
                toast({
                  title: 'Success',
                  description: data.requiresApproval 
                    ? 'Override submitted for approval' 
                    : 'Attendance record updated successfully'
                })
              }}
              onCancel={() => {
                setShowOverride(false)
                setSelectedRecord(null)
              }}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  )
}
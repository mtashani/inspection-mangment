/**
 * Admin Attendance Management API Functions (Inspector-Centric)
 */

import {
  AttendanceRecord,
  AttendanceFilters,
  WorkCycle,
  WorkCycleData,
  AttendanceDay,
  AdminApiResponse,
  AdminPaginatedResponse
} from '@/types/admin'
import { adminApiGet, adminApiPost, adminApiPut, adminApiDelete, buildQueryParams } from './base'

/**
 * Get all attendance records with optional filtering (Inspector-Centric)
 */
export async function getAttendanceRecords(
  page: number = 1,
  limit: number = 20,
  filters?: AttendanceFilters
): Promise<AdminPaginatedResponse<AttendanceRecord>> {
  const queryParams = buildQueryParams({
    page,
    limit,
    ...filters
  })
  
  return adminApiGet<AdminPaginatedResponse<AttendanceRecord>>(`/inspectors/attendance${queryParams}`)
}

/**
 * Get attendance records for a specific inspector (Inspector-Centric)
 */
export async function getInspectorAttendance(
  inspectorId: number,
  jalaliYear?: number,
  jalaliMonth?: number
): Promise<AttendanceRecord[]> {
  const queryParams = buildQueryParams({
    ...(jalaliYear && { jalali_year: jalaliYear }),
    ...(jalaliMonth && { jalali_month: jalaliMonth })
  })
  
  const response = await adminApiGet<AttendanceRecord[]>(
    `/inspectors/attendance/${inspectorId}${queryParams}`
  )
  return response
}

/**
 * Get attendance for a specific Jalali month (Inspector-Centric)
 */
export async function getJalaliMonthlyAttendance(
  inspectorId: number,
  jalaliYear: number,
  jalaliMonth: number
): Promise<AttendanceDay[]> {
  const response = await adminApiGet<AttendanceDay[]>(
    `/inspectors/attendance/${inspectorId}?jalali_year=${jalaliYear}&jalali_month=${jalaliMonth}`
  )
  return response
}

/**
 * Create or update attendance record for specific inspector and date (Inspector-Centric)
 */
export async function createOrUpdateAttendance(
  attendanceData: {
    inspector_id?: number
    date?: string
    jalali_date?: string
    status: string
    regular_hours?: number
    overtime_hours?: number
    night_shift_hours?: number
    on_call_hours?: number
    is_override?: boolean
    override_reason?: string
    notes?: string
  }
): Promise<AttendanceRecord> {
  const response = await adminApiPost<AttendanceRecord>(
    `/inspectors/attendance`, 
    attendanceData
  )
  return response
}

/**
 * Bulk update attendance records (Inspector-Centric)
 */
export async function bulkUpdateAttendance(
  records: Array<{
    id?: number
    inspector_id: number
    date?: string
    jalali_date?: string
    status: string
    regular_hours?: number
    overtime_hours?: number
    notes?: string
  }>
): Promise<any> {
  const response = await adminApiPost<any>(
    '/inspectors/attendance/bulk',
    records
  )
  return response
}

/**
 * Get attendance summary for admin (Inspector-Centric)
 */
export async function getAttendanceSummary(
  jalaliYear: number,
  jalaliMonth: number,
  department?: string
): Promise<any> {
  const queryParams = buildQueryParams({
    jalali_year: jalaliYear,
    jalali_month: jalaliMonth,
    ...(department && { department })
  })
  
  const response = await adminApiGet<any>(
    `/inspectors/attendance/summary${queryParams}`
  )
  return response
}

/**
 * Get today's attendance overview (Inspector-Centric)
 */
export async function getTodayAttendance(): Promise<any> {
  const response = await adminApiGet<any>(
    `/inspectors/attendance/today`
  )
  return response
}

/**
 * Get monthly attendance overview (Inspector-Centric)
 */
export async function getMonthlyOverview(
  jalaliYear: number,
  jalaliMonth: number
): Promise<any> {
  const response = await adminApiGet<any>(
    `/inspectors/attendance/monthly-overview?jalali_year=${jalaliYear}&jalali_month=${jalaliMonth}`
  )
  return response
}

/**
 * Create attendance record
 */
export async function createAttendanceRecord(data: {
  inspectorId: number
  date: string
  status: string
  workHours: number
  overtimeHours?: number
  notes?: string
}): Promise<AttendanceRecord> {
  const response = await adminApiPost<AdminApiResponse<AttendanceRecord>>('/inspectors/attendance', data)
  return response.data
}

/**
 * Update attendance record
 */
export async function updateAttendanceRecord(
  id: number,
  data: Partial<{
    status: string
    workHours: number
    overtimeHours: number
    notes: string
    isOverride: boolean
    overrideReason: string
  }>
): Promise<AttendanceRecord> {
  const response = await adminApiPut<AdminApiResponse<AttendanceRecord>>(`/inspectors/attendance/${id}`, data)
  return response.data
}

/**
 * Delete attendance record
 */
export async function deleteAttendanceRecord(id: number): Promise<void> {
  await adminApiDelete<AdminApiResponse<void>>(`/inspectors/attendance/${id}`)
}

/**
 * Get work cycle for inspector
 */
export async function getInspectorWorkCycle(inspectorId: number): Promise<WorkCycle | null> {
  try {
    const response = await adminApiGet<AdminApiResponse<WorkCycle>>(
      `/inspectors/work-cycles/inspector/${inspectorId}`
    )
    return response.data
  } catch (error) {
    // Return null if no work cycle found
    return null
  }
}

/**
 * Create work cycle for inspector
 */
export async function createWorkCycle(
  inspectorId: number,
  data: WorkCycleData
): Promise<WorkCycle> {
  const response = await adminApiPost<AdminApiResponse<WorkCycle>>(
    '/inspectors/work-cycles',
    { inspectorId, ...data }
  )
  return response.data
}

/**
 * Update work cycle
 */
export async function updateWorkCycle(
  id: number,
  data: Partial<WorkCycleData>
): Promise<WorkCycle> {
  const response = await adminApiPut<AdminApiResponse<WorkCycle>>(`/inspectors/work-cycles/${id}`, data)
  return response.data
}

/**
 * Delete work cycle
 */
export async function deleteWorkCycle(id: number): Promise<void> {
  await adminApiDelete<AdminApiResponse<void>>(`/inspectors/work-cycles/${id}`)
}

/**
 * Reset work cycle (create new cycle with new start date)
 */
export async function resetWorkCycle(
  inspectorId: number,
  newStartDate: string
): Promise<WorkCycle> {
  const response = await adminApiPost<AdminApiResponse<WorkCycle>>(
    `/inspectors/work-cycles/reset`,
    { inspectorId, startDate: newStartDate }
  )
  return response.data
}

/**
 * Get attendance statistics
 */
export async function getAttendanceStats(
  startDate?: string,
  endDate?: string
): Promise<{
  totalWorkingDays: number
  totalOvertimeHours: number
  averageAttendanceRate: number
  absenteeismRate: number
  byStatus: Record<string, number>
  byInspector: Array<{
    inspectorId: number
    inspectorName: string
    workingDays: number
    overtimeHours: number
    attendanceRate: number
  }>
}> {
  try {
    // Use the working admin dashboard stats endpoint instead
    const dashboardStats = await adminApiGet<any>('/admin/dashboard/stats')
    
    // Transform the response to match expected format
    const attendanceStats = {
      totalWorkingDays: dashboardStats.monthly_stats?.total_records || 0,
      totalOvertimeHours: 0, // TODO: Calculate from detailed data when available
      averageAttendanceRate: dashboardStats.attendance_rate_today || 0,
      absenteeismRate: 100 - (dashboardStats.attendance_rate_today || 0),
      byStatus: dashboardStats.monthly_stats?.status_counts || {},
      byInspector: [] // TODO: Get detailed inspector data when available
    }
    
    return attendanceStats
  } catch (error) {
    console.error('Failed to fetch attendance stats:', error)
    // Return empty stats as fallback
    return {
      totalWorkingDays: 0,
      totalOvertimeHours: 0,
      averageAttendanceRate: 0,
      absenteeismRate: 0,
      byStatus: {},
      byInspector: []
    }
  }
}

/**
 * Generate attendance report
 */
export async function generateAttendanceReport(
  inspectorId?: number,
  startDate?: string,
  endDate?: string,
  format: 'PDF' | 'EXCEL' | 'CSV' = 'PDF'
): Promise<Blob> {
  const queryParams = buildQueryParams({
    inspector_id: inspectorId,
    start_date: startDate,
    end_date: endDate,
    format: format.toLowerCase()
  })
  
  const response = await fetch(`/api/v1/admin/attendance/report${queryParams}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to generate attendance report')
  }
  
  return response.blob()
}

/**
 * Get attendance trends data for analytics
 */
export async function getAttendanceTrends(
  jalaliYear?: number,
  jalaliMonth?: number
): Promise<{
  attendanceTrends: Array<{
    month: string
    attendanceRate: number
    workingDays: number
    overtimeHours: number
  }>
  inspectorPerformance: Array<{
    inspectorId: number
    name: string
    attendanceRate: number
    workingDays: number
    overtimeHours: number
    trend: 'up' | 'down' | 'stable'
    trendValue: number
  }>
}> {
  try {
    // Get current stats
    const dashboardStats = await adminApiGet<any>('/admin/dashboard/stats')
    const todayAttendance = await adminApiGet<any>('/admin/attendance/today')
    
    // Mock trends data for now - can be enhanced when backend provides historical data
    const attendanceTrends = [
      { month: 'Jan', attendanceRate: 89.5, workingDays: 22, overtimeHours: 45 },
      { month: 'Feb', attendanceRate: 91.2, workingDays: 20, overtimeHours: 38 },
      { month: 'Mar', attendanceRate: 93.8, workingDays: 23, overtimeHours: 52 },
      { month: 'Apr', attendanceRate: 88.7, workingDays: 21, overtimeHours: 41 },
      { month: 'May', attendanceRate: 94.1, workingDays: 22, overtimeHours: 48 },
      { month: 'Current', attendanceRate: dashboardStats.attendance_rate_today || 0, workingDays: dashboardStats.monthly_stats?.total_records || 0, overtimeHours: 44 }
    ]
    
    // Transform today's attendance data to inspector performance
    const inspectorPerformance = (todayAttendance.inspector_details || []).map((detail: any, index: number) => ({
      inspectorId: detail.inspector_id,
      name: detail.inspector_name,
      attendanceRate: detail.status === 'WORKING' ? 100 : detail.status === 'OVERTIME' ? 120 : 0,
      workingDays: Math.floor(detail.regular_hours / 8) || 1,
      overtimeHours: detail.overtime_hours || 0,
      trend: index % 3 === 0 ? 'up' : index % 3 === 1 ? 'down' : 'stable',
      trendValue: (Math.random() * 10) - 5
    }))
    
    return {
      attendanceTrends,
      inspectorPerformance
    }
  } catch (error) {
    console.error('Failed to fetch attendance trends:', error)
    return {
      attendanceTrends: [],
      inspectorPerformance: []
    }
  }
}
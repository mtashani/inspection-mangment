/**
 * Admin Reports API Functions (Inspector-Centric)
 */

import { adminApiGet, adminApiPost, buildQueryParams } from './base'

/**
 * Get available inspector attendance reports (Inspector-Centric)
 */
export async function getAvailableReports(): Promise<any> {
  const response = await adminApiGet<any>('/inspectors/attendance/reports')
  return response
}

/**
 * Generate inspector attendance report (Inspector-Centric)
 */
export async function generateAttendanceReport(filters: any): Promise<any> {
  const response = await adminApiPost<any>('/inspectors/attendance/reports', filters)
  return response
}

/**
 * Get specific inspector attendance report (Inspector-Centric)
 */
export async function getSpecificReport(
  reportId: string,
  jalaliYear: number,
  jalaliMonth: number
): Promise<any> {
  const response = await adminApiGet<any>(
    `/inspectors/attendance/reports/${reportId}?jalali_year=${jalaliYear}&jalali_month=${jalaliMonth}`
  )
  return response
}

/**
 * Export inspector attendance data in specified format (Inspector-Centric)
 */
export async function exportData(
  format: string,
  filters: any
): Promise<Blob> {
  const url = `/inspectors/attendance/reports/export`
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
    body: JSON.stringify({
      format,
      filters
    })
  })
  
  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`)
  }
  
  return response.blob()
}

/**
 * Bulk export inspector attendance data (Inspector-Centric)
 */
export async function bulkExportData(bulkRequest: any): Promise<Blob> {
  const url = `/inspectors/attendance/reports/bulk-export`
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
    },
    body: JSON.stringify(bulkRequest)
  })
  
  if (!response.ok) {
    throw new Error(`Bulk export failed: ${response.statusText}`)
  }
  
  return response.blob()
}

/**
 * Get available export formats for inspector attendance reports (Inspector-Centric)
 */
export async function getAvailableFormats(): Promise<any> {
  const response = await adminApiGet<any>('/inspectors/attendance/reports/formats')
  return response
}

/**
 * Get inspector attendance report templates (Inspector-Centric)
 */
export async function getReportTemplates(): Promise<any> {
  const response = await adminApiGet<any>('/inspectors/attendance/reports/templates')
  return response
}

/**
 * Schedule recurring inspector attendance report (Inspector-Centric)
 */
export async function scheduleRecurringReport(scheduleData: any): Promise<any> {
  const response = await adminApiPost<any>('/inspectors/attendance/reports/schedule', scheduleData)
  return response
}

/**
 * Get scheduled inspector attendance reports (Inspector-Centric)
 */
export async function getScheduledReports(): Promise<any> {
  const response = await adminApiGet<any>('/inspectors/attendance/reports/scheduled')
  return response
}
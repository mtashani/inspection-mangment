import { DailyReport, InspectionGroup, NewInspectionFormValues, ReportFormValues, InspectionStatus } from "@/components/daily-reports/types"

const API_BASE = 'http://localhost:8000/api/v1/daily-reports'
const INSPECTIONS_BASE = 'http://localhost:8000/api/v1/inspections'

interface BackendInspector {
  id: number
  name: string
}

interface BackendDailyReport {
  id: number
  inspection_id: number
  report_date: string
  description: string
  inspectors: BackendInspector[]
  inspection: {
    status: InspectionStatus
  }
}

interface BackendInspection {
  id: number
  equipment_code: string
  start_date: string
  status: InspectionStatus
  daily_reports: BackendDailyReport[]
}

type StatusFilter = InspectionStatus | 'all'

// Transform backend inspection to frontend InspectionGroup
const transformInspection = (inspection: BackendInspection): InspectionGroup => ({
  id: String(inspection.id),
  equipmentTag: inspection.equipment_code,
  startDate: inspection.start_date,
  status: inspection.status,
  reports: inspection.daily_reports.map(transformDailyReport)
})

// Transform backend daily report to frontend DailyReport
const transformDailyReport = (report: BackendDailyReport): DailyReport => ({
  id: String(report.id),
  inspectionId: String(report.inspection_id),
  date: report.report_date,
  inspectors: report.inspectors.map(i => String(i.id)),
  description: report.description,
  status: report.inspection.status
})

// API error handling utility
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new ApiError(response.status, error.detail || 'An unexpected error occurred')
  }
  
  try {
    const data = await response.json()
    return data as T
  } catch (err) {
    console.error('Failed to parse response:', err)
    throw new ApiError(500, 'Failed to parse response data')
  }
}

// Get all inspections with their daily reports
export const getInspections = async (
  status?: StatusFilter,
  page: number = 1,
  pageSize: number = 10,
  dateRange?: { from: string; to: string }
): Promise<{ data: InspectionGroup[]; total: number }> => {
  try {
    let url = `${API_BASE}/inspections?page=${page}&page_size=${pageSize}`
    if (status && status !== 'all') {
      // Convert status to uppercase for API
      const apiStatus = status.toUpperCase()
      url += `&status=${apiStatus}`
    }
    if (dateRange?.from && dateRange?.to) {
      url += `&from_date=${dateRange.from}&to_date=${dateRange.to}`
    }

    console.log('Fetching inspections with URL:', url) // Debug log
    
    const response = await fetch(url)
    const data = await handleResponse<{ data: BackendInspection[]; total: number }>(response)
    
    return {
      data: data.data.map(transformInspection),
      total: data.total
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch inspections')
  }
}

// Create new inspection
export const createInspection = async (data: NewInspectionFormValues): Promise<InspectionGroup> => {
  try {
    const response = await fetch(`${API_BASE}/inspections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        equipment_code: data.equipmentTag,
        start_date: new Date(data.startDate).toISOString()
      })
    })
    const inspection = await handleResponse<BackendInspection>(response)
    return transformInspection(inspection)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to create inspection')
  }
}

// Delete inspection
export const deleteInspection = async (inspectionId: string): Promise<void> => {
  try {
    const response = await fetch(`${INSPECTIONS_BASE}/${inspectionId}`, {
      method: 'DELETE'
    })
    await handleResponse<{ message: string }>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to delete inspection')
  }
}

// Create new daily report
export const createDailyReport = async (inspectionId: string, data: ReportFormValues): Promise<DailyReport> => {
  try {
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspection_id: Number(inspectionId),
        description: data.description,
        inspector_ids: data.inspectors.map(Number),
        report_date: new Date(data.date).toISOString()
      })
    })
    const report = await handleResponse<BackendDailyReport>(response)
    return transformDailyReport(report)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to create daily report')
  }
}

// Update daily report
export const updateDailyReport = async (
  reportId: string,
  data: Partial<Pick<ReportFormValues, 'description' | 'inspectors' | 'date'>>
): Promise<DailyReport> => {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: data.description,
        inspector_ids: data.inspectors?.map(Number),
        report_date: data.date ? new Date(data.date).toISOString() : undefined
      })
    })
    const report = await handleResponse<BackendDailyReport>(response)
    return transformDailyReport(report)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to update daily report')
  }
}

// Delete daily report
export const deleteDailyReport = async (reportId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}`, {
      method: 'DELETE'
    })
    await handleResponse<{ message: string }>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to delete daily report')
  }
}

// Toggle inspection status
export const toggleInspectionStatus = async (inspectionId: string): Promise<InspectionGroup> => {
  try {
    const response = await fetch(`${INSPECTIONS_BASE}/${inspectionId}/toggle-status`, {
      method: 'POST'
    })
    const inspection = await handleResponse<BackendInspection>(response)
    return transformInspection(inspection)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to toggle inspection status')
  }
}
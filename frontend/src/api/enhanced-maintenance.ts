// Enhanced Maintenance Event Management API
// This file contains API functions for the enhanced maintenance event management system

import {
  EnhancedMaintenanceEvent,
  InspectionPlan,
  InspectionPlanCreateRequest,
  InspectionPlanUpdateRequest,
  EnhancedInspection,
  InspectionCreateRequest,
  InspectionUpdateRequest,
  DailyReport,
  DailyReportCreateRequest,
  DailyReportUpdateRequest,
  EventStatisticsResponse,
  RequesterBreakdownResponse,
  EquipmentStatusResponse,
  FilterOptions,
  PaginatedResponse,
  BulkOperationResult,
  ExportOptions,
  ExportResult,
  MaintenanceApiError,
  InspectionStatus,
  InspectionPlanStatus,
  MaintenanceEventCategory
} from '@/types/enhanced-maintenance'

import { MaintenanceEventStatus } from '@/types/maintenance'

const API_BASE = 'http://localhost:8000/api/v1/maintenance'

// Utility functions
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new MaintenanceApiError(
      error.detail || 'An unexpected error occurred',
      response.status,
      error.error_code
    )
  }
  
  try {
    const data = await response.json()
    return data as T
  } catch (err) {
    console.error('Failed to parse response:', err)
    throw new MaintenanceApiError('Failed to parse response data', 500)
  }
}

const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()))
      } else {
        searchParams.append(key, value.toString())
      }
    }
  })
  
  return searchParams.toString()
}

// Transform functions
const transformInspectionPlan = (plan: any): InspectionPlan => ({
  id: String(plan.id),
  maintenanceEventId: plan.maintenance_event_id ? String(plan.maintenance_event_id) : undefined,
  maintenanceSubEventId: plan.maintenance_sub_event_id ? String(plan.maintenance_sub_event_id) : undefined,
  equipmentTag: plan.equipment_tag,
  requester: plan.requester,
  priority: plan.priority,
  status: plan.status,
  description: plan.description,
  plannedStartDate: plan.planned_start_date,
  plannedEndDate: plan.planned_end_date,
  createdAt: plan.created_at,
  updatedAt: plan.updated_at
})

const transformEnhancedInspection = (inspection: any): EnhancedInspection => ({
  id: String(inspection.id),
  inspectionNumber: inspection.inspection_number,
  title: inspection.title,
  description: inspection.description,
  startDate: inspection.start_date,
  endDate: inspection.end_date,
  status: inspection.status,
  equipmentId: String(inspection.equipment_id),
  equipment: inspection.equipment,
  inspectionPlanId: inspection.inspection_plan_id ? String(inspection.inspection_plan_id) : undefined,
  inspectionPlan: inspection.inspection_plan ? transformInspectionPlan(inspection.inspection_plan) : undefined,
  requestingDepartment: inspection.requesting_department,
  requesterDetails: inspection.requester_details,
  workOrder: inspection.work_order,
  permitNumber: inspection.permit_number,
  isFirstTimeInspection: inspection.is_first_time_inspection || false,
  dailyReports: inspection.daily_reports?.map(transformDailyReport) || [],
  reports: inspection.reports || [],
  canCreateReport: inspection.can_create_report || false,
  canEdit: inspection.can_edit || false,
  canDelete: inspection.can_delete || false,
  canComplete: inspection.can_complete || false,
  createdAt: inspection.created_at,
  updatedAt: inspection.updated_at
})

const transformDailyReport = (report: any): DailyReport => ({
  id: String(report.id),
  inspectionId: String(report.inspection_id),
  reportDate: report.report_date,
  description: report.description,
  inspectorIds: report.inspector_ids || [],
  inspectorNames: report.inspector_names || '',
  findings: report.findings,
  recommendations: report.recommendations,
  weatherConditions: report.weather_conditions,
  safetyNotes: report.safety_notes,
  imageUrls: report.image_urls || [],
  attachmentUrls: report.attachment_urls || [],
  createdAt: report.created_at,
  updatedAt: report.updated_at
})

// Inspection Planning API
export const inspectionPlanningApi = {
  // Create inspection plan
  async createInspectionPlan(data: InspectionPlanCreateRequest): Promise<InspectionPlan> {
    try {
      const eventId = data.maintenanceEventId || data.maintenanceSubEventId
      if (!eventId) {
        throw new MaintenanceApiError('Either maintenanceEventId or maintenanceSubEventId is required')
      }

      const endpoint = data.maintenanceEventId 
        ? `/events/${data.maintenanceEventId}/inspections/plan`
        : `/sub-events/${data.maintenanceSubEventId}/inspections/plan`

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment_tag: data.equipmentTag,
          requester: data.requester,
          priority: data.priority,
          description: data.description,
          planned_start_date: data.plannedStartDate,
          planned_end_date: data.plannedEndDate
        })
      })

      const plan = await handleResponse<any>(response)
      return transformInspectionPlan(plan)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to create inspection plan')
    }
  },

  // Get planned inspections for event
  async getPlannedInspections(eventId: string, isSubEvent: boolean = false): Promise<InspectionPlan[]> {
    try {
      const endpoint = isSubEvent 
        ? `/sub-events/${eventId}/inspections/planned`
        : `/events/${eventId}/inspections/planned`

      const response = await fetch(`${API_BASE}${endpoint}`)
      const plans = await handleResponse<any[]>(response)
      return plans.map(transformInspectionPlan)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to fetch planned inspections')
    }
  },

  // Update inspection plan
  async updateInspectionPlan(planId: string, data: InspectionPlanUpdateRequest): Promise<InspectionPlan> {
    try {
      const response = await fetch(`${API_BASE}/inspections/plan/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment_tag: data.equipmentTag,
          requester: data.requester,
          priority: data.priority,
          status: data.status,
          description: data.description,
          planned_start_date: data.plannedStartDate,
          planned_end_date: data.plannedEndDate
        })
      })

      const plan = await handleResponse<any>(response)
      return transformInspectionPlan(plan)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to update inspection plan')
    }
  },

  // Delete inspection plan
  async deleteInspectionPlan(planId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/inspections/plan/${planId}`, {
        method: 'DELETE'
      })
      await handleResponse<{ message: string }>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to delete inspection plan')
    }
  }
}

// Enhanced Reporting API
export const enhancedReportingApi = {
  // Get event statistics
  async getEventStatistics(eventId: string): Promise<EventStatisticsResponse> {
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/statistics`)
      return await handleResponse<EventStatisticsResponse>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to fetch event statistics')
    }
  },

  // Get requester breakdown
  async getRequesterBreakdown(eventId: string): Promise<RequesterBreakdownResponse> {
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/requester-breakdown`)
      return await handleResponse<RequesterBreakdownResponse>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to fetch requester breakdown')
    }
  },

  // Get equipment status
  async getEquipmentStatus(eventId: string): Promise<EquipmentStatusResponse> {
    try {
      const response = await fetch(`${API_BASE}/events/${eventId}/equipment-status`)
      return await handleResponse<EquipmentStatusResponse>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to fetch equipment status')
    }
  }
}

// Filtering and Search API
export const filteringSearchApi = {
  // Get filtered inspections
  async getFilteredInspections(params: {
    eventId?: string
    dateFrom?: string
    dateTo?: string
    status?: InspectionStatus[]
    inspector?: string[]
    equipmentTag?: string
    requester?: string[]
    skip?: number
    limit?: number
  }): Promise<PaginatedResponse<EnhancedInspection>> {
    try {
      const queryParams = buildQueryParams({
        event_id: params.eventId,
        date_from: params.dateFrom,
        date_to: params.dateTo,
        status: params.status,
        inspector: params.inspector,
        equipment_tag: params.equipmentTag,
        requester: params.requester,
        skip: params.skip || 0,
        limit: params.limit || 50
      })

      const response = await fetch(`${API_BASE}/inspections/filtered?${queryParams}`)
      const data = await handleResponse<{
        data: any[]
        total: number
        page: number
        limit: number
        has_more: boolean
      }>(response)

      return {
        data: data.data.map(transformEnhancedInspection),
        total: data.total,
        page: data.page,
        limit: data.limit,
        hasMore: data.has_more
      }
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to fetch filtered inspections')
    }
  },

  // Search equipment tags
  async searchEquipmentTags(query: string, limit: number = 10): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/equipment/search?q=${encodeURIComponent(query)}&limit=${limit}`)
      const data = await handleResponse<{ tags: string[] }>(response)
      return data.tags
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to search equipment tags')
    }
  },

  // Get filtered daily reports
  async getFilteredDailyReports(params: {
    eventId?: string
    dateFrom?: string
    dateTo?: string
    inspector?: string[]
    skip?: number
    limit?: number
  }): Promise<PaginatedResponse<DailyReport>> {
    try {
      const queryParams = buildQueryParams({
        event_id: params.eventId,
        date_from: params.dateFrom,
        date_to: params.dateTo,
        inspector: params.inspector,
        skip: params.skip || 0,
        limit: params.limit || 50
      })

      const response = await fetch(`${API_BASE}/daily-reports/filtered?${queryParams}`)
      const data = await handleResponse<{
        data: any[]
        total: number
        page: number
        limit: number
        has_more: boolean
      }>(response)

      return {
        data: data.data.map(transformDailyReport),
        total: data.total,
        page: data.page,
        limit: data.limit,
        hasMore: data.has_more
      }
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to fetch filtered daily reports')
    }
  }
}

// Enhanced Inspections API
export const enhancedInspectionsApi = {
  // Create inspection from plan
  async createInspectionFromPlan(planId: string, data: Partial<InspectionCreateRequest>): Promise<EnhancedInspection> {
    try {
      const response = await fetch(`${API_BASE}/inspections/from-plan/${planId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspection_number: data.inspectionNumber,
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          work_order: data.workOrder,
          permit_number: data.permitNumber
        })
      })

      const inspection = await handleResponse<any>(response)
      return transformEnhancedInspection(inspection)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to create inspection from plan')
    }
  },

  // Get enhanced inspection
  async getEnhancedInspection(inspectionId: string): Promise<EnhancedInspection> {
    try {
      const response = await fetch(`${API_BASE}/inspections/${inspectionId}/enhanced`)
      const inspection = await handleResponse<any>(response)
      return transformEnhancedInspection(inspection)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to fetch enhanced inspection')
    }
  },

  // Update inspection
  async updateEnhancedInspection(inspectionId: string, data: InspectionUpdateRequest): Promise<EnhancedInspection> {
    try {
      const response = await fetch(`${API_BASE}/inspections/${inspectionId}/enhanced`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          status: data.status,
          requesting_department: data.requestingDepartment,
          requester_details: data.requesterDetails,
          work_order: data.workOrder,
          permit_number: data.permitNumber
        })
      })

      const inspection = await handleResponse<any>(response)
      return transformEnhancedInspection(inspection)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to update enhanced inspection')
    }
  },

  // Complete inspection
  async completeInspection(inspectionId: string, completionData?: {
    endDate?: string
    finalReport?: string
    notes?: string
  }): Promise<EnhancedInspection> {
    try {
      const response = await fetch(`${API_BASE}/inspections/${inspectionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          end_date: completionData?.endDate,
          final_report: completionData?.finalReport,
          notes: completionData?.notes
        })
      })

      const inspection = await handleResponse<any>(response)
      return transformEnhancedInspection(inspection)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to complete inspection')
    }
  }
}

// Enhanced Daily Reports API
export const enhancedDailyReportsApi = {
  // Create daily report
  async createDailyReport(data: DailyReportCreateRequest): Promise<DailyReport> {
    try {
      const response = await fetch(`${API_BASE}/daily-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspection_id: data.inspectionId,
          report_date: data.reportDate,
          description: data.description,
          inspector_ids: data.inspectorIds,
          findings: data.findings,
          recommendations: data.recommendations,
          weather_conditions: data.weatherConditions,
          safety_notes: data.safetyNotes
        })
      })

      const report = await handleResponse<any>(response)
      return transformDailyReport(report)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to create daily report')
    }
  },

  // Update daily report
  async updateDailyReport(reportId: string, data: DailyReportUpdateRequest): Promise<DailyReport> {
    try {
      const response = await fetch(`${API_BASE}/daily-reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_date: data.reportDate,
          description: data.description,
          inspector_ids: data.inspectorIds,
          findings: data.findings,
          recommendations: data.recommendations,
          weather_conditions: data.weatherConditions,
          safety_notes: data.safetyNotes
        })
      })

      const report = await handleResponse<any>(response)
      return transformDailyReport(report)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to update daily report')
    }
  },

  // Delete daily report
  async deleteDailyReport(reportId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/daily-reports/${reportId}`, {
        method: 'DELETE'
      })
      await handleResponse<{ message: string }>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to delete daily report')
    }
  },

  // Upload images for daily report
  async uploadImages(reportId: string, images: File[]): Promise<{
    success: boolean
    imageUrls: string[]
    message: string
  }> {
    try {
      const formData = new FormData()
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image)
      })

      const response = await fetch(`${API_BASE}/daily-reports/${reportId}/images`, {
        method: 'POST',
        body: formData,
      })

      return await handleResponse<{
        success: boolean
        imageUrls: string[]
        message: string
      }>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to upload images')
    }
  },

  // Upload attachments for daily report
  async uploadAttachments(reportId: string, attachments: File[]): Promise<{
    success: boolean
    attachmentUrls: string[]
    message: string
  }> {
    try {
      const formData = new FormData()
      attachments.forEach((attachment, index) => {
        formData.append(`attachment_${index}`, attachment)
      })

      const response = await fetch(`${API_BASE}/daily-reports/${reportId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      return await handleResponse<{
        success: boolean
        attachmentUrls: string[]
        message: string
      }>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to upload attachments')
    }
  }
}

// Bulk Operations API
export const bulkOperationsApi = {
  // Bulk update status
  async bulkUpdateStatus(
    itemIds: string[],
    itemType: 'inspection' | 'maintenance',
    status: InspectionStatus | MaintenanceEventStatus
  ): Promise<BulkOperationResult> {
    try {
      const response = await fetch(`${API_BASE}/bulk/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_ids: itemIds,
          item_type: itemType,
          status
        })
      })

      return await handleResponse<BulkOperationResult>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to perform bulk status update')
    }
  },

  // Bulk delete
  async bulkDelete(
    itemIds: string[],
    itemType: 'inspection' | 'maintenance'
  ): Promise<BulkOperationResult> {
    try {
      const response = await fetch(`${API_BASE}/bulk/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_ids: itemIds,
          item_type: itemType
        })
      })

      return await handleResponse<BulkOperationResult>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to perform bulk delete')
    }
  }
}

// Export API
export const exportApi = {
  // Export data
  async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      const response = await fetch(`${API_BASE}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: options.format,
          filters: options.filters,
          include_images: options.includeImages,
          include_attachments: options.includeAttachments
        })
      })

      return await handleResponse<ExportResult>(response)
    } catch (error) {
      if (error instanceof MaintenanceApiError) {
        throw error
      }
      throw new MaintenanceApiError('Failed to export data')
    }
  }
}

// Utility functions for error handling and retries
export const apiUtils = {
  // Retry function with exponential backoff
  async withRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          break
        }

        // Don't retry on client errors (4xx)
        if (error instanceof MaintenanceApiError && error.statusCode && error.statusCode < 500) {
          break
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  },

  // Check if error is retryable
  isRetryableError(error: Error): boolean {
    if (error instanceof MaintenanceApiError) {
      return !error.statusCode || error.statusCode >= 500
    }
    return true
  },

  // Format error for display
  formatError(error: Error): string {
    if (error instanceof MaintenanceApiError) {
      return error.message
    }
    return 'An unexpected error occurred'
  }
}
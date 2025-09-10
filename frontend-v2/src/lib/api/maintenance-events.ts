import {
  MaintenanceEvent,
  MaintenanceSubEvent,
  Inspection,
  DailyReport,
  EventsSummary,
  EventStatistics,
  EventsFilters,
  InspectionsFilters,
  DailyReportsFilters,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  CreateMaintenanceEventRequest,
  UpdateMaintenanceEventRequest,
  UpdateInspectionRequest,
  PaginatedInspectionsResponse
} from '@/types/maintenance-events'
import { NetworkError, RetryManager, ApiError } from '@/lib/utils/error-handling'

// API client configuration
class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  private retryManager = new RetryManager(3, 1000, 10000)
  
  private async makeRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorDetails: any = null
        
        try {
          const errorData = await response.json()
          console.log('🔴 API Error Response:', errorData)
          // Extract meaningful error message
          if (typeof errorData === 'object' && errorData !== null) {
            if (errorData.message) {
              errorMessage = errorData.message
            } else if (errorData.detail) {
              errorMessage = errorData.detail
            } else if (Array.isArray(errorData) && errorData.length > 0) {
              // Handle array of errors
              const firstError = errorData[0]
              if (typeof firstError === 'string') {
                errorMessage = firstError
              } else if (firstError.msg) {
                errorMessage = firstError.msg
              } else if (firstError.message) {
                errorMessage = firstError.message
              } else if (typeof firstError === 'object' && firstError !== null) {
                // Handle validation error objects with loc, msg, etc.
                if (firstError.msg) {
                  errorMessage = firstError.msg
                } else {
                  errorMessage = JSON.stringify(firstError)
                }
              }
            } else if (Object.keys(errorData).length > 0) {
              // Handle object with error details
              const firstKey = Object.keys(errorData)[0]
              const firstValue = errorData[firstKey]
              if (typeof firstValue === 'string') {
                errorMessage = firstValue
              } else if (Array.isArray(firstValue) && firstValue.length > 0) {
                errorMessage = firstValue[0]
              } else if (typeof firstValue === 'object' && firstValue !== null) {
                // Handle nested error objects
                if (firstValue.msg) {
                  errorMessage = firstValue.msg
                } else if (firstValue.message) {
                  errorMessage = firstValue.message
                } else {
                  errorMessage = JSON.stringify(firstValue)
                }
              }
            }
          } else if (typeof errorData === 'string') {
            errorMessage = errorData
          }
          errorDetails = errorData
        } catch {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text()
            console.log('🔴 API Error Text:', errorText)
            if (errorText && errorText !== '""') {
              errorMessage = errorText
            }
          } catch {
            console.log('🔴 API Error: Unable to parse response')
          }
        }
        
        console.log('🚨 Throwing ApiError:', {
          message: errorMessage,
          status: response.status,
          details: errorDetails,
          url: url
        })
        
        // Ensure errorMessage is not an object
        const finalErrorMessage = typeof errorMessage === 'object' 
          ? JSON.stringify(errorMessage) 
          : (errorMessage || `API Error ${response.status}`)
        
        const apiError = new ApiError(finalErrorMessage, response.status)
        // Attach response details for debugging
        ;(apiError as any).response = errorDetails
        ;(apiError as any).url = url
        throw apiError
      }
      
      return response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network connection failed')
      }
      throw error
    }
  }
  
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`/api/v1${endpoint}`, this.baseURL)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }
    
    return this.retryManager.execute(() => 
      this.makeRequest<T>(url.toString())
    )
  }
  
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`
    
    return this.retryManager.execute(() =>
      this.makeRequest<T>(url, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    )
  }
  
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`
    
    return this.retryManager.execute(() =>
      this.makeRequest<T>(url, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    )
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`
    
    return this.retryManager.execute(() =>
      this.makeRequest<T>(url, {
        method: 'DELETE'
      })
    )
  }
}

// Maintenance Events API service
class MaintenanceEventsApiService {
  constructor(private client: ApiClient) {}
  
  async getMaintenanceEvents(filters: EventsFilters = {}): Promise<MaintenanceEvent[]> {
    const params: Record<string, unknown> = {}
    
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.eventType) params.event_type = filters.eventType
    if (filters.dateFrom) params.from_date = filters.dateFrom
    if (filters.dateTo) params.to_date = filters.dateTo
    
    const response = await this.client.get<MaintenanceEvent[]>('/maintenance/events', params)
    
    // Log response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Events API Response:', response?.length || 0, 'events')
    }
    
    return response
  }
  
  async getMaintenanceEvent(id: string): Promise<MaintenanceEvent> {
    return this.client.get(`/maintenance/events/${id}`)
  }
  
  async createMaintenanceEvent(data: CreateMaintenanceEventRequest): Promise<MaintenanceEvent> {
    return this.client.post('/maintenance/events', data)
  }
  
  async updateMaintenanceEvent(id: string, data: UpdateMaintenanceEventRequest): Promise<MaintenanceEvent> {
    return this.client.put(`/maintenance/events/${id}`, data)
  }
  
  async deleteMaintenanceEvent(id: string): Promise<void> {
    return this.client.delete(`/maintenance/events/${id}`)
  }
  
  async getMaintenanceSubEvents(parentEventId: string): Promise<MaintenanceSubEvent[]> {
    return this.client.get('/maintenance/sub-events', { parent_event_id: parentEventId })
  }
  
  async getEventsSummary(filters: EventsFilters = {}): Promise<EventsSummary> {
    const params: Record<string, unknown> = {}
    
    if (filters.dateFrom) params.from_date = filters.dateFrom
    if (filters.dateTo) params.to_date = filters.dateTo
    
    try {
      // Try to get maintenance events summary first
      const maintenanceResponse = await this.client.get<unknown>('/maintenance/statistics/summary', params)
      
      // Try to get inspections summary
      const inspectionsResponse = await this.client.get<unknown>('/inspections/statistics/summary', params)
      
      // Log responses for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Maintenance Summary API Response:', maintenanceResponse)
        console.log('📊 Inspections Summary API Response:', inspectionsResponse)
      }
      
      // Transform combined response to match frontend interface
      const transformed = {
        totalEvents: (maintenanceResponse as any)?.total_events || 0,
        activeEvents: (maintenanceResponse as any)?.status_breakdown?.InProgress || 0,
        completedEvents: (maintenanceResponse as any)?.status_breakdown?.Completed || 0,
        overdueEvents: (maintenanceResponse as any)?.overdue_events || (maintenanceResponse as any)?.status_breakdown?.Overdue || 0,
        
        // Use inspections data from inspections API
        totalInspections: (inspectionsResponse as any)?.total_inspections || 0,
        activeInspections: (inspectionsResponse as any)?.status_breakdown?.InProgress || 0,
        plannedInspections: (inspectionsResponse as any)?.status_breakdown?.Planned || 0,
        unplannedInspections: ((inspectionsResponse as any)?.total_inspections || 0) - ((inspectionsResponse as any)?.status_breakdown?.Planned || 0),
        completedInspections: (inspectionsResponse as any)?.status_breakdown?.Completed || 0,
        
        // For reports, try maintenance API first, then fallback to calculation
        totalReports: (maintenanceResponse as any)?.total_reports || 0,
        reportsThisMonth: (maintenanceResponse as any)?.reports_this_month || 0,
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Transformed Combined Summary:', transformed)
        console.log('🔍 Active Inspections Debug:', {
          from_inspections_api: (inspectionsResponse as any)?.status_breakdown?.InProgress,
          from_maintenance_api: (maintenanceResponse as any)?.active_inspections,
          final_value: transformed.activeInspections
        })
      }
      
      return transformed
      
    } catch (error) {
      console.warn('Failed to get summary from separate APIs, trying single endpoint:', error)
      
      // Fallback to single endpoint if separate APIs fail
      const response = await this.client.get<unknown>('/maintenance/statistics/summary', params)
      
      // Log response for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Fallback Summary API Response:', response)
      }
      
      // If this is actually inspections data, map it correctly
      const isInspectionData = !!(response as any)?.status_breakdown?.InProgress
      
      if (isInspectionData) {
        const transformed = {
          totalEvents: 0, // No events data available
          activeEvents: 0,
          completedEvents: 0,
          overdueEvents: 0,
          
          // Use the inspections data we have
          totalInspections: (response as any)?.total_inspections || 0,
          activeInspections: (response as any)?.status_breakdown?.InProgress || 0,
          plannedInspections: (response as any)?.status_breakdown?.Planned || 0,
          unplannedInspections: ((response as any)?.total_inspections || 0) - ((response as any)?.status_breakdown?.Planned || 0),
          completedInspections: (response as any)?.status_breakdown?.Completed || 0,
          
          totalReports: 0, // No reports data available
          reportsThisMonth: 0,
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Transformed Inspections-only Summary:', transformed)
        }
        
        return transformed
      }
      
      // Original transformation for maintenance events
      const transformed = {
        totalEvents: (response as any)?.total_events || 0,
        activeEvents: (response as any)?.status_breakdown?.InProgress || 0,
        completedEvents: (response as any)?.status_breakdown?.Completed || 0,
        overdueEvents: (response as any)?.overdue_events || (response as any)?.status_breakdown?.Overdue || 0,
        totalInspections: (response as any)?.total_inspections || 0,
        activeInspections: (response as any)?.active_inspections || 
                          (response as any)?.status_breakdown?.InProgress || 
                          (response as any)?.inspection_status_breakdown?.InProgress || 0,
        plannedInspections: (response as any)?.planned_inspections || 0,
        unplannedInspections: (response as any)?.unplanned_inspections || 0,
        completedInspections: (response as any)?.completed_inspections || 0,
        totalReports: (response as any)?.total_reports || 0,
        reportsThisMonth: (response as any)?.reports_this_month || 0,
      }
      
      return transformed
    }
  }
  
  async startMaintenanceEvent(id: string): Promise<MaintenanceEvent> {
    return this.client.post(`/maintenance/events/${id}/start`, {})
  }
  
  async completeMaintenanceEvent(id: string, notes?: string): Promise<MaintenanceEvent> {
    return this.client.post(`/maintenance/events/${id}/complete`, { notes })
  }
  
  async reopenMaintenanceEvent(id: string): Promise<MaintenanceEvent> {
    return this.client.post(`/maintenance/events/${id}/reopen`, {})
  }
  
  async revertMaintenanceEvent(id: string): Promise<MaintenanceEvent> {
    return this.client.post(`/maintenance/events/${id}/revert`, {})
  }
  
  async reactivateMaintenanceEvent(id: string): Promise<MaintenanceEvent> {
    return this.client.post(`/maintenance/events/${id}/reactivate`, {})
  }
  
  async approveMaintenanceEvent(id: string, approvedBy?: string): Promise<MaintenanceEvent> {
    return this.client.post(`/maintenance/events/${id}/approve`, { approved_by: approvedBy })
  }
  
  async revertApprovalMaintenanceEvent(id: string): Promise<MaintenanceEvent> {
    return this.client.post(`/maintenance/events/${id}/revert-approval`, {})
  }
  
  async createMaintenanceSubEvent(data: any): Promise<MaintenanceSubEvent> {
    return this.client.post('/maintenance/sub-events', data)
  }
  
  async updateMaintenanceSubEvent(id: string, data: any): Promise<MaintenanceSubEvent> {
    return this.client.put(`/maintenance/sub-events/${id}`, data)
  }
  
  async getEventStatistics(eventId: string): Promise<EventStatistics> {
    return this.client.get(`/maintenance/events/${eventId}/statistics`)
  }
}

// Inspections API service
class InspectionsApiService {
  constructor(private client: ApiClient) {}
  
  async getInspections(filters: InspectionsFilters = {}): Promise<PaginatedInspectionsResponse> {
    const params: Record<string, unknown> = {}
    
    if (filters.eventId) params.maintenance_event_id = filters.eventId
    if (filters.subEventId) params.maintenance_sub_event_id = filters.subEventId
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.equipmentTag) params.equipment_tag = filters.equipmentTag
    if (filters.dateFrom) params.from_date = filters.dateFrom
    if (filters.dateTo) params.to_date = filters.dateTo
    // Always send date_field, default to actual_start_date
    params.date_field = filters.dateField || 'actual_start_date'
    if (filters.skip !== undefined) params.skip = filters.skip
    if (filters.limit !== undefined) params.limit = filters.limit
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ InspectionsAPI - Request Details:', {
        filters,
        params,
        endpoint: '/inspections',
        hasDateFrom: !!filters.dateFrom,
        hasDateTo: !!filters.dateTo,
        dateField: filters.dateField || 'actual_start_date',
        fullUrl: `/inspections?${new URLSearchParams(params as Record<string, string>).toString()}`
      })
    }
    
    const response = await this.client.get<PaginatedInspectionsResponse>('/inspections', params)
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('📨 InspectionsAPI - Response:', {
        count: response?.data?.length || 0,
        pagination: response?.pagination,
        firstInspection: response?.data?.[0] ? {
          id: response.data[0].id,
          title: response.data[0].title,
          inspection_number: response.data[0].inspection_number
        } : null
      })
    }
    
    return response
  }
  
  async getInspection(id: number): Promise<Inspection> {
    return this.client.get(`/inspections/${id}`)
  }
  
  async createPlanInspection(data: any): Promise<Inspection> {
    console.log('📝 InspectionsAPI - createPlanInspection request:', data)
    
    // Transform frontend data to match unified backend API
    const backendData = {
      inspection_number: data.inspection_number,
      title: data.title,
      description: data.description,
      equipment_id: data.equipment_id,
      requesting_department: data.requesting_department,
      work_order: data.work_order,
      permit_number: data.permit_number,
      // Unified model fields
      is_planned: true, // This is a planned inspection
      maintenance_event_id: data.maintenance_event_id,
      maintenance_sub_event_id: data.maintenance_sub_event_id,
      // For planned inspections, use planned dates
      planned_start_date: data.planned_start_date,
      planned_end_date: data.planned_end_date,
      // Set actual dates to null for planned inspections
      actual_start_date: null,
      actual_end_date: null,
      // Unplanned reason is not needed for planned inspections
      unplanned_reason: null
    }
    
    console.log('🔄 InspectionsAPI - transformed backend data:', backendData)
    
    try {
      const result = await this.client.post<Inspection>('/inspections', backendData)
      console.log('📝 InspectionsAPI - createPlanInspection response:', result)
      return result
    } catch (error) {
      console.error('❌ InspectionsAPI - createPlanInspection error:', error)
      throw error
    }
  }
  
  async createUnplannedInspection(data: any): Promise<Inspection> {
    console.log('📝 InspectionsAPI - createUnplannedInspection request:', data)
    
    // Transform frontend data to match unified backend API
    const backendData = {
      inspection_number: data.inspection_number,
      title: data.title,
      description: data.description,
      equipment_id: data.equipment_id,
      requesting_department: data.requesting_department,
      work_order: data.work_order,
      permit_number: data.permit_number,
      // Unified model fields for unplanned inspection
      is_planned: false, // This is an unplanned inspection
      unplanned_reason: data.unplanned_reason,
      maintenance_event_id: data.maintenance_event_id,
      maintenance_sub_event_id: data.maintenance_sub_event_id,
      // For unplanned inspections, set actual dates immediately
      actual_start_date: data.actual_start_date || data.planned_date || new Date().toISOString().split('T')[0],
      actual_end_date: null, // End date will be set when inspection is completed
      // Set planned dates to null for unplanned inspections
      planned_start_date: null,
      planned_end_date: null
    }
    
    console.log('🔄 InspectionsAPI - transformed unplanned backend data:', backendData)
    
    try {
      const result = await this.client.post<Inspection>('/inspections', backendData)
      console.log('📝 InspectionsAPI - createUnplannedInspection response:', result)
      return result
    } catch (error) {
      console.error('❌ InspectionsAPI - createUnplannedInspection error:', error)
      throw error
    }
  }
  
  async updateInspectionStatus(id: number, status: string): Promise<Inspection> {
    return this.client.put(`/inspections/${id}`, { status })
  }
  
  async updateInspection(id: number, data: UpdateInspectionRequest): Promise<Inspection> {
    console.log('📝 InspectionsAPI - updateInspection request:', { id, data })
    try {
      const result = await this.client.put<Inspection>(`/inspections/${id}`, data)
      console.log('📝 InspectionsAPI - updateInspection response:', result)
      return result
    } catch (error) {
      console.error('❌ InspectionsAPI - updateInspection error:', error)
      throw error
    }
  }
  
  async startInspection(id: number): Promise<any> {
    console.log('🚀 InspectionsAPI - startInspection request:', { id })
    try {
      const result = await this.client.post<any>(`/inspections/${id}/start`, {})
      console.log('🚀 InspectionsAPI - startInspection response:', result)
      return result
    } catch (error) {
      console.error('❌ InspectionsAPI - startInspection error:', error)
      throw error
    }
  }
  
  async completeInspection(id: number, data?: any): Promise<Inspection> {
    console.log('🏁 InspectionsAPI - completeInspection request:', { id, data })
    try {
      // Use dedicated completion endpoint if available, otherwise update status
      const result = await this.client.post<Inspection>(`/inspections/${id}/complete`, data || {})
      console.log('🏁 InspectionsAPI - completeInspection response:', result)
      return result
    } catch (error) {
      console.error('❌ InspectionsAPI - completeInspection error:', error)
      // Fallback to status update if dedicated endpoint doesn't exist
      console.log('🔄 InspectionsAPI - trying fallback status update')
      return this.client.put(`/inspections/${id}`, { status: 'Completed' })
    }
  }
  
  async deleteInspection(id: number): Promise<{ message: string }> {
    console.log('🗑️ InspectionsAPI - deleteInspection request:', { id })
    try {
      const result = await this.client.delete<{ message: string }>(`/inspections/${id}`)
      console.log('🗑️ InspectionsAPI - deleteInspection response:', result)
      return result
    } catch (error) {
      console.error('❌ InspectionsAPI - deleteInspection error:', error)
      throw error
    }
  }
}

// Daily Reports API service
class DailyReportsApiService {
  constructor(private client: ApiClient) {}
  
  async getDailyReports(filters: DailyReportsFilters = {}): Promise<DailyReport[]> {
    const params: Record<string, unknown> = {}
    
    if (filters.inspectionId) params.inspection_id = filters.inspectionId
    if (filters.search) params.search = filters.search
    if (filters.dateFrom) params.date_from = filters.dateFrom
    if (filters.dateTo) params.date_to = filters.dateTo
    
    return this.client.get('/daily-reports', params)
  }
  
  async getDailyReport(id: number): Promise<DailyReport> {
    return this.client.get(`/daily-reports/${id}`)
  }
  
  async createDailyReport(data: CreateDailyReportRequest): Promise<DailyReport> {
    return this.client.post('/daily-reports', data)
  }
  
  async updateDailyReport(id: number, data: UpdateDailyReportRequest): Promise<DailyReport> {
    return this.client.put(`/daily-reports/${id}`, data)
  }
  
  async deleteDailyReport(id: number): Promise<void> {
    return this.client.delete(`/daily-reports/${id}`)
  }
  
  async getDailyReportsByInspection(inspectionId: number): Promise<DailyReport[]> {
    return this.client.get(`/daily-reports/by-inspection/${inspectionId}`)
  }
}

// API instances
const apiClient = new ApiClient()

export const maintenanceEventsApi = new MaintenanceEventsApiService(apiClient)
export const inspectionsApi = new InspectionsApiService(apiClient)
export const dailyReportsApi = new DailyReportsApiService(apiClient)

// Export for testing
export { ApiClient }
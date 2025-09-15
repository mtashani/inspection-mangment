// Daily Reports API Service
// This file contains API client and service methods for Daily Reports functionality

import {
  DailyReport,
  Inspection,
  MaintenanceEvent,
  DailyReportsSummary,
  DailyReportsFilters,
  CreateDailyReportRequest,
  UpdateDailyReportRequest,
  CreateInspectionRequest,
  UpdateInspectionRequest,
  UpdateMaintenanceEventStatusRequest,
  ApiResponse,
  DailyReportsApiError,
  InspectionStatus,
  MaintenanceEventStatus,
  MaintenanceEventType,
  RefineryDepartment
} from '@/types/daily-reports'

// Base API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_V1 = `${API_BASE}/api/v1`
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

// HTTP client class with error handling
class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_V1) {
    this.baseURL = baseURL
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Get auth token from localStorage or auth context
    const token = localStorage.getItem('access_token')
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'Unknown error occurred' 
      }))
      
      throw new DailyReportsApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      )
    }

    return response.json()
  }

  /**
   * Test if backend is available
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    })

    return this.handleResponse<T>(response)
  }
}

// Create API client instance
const apiClient = new ApiClient()

// Daily Reports API Service
export class DailyReportsApiService {
  /**
   * Get daily reports with optional filtering
   */
  async getDailyReports(filters?: DailyReportsFilters): Promise<DailyReport[]> {
    try {
      const params: Record<string, any> = {}

      if (filters) {
        if (filters.search) params.search = filters.search
        if (filters.inspector) params.inspector_name = filters.inspector
        if (filters.equipmentTag) params.equipment_tag = filters.equipmentTag
        if (filters.dateRange?.from) params.from_date = filters.dateRange.from
        if (filters.dateRange?.to) params.to_date = filters.dateRange.to
        if (filters.hasReports !== undefined) params.has_reports = filters.hasReports
        
        // Handle multiple inspection IDs
        if (filters.inspectionIds && filters.inspectionIds.length > 0) {
          params.inspection_ids = filters.inspectionIds.join(',')
        }
      }

      const result = await apiClient.get<DailyReport[]>('/daily-reports', params)
      console.log('✅ Successfully fetched daily reports from backend:', result.length, 'reports')
      return result
    } catch (error) {
      console.warn('⚠️ Backend not available, returning mock data:', error)
      // Return mock data when backend is not available
      return this.getMockDailyReports(filters)
    }
  }

  /**
   * Get mock daily reports for development/testing
   */
  private getMockDailyReports(filters?: DailyReportsFilters): DailyReport[] {
    const mockReports: DailyReport[] = [
      {
        id: 1,
        inspectionId: 101,
        reportDate: '2025-01-15',
        description: 'Daily inspection of pump P-001. Checked vibration levels, temperature readings, and visual inspection of seals.',
        inspectorIds: [1, 2],
        inspectorNames: 'احمد رضایی، محمد احمدی',
        findings: 'Minor oil leak detected at seal connection',
        recommendations: 'Schedule seal replacement within next maintenance window',
        weatherConditions: 'clear',
        safetyNotes: 'All safety protocols followed. No incidents reported.',
        createdAt: '2025-01-15T08:30:00Z',
        updatedAt: '2025-01-15T08:30:00Z'
      },
      {
        id: 2,
        inspectionId: 102,
        reportDate: '2025-01-14',
        description: 'Heat exchanger HE-001 inspection. Performed pressure test and thermal imaging.',
        inspectorIds: [3],
        inspectorNames: 'علی محمدی',
        findings: 'All parameters within normal range',
        recommendations: 'Continue regular monitoring',
        weatherConditions: 'cloudy',
        safetyNotes: 'Equipment properly isolated before inspection',
        createdAt: '2025-01-14T10:15:00Z',
        updatedAt: '2025-01-14T10:15:00Z'
      },
      {
        id: 3,
        inspectionId: 103,
        reportDate: '2025-01-13',
        description: 'Vessel V-001 external inspection. Checked for corrosion and structural integrity.',
        inspectorIds: [1],
        inspectorNames: 'احمد رضایی',
        findings: 'Surface corrosion noted on lower section',
        recommendations: 'Apply protective coating during next shutdown',
        weatherConditions: 'windy',
        safetyNotes: 'Used proper fall protection equipment',
        createdAt: '2025-01-13T14:20:00Z',
        updatedAt: '2025-01-13T14:20:00Z'
      }
    ]

    // Apply basic filtering
    let filteredReports = mockReports

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredReports = filteredReports.filter(report =>
        report.description.toLowerCase().includes(searchTerm) ||
        report.inspectorNames?.toLowerCase().includes(searchTerm)
      )
    }

    if (filters?.inspector) {
      filteredReports = filteredReports.filter(report =>
        report.inspectorNames?.includes(filters.inspector!)
      )
    }
    
    // Handle multiple inspection IDs filter
    if (filters?.inspectionIds && filters.inspectionIds.length > 0) {
      filteredReports = filteredReports.filter(report =>
        filters.inspectionIds!.includes(report.inspectionId)
      )
    }

    return filteredReports
  }

  /**
   * Get daily reports for a specific inspection
   */
  async getDailyReportsByInspection(inspectionId: number): Promise<{
    inspectionId: number
    equipmentTag?: string
    equipmentDescription?: string
    inspectionStatus: InspectionStatus
    dailyReports: DailyReport[]
  }> {
    return apiClient.get(`/daily-reports/by-inspection/${inspectionId}`)
  }

  /**
   * Get a specific daily report by ID
   */
  async getDailyReport(reportId: number): Promise<DailyReport & {
    equipmentTag?: string
    equipmentDescription?: string
  }> {
    return apiClient.get(`/daily-reports/${reportId}`)
  }

  /**
   * Create a new daily report
   */
  async createDailyReport(data: CreateDailyReportRequest): Promise<DailyReport> {
    return apiClient.post<DailyReport>('/daily-reports', data)
  }

  /**
   * Update an existing daily report
   */
  async updateDailyReport(reportId: number, data: UpdateDailyReportRequest): Promise<DailyReport> {
    return apiClient.put<DailyReport>(`/daily-reports/${reportId}`, data)
  }

  /**
   * Delete a daily report
   */
  async deleteDailyReport(reportId: number): Promise<{ message: string }> {
    return apiClient.delete(`/daily-reports/${reportId}`)
  }

  /**
   * Get summary statistics for daily reports
   */
  async getSummary(filters?: DailyReportsFilters): Promise<DailyReportsSummary> {
    try {
      // Try to get summary from backend first
      return await apiClient.get<DailyReportsSummary>('/daily-reports/summary', 
        filters ? apiHelpers.buildFilterParams(filters) : {}
      )
    } catch (error) {
      console.warn('Backend summary not available, calculating from reports:', error)
      // Fallback: calculate from daily reports data
      const reports = await this.getDailyReports(filters)
      
      return {
        activeInspections: Math.max(reports.length - 1, 0),
        completedInspections: reports.length,
        activeMaintenanceEvents: Math.floor(reports.length / 3),
        completedMaintenanceEvents: Math.floor(reports.length / 2),
        reportsThisMonth: reports.filter(r => {
          const reportDate = new Date(r.reportDate)
          const now = new Date()
          return reportDate.getMonth() === now.getMonth() && 
                 reportDate.getFullYear() === now.getFullYear()
        }).length,
        activeInspectors: new Set(reports.map(r => r.inspectorNames).filter(Boolean)).size,
        overdueItems: Math.floor(Math.random() * 3), // Mock overdue items
        upcomingDeadlines: Math.floor(Math.random() * 5) + 2 // Mock upcoming deadlines
      }
    }
  }
}

// Inspections API Service
export class InspectionsApiService {
  /**
   * Get inspections with optional filtering
   */
  async getInspections(filters?: {
    skip?: number
    limit?: number
    status?: InspectionStatus
    equipmentTag?: string
    department?: RefineryDepartment
    fromDate?: string
    toDate?: string
    eventId?: string
    subEventId?: number
  }): Promise<Inspection[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams()
      
      if (filters?.skip !== undefined) params.append('skip', filters.skip.toString())
      if (filters?.limit !== undefined) params.append('limit', filters.limit.toString())
      if (filters?.status) params.append('status', filters.status)
      if (filters?.equipmentTag) params.append('equipment_tag', filters.equipmentTag)
      if (filters?.department) params.append('department', filters.department)
      if (filters?.fromDate) params.append('from_date', filters.fromDate)
      if (filters?.toDate) params.append('to_date', filters.toDate)
      if (filters?.eventId) params.append('maintenance_event_id', filters.eventId)
      if (filters?.subEventId) params.append('maintenance_sub_event_id', filters.subEventId.toString())
      
      const queryString = params.toString()
      const url = queryString ? `/inspections?${queryString}` : '/inspections'
      
      const result = await apiClient.get<Inspection[]>(url)
      console.log('✅ Real inspections data received:', {
        count: result.length,
        filters,
        url
      })
      
      return result
    } catch (error) {
      console.error('❌ Failed to fetch inspections from backend:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      })
      
      // Only return mock data in development or if specifically requested
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚧 Using mock data for development')
        return this.getMockInspections(filters)
      }
      
      // In production, throw the error instead of silently returning mock data
      throw error
    }
  }

  /**
   * Get mock inspections for development/testing
   * Now respects filters to avoid showing generic data for all events
   */
  private getMockInspections(filters?: {
    eventId?: string
    subEventId?: number
    [key: string]: any
  }): Inspection[] {
    // If specific event/sub-event filters are provided and they don't match our mock data,
    // return empty array instead of generic mock data
    if (filters?.eventId && !['1', '2', '3'].includes(filters.eventId)) {
      console.log('📊 No mock data for eventId:', filters.eventId, 'returning empty array')
      return []
    }
    
    if (filters?.subEventId && ![1, 2, 3].includes(filters.subEventId)) {
      console.log('📊 No mock data for subEventId:', filters.subEventId, 'returning empty array')
      return []
    }
    
    // Only return mock data for predefined test events
    return [
      {
        id: 101,
        inspectionNumber: 'INS-2025-001',
        title: 'Pump P-001 Quarterly Inspection',
        description: 'Routine quarterly inspection of centrifugal pump P-001',
        startDate: '2025-01-15',
        endDate: '2025-01-20',
        status: InspectionStatus.InProgress,
        equipmentId: 1,
        equipment: {
          id: 1,
          tag: 'P-001',
          description: 'Centrifugal Pump - Main Feed',
          equipment_type: 'Pump',
          unit: 'Unit 100',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        requestingDepartment: RefineryDepartment.Operations,
        workOrder: 'WO-2025-001',
        dailyReports: [
          {
            id: 1,
            inspectionId: 101,
            reportDate: '2025-01-15',
            description: 'Daily inspection of pump P-001. Checked vibration levels, temperature readings, and visual inspection of seals.',
            inspectorIds: [1, 2],
            inspectorNames: 'احمد رضایی، محمد احمدی',
            findings: 'Minor oil leak detected at seal connection',
            recommendations: 'Schedule seal replacement within next maintenance window',
            weatherConditions: 'clear',
            safetyNotes: 'All safety protocols followed. No incidents reported.',
            createdAt: '2025-01-15T08:30:00Z',
            updatedAt: '2025-01-15T08:30:00Z'
          }
        ],
        canCreateReport: true,
        canEdit: true,
        canComplete: true,
        canDelete: false,
        createdAt: '2025-01-10T09:00:00Z',
        updatedAt: '2025-01-15T08:30:00Z'
      },
      {
        id: 102,
        inspectionNumber: 'INS-2025-002',
        title: 'Heat Exchanger HE-001 Annual Inspection',
        description: 'Annual comprehensive inspection of shell and tube heat exchanger',
        startDate: '2025-01-14',
        endDate: '2025-01-18',
        status: InspectionStatus.InProgress,
        equipmentId: 2,
        equipment: {
          id: 2,
          tag: 'HE-001',
          description: 'Shell & Tube Heat Exchanger',
          equipment_type: 'Heat Exchanger',
          unit: 'Unit 100',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        requestingDepartment: RefineryDepartment.Maintenance,
        workOrder: 'WO-2025-002',
        dailyReports: [
          {
            id: 2,
            inspectionId: 102,
            reportDate: '2025-01-14',
            description: 'Heat exchanger HE-001 inspection. Performed pressure test and thermal imaging.',
            inspectorIds: [3],
            inspectorNames: 'علی محمدی',
            findings: 'All parameters within normal range',
            recommendations: 'Continue regular monitoring',
            weatherConditions: 'cloudy',
            safetyNotes: 'Equipment properly isolated before inspection',
            createdAt: '2025-01-14T10:15:00Z',
            updatedAt: '2025-01-14T10:15:00Z'
          }
        ],
        canCreateReport: true,
        canEdit: true,
        canComplete: true,
        canDelete: false,
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-14T10:15:00Z'
      },
      {
        id: 103,
        inspectionNumber: 'INS-2025-003',
        title: 'Pressure Vessel V-001 Inspection',
        description: 'External visual inspection of pressure vessel V-001',
        startDate: '2025-01-13',
        status: InspectionStatus.Completed,
        equipmentId: 3,
        equipment: {
          id: 3,
          tag: 'V-001',
          description: 'Pressure Vessel - Storage Tank',
          equipment_type: 'Vessel',
          unit: 'Unit 200',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        requestingDepartment: RefineryDepartment.Safety,
        workOrder: 'WO-2025-003',
        dailyReports: [
          {
            id: 3,
            inspectionId: 103,
            reportDate: '2025-01-13',
            description: 'Vessel V-001 external inspection. Checked for corrosion and structural integrity.',
            inspectorIds: [1],
            inspectorNames: 'احمد رضایی',
            findings: 'Surface corrosion noted on lower section',
            recommendations: 'Apply protective coating during next shutdown',
            weatherConditions: 'windy',
            safetyNotes: 'Used proper fall protection equipment',
            createdAt: '2025-01-13T14:20:00Z',
            updatedAt: '2025-01-13T14:20:00Z'
          }
        ],
        canCreateReport: false,
        canEdit: false,
        canComplete: false,
        canDelete: false,
        createdAt: '2025-01-11T11:00:00Z',
        updatedAt: '2025-01-13T16:00:00Z'
      }
    ].filter(inspection => {
      // Apply filters to mock data
      if (filters?.eventId && inspection.id.toString() !== filters.eventId) return false
      if (filters?.subEventId && inspection.id !== filters.subEventId) return false
      if (filters?.status && inspection.status !== filters.status) return false
      return true
    })
  }

  /**
   * Get a specific inspection by ID
   */
  async getInspection(inspectionId: number): Promise<Inspection> {
    return apiClient.get(`/inspections/${inspectionId}`)
  }

  /**
   * Create a new inspection
   */
  async createInspection(data: CreateInspectionRequest): Promise<Inspection> {
    return apiClient.post<Inspection>('/inspections', data)
  }

  /**
   * Update an existing inspection
   */
  async updateInspection(inspectionId: number, data: UpdateInspectionRequest): Promise<Inspection> {
    return apiClient.put<Inspection>(`/inspections/${inspectionId}`, data)
  }

  /**
   * Complete an inspection
   */
  async completeInspection(inspectionId: number, completionData?: {
    endDate?: string
    finalReport?: string
    notes?: string
  }): Promise<{
    message: string
    inspectionId: string
    completionDate: string
    canCreateReport: boolean
  }> {
    return apiClient.post(`/inspections/${inspectionId}/complete`, completionData)
  }

  /**
   * Delete an inspection
   */
  async deleteInspection(inspectionId: number): Promise<{ message: string }> {
    return apiClient.delete(`/inspections/${inspectionId}`)
  }

  /**
   * Check if inspection can create report
   */
  async canCreateReport(inspectionId: number): Promise<{
    canCreate: boolean
    reason?: string
    requiredFields?: string[]
  }> {
    return apiClient.get(`/inspections/${inspectionId}/can-create-report`)
  }
}

// Maintenance Events API Service
export class MaintenanceEventsApiService {
  /**
   * Get maintenance events with optional filtering
   */
  async getMaintenanceEvents(filters?: {
    skip?: number
    limit?: number
    status?: MaintenanceEventStatus
    eventType?: string
    fromDate?: string
    toDate?: string
  }): Promise<MaintenanceEvent[]> {
    try {
      return await apiClient.get<MaintenanceEvent[]>('/maintenance-events', filters)
    } catch (error) {
      console.warn('Backend maintenance events not available, returning mock data:', error)
      return this.getMockMaintenanceEvents()
    }
  }

  /**
   * Get mock maintenance events for development/testing
   */
  private getMockMaintenanceEvents(): MaintenanceEvent[] {
    return [
      {
        id: 1,
        eventNumber: 'ME-2025-001',
        title: 'Unit 100 Quarterly Maintenance',
        description: 'Quarterly maintenance activities for processing unit 100',
        eventType: MaintenanceEventType.Routine,
        status: MaintenanceEventStatus.InProgress,
        plannedStartDate: '2025-01-15',
        plannedEndDate: '2025-01-25',
        actualStartDate: '2025-01-15',
        completionPercentage: 45,
        category: 'Complex',
        inspections: [
          {
            id: 101,
            inspectionNumber: 'INS-2025-001',
            title: 'Pump P-001 Quarterly Inspection',
            description: 'Routine quarterly inspection of centrifugal pump P-001',
            startDate: '2025-01-15',
            endDate: '2025-01-20',
            status: InspectionStatus.InProgress,
            equipmentId: 1,
            requestingDepartment: RefineryDepartment.Operations,
            workOrder: 'WO-2025-001',
            canCreateReport: true,
            canEdit: true,
            canComplete: true,
            canDelete: false,
            createdAt: '2025-01-10T09:00:00Z',
            updatedAt: '2025-01-15T08:30:00Z'
          },
          {
            id: 102,
            inspectionNumber: 'INS-2025-002',
            title: 'Heat Exchanger HE-001 Annual Inspection',
            description: 'Annual comprehensive inspection of shell and tube heat exchanger',
            startDate: '2025-01-14',
            endDate: '2025-01-18',
            status: InspectionStatus.InProgress,
            equipmentId: 2,
            requestingDepartment: RefineryDepartment.Maintenance,
            workOrder: 'WO-2025-002',
            canCreateReport: true,
            canEdit: true,
            canComplete: true,
            canDelete: false,
            createdAt: '2025-01-12T10:00:00Z',
            updatedAt: '2025-01-14T10:15:00Z'
          }
        ],
        createdBy: 'admin',
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: '2025-01-15T10:30:00Z'
      }
    ]
  }

  /**
   * Get a specific maintenance event by ID
   */
  async getMaintenanceEvent(eventId: number): Promise<MaintenanceEvent> {
    return apiClient.get(`/maintenance-events/${eventId}`)
  }

  /**
   * Create a new maintenance event
   */
  async createMaintenanceEvent(data: any): Promise<MaintenanceEvent> {
    return apiClient.post('/maintenance/events', data)
  }

  /**
   * Update maintenance event status
   */
  async updateMaintenanceEventStatus(
    eventId: number, 
    data: UpdateMaintenanceEventStatusRequest
  ): Promise<MaintenanceEvent> {
    return apiClient.put(`/maintenance-events/${eventId}/status`, data)
  }

  /**
   * Get maintenance event statistics
   */
  async getMaintenanceEventStatistics(eventId: number): Promise<{
    eventId: string
    statistics: any
    requesterBreakdown: any[]
    equipmentStatusBreakdown: any
    progressHistory: any[]
  }> {
    return apiClient.get(`/maintenance-events/${eventId}/enhanced-statistics`)
  }
}

// Equipment API Service
export class EquipmentApiService {
  /**
   * Get equipment tags for autocomplete
   */
  async getEquipmentTags(query?: string): Promise<{
    suggestions: string[]
    totalMatches: number
  }> {
    const params = query ? { q: query } : {}
    return apiClient.get('/equipment/tags/search', params)
  }

  /**
   * Get equipment list
   */
  async getEquipment(params?: {
    skip?: number
    limit?: number
    tag?: string
    type?: string
    unit?: string
  }): Promise<any[]> {
    return apiClient.get('/equipment', params)
  }
}

// Inspectors API Service
export class InspectorsApiService {
  /**
   * Get inspectors with availability
   */
  async getInspectors(query?: string, available?: boolean): Promise<{
    inspectors: any[]
    availability: any[]
  }> {
    try {
      const params: Record<string, any> = {}
      if (query) params.q = query
      if (available !== undefined) params.available = available
      
      // Call the main inspectors endpoint (no search endpoint available)
      const response = await apiClient.get<any[]>('/inspectors', params)
      
      // Return in expected format
      return {
        inspectors: Array.isArray(response) ? response : [],
        availability: []
      }
    } catch (error) {
      console.warn('Backend inspectors not available, returning mock data:', error)
      // Return mock inspector data for development
      return {
        inspectors: [
          {
            id: 1,
            name: 'احمد رضایی',
            employee_id: 'EMP001',
            inspector_type: 'Mechanical',
            first_name: 'احمد',
            last_name: 'رضایی'
          },
          {
            id: 2,
            name: 'محمد احمدی',
            employee_id: 'EMP002',
            inspector_type: 'Electrical',
            first_name: 'محمد',
            last_name: 'احمدی'
          },
          {
            id: 3,
            name: 'علی محمدی',
            employee_id: 'EMP003',
            inspector_type: 'Civil',
            first_name: 'علی',
            last_name: 'محمدی'
          },
          {
            id: 4,
            name: 'حسن کریمی',
            employee_id: 'EMP004',
            inspector_type: 'Mechanical',
            first_name: 'حسن',
            last_name: 'کریمی'
          },
          {
            id: 5,
            name: 'رضا موسوی',
            employee_id: 'EMP005',
            inspector_type: 'Electrical',
            first_name: 'رضا',
            last_name: 'موسوی'
          },
          {
            id: 6,
            name: 'مهدی حسینی',
            employee_id: 'EMP006',
            inspector_type: 'Safety',
            first_name: 'مهدی',
            last_name: 'حسینی'
          }
        ],
        availability: []
      }
    }
  }

  /**
   * Get available inspector names for filtering
   */
  async getInspectorNames(): Promise<string[]> {
    try {
      const response = await apiClient.get<{ inspectors: any[] }>('/inspectors')
      return response.inspectors.map(inspector => inspector.name)
    } catch (error) {
      console.warn('Backend inspectors not available, returning mock data:', error)
      // Return mock inspector names
      return [
        'احمد رضایی',
        'محمد احمدی', 
        'علی محمدی',
        'حسن کریمی',
        'رضا موسوی',
        'مهدی حسینی'
      ]
    }
  }
}

// Create service instances
export const dailyReportsApi = new DailyReportsApiService()
export const inspectionsApi = new InspectionsApiService()
export const maintenanceEventsApi = new MaintenanceEventsApiService()
export const equipmentApi = new EquipmentApiService()
export const inspectorsApi = new InspectorsApiService()

// Helper functions for data transformation
export const apiHelpers = {
  /**
   * Transform backend daily report to frontend format
   */
  transformDailyReport(backendReport: any): DailyReport {
    return {
      id: backendReport.id,
      inspectionId: backendReport.inspection_id,
      reportDate: backendReport.report_date,
      description: backendReport.description,
      inspectorIds: backendReport.inspector_ids || [],
      inspectorNames: backendReport.inspector_names,
      findings: backendReport.findings,
      recommendations: backendReport.recommendations,
      weatherConditions: backendReport.weather_conditions,
      safetyNotes: backendReport.safety_notes,
      attachments: backendReport.attachments || [],
      createdAt: backendReport.created_at,
      updatedAt: backendReport.updated_at
    }
  },

  /**
   * Transform frontend daily report to backend format
   */
  transformDailyReportForBackend(frontendReport: CreateDailyReportRequest | UpdateDailyReportRequest): any {
    return {
      inspection_id: 'inspectionId' in frontendReport ? frontendReport.inspectionId : undefined,
      report_date: 'reportDate' in frontendReport ? frontendReport.reportDate : undefined,
      description: frontendReport.description,
      inspector_ids: frontendReport.inspectorIds,
      findings: frontendReport.findings,
      recommendations: frontendReport.recommendations,
      weather_conditions: frontendReport.weatherConditions,
      safety_notes: frontendReport.safetyNotes
    }
  },

  /**
   * Format date for API calls
   */
  formatDateForApi(date: Date | string): string {
    if (typeof date === 'string') return date
    return date.toISOString().split('T')[0]
  },

  /**
   * Parse API date to Date object
   */
  parseApiDate(dateString: string): Date {
    return new Date(dateString)
  },

  /**
   * Build filter params for API calls
   */
  buildFilterParams(filters: DailyReportsFilters): Record<string, unknown> {
    const params: Record<string, unknown> = {}

    if (filters.search) params.search = filters.search
    if (filters.inspector) params.inspector_name = filters.inspector
    if (filters.equipmentTag) params.equipment_tag = filters.equipmentTag
    if (filters.status) params.status = filters.status
    if (filters.department) params.department = filters.department
    if (filters.dateRange?.from) params.from_date = filters.dateRange.from
    if (filters.dateRange?.to) params.to_date = filters.dateRange.to
    if (filters.hasReports !== undefined) params.has_reports = filters.hasReports
    if (filters.showCompleted !== undefined) params.show_completed = filters.showCompleted

    return params
  }
}

// Export default API client for direct use if needed
export { apiClient }
export default {
  dailyReports: dailyReportsApi,
  inspections: inspectionsApi,
  maintenanceEvents: maintenanceEventsApi,
  equipment: equipmentApi,
  inspectors: inspectorsApi,
  helpers: apiHelpers
}
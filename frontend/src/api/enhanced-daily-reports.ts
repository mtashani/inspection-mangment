// Enhanced Daily Reports API Functions

import {
  Inspection,
  DailyReport,
  Equipment,
  HierarchicalItem,
  InspectionGroup,
  MaintenanceEventGroup,
  DailyReportsFilters,
  DailyReportsSummary,
  DailyReportsSearchParams,
  InspectionStatus,
  RefineryDepartment
} from '../types/enhanced-daily-reports'

import { MaintenanceEvent, MaintenanceEventStatus, MaintenanceEventType } from '../types/maintenance'
import { FinalReport } from '../types/professional-reports'

const API_BASE = '/api/v1'

// Utility function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Enhanced Inspections API
export const inspectionsApi = {
  // Get inspections with filtering and pagination
  async getInspections(params: {
    skip?: number
    limit?: number
    status?: InspectionStatus
    equipmentTag?: string
    department?: RefineryDepartment
    fromDate?: string
    toDate?: string
  } = {}): Promise<Inspection[]> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return apiCall<Inspection[]>(`/inspections?${searchParams.toString()}`)
  },

  // Create new inspection
  async createInspection(inspectionData: {
    inspectionNumber: string
    title: string
    description?: string
    startDate: string
    equipmentId: string
    requestingDepartment: RefineryDepartment
    workOrder?: string
    permitNumber?: string
  }): Promise<Inspection> {
    return apiCall<Inspection>('/inspections', {
      method: 'POST',
      body: JSON.stringify(inspectionData),
    })
  },

  // Get specific inspection with related data
  async getInspection(inspectionId: string): Promise<Inspection> {
    return apiCall<Inspection>(`/inspections/${inspectionId}`)
  },

  // Update inspection
  async updateInspection(
    inspectionId: string,
    inspectionData: Partial<Inspection>
  ): Promise<Inspection> {
    return apiCall<Inspection>(`/inspections/${inspectionId}`, {
      method: 'PUT',
      body: JSON.stringify(inspectionData),
    })
  },

  // Complete inspection
  async completeInspection(
    inspectionId: string,
    completionData?: {
      endDate?: string
      finalReport?: string
      notes?: string
    }
  ): Promise<{
    message: string
    inspectionId: string
    completionDate: string
    canCreateReport: boolean
  }> {
    return apiCall(`/inspections/${inspectionId}/complete`, {
      method: 'POST',
      body: completionData ? JSON.stringify(completionData) : undefined,
    })
  },

  // Delete inspection
  async deleteInspection(inspectionId: string): Promise<{ message: string }> {
    return apiCall<{ message: string }>(`/inspections/${inspectionId}`, {
      method: 'DELETE',
    })
  },

  // Get inspection reports
  async getInspectionReports(inspectionId: string): Promise<FinalReport[]> {
    return apiCall<FinalReport[]>(`/inspections/${inspectionId}/reports`)
  },

  // Check if inspection can create report
  async canCreateReport(inspectionId: string): Promise<{
    canCreate: boolean
    reason?: string
    requiredFields?: string[]
  }> {
    return apiCall(`/inspections/${inspectionId}/can-create-report`)
  }
}

// Enhanced Daily Reports API
export const dailyReportsApi = {
  // Get daily reports for inspection
  async getDailyReports(inspectionId: string): Promise<DailyReport[]> {
    return apiCall<DailyReport[]>(`/inspections/${inspectionId}/daily-reports`)
  },

  // Create daily report
  async createDailyReport(dailyReportData: {
    inspectionId: string
    reportDate: string
    description: string
    inspectorIds: number[]
    findings?: string
    recommendations?: string
    weatherConditions?: string
    safetyNotes?: string
  }): Promise<DailyReport> {
    return apiCall<DailyReport>('/daily-reports', {
      method: 'POST',
      body: JSON.stringify(dailyReportData),
    })
  },

  // Update daily report
  async updateDailyReport(
    reportId: string,
    reportData: Partial<DailyReport>
  ): Promise<DailyReport> {
    return apiCall<DailyReport>(`/daily-reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    })
  },

  // Delete daily report
  async deleteDailyReport(reportId: string): Promise<{ message: string }> {
    return apiCall<{ message: string }>(`/daily-reports/${reportId}`, {
      method: 'DELETE',
    })
  },

  // Upload images for daily report
  async uploadImages(
    reportId: string,
    images: File[]
  ): Promise<{
    success: boolean
    imageUrls: string[]
    message: string
  }> {
    const formData = new FormData()
    images.forEach((image, index) => {
      formData.append(`image_${index}`, image)
    })

    const response = await fetch(`${API_BASE}/daily-reports/${reportId}/images`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload images: ${response.statusText}`)
    }

    return response.json()
  },

  // Upload attachments for daily report
  async uploadAttachments(
    reportId: string,
    attachments: File[]
  ): Promise<{
    success: boolean
    attachmentUrls: string[]
    message: string
  }> {
    const formData = new FormData()
    attachments.forEach((attachment, index) => {
      formData.append(`attachment_${index}`, attachment)
    })

    const response = await fetch(`${API_BASE}/daily-reports/${reportId}/attachments`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload attachments: ${response.statusText}`)
    }

    return response.json()
  }
}

// Equipment API (Enhanced)
export const equipmentApi = {
  // Get equipment with enhanced data
  async getEquipment(params: {
    skip?: number
    limit?: number
    tag?: string
    type?: string
    unit?: string
    riskLevel?: string
    inspectionStatus?: InspectionStatus
    maintenanceStatus?: MaintenanceEventStatus
  } = {}): Promise<Equipment[]> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return apiCall<Equipment[]>(`/equipment?${searchParams.toString()}`)
  },

  // Get specific equipment with all related data
  async getEquipmentDetail(equipmentId: string): Promise<Equipment> {
    return apiCall<Equipment>(`/equipment/${equipmentId}`)
  },

  // Update equipment
  async updateEquipment(
    equipmentId: string,
    equipmentData: Partial<Equipment>
  ): Promise<Equipment> {
    return apiCall<Equipment>(`/equipment/${equipmentId}`, {
      method: 'PUT',
      body: JSON.stringify(equipmentData),
    })
  },

  // Get equipment inspections
  async getEquipmentInspections(equipmentId: string): Promise<Inspection[]> {
    return apiCall<Inspection[]>(`/equipment/${equipmentId}/inspections`)
  },

  // Get equipment maintenance events
  async getEquipmentMaintenanceEvents(equipmentId: string): Promise<MaintenanceEvent[]> {
    return apiCall<MaintenanceEvent[]>(`/equipment/${equipmentId}/maintenance`)
  },

  // Get equipment reports
  async getEquipmentReports(equipmentId: string): Promise<FinalReport[]> {
    return apiCall<FinalReport[]>(`/equipment/${equipmentId}/reports`)
  }
}

// Hierarchical Daily Reports API
export const hierarchicalReportsApi = {
  // Get hierarchical data (inspections + maintenance events)
  async getHierarchicalData(params: DailyReportsSearchParams): Promise<{
    items: HierarchicalItem[]
    total: number
    hasMore: boolean
    summary: DailyReportsSummary
  }> {
    const searchParams = new URLSearchParams()
    
    // Add search query
    if (params.query) {
      searchParams.append('query', params.query)
    }

    // Add filters
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'dateRange' && value) {
          searchParams.append('from_date', value.from)
          searchParams.append('to_date', value.to)
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })

    // Add sorting and pagination
    searchParams.append('sort_by', params.sortBy)
    searchParams.append('sort_order', params.sortOrder)
    searchParams.append('page', params.page.toString())
    searchParams.append('limit', params.limit.toString())

    return apiCall(`/daily-reports/hierarchical?${searchParams.toString()}`)
  },

  // Get summary statistics
  async getSummary(filters: DailyReportsFilters = {}): Promise<DailyReportsSummary> {
    const searchParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'dateRange' && value) {
          searchParams.append('from_date', value.from)
          searchParams.append('to_date', value.to)
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })

    return apiCall<DailyReportsSummary>(`/daily-reports/summary?${searchParams.toString()}`)
  },

  // Bulk operations
  async bulkUpdateStatus(
    itemIds: string[],
    itemType: 'inspection' | 'maintenance',
    status: InspectionStatus | MaintenanceEventStatus
  ): Promise<{
    success: boolean
    updatedCount: number
    failedItems: string[]
    message: string
  }> {
    return apiCall('/daily-reports/bulk-update-status', {
      method: 'POST',
      body: JSON.stringify({
        item_ids: itemIds,
        item_type: itemType,
        status
      }),
    })
  },

  // Export hierarchical data
  async exportData(
    filters: DailyReportsFilters,
    format: 'excel' | 'csv' | 'pdf'
  ): Promise<{
    success: boolean
    exportUrl: string
    format: string
    message: string
    exportedAt: string
  }> {
    return apiCall('/daily-reports/export', {
      method: 'POST',
      body: JSON.stringify({
        filters,
        format
      }),
    })
  }
}

// Helper functions for enhanced daily reports
export const dailyReportsHelpers = {
  // Transform inspection to UI format
  transformInspectionToGroup(inspection: Inspection): InspectionGroup {
    const reportCount = inspection.reports?.length || 0
    const lastReportDate = inspection.dailyReports?.length > 0 
      ? Math.max(...inspection.dailyReports.map(r => new Date(r.reportDate).getTime()))
      : undefined

    return {
      type: 'inspection',
      id: inspection.id,
      equipmentTag: inspection.equipment?.tag || 'Unknown',
      equipmentDescription: inspection.equipment?.description,
      inspectionNumber: inspection.inspectionNumber,
      title: inspection.title,
      startDate: inspection.startDate,
      endDate: inspection.endDate,
      status: inspection.status,
      requestingDepartment: inspection.requestingDepartment,
      dailyReports: inspection.dailyReports || [],
      reports: inspection.reports || [],
      canCreateReport: inspection.canCreateReport,
      canEdit: inspection.canEdit,
      canDelete: inspection.canDelete,
      canComplete: inspection.canComplete,
      reportCount,
      lastReportDate: lastReportDate ? new Date(lastReportDate).toISOString() : undefined
    }
  },

  // Transform maintenance event to UI format
  transformMaintenanceToGroup(event: MaintenanceEvent): MaintenanceEventGroup {
    const completedSubEvents = event.subEvents?.filter(
      sub => sub.status === MaintenanceEventStatus.COMPLETED
    ).length || 0

    const now = new Date()
    const overdueSubEvents = event.subEvents?.filter(sub => {
      const plannedEnd = new Date(sub.plannedEndDate)
      return now > plannedEnd && sub.status !== MaintenanceEventStatus.COMPLETED
    }).length || 0

    return {
      type: 'maintenance',
      id: event.id,
      eventNumber: event.eventNumber,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      status: event.status,
      plannedStartDate: event.plannedStartDate,
      plannedEndDate: event.plannedEndDate,
      actualStartDate: event.actualStartDate,
      actualEndDate: event.actualEndDate,
      subEvents: event.subEvents || [],
      completionPercentage: event.completionPercentage,
      canEdit: event.status === MaintenanceEventStatus.PLANNED,
      canDelete: event.status === MaintenanceEventStatus.PLANNED,
      canStart: event.status === MaintenanceEventStatus.PLANNED,
      canComplete: event.status === MaintenanceEventStatus.IN_PROGRESS,
      overdueSubEvents,
      completedSubEvents
    }
  },

  // Get status color for inspections
  getInspectionStatusColor(status: InspectionStatus): string {
    switch (status) {
      case InspectionStatus.PLANNED:
        return 'blue'
      case InspectionStatus.IN_PROGRESS:
        return 'yellow'
      case InspectionStatus.COMPLETED:
        return 'green'
      case InspectionStatus.CANCELLED:
        return 'red'
      case InspectionStatus.ON_HOLD:
        return 'gray'
      default:
        return 'gray'
    }
  },

  // Get department color
  getDepartmentColor(department: RefineryDepartment): string {
    switch (department) {
      case RefineryDepartment.OPERATIONS:
        return 'blue'
      case RefineryDepartment.MAINTENANCE:
        return 'orange'
      case RefineryDepartment.ENGINEERING:
        return 'purple'
      case RefineryDepartment.SAFETY:
        return 'red'
      case RefineryDepartment.QUALITY:
        return 'green'
      case RefineryDepartment.INSPECTION:
        return 'teal'
      default:
        return 'gray'
    }
  },

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  },

  // Format date with time
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  // Calculate days since/until
  calculateDaysFromNow(dateString: string): {
    days: number
    isPast: boolean
    label: string
  } {
    const now = new Date()
    const targetDate = new Date(dateString)
    const diffTime = targetDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const isPast = diffDays < 0

    let label: string
    if (diffDays === 0) {
      label = 'Today'
    } else if (diffDays === 1) {
      label = 'Tomorrow'
    } else if (diffDays === -1) {
      label = 'Yesterday'
    } else if (isPast) {
      label = `${Math.abs(diffDays)} days ago`
    } else {
      label = `In ${diffDays} days`
    }

    return {
      days: Math.abs(diffDays),
      isPast,
      label
    }
  },

  // Check if item is overdue
  isOverdue(item: HierarchicalItem): boolean {
    const now = new Date()
    
    if (item.type === 'inspection') {
      const plannedEnd = item.endDate ? new Date(item.endDate) : null
      return plannedEnd ? now > plannedEnd && item.status !== InspectionStatus.COMPLETED : false
    } else {
      const plannedEnd = new Date(item.plannedEndDate)
      return now > plannedEnd && item.status !== MaintenanceEventStatus.COMPLETED
    }
  },

  // Get priority level
  getPriorityLevel(item: HierarchicalItem): 'low' | 'medium' | 'high' | 'critical' {
    if (this.isOverdue(item)) return 'critical'
    
    const now = new Date()
    let targetDate: Date
    
    if (item.type === 'inspection') {
      targetDate = item.endDate ? new Date(item.endDate) : new Date(item.startDate)
    } else {
      targetDate = new Date(item.plannedEndDate)
    }
    
    const daysUntil = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil <= 1) return 'high'
    if (daysUntil <= 7) return 'medium'
    return 'low'
  },

  // Filter items based on search query
  filterItems(items: HierarchicalItem[], query: string): HierarchicalItem[] {
    if (!query.trim()) return items

    const searchTerm = query.toLowerCase()
    
    return items.filter(item => {
      // Search in common fields
      const searchableText = [
        item.title,
        item.type === 'inspection' ? item.equipmentTag : item.eventNumber,
        item.type === 'inspection' ? item.inspectionNumber : item.description || ''
      ].join(' ').toLowerCase()

      return searchableText.includes(searchTerm)
    })
  },

  // Sort items
  sortItems(
    items: HierarchicalItem[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): HierarchicalItem[] {
    const sorted = [...items].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.type === 'inspection' ? a.startDate : a.plannedStartDate)
          bValue = new Date(b.type === 'inspection' ? b.startDate : b.plannedStartDate)
          break
        case 'status':
          aValue = a.type === 'inspection' ? a.status : a.status
          bValue = b.type === 'inspection' ? b.status : b.status
          break
        case 'equipment':
          aValue = a.type === 'inspection' ? a.equipmentTag : a.title
          bValue = b.type === 'inspection' ? b.equipmentTag : b.title
          break
        case 'inspector':
          aValue = a.type === 'inspection' ? a.title : a.title
          bValue = b.type === 'inspection' ? b.title : b.title
          break
        default:
          aValue = a.title
          bValue = b.title
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  },

  // Group items by date
  groupItemsByDate(items: HierarchicalItem[]): Record<string, HierarchicalItem[]> {
    const groups: Record<string, HierarchicalItem[]> = {}

    items.forEach(item => {
      const date = item.type === 'inspection' ? item.startDate : item.plannedStartDate
      const dateKey = new Date(date).toDateString()
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(item)
    })

    return groups
  }
}

// Error handling utilities
export class DailyReportsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message)
    this.name = 'DailyReportsApiError'
  }
}

// Mock data generators for development
export const mockDailyReportsData = {
  generateMockInspection(overrides: Partial<Inspection> = {}): Inspection {
    return {
      id: `inspection-${Date.now()}`,
      inspectionNumber: `INS-${Math.floor(Math.random() * 10000)}`,
      title: 'Sample Inspection',
      description: 'Sample inspection description',
      startDate: new Date().toISOString(),
      status: InspectionStatus.PLANNED,
      equipmentId: 'equipment-123',
      requestingDepartment: RefineryDepartment.OPERATIONS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dailyReports: [],
      reports: [],
      canCreateReport: false,
      canEdit: true,
      canDelete: true,
      canComplete: false,
      ...overrides
    }
  },

  generateMockDailyReport(inspectionId: string, overrides: Partial<DailyReport> = {}): DailyReport {
    return {
      id: `daily-report-${Date.now()}`,
      inspectionId,
      reportDate: new Date().toISOString(),
      description: 'Sample daily report',
      inspectorIds: [1, 2],
      inspectorNames: 'John Doe, Jane Smith',
      findings: 'No significant findings',
      recommendations: 'Continue monitoring',
      weatherConditions: 'Clear, 25°C',
      safetyNotes: 'All safety protocols followed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    }
  },

  generateMockSummary(): DailyReportsSummary {
    return {
      activeInspections: Math.floor(Math.random() * 50) + 10,
      completedInspections: Math.floor(Math.random() * 100) + 50,
      activeMaintenanceEvents: Math.floor(Math.random() * 30) + 5,
      completedMaintenanceEvents: Math.floor(Math.random() * 80) + 20,
      reportsThisMonth: Math.floor(Math.random() * 200) + 100,
      activeInspectors: Math.floor(Math.random() * 20) + 5,
      overdueItems: Math.floor(Math.random() * 10),
      upcomingDeadlines: Math.floor(Math.random() * 15) + 5
    }
  }
}
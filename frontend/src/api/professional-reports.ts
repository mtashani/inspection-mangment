import {
  Template,
  FinalReport,
  ReportType,
  ExportFormat,
  ReportStatus,
  ReportExportRequest
} from '@/types/professional-reports'

const API_BASE = '/api/v1/report'

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

// Transform backend template to frontend format
const transformTemplate = (template: any): Template => ({
  id: String(template.id),
  name: template.name,
  description: template.description,
  reportType: template.report_type || 'general',
  isActive: template.is_active,
  createdAt: template.created_at,
  updatedAt: template.updated_at,
  sections: template.sections?.map(transformSection) || []
})

const transformSection = (section: any) => ({
  id: String(section.id),
  templateId: String(section.template_id),
  title: section.title,
  sectionType: section.section_type,
  order: section.order,
  subsections: section.subsections?.map(transformSubSection) || []
})

const transformSubSection = (subsection: any) => ({
  id: String(subsection.id),
  sectionId: String(subsection.section_id),
  title: subsection.title,
  order: subsection.order,
  fields: subsection.fields?.map(transformField) || []
})

const transformField = (field: any) => ({
  id: String(field.id),
  subsectionId: String(field.subsection_id),
  label: field.label,
  fieldType: field.field_type,
  valueSource: field.value_source,
  order: field.order,
  row: field.row || 0,
  col: field.col || 0,
  rowspan: field.rowspan || 1,
  colspan: field.colspan || 1,
  options: field.options ? JSON.parse(field.options) : undefined,
  isRequired: field.is_required,
  placeholder: field.placeholder,
  autoSourceKey: field.auto_source_key,
  purpose: field.purpose
})

const transformFinalReport = (report: any): FinalReport => ({
  id: String(report.id),
  inspectionId: String(report.inspection_id),
  templateId: String(report.template_id),
  createdBy: String(report.created_by),
  status: report.status,
  reportSerialNumber: report.report_serial_number,
  createdAt: report.created_at,
  updatedAt: report.updated_at,
  template: report.template ? transformTemplate(report.template) : undefined,
  fieldValues: report.field_values || {}
})

// Template Management APIs
export const getTemplates = async (activeOnly: boolean = true): Promise<Template[]> => {
  try {
    const url = `${API_BASE}/templates?active_only=${activeOnly}`
    const response = await fetch(url)
    const templates = await handleResponse<any[]>(response)
    return templates.map(transformTemplate)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch templates')
  }
}

export const getTemplate = async (templateId: string): Promise<Template> => {
  try {
    const response = await fetch(`${API_BASE}/templates/${templateId}`)
    const data = await handleResponse<{ template: any }>(response)
    return transformTemplate(data.template)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch template')
  }
}

export const createTemplate = async (templateData: any): Promise<Template> => {
  try {
    const response = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData)
    })
    const data = await handleResponse<{ template_id: string }>(response)
    // Fetch the created template
    return await getTemplate(data.template_id)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to create template')
  }
}

export const updateTemplate = async (templateId: string, templateData: any): Promise<Template> => {
  try {
    const response = await fetch(`${API_BASE}/templates/${templateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData)
    })
    await handleResponse<{ template_id: string }>(response)
    // Fetch the updated template
    return await getTemplate(templateId)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to update template')
  }
}

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/templates/${templateId}`, {
      method: 'DELETE'
    })
    await handleResponse<{ message: string }>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to delete template')
  }
}

export const cloneTemplate = async (templateId: string, newName: string): Promise<Template> => {
  try {
    const response = await fetch(`${API_BASE}/templates/${templateId}/clone?new_name=${encodeURIComponent(newName)}`, {
      method: 'POST'
    })
    const data = await handleResponse<{ cloned_template_id: string }>(response)
    return await getTemplate(data.cloned_template_id)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to clone template')
  }
}

export const validateTemplate = async (templateId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/templates/${templateId}/validate`)
    return await handleResponse<{ validation_result: any }>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to validate template')
  }
}

export const previewTemplate = async (templateId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/templates/${templateId}/preview`)
    return await handleResponse<{ preview: any }>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to generate template preview')
  }
}

// Report Management APIs
export const getAvailableTemplates = async (inspectionId: string): Promise<Template[]> => {
  try {
    const response = await fetch(`${API_BASE}/available-templates?inspection_id=${inspectionId}`)
    const templates = await handleResponse<any[]>(response)
    return templates.map(transformTemplate)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch available templates')
  }
}

export const createReport = async (
  inspectionId: string,
  templateId: string,
  createdBy: string
): Promise<FinalReport> => {
  try {
    const response = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspection_id: Number(inspectionId),
        template_id: Number(templateId),
        created_by: Number(createdBy)
      })
    })
    const data = await handleResponse<{ report_id: string }>(response)
    return await getReport(data.report_id)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to create report')
  }
}

export const getReport = async (reportId: string): Promise<FinalReport> => {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}`)
    const data = await handleResponse<{ report: any }>(response)
    return transformFinalReport(data.report)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch report')
  }
}

export const updateFieldValues = async (
  reportId: string,
  fieldValues: Record<string, any>
): Promise<FinalReport> => {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}/fields`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fieldValues)
    })
    await handleResponse<{ report_id: string }>(response)
    return await getReport(reportId)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to update field values')
  }
}

export const submitReport = async (reportId: string): Promise<FinalReport> => {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}/submit`, {
      method: 'POST'
    })
    await handleResponse<{ report_id: string }>(response)
    return await getReport(reportId)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to submit report')
  }
}

export const getReportsByInspection = async (
  inspectionId: string,
  status?: ReportStatus
): Promise<FinalReport[]> => {
  try {
    let url = `${API_BASE}/inspections/${inspectionId}/reports`
    if (status) url += `?status=${status}`
    
    const response = await fetch(url)
    const reports = await handleResponse<any[]>(response)
    return reports.map(transformFinalReport)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch reports by inspection')
  }
}

export const exportReport = async (
  reportId: string,
  format: ExportFormat = 'PDF'
): Promise<{ export_url?: string; data?: any }> => {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}/export?format=${format}`)
    return await handleResponse<{ export_url?: string; data?: any }>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to export report')
  }
}

export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}`, {
      method: 'DELETE'
    })
    await handleResponse<{ message: string }>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to delete report')
  }
}

// Auto-field APIs
export const getAutoFields = async (reportId: string): Promise<Record<string, any>> => {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}/auto-fields`)
    const data = await handleResponse<{ auto_fields: Record<string, any> }>(response)
    return data.auto_fields
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch auto-filled fields')
  }
}

export const refreshAutoFields = async (reportId: string): Promise<Record<string, any>> => {
  try {
    const response = await fetch(`${API_BASE}/reports/${reportId}/auto-fields/refresh`, {
      method: 'POST'
    })
    const data = await handleResponse<{ refreshed_fields: Record<string, any> }>(response)
    return data.refreshed_fields
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to refresh auto-filled fields')
  }
}

// Report Types (mock data for now - can be made configurable later)
export const getReportTypes = async (): Promise<ReportType[]> => {
  // This could be fetched from backend in the future
  return [
    {
      id: 'pressure-vessel',
      name: 'Pressure Vessel Inspection',
      description: 'Standard inspection report for pressure vessels'
    },
    {
      id: 'heat-exchanger',
      name: 'Heat Exchanger Inspection',
      description: 'Specialized report for heat exchanger inspections'
    },
    {
      id: 'general-equipment',
      name: 'General Equipment Inspection',
      description: 'General purpose inspection report for various equipment types'
    },
    {
      id: 'corrosion-assessment',
      name: 'Corrosion Assessment',
      description: 'Detailed corrosion analysis and assessment report'
    }
  ]
}      
  description: 'Heat exchanger inspection report',
        icon: '🔥',
        category: 'Equipment',
        templates: []
      },
      {
        id: 'piping',
        name: 'Piping System Inspection',
        description: 'Piping system inspection report',
        icon: '🔧',
        category: 'Infrastructure',
        templates: []
      },
      {
        id: 'tank',
        name: 'Storage Tank Inspection',
        description: 'Storage tank inspection report',
        icon: '🛢️',
        category: 'Storage',
        templates: []
      }
    ]
  },

  // Get templates by report type
  async getTemplatesByType(reportTypeId: string): Promise<Template[]> {
    return apiCall<Template[]>(`/templates/by-type/${reportTypeId}`)
  },

  // Check if inspection can create report
  async canCreateReport(inspectionId: string): Promise<{
    canCreate: boolean
    reason?: string
    availableTypes: ReportType[]
  }> {
    return apiCall(`/reports/can-create?inspection_id=${inspectionId}`)
  }
}

// Auto-field Sources API
export const autoFieldsApi = {
  // Get available auto-field sources
  async getAutoSources(): Promise<AutoSource[]> {
    return apiCall<AutoSource[]>('/auto-sources')
  },

  // Get auto-field value for specific source
  async getAutoFieldValue(
    sourceKey: string,
    inspectionId: string
  ): Promise<{
    success: boolean
    value: any
    dataType: string
    lastUpdated: string
  }> {
    const params = new URLSearchParams({
      source_key: sourceKey,
      inspection_id: inspectionId
    })
    return apiCall(`/auto-sources/value?${params.toString()}`)
  },

  // Test auto-field mapping
  async testAutoFieldMapping(
    fieldId: string,
    sourceKey: string,
    inspectionId: string
  ): Promise<{
    success: boolean
    testValue: any
    transformedValue: any
    message: string
  }> {
    return apiCall('/auto-sources/test', {
      method: 'POST',
      body: JSON.stringify({
        field_id: fieldId,
        source_key: sourceKey,
        inspection_id: inspectionId
      }),
    })
  }
}

// Report Statistics API
export const reportStatsApi = {
  // Get report statistics
  async getReportStats(params: {
    fromDate?: string
    toDate?: string
    reportType?: string
  } = {}): Promise<ReportStats> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })

    return apiCall<ReportStats>(`/statistics?${searchParams.toString()}`)
  },

  // Get report trends
  async getReportTrends(params: {
    period: 'week' | 'month' | 'quarter' | 'year'
    reportType?: string
  }): Promise<{
    success: boolean
    trends: Array<{
      period: string
      totalReports: number
      approvedReports: number
      averageCompletionTime: number
    }>
    message: string
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })

    return apiCall(`/statistics/trends?${searchParams.toString()}`)
  }
}

// Helper functions for professional reports
export const reportHelpers = {
  // Transform template for UI display
  transformTemplateForUI(template: Template): Template & {
    fieldCount: number
    sectionCount: number
    estimatedTime: number
    complexity: 'simple' | 'moderate' | 'complex'
  } {
    const fieldCount = template.sections.reduce((total, section) => {
      return total + section.subsections.reduce((subTotal, subsection) => {
        return subTotal + subsection.fields.length
      }, 0)
    }, 0)

    const sectionCount = template.sections.length
    const estimatedTime = Math.max(10, fieldCount * 2) // 2 minutes per field, minimum 10 minutes
    
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple'
    if (fieldCount > 50 || sectionCount > 10) complexity = 'complex'
    else if (fieldCount > 20 || sectionCount > 5) complexity = 'moderate'

    return {
      ...template,
      fieldCount,
      sectionCount,
      estimatedTime,
      complexity
    }
  },

  // Validate field value
  validateFieldValue(field: any, value: any): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Required field validation
    if (field.isRequired && (value === null || value === undefined || value === '')) {
      errors.push(`${field.label} is required`)
    }

    // Type-specific validation
    if (value !== null && value !== undefined && value !== '') {
      switch (field.fieldType) {
        case 'NUMBER':
          if (isNaN(Number(value))) {
            errors.push(`${field.label} must be a valid number`)
          } else {
            const numValue = Number(value)
            if (field.validationRules?.minValue !== undefined && numValue < field.validationRules.minValue) {
              errors.push(`${field.label} must be at least ${field.validationRules.minValue}`)
            }
            if (field.validationRules?.maxValue !== undefined && numValue > field.validationRules.maxValue) {
              errors.push(`${field.label} must be at most ${field.validationRules.maxValue}`)
            }
          }
          break

        case 'TEXT':
        case 'TEXTAREA':
          const strValue = String(value)
          if (field.validationRules?.minLength !== undefined && strValue.length < field.validationRules.minLength) {
            errors.push(`${field.label} must be at least ${field.validationRules.minLength} characters`)
          }
          if (field.validationRules?.maxLength !== undefined && strValue.length > field.validationRules.maxLength) {
            errors.push(`${field.label} must be at most ${field.validationRules.maxLength} characters`)
          }
          if (field.validationRules?.pattern) {
            const regex = new RegExp(field.validationRules.pattern)
            if (!regex.test(strValue)) {
              errors.push(`${field.label} format is invalid`)
            }
          }
          break

        case 'DATE':
          const dateValue = new Date(value)
          if (isNaN(dateValue.getTime())) {
            errors.push(`${field.label} must be a valid date`)
          }
          break

        case 'SELECT':
          if (field.options && !field.options.includes(value)) {
            errors.push(`${field.label} must be one of the available options`)
          }
          break

        case 'MULTI_SELECT':
          if (Array.isArray(value)) {
            const invalidOptions = value.filter(v => field.options && !field.options.includes(v))
            if (invalidOptions.length > 0) {
              errors.push(`${field.label} contains invalid options: ${invalidOptions.join(', ')}`)
            }
          } else {
            errors.push(`${field.label} must be an array`)
          }
          break
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Calculate form completion percentage
  calculateFormCompletion(template: Template, fieldValues: Record<string, any>): {
    percentage: number
    completedFields: number
    totalFields: number
    requiredCompleted: number
    totalRequired: number
  } {
    let totalFields = 0
    let completedFields = 0
    let totalRequired = 0
    let requiredCompleted = 0

    template.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        subsection.fields.forEach(field => {
          totalFields++
          if (field.isRequired) totalRequired++

          const value = fieldValues[field.id]
          const hasValue = value !== null && value !== undefined && value !== ''
          
          if (hasValue) {
            completedFields++
            if (field.isRequired) requiredCompleted++
          }
        })
      })
    })

    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

    return {
      percentage,
      completedFields,
      totalFields,
      requiredCompleted,
      totalRequired
    }
  },

  // Get field display value
  getFieldDisplayValue(field: any, value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    switch (field.fieldType) {
      case 'DATE':
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      
      case 'CHECKBOX':
        return value ? 'Yes' : 'No'
      
      case 'MULTI_SELECT':
        return Array.isArray(value) ? value.join(', ') : String(value)
      
      case 'NUMBER':
        return Number(value).toLocaleString()
      
      default:
        return String(value)
    }
  },

  // Get status color for UI
  getStatusColor(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.DRAFT:
        return 'gray'
      case ReportStatus.SUBMITTED:
        return 'blue'
      case ReportStatus.UNDER_REVIEW:
        return 'yellow'
      case ReportStatus.APPROVED:
        return 'green'
      case ReportStatus.REJECTED:
        return 'red'
      default:
        return 'gray'
    }
  },

  // Get status icon
  getStatusIcon(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.DRAFT:
        return '📝'
      case ReportStatus.SUBMITTED:
        return '📤'
      case ReportStatus.UNDER_REVIEW:
        return '👀'
      case ReportStatus.APPROVED:
        return '✅'
      case ReportStatus.REJECTED:
        return '❌'
      default:
        return '📄'
    }
  },

  // Format template version
  formatTemplateVersion(version: number): string {
    return `v${version.toFixed(1)}`
  },

  // Check if user can edit report
  canEditReport(report: FinalReport, currentUserId: string): boolean {
    return (
      report.status === ReportStatus.DRAFT &&
      report.createdBy === currentUserId
    )
  },

  // Check if user can submit report
  canSubmitReport(report: FinalReport, currentUserId: string): boolean {
    return (
      report.status === ReportStatus.DRAFT &&
      report.createdBy === currentUserId
    )
  },

  // Generate report serial number
  generateSerialNumber(template: Template, inspectionId: string): string {
    const templateCode = template.name.substring(0, 3).toUpperCase()
    const inspectionCode = inspectionId.substring(0, 8).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${templateCode}-${inspectionCode}-${timestamp}`
  }
}

// Error handling utilities
export class ReportApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ReportApiError'
  }
}

// Mock data generators for development
export const mockReportData = {
  generateMockTemplate(overrides: Partial<Template> = {}): Template {
    return {
      id: `template-${Date.now()}`,
      name: 'Sample Inspection Template',
      description: 'A sample template for testing',
      reportType: 'pressure-vessel',
      isActive: true,
      sections: [
        {
          id: 'section-1',
          templateId: `template-${Date.now()}`,
          title: 'General Information',
          sectionType: 'HEADER' as any,
          order: 1,
          isRequired: true,
          subsections: [
            {
              id: 'subsection-1',
              sectionId: 'section-1',
              title: 'Basic Details',
              order: 1,
              isRequired: true,
              fields: [
                {
                  id: 'field-1',
                  subsectionId: 'subsection-1',
                  label: 'Equipment Tag',
                  fieldType: 'TEXT' as any,
                  valueSource: 'AUTO' as any,
                  isRequired: true,
                  autoSourceKey: 'equipment.tag',
                  row: 1,
                  col: 1,
                  rowspan: 1,
                  colspan: 1,
                  order: 1
                }
              ]
            }
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      ...overrides
    }
  },

  generateMockReport(overrides: Partial<FinalReport> = {}): FinalReport {
    return {
      id: `report-${Date.now()}`,
      inspectionId: 'inspection-123',
      templateId: 'template-456',
      createdBy: 'user-789',
      status: ReportStatus.DRAFT,
      serialNumber: 'RPT-123456-789',
      fieldValues: {
        'field-1': 'V-101',
        'field-2': 'Pressure Vessel',
        'field-3': new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    }
  }
}
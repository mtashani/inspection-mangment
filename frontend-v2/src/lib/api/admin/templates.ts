/**
 * Admin Template Management API Functions
 */

import {
  ReportTemplate,
  TemplateFormData,
  TemplateFilters,
  AdminApiResponse,
  AdminPaginatedResponse
} from '@/types/admin'
import { adminApiGet, adminApiPost, adminApiPut, adminApiDelete, buildQueryParams } from './base'

/**
 * Get paginated list of templates with optional filtering
 */
export async function getTemplates(
  page: number = 1,
  limit: number = 20,
  filters?: TemplateFilters
): Promise<AdminPaginatedResponse<ReportTemplate>> {
  const queryParams = buildQueryParams({
    page,
    limit,
    ...filters
  })
  
  return adminApiGet<AdminPaginatedResponse<ReportTemplate>>(`/templates${queryParams}`)
}

/**
 * Get all templates (without pagination)
 */
export async function getAllTemplates(filters?: TemplateFilters): Promise<ReportTemplate[]> {
  const queryParams = buildQueryParams(filters || {})
  const response = await adminApiGet<AdminApiResponse<ReportTemplate[]>>(`/templates/all${queryParams}`)
  return response.data
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string): Promise<ReportTemplate> {
  const response = await adminApiGet<AdminApiResponse<ReportTemplate>>(`/templates/${id}`)
  return response.data
}

/**
 * Create new template
 */
export async function createTemplate(data: TemplateFormData): Promise<ReportTemplate> {
  const response = await adminApiPost<AdminApiResponse<ReportTemplate>>('/templates', data)
  return response.data
}

/**
 * Update existing template
 */
export async function updateTemplate(id: string, data: Partial<TemplateFormData>): Promise<ReportTemplate> {
  const response = await adminApiPut<AdminApiResponse<ReportTemplate>>(`/templates/${id}`, data)
  return response.data
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string): Promise<void> {
  await adminApiDelete<AdminApiResponse<void>>(`/templates/${id}`)
}

/**
 * Clone template
 */
export async function cloneTemplate(id: string, newName: string): Promise<ReportTemplate> {
  const response = await adminApiPost<AdminApiResponse<ReportTemplate>>(
    `/templates/${id}/clone`,
    { name: newName }
  )
  return response.data
}

/**
 * Toggle template active status
 */
export async function toggleTemplateStatus(id: string, isActive: boolean): Promise<ReportTemplate> {
  const response = await adminApiPut<AdminApiResponse<ReportTemplate>>(
    `/templates/${id}/status`,
    { isActive }
  )
  return response.data
}

/**
 * Validate template structure
 */
export async function validateTemplate(data: TemplateFormData): Promise<{
  isValid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}> {
  const response = await adminApiPost<AdminApiResponse<{
    isValid: boolean
    errors: Array<{
      field: string
      message: string
    }>
  }>>('/templates/validate', data)
  return response.data
}

/**
 * Test template with sample data
 */
export async function testTemplate(
  id: string,
  sampleData: Record<string, unknown>
): Promise<{
  success: boolean
  renderedTemplate: string
  errors?: string[]
}> {
  const response = await adminApiPost<AdminApiResponse<{
    success: boolean
    renderedTemplate: string
    errors?: string[]
  }>>(`/templates/${id}/test`, { sampleData })
  return response.data
}

/**
 * Get template usage statistics
 */
export async function getTemplateUsageStats(id: string): Promise<{
  totalUsage: number
  recentUsage: number
  lastUsedAt?: string
  usageByMonth: Array<{
    month: string
    count: number
  }>
}> {
  const response = await adminApiGet<AdminApiResponse<{
    totalUsage: number
    recentUsage: number
    lastUsedAt?: string
    usageByMonth: Array<{
      month: string
      count: number
    }>
  }>>(`/templates/${id}/usage-stats`)
  return response.data
}

/**
 * Get template versions/history
 */
export async function getTemplateVersions(id: string): Promise<Array<{
  version: number
  createdAt: string
  createdBy: string
  changes: string[]
}>> {
  const response = await adminApiGet<AdminApiResponse<Array<{
    version: number
    createdAt: string
    createdBy: string
    changes: string[]
  }>>>(`/templates/${id}/versions`)
  return response.data
}

/**
 * Restore template to specific version
 */
export async function restoreTemplateVersion(id: string, version: number): Promise<ReportTemplate> {
  const response = await adminApiPost<AdminApiResponse<ReportTemplate>>(
    `/templates/${id}/restore`,
    { version }
  )
  return response.data
}

/**
 * Export template
 */
export async function exportTemplate(id: string, format: 'JSON' | 'YAML' = 'JSON'): Promise<Blob> {
  const response = await fetch(`/api/v1/admin/templates/${id}/export?format=${format.toLowerCase()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to export template')
  }
  
  return response.blob()
}

/**
 * Import template from file
 */
export async function importTemplate(file: File): Promise<ReportTemplate> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/v1/admin/templates/import', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: formData,
  })
  
  if (!response.ok) {
    throw new Error('Failed to import template')
  }
  
  const result = await response.json()
  return result.data
}

/**
 * Get template statistics
 */
export async function getTemplateStats(): Promise<{
  total: number
  active: number
  inactive: number
  byType: Record<string, number>
  recentlyCreated: number
  recentlyUsed: number
}> {
  const response = await adminApiGet<AdminApiResponse<{
    total: number
    active: number
    inactive: number
    byType: Record<string, number>
    recentlyCreated: number
    recentlyUsed: number
  }>>('/templates/stats')
  return response.data
}

/**
 * Search templates
 */
export async function searchTemplates(query: string, limit: number = 10): Promise<ReportTemplate[]> {
  const response = await adminApiGet<AdminApiResponse<ReportTemplate[]>>(
    `/templates/search?q=${encodeURIComponent(query)}&limit=${limit}`
  )
  return response.data
}
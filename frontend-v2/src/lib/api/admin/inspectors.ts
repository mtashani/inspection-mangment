/**
 * Admin Inspector Management API Functions
 */

import {
  Inspector,
  InspectorFormData,
  InspectorFilters,
  SpecialtyPermissions,
  SpecialtyCode,
  AdminApiResponse,
  AdminPaginatedResponse
} from '@/types/admin'
import { adminApiGet, adminApiPost, adminApiPut, adminApiDelete, adminApiRequest, buildQueryParams } from './base'

// Check environment variable for mock data usage
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

/**
 * Get paginated list of inspectors with optional filtering
 */
export async function getInspectors(
  page: number = 1,
  limit: number = 20,
  filters?: InspectorFilters
): Promise<AdminPaginatedResponse<Inspector>> {
  if (USE_MOCK_DATA) {
    const { getMockInspectorsPaginated } = await import('@/lib/mock-data/inspectors')
    return getMockInspectorsPaginated(page, limit)
  }

  const queryParams = buildQueryParams({
    skip: (page - 1) * limit,
    limit,
    ...filters
  } as Record<string, unknown>)
  
  const inspectors = await adminApiGet<Inspector[]>(`/inspectors${queryParams}`)
  
  // Convert to paginated response format
  return {
    data: inspectors,
    pagination: {
      page,
      limit,
      total: inspectors.length, // Note: Backend should provide total count
      totalPages: Math.ceil(inspectors.length / limit)
    },
    success: true,
    message: 'Inspectors retrieved successfully'
  }
}

/**
 * Get all inspectors (without pagination)
 */
export async function getAllInspectors(filters?: InspectorFilters): Promise<Inspector[]> {
  const queryParams = buildQueryParams((filters || {}) as Record<string, unknown>)
  const inspectors = await adminApiGet<Inspector[]>(`/inspectors${queryParams}`)
  return inspectors
}

/**
 * Get inspector by ID
 */
export async function getInspectorById(id: number): Promise<Inspector> {
  if (USE_MOCK_DATA) {
    const { getMockInspectorById } = await import('@/lib/mock-data/inspectors')
    const inspector = getMockInspectorById(id)
    if (!inspector) {
      throw new Error(`Inspector with ID ${id} not found`)
    }
    return inspector
  }
  
  const inspector = await adminApiGet<Inspector>(`/inspectors/${id}`)
  return inspector
}

/**
 * Create new inspector
 */
export async function createInspector(data: InspectorFormData): Promise<Inspector> {
  const inspector = await adminApiPost<Inspector>('/inspectors', data)
  return inspector
}

/**
 * Update existing inspector
 */
export async function updateInspector(id: number, data: Partial<InspectorFormData>): Promise<Inspector> {
  const inspector = await adminApiPut<Inspector>(`/inspectors/${id}`, data)
  return inspector
}

/**
 * Delete inspector
 */
export async function deleteInspector(id: number): Promise<void> {
  await adminApiDelete<void>(`/inspectors/${id}`)
}

/**
 * Update inspector specialties
 */
export async function updateInspectorSpecialties(
  id: number,
  specialties: SpecialtyPermissions
): Promise<Inspector> {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const { getMockInspectorById, mockInspectors } = await import('@/lib/mock-data/inspectors')
    const inspector = getMockInspectorById(id)
    if (!inspector) {
      throw new Error(`Inspector with ID ${id} not found`)
    }
    
    // Convert SpecialtyPermissions to SpecialtyCode array
    const newSpecialties: SpecialtyCode[] = []
    if (specialties.PSV) newSpecialties.push('PSV')
    if (specialties.CRANE) newSpecialties.push('CRANE')
    if (specialties.CORROSION) newSpecialties.push('CORROSION')
    
    // Update the mock inspector
    const updatedInspector = {
      ...inspector,
      specialties: newSpecialties,
      updatedAt: new Date().toISOString()
    }
    
    return updatedInspector
  }

  const response = await adminApiPut<AdminApiResponse<Inspector>>(
    `/inspectors/${id}/specialties`,
    specialties
  )
  return response.data
}

/**
 * Toggle inspector active status
 */
export async function toggleInspectorStatus(id: number, active: boolean): Promise<Inspector> {
  const response = await adminApiPut<AdminApiResponse<Inspector>>(
    `/inspectors/${id}/status`,
    { active }
  )
  return response.data
}

/**
 * Toggle inspector login permission
 */
export async function toggleInspectorLoginPermission(id: number, canLogin: boolean): Promise<Inspector> {
  const response = await adminApiPut<AdminApiResponse<Inspector>>(
    `/inspectors/${id}/login-permission`,
    { canLogin }
  )
  return response.data
}

/**
 * Bulk update inspectors
 */
export async function bulkUpdateInspectors(
  inspectorIds: number[],
  updates: Partial<InspectorFormData>
): Promise<Inspector[]> {
  const response = await adminApiPut<AdminApiResponse<Inspector[]>>(
    '/inspectors/bulk-update',
    { inspectorIds, updates }
  )
  return response.data
}

/**
 * Bulk delete inspectors
 */
export async function bulkDeleteInspectors(inspectorIds: number[]): Promise<void> {
  await adminApiRequest<AdminApiResponse<void>>('/inspectors/bulk-delete', {
    method: 'DELETE',
    body: JSON.stringify({ inspectorIds })
  })
}

/**
 * Search inspectors by name or employee ID
 */
export async function searchInspectors(query: string, limit: number = 10): Promise<Inspector[]> {
  const response = await adminApiGet<AdminApiResponse<Inspector[]>>(
    `/inspectors/search?q=${encodeURIComponent(query)}&limit=${limit}`
  )
  return response.data
}

/**
 * Get inspector statistics
 */
export async function getInspectorStats(): Promise<{
  total: number
  active: number
  inactive: number
  bySpecialty: Record<string, number>
  byType: Record<string, number>
}> {
  const response = await adminApiGet<AdminApiResponse<{
    total: number
    active: number
    inactive: number
    bySpecialty: Record<string, number>
    byType: Record<string, number>
  }>>('/inspectors/stats')
  return response.data
}

/**
 * Export inspector data
 */
export async function exportInspectorData(inspectorIds?: number[]): Promise<Blob> {
  const queryParams = inspectorIds ? `?ids=${inspectorIds.join(',')}` : ''
  const response = await adminApiRequest<Blob>(`/inspectors/export${queryParams}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
  return response
}

/**
 * Import inspector data from file
 */
export async function importInspectorData(file: File): Promise<{
  successCount: number
  errorCount: number
  errors: Array<{ row: number; message: string }>
}> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await adminApiRequest<AdminApiResponse<{
    successCount: number
    errorCount: number
    errors: Array<{ row: number; message: string }>
  }>>('/inspectors/import', {
    method: 'POST',
    body: formData
  })
  return response.data
}
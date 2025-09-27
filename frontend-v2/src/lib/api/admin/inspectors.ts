/**
 * Admin Inspector Management API Functions
 */

import {
  Inspector,
  InspectorFormData,
  InspectorFilters,
  AdminApiResponse,
  AdminPaginatedResponse
} from '@/types/admin'
import { adminApiGet, adminApiPost, adminApiPut, adminApiDelete, adminApiRequest, adminApiGetAuthenticated, buildQueryParams } from './base'
import { snakeToCamelObject } from '@/lib/utils/transform'

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
    page,
    page_size: limit,
    search: filters?.search,
    active_only: filters?.active !== undefined ? filters.active : false, // Show all inspectors by default
    can_login_only: filters?.canLogin,
    sort_by: 'last_name',
    sort_order: 'asc'
  } as Record<string, unknown>)
  
  // Try to get both data and statistics
  let response: any[]
  let stats: {
    total_inspectors: number
    active_inspectors: number
    inactive_inspectors: number
    login_enabled: number
    attendance_tracking_enabled: number
    inspectors_with_roles: number
    inspectors_without_roles: number
    activity_rate: number
  }

  try {
    // Get the inspector data first
    response = await adminApiGetAuthenticated<any[]>(`/inspectors${queryParams}`)
    
    // Transform snake_case to camelCase
    const transformedResponse: Inspector[] = response.map(item => snakeToCamelObject<Inspector>(item))
    
    // Try to get statistics, but fallback if it fails
    try {
      stats = await adminApiGetAuthenticated<{
        total_inspectors: number
        active_inspectors: number
        inactive_inspectors: number
        login_enabled: number
        attendance_tracking_enabled: number
        inspectors_with_roles: number
        inspectors_without_roles: number
        activity_rate: number
      }>('/inspectors/statistics')
    } catch (statsError) {
      console.warn('Statistics endpoint failed, using fallback pagination:', statsError)
      // Fallback: estimate total based on current page and response length
      const estimatedTotal = transformedResponse.length < limit ? transformedResponse.length : transformedResponse.length * 5 // Conservative estimate
      stats = {
        total_inspectors: estimatedTotal,
        active_inspectors: estimatedTotal,
        inactive_inspectors: 0,
        login_enabled: 0,
        attendance_tracking_enabled: 0,
        inspectors_with_roles: 0,
        inspectors_without_roles: 0,
        activity_rate: 0
      }
    }
  } catch (error) {
    console.error('Failed to fetch inspectors:', error)
    throw error
  }
  
  // Get total count based on active_only filter
  const totalCount = filters?.active === false 
    ? stats.total_inspectors 
    : (filters?.active === true ? stats.active_inspectors : stats.total_inspectors)
  
  // Convert to standardized response format
  return {
    data: response.map(item => snakeToCamelObject<Inspector>(item)),
    pagination: {
      page: page,
      limit: limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
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
  const inspectors = await adminApiGetAuthenticated<any[]>(`/inspectors${queryParams}`)
  return inspectors.map(item => snakeToCamelObject<Inspector>(item))
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
  
  const inspector = await adminApiGetAuthenticated<any>(`/inspectors/${id}`)
  return snakeToCamelObject<Inspector>(inspector)
}

/**
 * Create new inspector
 */
export async function createInspector(data: InspectorFormData): Promise<Inspector> {
  // Transform frontend data to backend format
  const backendData = {
    first_name: data.firstName,
    last_name: data.lastName,
    employee_id: data.employeeId,
    national_id: data.nationalId,
    email: data.email,
    phone: data.phone || null,
    years_experience: Number(data.yearsExperience) || 0, // Ensure it's a proper number
    date_of_birth: data.dateOfBirth || null,
    username: data.username || null,
    password: data.password || null,
    can_login: data.canLogin || false,
    active: data.active ?? true,
    attendance_tracking_enabled: data.attendanceTrackingEnabled || false,
    education_degree: data.educationDegree || null,
    education_field: data.educationField || null,
    education_institute: data.educationInstitute || null,
    graduation_year: data.graduationYear ? Number(data.graduationYear) : null,
    birth_place: data.birthPlace || null,
    marital_status: data.maritalStatus || null,
    base_hourly_rate: data.baseHourlyRate ? Number(data.baseHourlyRate) : null,
    overtime_multiplier: data.overtimeMultiplier ? Number(data.overtimeMultiplier) : 1.5,
    night_shift_multiplier: data.nightShiftMultiplier ? Number(data.nightShiftMultiplier) : 1.3,
    on_call_multiplier: data.onCallMultiplier ? Number(data.onCallMultiplier) : 2.0
  }
  
  // Log the data being sent in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Sending inspector data to backend:', {
      ...backendData,
      password: backendData.password ? '[PROVIDED]' : '[NOT PROVIDED]'
    })
  }
  
  const inspector = await adminApiPost<Inspector>('/inspectors', backendData)
  return inspector
}

/**
 * Update existing inspector
 */
export async function updateInspector(id: number, data: Partial<InspectorFormData>): Promise<Inspector> {
  // Transform frontend data to backend format, filtering out undefined values
  const backendData: Record<string, any> = {}
  
  // Only include fields that are explicitly set (not undefined)
  if (data.firstName !== undefined) backendData.first_name = data.firstName
  if (data.lastName !== undefined) backendData.last_name = data.lastName
  if (data.employeeId !== undefined) backendData.employee_id = data.employeeId
  if (data.nationalId !== undefined) backendData.national_id = data.nationalId
  if (data.email !== undefined) backendData.email = data.email
  if (data.phone !== undefined) backendData.phone = data.phone
  if (data.yearsExperience !== undefined) backendData.years_experience = data.yearsExperience
  if (data.dateOfBirth !== undefined) backendData.date_of_birth = data.dateOfBirth
  if (data.username !== undefined) backendData.username = data.username
  if (data.password !== undefined) backendData.password = data.password
  if (data.canLogin !== undefined) backendData.can_login = data.canLogin
  if (data.active !== undefined) backendData.active = data.active
  if (data.attendanceTrackingEnabled !== undefined) backendData.attendance_tracking_enabled = data.attendanceTrackingEnabled
  if (data.educationDegree !== undefined) backendData.education_degree = data.educationDegree
  if (data.educationField !== undefined) backendData.education_field = data.educationField
  if (data.educationInstitute !== undefined) backendData.education_institute = data.educationInstitute
  if (data.graduationYear !== undefined) backendData.graduation_year = data.graduationYear
  if (data.birthPlace !== undefined) backendData.birth_place = data.birthPlace
  if (data.maritalStatus !== undefined) backendData.marital_status = data.maritalStatus
  if (data.baseHourlyRate !== undefined) backendData.base_hourly_rate = data.baseHourlyRate
  if (data.overtimeMultiplier !== undefined) backendData.overtime_multiplier = data.overtimeMultiplier
  if (data.nightShiftMultiplier !== undefined) backendData.night_shift_multiplier = data.nightShiftMultiplier
  if (data.onCallMultiplier !== undefined) backendData.on_call_multiplier = data.onCallMultiplier
  
  // Log the data being sent in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Updating inspector with data:', {
      ...backendData,
      password: backendData.password ? '[PROVIDED]' : undefined
    })
  }
  
  const inspector = await adminApiPut<Inspector>(`/inspectors/${id}`, backendData)
  return inspector
}

/**
 * Get related records for an inspector before deletion
 */
export async function getInspectorRelatedRecords(id: number): Promise<{
  inspector_id: number
  inspector_name: string
  employee_id: string
  related_records: {
    roles: { count: number; data: any[] }
    documents: { count: number; data: any[] }
    notifications: { count: number; data: any[] }
    notification_preferences: { count: number; data: any[] }
  }
  total_related_records: number
  can_delete_safely: boolean
}> {
  const response = await adminApiGet<{
    inspector_id: number
    inspector_name: string
    employee_id: string
    related_records: {
      roles: { count: number; data: any[] }
      documents: { count: number; data: any[] }
      notifications: { count: number; data: any[] }
      notification_preferences: { count: number; data: any[] }
    }
    total_related_records: number
    can_delete_safely: boolean
  }>(`/inspectors/${id}/related-records`)
  return response
}

/**
 * Delete inspector with optional force parameter
 */
export async function deleteInspectorWithForce(id: number, force: boolean = false): Promise<void> {
  const queryParams = force ? '?force=true' : ''
  await adminApiDelete<void>(`/inspectors/${id}${queryParams}`)
}

/**
 * Delete inspector (legacy function - uses normal delete by default)
 */
export async function deleteInspector(id: number): Promise<void> {
  await deleteInspectorWithForce(id, false)
}

// updateInspectorSpecialties function removed - specialties system deprecated

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
  const response = await adminApiGetAuthenticated<{
    query: string
    results: Array<{
      id: number
      name: string
      employee_id: string
      email: string
      active: boolean
    }>
    total: number
  }>(`/inspectors/search?q=${encodeURIComponent(query)}&limit=${limit}`)
  
  // Transform to Inspector format
  return response.results.map(result => snakeToCamelObject<Inspector>(result))
}

/**
 * Get inspector statistics
 */
export async function getInspectorStats(): Promise<{
  total_inspectors: number
  active_inspectors: number
  inactive_inspectors: number
  login_enabled: number
  attendance_tracking_enabled: number
  inspectors_with_roles: number
  inspectors_without_roles: number
  activity_rate: number
}> {
  const response = await adminApiGetAuthenticated<{
    total_inspectors: number
    active_inspectors: number
    inactive_inspectors: number
    login_enabled: number
    attendance_tracking_enabled: number
    inspectors_with_roles: number
    inspectors_without_roles: number
    activity_rate: number
  }>('/inspectors/statistics')
  return response
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
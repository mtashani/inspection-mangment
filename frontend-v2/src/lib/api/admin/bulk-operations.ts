/**
 * Admin Bulk Operations API Functions
 */

import {
  BulkOperation,
  BulkImportData,
  BulkImportOptions,
  BulkExportOptions,
  AdminApiResponse,
  AdminPaginatedResponse
} from '@/types/admin'
import { adminApiGet, adminApiPost, adminApiDelete, adminApiUpload, buildQueryParams } from './base'

/**
 * Get paginated list of bulk operations
 */
export async function getBulkOperations(
  page: number = 1,
  limit: number = 20,
  filters?: {
    type?: string
    status?: string
    createdBy?: string
  }
): Promise<AdminPaginatedResponse<BulkOperation>> {
  const queryParams = buildQueryParams({
    page,
    limit,
    ...filters
  })
  
  return adminApiGet<AdminPaginatedResponse<BulkOperation>>(`/bulk-operations${queryParams}`)
}

/**
 * Get bulk operation by ID
 */
export async function getBulkOperationById(id: string): Promise<BulkOperation> {
  const response = await adminApiGet<AdminApiResponse<BulkOperation>>(`/bulk-operations/${id}`)
  return response.data
}

/**
 * Import data from Excel/CSV file
 */
export async function importDataFromFile(
  file: File,
  type: 'INSPECTORS' | 'ATTENDANCE' | 'TEMPLATES',
  options: BulkImportOptions
): Promise<BulkOperation> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('options', JSON.stringify(options))
  
  const response = await fetch('/api/v1/admin/bulk-operations/import', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: formData,
  })
  
  if (!response.ok) {
    throw new Error('Failed to import data')
  }
  
  const result = await response.json()
  return result.data
}

/**
 * Export data to Excel/CSV file
 */
export async function exportDataToFile(options: BulkExportOptions): Promise<Blob> {
  const response = await adminApiPost<Blob>('/bulk-operations/export', options)
  return response
}

/**
 * Validate import file without importing
 */
export async function validateImportFile(
  file: File,
  type: 'INSPECTORS' | 'ATTENDANCE' | 'TEMPLATES',
  options: BulkImportOptions
): Promise<{
  isValid: boolean
  totalRows: number
  validRows: number
  errors: Array<{
    row: number
    field?: string
    message: string
    value?: unknown
  }>
  preview: Array<Record<string, unknown>>
}> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('options', JSON.stringify({ ...options, validateOnly: true }))
  
  const response = await fetch('/api/v1/admin/bulk-operations/validate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: formData,
  })
  
  if (!response.ok) {
    throw new Error('Failed to validate import file')
  }
  
  const result = await response.json()
  return result.data
}

/**
 * Cancel bulk operation
 */
export async function cancelBulkOperation(id: string): Promise<BulkOperation> {
  const response = await adminApiPost<AdminApiResponse<BulkOperation>>(
    `/bulk-operations/${id}/cancel`,
    {}
  )
  return response.data
}

/**
 * Delete bulk operation
 */
export async function deleteBulkOperation(id: string): Promise<void> {
  await adminApiDelete<AdminApiResponse<void>>(`/bulk-operations/${id}`)
}

/**
 * Get bulk operation progress
 */
export async function getBulkOperationProgress(id: string): Promise<{
  status: string
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  progress: number
  estimatedTimeRemaining?: number
  currentStep?: string
}> {
  const response = await adminApiGet<AdminApiResponse<{
    status: string
    totalRecords: number
    processedRecords: number
    successfulRecords: number
    failedRecords: number
    progress: number
    estimatedTimeRemaining?: number
    currentStep?: string
  }>>(`/bulk-operations/${id}/progress`)
  return response.data
}

/**
 * Download bulk operation result file
 */
export async function downloadBulkOperationResult(id: string): Promise<Blob> {
  const response = await fetch(`/api/v1/admin/bulk-operations/${id}/download`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to download bulk operation result')
  }
  
  return response.blob()
}

/**
 * Get bulk operation errors
 */
export async function getBulkOperationErrors(id: string): Promise<Array<{
  row: number
  field?: string
  message: string
  value?: unknown
}>> {
  const response = await adminApiGet<AdminApiResponse<Array<{
    row: number
    field?: string
    message: string
    value?: unknown
  }>>>(`/bulk-operations/${id}/errors`)
  return response.data
}

/**
 * Retry failed bulk operation
 */
export async function retryBulkOperation(id: string): Promise<BulkOperation> {
  const response = await adminApiPost<AdminApiResponse<BulkOperation>>(
    `/bulk-operations/${id}/retry`,
    {}
  )
  return response.data
}

/**
 * Get import template for specific data type
 */
export async function getImportTemplate(
  type: 'INSPECTORS' | 'ATTENDANCE' | 'TEMPLATES',
  format: 'EXCEL' | 'CSV' = 'EXCEL'
): Promise<Blob> {
  const response = await fetch(
    `/api/v1/admin/bulk-operations/template?type=${type}&format=${format.toLowerCase()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to download import template')
  }
  
  return response.blob()
}

/**
 * Get bulk operations statistics
 */
export async function getBulkOperationsStats(): Promise<{
  totalOperations: number
  completedOperations: number
  failedOperations: number
  inProgressOperations: number
  byType: Record<string, number>
  recentOperations: Array<{
    id: string
    type: string
    status: string
    createdAt: string
    completedAt?: string
  }>
}> {
  const response = await adminApiGet<AdminApiResponse<{
    totalOperations: number
    completedOperations: number
    failedOperations: number
    inProgressOperations: number
    byType: Record<string, number>
    recentOperations: Array<{
      id: string
      type: string
      status: string
      createdAt: string
      completedAt?: string
    }>
  }>>('/bulk-operations/stats')
  return response.data
}

/**
 * Bulk update inspectors
 */
export async function bulkUpdateInspectors(
  inspectorIds: number[],
  updates: Record<string, unknown>
): Promise<BulkOperation> {
  const response = await adminApiPost<AdminApiResponse<BulkOperation>>(
    '/bulk-operations/inspectors/bulk-update',
    { inspectorIds, updates }
  )
  return response.data
}

/**
 * Bulk delete inspectors
 */
export async function bulkDeleteInspectors(inspectorIds: number[]): Promise<BulkOperation> {
  const response = await adminApiPost<AdminApiResponse<BulkOperation>>(
    '/bulk-operations/inspectors/bulk-delete',
    { inspectorIds }
  )
  return response.data
}

/**
 * Bulk update attendance records
 */
export async function bulkUpdateAttendance(
  records: Array<{
    id?: number
    inspectorId: number
    date: string
    status: string
    workHours: number
    overtimeHours?: number
  }>
): Promise<BulkOperation> {
  const response = await adminApiPost<AdminApiResponse<BulkOperation>>(
    '/bulk-operations/attendance/bulk-update',
    { records }
  )
  return response.data
}
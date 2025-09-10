/**
 * Admin Payroll Management API Functions (Inspector-Centric)
 */

import {
  PayrollRecord,
  PayrollCalculation,
  PayrollSettings,
  PayrollFilters,
  BonusRule,
  DeductionRule,
  AdminApiResponse,
  AdminPaginatedResponse
} from '@/types/admin'
import { adminApiGet, adminApiPost, adminApiPut, adminApiDelete, buildQueryParams } from './base'

/**
 * Get paginated payroll records with optional filtering
 */
export async function getPayrollRecords(
  page: number = 1,
  limit: number = 20,
  filters?: PayrollFilters
): Promise<AdminPaginatedResponse<PayrollRecord>> {
  const queryParams = buildQueryParams({
    page,
    limit,
    ...filters
  })
  
  return adminApiGet<AdminPaginatedResponse<PayrollRecord>>(`/inspectors/payroll${queryParams}`)
}

/**
 * Get payroll record by ID
 */
export async function getPayrollRecordById(id: number): Promise<PayrollRecord> {
  const response = await adminApiGet<AdminApiResponse<PayrollRecord>>(`/inspectors/payroll/${id}`)
  return response.data
}

/**
 * Get payroll records for specific inspector
 */
export async function getInspectorPayroll(
  inspectorId: number,
  year?: number,
  month?: number
): Promise<PayrollRecord[]> {
  const queryParams = buildQueryParams({
    year,
    month
  })
  
  const response = await adminApiGet<AdminApiResponse<PayrollRecord[]>>(
    `/inspectors/payroll/inspector/${inspectorId}${queryParams}`
  )
  return response.data
}

/**
 * Calculate payroll for inspector and month
 */
export async function calculatePayroll(
  inspectorId: number,
  month: number,
  year: number
): Promise<PayrollCalculation> {
  const response = await adminApiPost<AdminApiResponse<PayrollCalculation>>(
    '/inspectors/payroll/calculate',
    { inspectorId, month, year }
  )
  return response.data
}

/**
 * Generate payroll record
 */
export async function generatePayrollRecord(
  inspectorId: number,
  month: number,
  year: number,
  overrides?: Partial<PayrollCalculation>
): Promise<PayrollRecord> {
  const response = await adminApiPost<AdminApiResponse<PayrollRecord>>(
    '/inspectors/payroll/generate',
    { inspectorId, month, year, overrides }
  )
  return response.data
}

/**
 * Update payroll record
 */
export async function updatePayrollRecord(
  id: number,
  data: Partial<{
    bonuses: number
    deductions: number
    notes: string
    isPaid: boolean
  }>
): Promise<PayrollRecord> {
  const response = await adminApiPut<AdminApiResponse<PayrollRecord>>(`/inspectors/payroll/${id}`, data)
  return response.data
}

/**
 * Mark payroll as paid
 */
export async function markPayrollAsPaid(id: number): Promise<PayrollRecord> {
  const response = await adminApiPut<AdminApiResponse<PayrollRecord>>(
    `/inspectors/payroll/${id}/mark-paid`,
    {}
  )
  return response.data
}

/**
 * Bulk generate payroll for multiple inspectors
 */
export async function bulkGeneratePayroll(
  inspectorIds: number[],
  month: number,
  year: number
): Promise<PayrollRecord[]> {
  const response = await adminApiPost<AdminApiResponse<PayrollRecord[]>>(
    '/inspectors/payroll/bulk-generate',
    { inspectorIds, month, year }
  )
  return response.data
}

/**
 * Delete payroll record
 */
export async function deletePayrollRecord(id: number): Promise<void> {
  await adminApiDelete<AdminApiResponse<void>>(`/inspectors/payroll/${id}`)
}

/**
 * Get payroll settings for inspector
 */
export async function getPayrollSettings(inspectorId: number): Promise<PayrollSettings> {
  const response = await adminApiGet<AdminApiResponse<PayrollSettings>>(
    `/inspectors/payroll/settings/inspector/${inspectorId}`
  )
  return response.data
}

/**
 * Update payroll settings for inspector
 */
export async function updatePayrollSettings(
  inspectorId: number,
  settings: Partial<PayrollSettings>
): Promise<PayrollSettings> {
  const response = await adminApiPut<AdminApiResponse<PayrollSettings>>(
    `/inspectors/payroll/settings/inspector/${inspectorId}`,
    settings
  )
  return response.data
}

/**
 * Get bonus rules
 */
export async function getBonusRules(): Promise<BonusRule[]> {
  const response = await adminApiGet<AdminApiResponse<BonusRule[]>>('/inspectors/payroll/bonus-rules')
  return response.data
}

/**
 * Create bonus rule
 */
export async function createBonusRule(rule: Omit<BonusRule, 'id'>): Promise<BonusRule> {
  const response = await adminApiPost<AdminApiResponse<BonusRule>>('/inspectors/payroll/bonus-rules', rule)
  return response.data
}

/**
 * Update bonus rule
 */
export async function updateBonusRule(id: string, rule: Partial<BonusRule>): Promise<BonusRule> {
  const response = await adminApiPut<AdminApiResponse<BonusRule>>(`/inspectors/payroll/bonus-rules/${id}`, rule)
  return response.data
}

/**
 * Delete bonus rule
 */
export async function deleteBonusRule(id: string): Promise<void> {
  await adminApiDelete<AdminApiResponse<void>>(`/inspectors/payroll/bonus-rules/${id}`)
}

/**
 * Get deduction rules
 */
export async function getDeductionRules(): Promise<DeductionRule[]> {
  const response = await adminApiGet<AdminApiResponse<DeductionRule[]>>('/inspectors/payroll/deduction-rules')
  return response.data
}

/**
 * Create deduction rule
 */
export async function createDeductionRule(rule: Omit<DeductionRule, 'id'>): Promise<DeductionRule> {
  const response = await adminApiPost<AdminApiResponse<DeductionRule>>('/inspectors/payroll/deduction-rules', rule)
  return response.data
}

/**
 * Update deduction rule
 */
export async function updateDeductionRule(id: string, rule: Partial<DeductionRule>): Promise<DeductionRule> {
  const response = await adminApiPut<AdminApiResponse<DeductionRule>>(`/inspectors/payroll/deduction-rules/${id}`, rule)
  return response.data
}

/**
 * Delete deduction rule
 */
export async function deleteDeductionRule(id: string): Promise<void> {
  await adminApiDelete<AdminApiResponse<void>>(`/inspectors/payroll/deduction-rules/${id}`)
}

/**
 * Generate payroll report
 */
export async function generatePayrollReport(
  month: number,
  year: number,
  inspectorIds?: number[],
  format: 'PDF' | 'EXCEL' | 'CSV' = 'PDF'
): Promise<Blob> {
  const queryParams = buildQueryParams({
    month,
    year,
    inspector_ids: inspectorIds?.join(','),
    format: format.toLowerCase()
  })
  
  const response = await fetch(`/api/v1/inspectors/payroll/report${queryParams}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to generate payroll report')
  }
  
  return response.blob()
}

/**
 * Export payroll data
 */
export async function exportPayrollData(
  startDate: string,
  endDate: string,
  format: 'EXCEL' | 'CSV' = 'EXCEL'
): Promise<Blob> {
  const queryParams = buildQueryParams({
    start_date: startDate,
    end_date: endDate,
    format: format.toLowerCase()
  })
  
  const response = await fetch(`/api/v1/inspectors/payroll/export${queryParams}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to export payroll data')
  }
  
  return response.blob()
}

/**
 * Get payroll statistics
 */
export async function getPayrollStats(
  startDate?: string,
  endDate?: string
): Promise<{
  totalPayroll: number
  averageSalary: number
  totalOvertimePay: number
  totalBonuses: number
  totalDeductions: number
  pendingPayments: number
  paidPayments: number
  byInspector: Array<{
    inspectorId: number
    inspectorName: string
    totalPay: number
    overtimePay: number
    bonuses: number
    deductions: number
  }>
}> {
  const queryParams = buildQueryParams({
    start_date: startDate,
    end_date: endDate
  })
  
  const response = await adminApiGet<AdminApiResponse<{
    totalPayroll: number
    averageSalary: number
    totalOvertimePay: number
    totalBonuses: number
    totalDeductions: number
    pendingPayments: number
    paidPayments: number
    byInspector: Array<{
      inspectorId: number
      inspectorName: string
      totalPay: number
      overtimePay: number
      bonuses: number
      deductions: number
    }>
  }>>(`/inspectors/payroll/stats${queryParams}`)
  return response.data
}
/**
 * Work Cycle Management API
 */

import { adminApiPost, adminApiGet, adminApiPut, adminApiDelete } from './base'

export interface WorkCycleData {
  start_date?: string // YYYY-MM-DD format
  jalali_start_date?: string // YYYY-MM-DD format
  cycle_type: 'full_time' | 'part_time' | 'contract' | 'fourteen_fourteen' | 'seven_seven' | 'office' | 'guest'
}

export interface WorkCycleResponse {
  id: number
  inspector_id: number
  start_date: string
  jalali_start_date: string
  cycle_type: string
  created_at: string
  updated_at: string
}

/**
 * Create a work cycle for an inspector
 */
export async function createWorkCycle(inspectorId: number, data: WorkCycleData): Promise<WorkCycleResponse> {
  const response = await adminApiPost<WorkCycleResponse>('/inspectors/work-cycles', {
    ...data,
    inspector_id: inspectorId
  })
  return response
}

/**
 * Get work cycles for an inspector
 */
export async function getInspectorWorkCycles(inspectorId: number): Promise<WorkCycleResponse[]> {
  const response = await adminApiGet<WorkCycleResponse[]>(`/inspectors/${inspectorId}/work-cycles`)
  return response
}

/**
 * Update a work cycle
 */
export async function updateWorkCycle(cycleId: number, data: Partial<WorkCycleData>): Promise<WorkCycleResponse> {
  const response = await adminApiPut<WorkCycleResponse>(`/inspectors/work-cycles/${cycleId}`, data)
  return response
}

/**
 * Delete a work cycle
 */
export async function deleteWorkCycle(cycleId: number): Promise<void> {
  await adminApiDelete<void>(`/inspectors/work-cycles/${cycleId}`)
}
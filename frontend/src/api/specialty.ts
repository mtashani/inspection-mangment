/**
 * Specialty API - Backend Integration
 */

import { SpecialtyCode, SpecialtyMap, SpecialtyCodeResponse, Inspector } from '@/types/inspector'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

export const specialtyApi = {
  /**
   * Get specialties for a specific inspector
   */
  getInspectorSpecialties: async (inspectorId: number): Promise<SpecialtyMap> => {
    const response = await fetch(`${API_BASE}/api/v1/inspectors/${inspectorId}/specialties`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Update specialties for a specific inspector (Admin only)
   */
  updateInspectorSpecialties: async (
    inspectorId: number, 
    specialties: SpecialtyMap
  ): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE}/api/v1/inspectors/${inspectorId}/specialties`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(specialties)
    })
    return handleResponse(response)
  },

  /**
   * Get all available specialty codes with descriptions
   */
  getSpecialtyCodes: async (): Promise<SpecialtyCodeResponse[]> => {
    const response = await fetch(`${API_BASE}/api/v1/inspectors/specialty-codes`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Get inspectors with a specific specialty
   */
  getInspectorsBySpecialty: async (specialty: SpecialtyCode): Promise<Inspector[]> => {
    const response = await fetch(`${API_BASE}/api/v1/inspectors/by-specialty/${specialty}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Grant a specific specialty to inspector (Admin only)
   */
  grantSpecialty: async (
    inspectorId: number, 
    specialty: SpecialtyCode
  ): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE}/api/v1/inspectors/${inspectorId}/grant/${specialty}`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Revoke a specific specialty from inspector (Admin only)
   */
  revokeSpecialty: async (
    inspectorId: number, 
    specialty: SpecialtyCode
  ): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE}/api/v1/inspectors/${inspectorId}/revoke/${specialty}`, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  // Helper endpoints for specific specialties
  /**
   * Get all PSV inspectors
   */
  getPSVInspectors: async (): Promise<Inspector[]> => {
    const response = await fetch(`${API_BASE}/api/v1/inspectors/psv-inspectors`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Get all Crane inspectors
   */
  getCraneInspectors: async (): Promise<Inspector[]> => {
    const response = await fetch(`${API_BASE}/api/v1/inspectors/crane-inspectors`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  },

  /**
   * Get all Corrosion inspectors
   */
  getCorrosionInspectors: async (): Promise<Inspector[]> => {
    const response = await fetch(`${API_BASE}/api/v1/inspectors/corrosion-inspectors`, {
      headers: getAuthHeaders()
    })
    return handleResponse(response)
  }
}

// Convenience function to get inspectors by specialty using the helper endpoints
export const getInspectorsBySpecialtyHelper = async (specialty: SpecialtyCode): Promise<Inspector[]> => {
  switch (specialty) {
    case 'PSV':
      return specialtyApi.getPSVInspectors()
    case 'CRANE':
      return specialtyApi.getCraneInspectors()
    case 'CORROSION':
      return specialtyApi.getCorrosionInspectors()
    default:
      throw new Error(`Unknown specialty: ${specialty}`)
  }
}

// Batch operations
export const specialtyBatchApi = {
  /**
   * Get all inspectors grouped by specialty
   */
  getAllInspectorsBySpecialty: async (): Promise<{
    PSV: Inspector[]
    CRANE: Inspector[]
    CORROSION: Inspector[]
  }> => {
    const [psvInspectors, craneInspectors, corrosionInspectors] = await Promise.all([
      specialtyApi.getPSVInspectors(),
      specialtyApi.getCraneInspectors(),
      specialtyApi.getCorrosionInspectors()
    ])

    return {
      PSV: psvInspectors,
      CRANE: craneInspectors,
      CORROSION: corrosionInspectors
    }
  },

  /**
   * Bulk update specialties for multiple inspectors
   */
  bulkUpdateSpecialties: async (updates: Array<{
    inspectorId: number
    specialties: SpecialtyMap
  }>): Promise<{ success: number, failed: number, errors: string[] }> => {
    const results = await Promise.allSettled(
      updates.map(({ inspectorId, specialties }) => 
        specialtyApi.updateInspectorSpecialties(inspectorId, specialties)
      )
    )

    const success = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason.message)

    return { success, failed, errors }
  }
}

export default specialtyApi
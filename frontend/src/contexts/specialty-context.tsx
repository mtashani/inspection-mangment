'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SpecialtyCode, SpecialtyMap, SpecialtyContextType, Inspector } from '@/types/inspector'
import { specialtyApi, specialtyBatchApi } from '@/api/specialty'
import { useAuth } from './auth-context'

const SpecialtyContext = createContext<SpecialtyContextType>({
  specialties: { PSV: false, CRANE: false, CORROSION: false },
  loading: false,
  error: null,
  inspectorsBySpecialty: {
    PSV: [],
    CRANE: [],
    CORROSION: []
  },
  updateInspectorSpecialties: async () => {},
  refreshInspectorsBySpecialty: async () => {},
  getAvailableInspectors: () => []
})

export const useSpecialty = () => useContext(SpecialtyContext)

export function SpecialtyProvider({ children }: { children: ReactNode }) {
  const { inspector, isAuthenticated } = useAuth()
  const [specialties, setSpecialties] = useState<SpecialtyMap>({
    PSV: false,
    CRANE: false,
    CORROSION: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inspectorsBySpecialty, setInspectorsBySpecialty] = useState<{
    PSV: Inspector[]
    CRANE: Inspector[]
    CORROSION: Inspector[]
  }>({
    PSV: [],
    CRANE: [],
    CORROSION: []
  })

  // Load current inspector's specialties
  useEffect(() => {
    if (inspector && isAuthenticated) {
      const specialties = inspector.specialties || []
      const currentSpecialties: SpecialtyMap = {
        PSV: specialties.includes('PSV'),
        CRANE: specialties.includes('CRANE'),
        CORROSION: specialties.includes('CORROSION')
      }
      setSpecialties(currentSpecialties)
    }
  }, [inspector, isAuthenticated])

  // Load inspectors by specialty on mount
  useEffect(() => {
    if (isAuthenticated) {
      refreshInspectorsBySpecialty()
    }
  }, [isAuthenticated])

  const updateInspectorSpecialties = async (
    inspectorId: number,
    newSpecialties: SpecialtyMap
  ): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await specialtyApi.updateInspectorSpecialties(inspectorId, newSpecialties)
      
      // If updating current inspector, update local state
      if (inspector && inspector.id === inspectorId) {
        setSpecialties(newSpecialties)
      }

      // Refresh inspectors by specialty to get updated lists
      await refreshInspectorsBySpecialty()
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update specialties'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshInspectorsBySpecialty = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const inspectorsBySpecialtyData = await specialtyBatchApi.getAllInspectorsBySpecialty()
      setInspectorsBySpecialty(inspectorsBySpecialtyData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inspectors by specialty'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getAvailableInspectors = (specialty: SpecialtyCode): Inspector[] => {
    return inspectorsBySpecialty[specialty].filter(inspector => 
      inspector.active && inspector.can_login
    )
  }

  // Individual specialty operations
  const grantSpecialty = async (inspectorId: number, specialty: SpecialtyCode): Promise<void> => {
    try {
      await specialtyApi.grantSpecialty(inspectorId, specialty)
      await refreshInspectorsBySpecialty()
      
      // Update local state if it's current inspector
      if (inspector && inspector.id === inspectorId) {
        setSpecialties(prev => ({ ...prev, [specialty]: true }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant specialty')
      throw err
    }
  }

  const revokeSpecialty = async (inspectorId: number, specialty: SpecialtyCode): Promise<void> => {
    try {
      await specialtyApi.revokeSpecialty(inspectorId, specialty)
      await refreshInspectorsBySpecialty()
      
      // Update local state if it's current inspector
      if (inspector && inspector.id === inspectorId) {
        setSpecialties(prev => ({ ...prev, [specialty]: false }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke specialty')
      throw err
    }
  }

  // Bulk operations
  const bulkUpdateSpecialties = async (updates: Array<{
    inspectorId: number
    specialties: SpecialtyMap
  }>): Promise<{ success: number, failed: number, errors: string[] }> => {
    setLoading(true)
    try {
      const result = await specialtyBatchApi.bulkUpdateSpecialties(updates)
      await refreshInspectorsBySpecialty()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk update failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for common use cases
  const hasSpecialtyAvailable = (specialty: SpecialtyCode): boolean => {
    return getAvailableInspectors(specialty).length > 0
  }

  const getSpecialtyStats = () => {
    return {
      PSV: {
        total: inspectorsBySpecialty.PSV.length,
        active: inspectorsBySpecialty.PSV.filter(i => i.active).length,
        available: getAvailableInspectors('PSV').length
      },
      CRANE: {
        total: inspectorsBySpecialty.CRANE.length,
        active: inspectorsBySpecialty.CRANE.filter(i => i.active).length,
        available: getAvailableInspectors('CRANE').length
      },
      CORROSION: {
        total: inspectorsBySpecialty.CORROSION.length,
        active: inspectorsBySpecialty.CORROSION.filter(i => i.active).length,
        available: getAvailableInspectors('CORROSION').length
      }
    }
  }

  const contextValue: SpecialtyContextType = {
    specialties,
    loading,
    error,
    inspectorsBySpecialty,
    updateInspectorSpecialties,
    refreshInspectorsBySpecialty,
    getAvailableInspectors
  }

  // Extended context with additional methods
  const extendedContextValue = {
    ...contextValue,
    grantSpecialty,
    revokeSpecialty,
    bulkUpdateSpecialties,
    hasSpecialtyAvailable,
    getSpecialtyStats
  }

  return (
    <SpecialtyContext.Provider value={extendedContextValue as SpecialtyContextType}>
      {children}
    </SpecialtyContext.Provider>
  )
}

// Hook with extended functionality
export const useSpecialtyExtended = () => {
  const context = useContext(SpecialtyContext)
  return context as typeof context & {
    grantSpecialty: (inspectorId: number, specialty: SpecialtyCode) => Promise<void>
    revokeSpecialty: (inspectorId: number, specialty: SpecialtyCode) => Promise<void>
    bulkUpdateSpecialties: (updates: Array<{ inspectorId: number, specialties: SpecialtyMap }>) => Promise<{ success: number, failed: number, errors: string[] }>
    hasSpecialtyAvailable: (specialty: SpecialtyCode) => boolean
    getSpecialtyStats: () => {
      PSV: { total: number, active: number, available: number }
      CRANE: { total: number, active: number, available: number }
      CORROSION: { total: number, active: number, available: number }
    }
  }
}

export default SpecialtyContext
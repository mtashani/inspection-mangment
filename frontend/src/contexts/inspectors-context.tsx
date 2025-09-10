'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getInspectors } from '@/api/inspectors'
import { Inspector, InspectorsContextType, SpecialtyCode } from '@/types/inspector'

const InspectorsContext = createContext<InspectorsContextType>({
  inspectors: [],
  loading: true,
  error: null,
  getInspectorName: () => 'Unknown',
  getInspectorsBySpecialty: () => [],
  refreshInspectors: async () => {}
})

export const useInspectors = () => useContext(InspectorsContext)

export function InspectorsProvider({ children }: { children: ReactNode }) {
  const [inspectors, setInspectors] = useState<Inspector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInspectors = async () => {
    setLoading(true)
    try {
      const data = await getInspectors()
      setInspectors(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inspectors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInspectors()
  }, [])

  const getInspectorName = (id: string | number): string => {
    const inspector = inspectors.find(i => String(i.id) === String(id))
    return inspector?.name || 'Unknown'
  }

  const getInspectorsBySpecialty = (specialty: SpecialtyCode): Inspector[] => {
    return inspectors.filter(inspector =>
      inspector.specialties.includes(specialty) &&
      inspector.active &&
      inspector.can_login
    )
  }

  const refreshInspectors = async (): Promise<void> => {
    await loadInspectors()
  }

  return (
    <InspectorsContext.Provider value={{
      inspectors,
      loading,
      error,
      getInspectorName,
      getInspectorsBySpecialty,
      refreshInspectors
    }}>
      {children}
    </InspectorsContext.Provider>
  )
}
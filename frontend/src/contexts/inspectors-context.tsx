'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getInspectors } from '@/api/inspectors'

interface Inspector {
  id: number
  name: string
  inspector_type: string
}

interface InspectorsContextType {
  inspectors: Inspector[]
  loading: boolean
  error: string | null
  getInspectorName: (id: string) => string
}

const InspectorsContext = createContext<InspectorsContextType>({
  inspectors: [],
  loading: true,
  error: null,
  getInspectorName: () => 'Unknown'
})

export const useInspectors = () => useContext(InspectorsContext)

export function InspectorsProvider({ children }: { children: ReactNode }) {
  const [inspectors, setInspectors] = useState<Inspector[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInspectors = async () => {
      try {
        const data = await getInspectors()
        setInspectors(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inspectors')
      } finally {
        setLoading(false)
      }
    }

    loadInspectors()
  }, [])

  const getInspectorName = (id: string): string => {
    const inspector = inspectors.find(i => String(i.id) === id)
    return inspector?.name || 'Unknown'
  }

  return (
    <InspectorsContext.Provider value={{ inspectors, loading, error, getInspectorName }}>
      {children}
    </InspectorsContext.Provider>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface Inspector {
  id: number
  username: string | null
  email: string
  name: string
  first_name: string
  last_name: string
  employee_id: string
  phone?: string | null
  can_login: boolean
  is_active: boolean
  roles: string[]
  permissions?: string[]
  profile_image_url?: string | null
}

interface UseInspectorsReturn {
  inspectors: Inspector[] | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createInspector: (inspectorData: Partial<Inspector>) => Promise<Inspector>
  updateInspector: (inspectorId: number, inspectorData: Partial<Inspector>) => Promise<Inspector>
  deleteInspector: (inspectorId: number) => Promise<void>
}

export function useInspectors(): UseInspectorsReturn {
  const { token } = useAuth()
  const [inspectors, setInspectors] = useState<Inspector[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch inspectors
  const fetchInspectors = async () => {
    if (!token) return
    
    setIsLoading(true)
    setError(null)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/v1/inspectors?page=1&page_size=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setInspectors(data.inspectors || data || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.detail || `Failed to fetch inspectors: ${response.status}`)
        setInspectors([])
      }
    } catch (error) {
      console.error('Error fetching inspectors:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      setInspectors([])
    } finally {
      setIsLoading(false)
    }
  }

  // Create inspector
  const createInspector = async (inspectorData: Partial<Inspector>): Promise<Inspector> => {
    if (!token) throw new Error('No authentication token')
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${API_BASE_URL}/api/v1/inspectors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inspectorData),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to create inspector')
    }
    
    const newInspector = await response.json()
    setInspectors(prev => prev ? [...prev, newInspector] : [newInspector])
    return newInspector
  }

  // Update inspector
  const updateInspector = async (inspectorId: number, inspectorData: Partial<Inspector>): Promise<Inspector> => {
    if (!token) throw new Error('No authentication token')
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${API_BASE_URL}/api/v1/inspectors/${inspectorId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inspectorData),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to update inspector')
    }
    
    const updatedInspector = await response.json()
    setInspectors(prev => 
      prev ? prev.map(inspector => 
        inspector.id === inspectorId ? updatedInspector : inspector
      ) : [updatedInspector]
    )
    return updatedInspector
  }

  // Delete inspector
  const deleteInspector = async (inspectorId: number): Promise<void> => {
    if (!token) throw new Error('No authentication token')
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${API_BASE_URL}/api/v1/inspectors/${inspectorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to delete inspector')
    }
    
    setInspectors(prev => prev ? prev.filter(inspector => inspector.id !== inspectorId) : [])
  }

  // Effect to fetch data on mount
  useEffect(() => {
    if (token) {
      fetchInspectors()
    }
  }, [token])

  return {
    inspectors,
    isLoading,
    error,
    refetch: fetchInspectors,
    createInspector,
    updateInspector,
    deleteInspector,
  }
}
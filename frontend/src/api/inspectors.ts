interface Inspector {
  id: number
  name: string
  inspector_type: string
}

const API_BASE = '/api/inspectors'

export const getInspectors = async (): Promise<Inspector[]> => {
  const response = await fetch(API_BASE)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new Error(error.detail || 'Failed to fetch inspectors')
  }
  return response.json()
}
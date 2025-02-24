const API_BASE = '/api/equipment'

// API error handling utility
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new ApiError(response.status, error.detail || 'An unexpected error occurred')
  }
  
  try {
    const data = await response.json()
    return data as T
  } catch (err) {
    console.error('Failed to parse response:', err)
    throw new ApiError(500, 'Failed to parse response data')
  }
}

export const getEquipmentTags = async (search?: string): Promise<string[]> => {
  try {
    const searchParam = search ? `?search=${encodeURIComponent(search)}` : ''
    const response = await fetch(`${API_BASE}/tags${searchParam}`)
    const data = await handleResponse<{ tags: string[] }>(response)
    return data.tags
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch equipment tags')
  }
}
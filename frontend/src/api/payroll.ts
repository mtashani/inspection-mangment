const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// گرفتن گزارش حقوق و دستمزد یک بازرس برای یک ماه
export const getPayroll = async (inspectorId: number, month: number, year: number): Promise<unknown> => {
  const response = await fetch(`${API_BASE}/payroll?inspector_id=${inspectorId}&month=${month}&year=${year}`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
} 
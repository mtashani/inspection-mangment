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

// گرفتن لیست مرخصی‌های یک بازرس
export const getLeaves = async (inspectorId: number): Promise<unknown> => {
  const response = await fetch(`${API_BASE}/leave?inspector_id=${inspectorId}`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

// ثبت درخواست مرخصی
export const requestLeave = async (inspectorId: number, from: string, to: string, reason: string): Promise<unknown> => {
  const response = await fetch(`${API_BASE}/leave`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ inspector_id: inspectorId, from, to, reason })
  })
  return handleResponse(response)
}

// حذف درخواست مرخصی
export const deleteLeave = async (leaveId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/leave/${leaveId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
  }
}

// تایید درخواست مرخصی
export const approveLeave = async (leaveId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/leave/${leaveId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
  }
}

// رد درخواست مرخصی
export const rejectLeave = async (leaveId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/leave/${leaveId}/reject`, {
    method: 'POST',
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
  }
} 
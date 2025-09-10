import { Inspector, CreateInspectorData } from '@/types/inspector'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// Helper function to get auth headers
export const getAuthHeaders = () => {
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

export const getInspectors = async (attendanceTrackingEnabled?: boolean): Promise<Inspector[]> => {
  const query = attendanceTrackingEnabled !== undefined ? `?attendance_tracking_enabled=${attendanceTrackingEnabled}` : ''
  const response = await fetch(`${API_BASE}/api/v1/inspectors/${query}`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const getInspector = async (id: number): Promise<Inspector> => {
  const response = await fetch(`${API_BASE}/api/v1/inspectors/${id}`, {
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}

export const createInspector = async (data: CreateInspectorData): Promise<Inspector> => {
  console.log("=== API CALL DEBUG ===");
  console.log("API URL:", `${API_BASE}/api/v1/inspectors/`);
  console.log("Request headers:", getAuthHeaders());
  console.log("Request body:", JSON.stringify(data, null, 2));
  
  const response = await fetch(`${API_BASE}/api/v1/inspectors/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  
  console.log("Response status:", response.status);
  console.log("Response headers:", Object.fromEntries(response.headers.entries()));
  
  const result = await handleResponse(response);
  console.log("API Response:", result);
  
  return result;
}

export const uploadInspectorProfileImage = async (inspectorId: number, imageFile: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  console.log("Uploading profile image for inspector:", inspectorId);
  console.log("Image file:", imageFile.name, imageFile.size, "bytes");
  
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}/api/v1/inspectors/${inspectorId}/profile-image`, {
    method: 'POST',
    headers,
    body: formData
  });
  
  console.log("Profile image upload response status:", response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log("Profile image upload result:", result);
  
  return result;
}

export const updateInspector = async (id: number, data: Partial<Inspector>): Promise<Inspector> => {
  const response = await fetch(`${API_BASE}/api/v1/inspectors/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse(response)
}

export const deleteInspector = async (id: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE}/api/v1/inspectors/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  return handleResponse(response)
}
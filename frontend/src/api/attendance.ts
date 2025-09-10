import { AttendanceDay } from '@/components/attendance/AttendanceCalendar'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

const handleResponse = async (response: Response): Promise<unknown> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    let errorMsg = ''
    if (typeof errorData.detail === 'string') {
      errorMsg = errorData.detail
    } else if (errorData.detail) {
      errorMsg = JSON.stringify(errorData.detail)
    } else if (errorData.message) {
      errorMsg = errorData.message
    } else {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`
    }
    throw errorMsg
  }
  return response.json()
}

// گرفتن لیست حضور و غیاب یک بازرس برای یک ماه یا سیکل
export const getAttendance = async (inspectorId: number, month: number, year: number): Promise<AttendanceDay[]> => {
  const response = await fetch(`${API_BASE}/api/v1/attendance/inspectors/${inspectorId}/monthly-attendance/${year}/${month}`, {
    headers: getAuthHeaders()
  })
  const data = await handleResponse(response) as { days: AttendanceDay[] }
  return data.days
}

// ثبت یا ویرایش حضور و غیاب یک روز
export const saveAttendanceDay = async (inspectorId: number, date: string, data: Omit<AttendanceDay, 'date'> & { jalali_date: string }): Promise<AttendanceDay> => {
  const response = await fetch(`${API_BASE}/api/v1/attendance/inspectors/${inspectorId}/attendance`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...data, date })
  })
  return handleResponse(response) as Promise<AttendanceDay>
}

// گرفتن اطلاعات work cycle یک بازرس
export const getWorkCycle = async (inspectorId: number): Promise<{ jalali_start_date: string } | null> => {
  const response = await fetch(`${API_BASE}/api/v1/work-cycles?inspector_id=${inspectorId}`, {
    headers: getAuthHeaders()
  })
  const data = await handleResponse(response)
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  return null;
}

// تعریف نوع WorkCycleResponse برای استفاده در خروجی updateWorkCycle
export interface WorkCycleResponse {
  id: number;
  inspector_id: number;
  start_date: string;
  cycle_type: string;
  jalali_start_date: string;
  created_at: string;
  updated_at: string;
}

// ویرایش اطلاعات work cycle یک بازرس
export const updateWorkCycle = async (
  cycleId: number,
  data: Partial<{ start_date: string; cycle_type: string; jalali_start_date: string }>
): Promise<WorkCycleResponse> => {
  const response = await fetch(`${API_BASE}/api/v1/work-cycles/${cycleId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  })
  return handleResponse(response) as Promise<WorkCycleResponse>;
} 
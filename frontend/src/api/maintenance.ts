import {
  MaintenanceEvent,
  MaintenanceSubEvent,
  MaintenanceEventCreateRequest,
  MaintenanceEventUpdateRequest,
  MaintenanceSubEventCreateRequest,
  MaintenanceSubEventUpdateRequest,
  MaintenanceEventGroup,
  MaintenanceEventStatus,
  MaintenanceEventType
} from '@/types/maintenance'

const API_BASE = 'http://localhost:8000/api/v1/maintenance'

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

// Transform backend maintenance event to frontend format
const transformMaintenanceEvent = (event: any): MaintenanceEvent => ({
  id: String(event.id),
  eventNumber: event.event_number,
  title: event.title,
  description: event.description,
  eventType: event.event_type,
  status: event.status,
  plannedStartDate: event.planned_start_date,
  plannedEndDate: event.planned_end_date,
  actualStartDate: event.actual_start_date,
  actualEndDate: event.actual_end_date,
  createdBy: event.created_by,
  approvedBy: event.approved_by,
  approvalDate: event.approval_date,
  notes: event.notes,
  createdAt: event.created_at,
  updatedAt: event.updated_at,
  subEvents: event.sub_events?.map(transformMaintenanceSubEvent) || [],
  completionPercentage: calculateCompletionPercentage(event.sub_events || [])
})

const transformMaintenanceSubEvent = (subEvent: any): MaintenanceSubEvent => ({
  id: String(subEvent.id),
  parentEventId: String(subEvent.parent_event_id),
  subEventNumber: subEvent.sub_event_number,
  title: subEvent.title,
  description: subEvent.description,
  subType: subEvent.sub_type,
  status: subEvent.status,
  plannedStartDate: subEvent.planned_start_date,
  plannedEndDate: subEvent.planned_end_date,
  actualStartDate: subEvent.actual_start_date,
  actualEndDate: subEvent.actual_end_date,
  completionPercentage: subEvent.completion_percentage || 0,
  notes: subEvent.notes,
  createdAt: subEvent.created_at,
  updatedAt: subEvent.updated_at
})

const calculateCompletionPercentage = (subEvents: any[]): number => {
  if (!subEvents || subEvents.length === 0) return 0
  
  const totalPercentage = subEvents.reduce((sum, subEvent) => {
    return sum + (subEvent.completion_percentage || 0)
  }, 0)
  
  return Math.round(totalPercentage / subEvents.length)
}

// Get maintenance events with filtering and pagination
export const getMaintenanceEvents = async (
  eventType?: MaintenanceEventType,
  status?: MaintenanceEventStatus,
  fromDate?: string,
  toDate?: string,
  skip: number = 0,
  limit: number = 100
): Promise<{ data: MaintenanceEvent[]; total: number }> => {
  try {
    let url = `${API_BASE}/events?skip=${skip}&limit=${limit}`
    
    if (eventType) url += `&event_type=${eventType}`
    if (status) url += `&status=${status}`
    if (fromDate) url += `&from_date=${fromDate}`
    if (toDate) url += `&to_date=${toDate}`

    const response = await fetch(url)
    const data = await handleResponse<{ data: any[]; total: number }>(response)
    
    return {
      data: data.data.map(transformMaintenanceEvent),
      total: data.total
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch maintenance events')
  }
}

// Create new maintenance event
export const createMaintenanceEvent = async (
  eventData: MaintenanceEventCreateRequest
): Promise<MaintenanceEvent> => {
  try {
    const response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_number: eventData.eventNumber,
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.eventType,
        planned_start_date: eventData.plannedStartDate,
        planned_end_date: eventData.plannedEndDate,
        created_by: eventData.createdBy,
        notes: eventData.notes
      })
    })
    
    const event = await handleResponse<any>(response)
    return transformMaintenanceEvent(event)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to create maintenance event')
  }
}

// Get maintenance event by ID
export const getMaintenanceEvent = async (eventId: string): Promise<MaintenanceEvent> => {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`)
    const event = await handleResponse<any>(response)
    return transformMaintenanceEvent(event)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch maintenance event')
  }
}

// Update maintenance event
export const updateMaintenanceEvent = async (
  eventId: string,
  eventData: MaintenanceEventUpdateRequest
): Promise<MaintenanceEvent> => {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.eventType,
        status: eventData.status,
        planned_start_date: eventData.plannedStartDate,
        planned_end_date: eventData.plannedEndDate,
        actual_start_date: eventData.actualStartDate,
        actual_end_date: eventData.actualEndDate,
        approved_by: eventData.approvedBy,
        notes: eventData.notes
      })
    })
    
    const event = await handleResponse<any>(response)
    return transformMaintenanceEvent(event)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to update maintenance event')
  }
}

// Delete maintenance event
export const deleteMaintenanceEvent = async (eventId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'DELETE'
    })
    await handleResponse<{ message: string }>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to delete maintenance event')
  }
}

// Start maintenance event
export const startMaintenanceEvent = async (eventId: string): Promise<MaintenanceEvent> => {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/start`, {
      method: 'POST'
    })
    const event = await handleResponse<any>(response)
    return transformMaintenanceEvent(event)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to start maintenance event')
  }
}

// Complete maintenance event
export const completeMaintenanceEvent = async (
  eventId: string,
  completionData?: { notes?: string }
): Promise<MaintenanceEvent> => {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completionData || {})
    })
    const event = await handleResponse<any>(response)
    return transformMaintenanceEvent(event)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to complete maintenance event')
  }
}

// Sub-events management
export const getMaintenanceSubEvents = async (
  parentEventId?: string,
  skip: number = 0,
  limit: number = 100
): Promise<{ data: MaintenanceSubEvent[]; total: number }> => {
  try {
    let url = `${API_BASE}/sub-events?skip=${skip}&limit=${limit}`
    if (parentEventId) url += `&parent_event_id=${parentEventId}`

    const response = await fetch(url)
    const data = await handleResponse<{ data: any[]; total: number }>(response)
    
    return {
      data: data.data.map(transformMaintenanceSubEvent),
      total: data.total
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch maintenance sub-events')
  }
}

export const createMaintenanceSubEvent = async (
  subEventData: MaintenanceSubEventCreateRequest
): Promise<MaintenanceSubEvent> => {
  try {
    const response = await fetch(`${API_BASE}/sub-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent_event_id: Number(subEventData.parentEventId),
        sub_event_number: subEventData.subEventNumber,
        title: subEventData.title,
        description: subEventData.description,
        sub_type: subEventData.subType,
        planned_start_date: subEventData.plannedStartDate,
        planned_end_date: subEventData.plannedEndDate,
        notes: subEventData.notes
      })
    })
    
    const subEvent = await handleResponse<any>(response)
    return transformMaintenanceSubEvent(subEvent)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to create maintenance sub-event')
  }
}

export const updateMaintenanceSubEvent = async (
  subEventId: string,
  subEventData: MaintenanceSubEventUpdateRequest
): Promise<MaintenanceSubEvent> => {
  try {
    const response = await fetch(`${API_BASE}/sub-events/${subEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: subEventData.title,
        description: subEventData.description,
        sub_type: subEventData.subType,
        status: subEventData.status,
        planned_start_date: subEventData.plannedStartDate,
        planned_end_date: subEventData.plannedEndDate,
        actual_start_date: subEventData.actualStartDate,
        actual_end_date: subEventData.actualEndDate,
        completion_percentage: subEventData.completionPercentage,
        notes: subEventData.notes
      })
    })
    
    const subEvent = await handleResponse<any>(response)
    return transformMaintenanceSubEvent(subEvent)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to update maintenance sub-event')
  }
}

export const deleteMaintenanceSubEvent = async (subEventId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/sub-events/${subEventId}`, {
      method: 'DELETE'
    })
    await handleResponse<{ message: string }>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to delete maintenance sub-event')
  }
}

// Get maintenance statistics
export const getMaintenanceStatistics = async (
  fromDate?: string,
  toDate?: string
): Promise<any> => {
  try {
    let url = `${API_BASE}/statistics`
    const params = new URLSearchParams()
    
    if (fromDate) params.append('from_date', fromDate)
    if (toDate) params.append('to_date', toDate)
    
    if (params.toString()) url += `?${params.toString()}`

    const response = await fetch(url)
    return await handleResponse<any>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error('Failed to fetch maintenance statistics')
  }
}
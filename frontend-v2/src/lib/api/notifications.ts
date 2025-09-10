// Notifications API Service
// Handles communication with backend notification system for persistence

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_V1 = `${API_BASE}/api/v1`

// Types for backend notification API
export interface BackendNotification {
  id: number
  title: string
  message: string
  type: string
  priority: string
  status: string
  related_item_id?: string
  related_item_type?: string
  action_url?: string
  extra_data: Record<string, any>
  created_at: string
  read_at?: string
  expires_at?: string
}

export interface NotificationFilters {
  status?: 'unread' | 'read' | 'archived' | 'dismissed'
  limit?: number
  offset?: number
}

// HTTP client for notifications API
class NotificationsApiClient {
  private baseURL: string

  constructor(baseURL: string = API_V1) {
    this.baseURL = baseURL
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Try both token storage keys used in the app
    const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token')
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'Unknown error occurred' 
      }))
      
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    return response.json()
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString())
        }
      })
    }

    console.log('📡 Making API request:', {
      method: 'GET',
      url: url.toString(),
      params: params || 'none'
    })

    try {
      const headers = await this.getAuthHeaders()
      console.log('🔑 Request headers:', {
        hasAuth: headers.Authorization ? 'yes' : 'no',
        contentType: headers['Content-Type']
      })
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: headers,
        // Add timeout and error handling
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      console.log('📨 Response status:', response.status, response.statusText)
      
      return this.handleResponse<T>(response)
    } catch (error) {
      console.error('❌ Request failed:', {
        url: url.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Enhanced error handling for network issues
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error('Request timeout - backend server may be unavailable')
        }
        if (error.message.includes('fetch')) {
          throw new Error('Network error - cannot connect to backend server')
        }
      }
      throw error
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        ...(data && { body: JSON.stringify(data) }),
        // Add timeout
        signal: AbortSignal.timeout(10000),
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      // Enhanced error handling for network issues
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error('Request timeout - backend server may be unavailable')
        }
        if (error.message.includes('fetch')) {
          throw new Error('Network error - cannot connect to backend server')
        }
      }
      throw error
    }
  }
}

// Notifications API Service
export class NotificationsApiService {
  private client: NotificationsApiClient

  constructor() {
    this.client = new NotificationsApiClient()
  }

  /**
   * Get persisted notifications from backend
   */
  async getNotifications(filters?: NotificationFilters): Promise<{notifications: BackendNotification[], unread_count: number}> {
    try {
      const params: Record<string, any> = {}
      
      if (filters?.status) params.status = filters.status
      if (filters?.limit) params.limit = filters.limit
      if (filters?.offset) params.offset = filters.offset
      
      // Backend endpoint: GET /api/v1/notifications/
      const result = await this.client.get<{notifications: BackendNotification[], unread_count: number}>('/notifications/', params)
      console.log('✅ Fetched persisted notifications from backend:', result.notifications?.length || 0)
      return result
    } catch (error) {
      console.error('❌ Failed to fetch notifications from backend:', error)
      return { notifications: [], unread_count: 0 }
    }
  }

  /**
   * Mark notification as read in backend
   */
  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
      // Backend endpoint: POST /api/v1/notifications/{id}/read
      await this.client.post(`/notifications/${notificationId}/read`)
      console.log('✅ Marked notification as read in backend:', notificationId)
      return true
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read in backend
   * Since there's no bulk endpoint, we fetch unread notifications and mark them individually
   */
  async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      // Get all unread notifications
      const response = await this.getNotifications({ status: 'unread', limit: 100 })
      
      // Mark each one as read individually
      const promises = response.notifications.map(notification => 
        this.markNotificationAsRead(notification.id)
      )
      
      const results = await Promise.allSettled(promises)
      const successCount = results.filter(result => result.status === 'fulfilled').length
      
      console.log(`✅ Marked ${successCount}/${response.notifications.length} notifications as read in backend`)
      return successCount === response.notifications.length
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error)
      return false
    }
  }

  /**
   * Get unread notifications count from backend
   */
  async getUnreadCount(): Promise<number> {
    try {
      // Backend endpoint: GET /api/v1/notifications/unread-count
      const result = await this.client.get<{ unread_count: number }>('/notifications/unread-count')
      return result.unread_count
    } catch (error) {
      console.error('❌ Failed to get unread count from backend:', error)
      return 0
    }
  }

  /**
   * Test backend connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple notifications call
      await this.client.get('/notifications/', { limit: 1 })
      return true
    } catch (error) {
      console.warn('⚠️ Backend notifications API not available:', error)
      return false
    }
  }
}

// Export singleton instance
export const notificationsApi = new NotificationsApiService()
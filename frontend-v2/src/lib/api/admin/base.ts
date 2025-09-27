/**
 * Admin API Base Configuration and Error Handling
 */

import { AdminApiError, AdminApiResponse, AdminPaginatedResponse } from '@/types/admin'
import { authService } from '@/lib/auth'

// Base API configuration
export const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export const ADMIN_API_PREFIX = '/api/v1'

// Admin API Error class
export class AdminAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AdminAPIError'
  }

  static fromResponse(response: Response, errorData?: AdminApiError): AdminAPIError {
    return new AdminAPIError(
      errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData?.code,
      errorData?.details
    )
  }
}

// Generic API response handler
export async function handleAdminAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: AdminApiError | undefined
    try {
      errorData = await response.json()
    } catch {
      // If JSON parsing fails, use default error
    }
    throw AdminAPIError.fromResponse(response, errorData)
  }

  const data = await response.json()
  return data
}

// Generic API request function with error handling
export async function adminApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${ADMIN_API_BASE_URL}${ADMIN_API_PREFIX}${endpoint}`
  
  // Get auth token from authService (consistent with authentication system)
  const token = authService.getToken()
  
  if (!token && process.env.NODE_ENV === 'development') {
    console.warn('🚨 No authentication token available for admin API request:', endpoint)
  }
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  // For FormData uploads, remove Content-Type header to allow browser to set multipart boundary
  if (config.body instanceof FormData) {
    const headers = config.headers as HeadersInit;
    delete headers['Content-Type'];
    config.headers = headers;
  }

  try {
    const response = await fetch(url, config)
    return await handleAdminAPIResponse<T>(response)
  } catch (error) {
    if (error instanceof AdminAPIError) {
      // Log specific admin API errors for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 AdminAPIError:', {
          endpoint,
          status: error.status,
          message: error.message,
          code: error.code,
          hasToken: !!token
        })
      }
      throw error
    }
    // Handle network errors or other unexpected errors
    const networkError = new AdminAPIError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      'NETWORK_ERROR'
    )
    
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Network/Unexpected Error:', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        hasToken: !!token
      })
    }
    
    throw networkError
  }
}

// Utility function for GET requests
export async function adminApiGet<T>(endpoint: string): Promise<T> {
  return adminApiRequest<T>(endpoint, { method: 'GET' })
}

// Utility function for authenticated GET requests with better error messages
export async function adminApiGetAuthenticated<T>(endpoint: string): Promise<T> {
  const token = authService.getToken()
  
  if (!token) {
    throw new AdminAPIError(
      'Authentication required. Please login to access admin features.',
      401,
      'NO_AUTH_TOKEN'
    )
  }
  
  return adminApiRequest<T>(endpoint, { method: 'GET' })
}

// Utility function for POST requests
export async function adminApiPost<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return adminApiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// Utility function for PUT requests
export async function adminApiPut<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return adminApiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// Utility function for PATCH requests
export async function adminApiPatch<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return adminApiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// Utility function for DELETE requests
export async function adminApiDelete<T>(endpoint: string): Promise<T> {
  return adminApiRequest<T>(endpoint, { method: 'DELETE' })
}

// Utility function for file uploads
export async function adminApiUpload<T>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<T> {
  const formData = new FormData()
  formData.append('file', file)
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value)
    })
  }

  const token = authService.getToken()
  
  return adminApiRequest<T>(endpoint, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      // Don't set Content-Type for FormData, let browser set it with boundary
    },
    body: formData,
  })
}

// Utility function for building query parameters
export function buildQueryParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// Type guards for API responses
export function isAdminApiResponse<T>(data: unknown): data is AdminApiResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    'data' in data
  )
}

export function isAdminPaginatedResponse<T>(data: unknown): data is AdminPaginatedResponse<T> {
  return (
    isAdminApiResponse(data) &&
    'pagination' in data &&
    typeof (data as AdminPaginatedResponse<T>).pagination === 'object'
  )
}

// Retry mechanism for failed requests
export async function adminApiRequestWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: AdminAPIError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await adminApiRequest<T>(endpoint, options)
    } catch (error) {
      lastError = error instanceof AdminAPIError ? error : new AdminAPIError(
        error instanceof Error ? error.message : 'Unknown error',
        0
      )

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (lastError.status >= 400 && lastError.status < 500 && lastError.status !== 429) {
        throw lastError
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
    }
  }

  throw lastError!
}
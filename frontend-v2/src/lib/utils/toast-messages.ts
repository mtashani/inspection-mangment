// Toast message utilities for consistent notifications

export const toastMessages = {
  // Daily Reports
  dailyReport: {
    created: 'Daily report created successfully',
    updated: 'Daily report updated successfully',
    deleted: 'Daily report deleted successfully',
    bulkDeleted: (count: number) => `${count} daily report${count !== 1 ? 's' : ''} deleted successfully`,
    createError: 'Failed to create daily report',
    updateError: 'Failed to update daily report',
    deleteError: 'Failed to delete daily report',
    loadError: 'Failed to load daily report',
  },
  
  // Maintenance Events
  maintenanceEvent: {
    created: 'Maintenance event created successfully',
    updated: 'Maintenance event updated successfully',
    deleted: 'Maintenance event deleted successfully',
    started: 'Maintenance event started successfully',
    completed: 'Maintenance event completed successfully',
    createError: 'Failed to create maintenance event',
    updateError: 'Failed to update maintenance event',
    deleteError: 'Failed to delete maintenance event',
    loadError: 'Failed to load maintenance event',
  },
  
  // Inspections
  inspection: {
    created: 'Inspection created successfully',
    updated: 'Inspection updated successfully',
    deleted: 'Inspection deleted successfully',
    completed: 'Inspection completed successfully',
    statusUpdated: 'Inspection status updated successfully',
    createError: 'Failed to create inspection',
    updateError: 'Failed to update inspection',
    deleteError: 'Failed to delete inspection',
    loadError: 'Failed to load inspection',
  },
  
  // General
  general: {
    saveSuccess: 'Changes saved successfully',
    saveError: 'Failed to save changes',
    loadError: 'Failed to load data',
    networkError: 'Network error occurred. Please try again.',
    unauthorizedError: 'You are not authorized to perform this action',
    validationError: 'Please check your input and try again',
    unexpectedError: 'An unexpected error occurred',
  },
  
  // File operations
  file: {
    uploadSuccess: 'File uploaded successfully',
    uploadError: 'Failed to upload file',
    deleteSuccess: 'File deleted successfully',
    deleteError: 'Failed to delete file',
    downloadError: 'Failed to download file',
    invalidFormat: 'Invalid file format',
    fileTooLarge: 'File size is too large',
  },
  
  // Authentication
  auth: {
    loginSuccess: 'Logged in successfully',
    logoutSuccess: 'Logged out successfully',
    loginError: 'Failed to log in',
    sessionExpired: 'Your session has expired. Please log in again.',
    accessDenied: 'Access denied',
  },
} as const

// Helper functions for common toast patterns
export function getSuccessMessage(entity: keyof typeof toastMessages, action: string): string {
  const entityMessages = toastMessages[entity] as Record<string, any>
  return entityMessages[action] || toastMessages.general.saveSuccess
}

export function getErrorMessage(entity: keyof typeof toastMessages, action: string): string {
  const entityMessages = toastMessages[entity] as Record<string, any>
  const errorKey = `${action}Error`
  return entityMessages[errorKey] || toastMessages.general.saveError
}

// Bulk operation messages
export function getBulkDeleteMessage(count: number, entityType: string): string {
  return `${count} ${entityType}${count !== 1 ? 's' : ''} deleted successfully`
}

export function getBulkUpdateMessage(count: number, entityType: string): string {
  return `${count} ${entityType}${count !== 1 ? 's' : ''} updated successfully`
}

// Error message formatting
export function formatApiError(error: any): string {
  console.log('🔍 formatApiError received:', {
    error,
    type: typeof error,
    constructor: error?.constructor?.name,
    isError: error instanceof Error,
    name: error?.name,
    message: error?.message,
    statusCode: error?.statusCode,
    status: error?.status
  })
  
  // Handle different error types with better debugging
  if (typeof error === 'string') {
    return error
  }
  
  // Handle null or undefined
  if (!error) {
    return toastMessages.general.unexpectedError
  }
  
  // Handle ApiError class specifically (check both name and properties)
  if (error instanceof Error) {
    // Check if it's an ApiError by name and properties
    if ((error.name === 'ApiError' || error.constructor.name === 'ApiError') && 
        (error as any).statusCode) {
      const apiError = error as any
      console.log('🔍 ApiError Details:', {
        message: apiError.message,
        statusCode: apiError.statusCode,
        response: apiError.response
      })
      
      // Return the error message if it's meaningful
      if (apiError.message && apiError.message !== '[object Object]') {
        return String(apiError.message)
      }
      
      // Try to extract from response if message is not useful
      if (apiError.response) {
        return extractErrorMessageFromResponse(apiError.response)
      }
      
      return `API Error (${apiError.statusCode}): Request failed`
    }
    
    // For other Error instances, ensure we return a string
    const message = error.message || error.toString()
    return ensureStringMessage(message)
  }
  
  // Handle direct response objects
  if (typeof error === 'object' && error !== null) {
    return extractErrorMessageFromResponse(error)
  }
  
  // Handle network/fetch errors
  if (error?.name === 'NetworkError') {
    return 'Network connection failed. Please check your connection.'
  }
  
  // Log unknown errors for debugging
  console.error('🚨 Unknown Error Format:', {
    error,
    type: typeof error,
    constructor: error?.constructor?.name,
    message: error?.message,
    keys: Object.keys(error || {})
  })
  
  return toastMessages.general.unexpectedError
}

// Helper function to extract error message from response objects
function extractErrorMessageFromResponse(response: any): string {
  if (typeof response === 'string') {
    return response
  }
  
  if (!response || typeof response !== 'object') {
    return toastMessages.general.unexpectedError
  }
  
  // Handle direct message properties
  if (response.message && typeof response.message === 'string') {
    return response.message
  }
  
  if (response.detail && typeof response.detail === 'string') {
    return response.detail
  }
  
  // Handle validation errors array (Pydantic format)
  if (Array.isArray(response)) {
    const validationMessages = response
      .map((err: any) => {
        if (typeof err === 'string') return err
        if (err && typeof err === 'object') {
          // Pydantic validation error format: {type, loc, msg, input, url}
          if (err.msg && typeof err.msg === 'string') {
            return err.msg
          }
          if (err.message && typeof err.message === 'string') {
            return err.message
          }
          // Format location and type for better error messages
          if (err.loc && Array.isArray(err.loc) && err.type) {
            const field = err.loc.join('.')
            return `${field}: ${err.type.replace('_', ' ')}`
          }
          if (err.type) {
            return err.type.replace('_', ' ')
          }
        }
        return 'Validation error'
      })
      .filter((msg: string) => msg && msg.length > 0)
    
    if (validationMessages.length > 0) {
      return validationMessages.join(', ')
    }
  }
  
  // Handle nested data objects
  if (response.data) {
    return extractErrorMessageFromResponse(response.data)
  }
  
  // Handle response with status-based messages
  if (response.status === 401 || response.statusCode === 401) {
    return toastMessages.auth.accessDenied
  }
  
  if (response.status === 403 || response.statusCode === 403) {
    return toastMessages.general.unauthorizedError
  }
  
  if ((response.status >= 500) || (response.statusCode >= 500)) {
    return 'Server error occurred. Please try again later.'
  }
  
  // Handle validation errors
  if (response.status === 400 || response.statusCode === 400) {
    return 'Invalid data provided. Please check your input.'
  }
  
  // Handle objects with error-like properties
  const keys = Object.keys(response)
  if (keys.length > 0) {
    const firstKey = keys[0]
    const firstValue = response[firstKey]
    
    if (typeof firstValue === 'string') {
      return firstValue
    }
    
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      const messages = firstValue
        .map((item: any) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object' && item.message) return item.message
          return String(item)
        })
        .filter((msg: string) => msg && msg.length > 0)
      
      if (messages.length > 0) {
        return messages.join(', ')
      }
    }
  }
  
  // Fallback to string conversion
  return ensureStringMessage(response)
}

// Helper function to ensure we always return a string
function ensureStringMessage(value: any): string {
  if (typeof value === 'string') {
    return value || toastMessages.general.unexpectedError
  }
  
  if (value === null || value === undefined) {
    return toastMessages.general.unexpectedError
  }
  
  if (typeof value === 'object') {
    try {
      // Try to extract meaningful information from object
      if (value.message) return String(value.message)
      if (value.msg) return String(value.msg)
      if (value.detail) return String(value.detail)
      
      // Avoid returning [object Object] by providing a meaningful message
      return 'An error occurred. Please try again.'
    } catch (e) {
      return toastMessages.general.unexpectedError
    }
  }
  
  try {
    return String(value)
  } catch (e) {
    return toastMessages.general.unexpectedError
  }
}



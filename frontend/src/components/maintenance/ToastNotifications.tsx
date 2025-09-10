'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAllToasts: () => void
  success: (title: string, message?: string, options?: Partial<Toast>) => string
  error: (title: string, message?: string, options?: Partial<Toast>) => string
  warning: (title: string, message?: string, options?: Partial<Toast>) => string
  info: (title: string, message?: string, options?: Partial<Toast>) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
  defaultDuration?: number
}

export function ToastProvider({ 
  children, 
  maxToasts = 5, 
  defaultDuration = 5000 
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration
    }

    setToasts(prev => {
      const updated = [newToast, ...prev]
      // Limit number of toasts
      return updated.slice(0, maxToasts)
    })

    // Auto remove toast after duration (unless persistent)
    if (!newToast.persistent && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [defaultDuration, maxToasts, removeToast])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const success = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'success', title, message })
  }, [addToast])

  const error = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'error', title, message, persistent: true })
  }, [addToast])

  const warning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'warning', title, message })
  }, [addToast])

  const info = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ ...options, type: 'info', title, message })
  }, [addToast])

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      removeToast(toast.id)
    }, 300) // Match animation duration
  }, [toast.id, removeToast])

  const getToastStyles = () => {
    const baseStyles = "relative flex items-start p-4 rounded-lg shadow-lg border transition-all duration-300 transform"
    
    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800"
    }

    const animationStyles = isLeaving 
      ? "translate-x-full opacity-0" 
      : isVisible 
        ? "translate-x-0 opacity-100" 
        : "translate-x-full opacity-0"

    return cn(baseStyles, typeStyles[toast.type], animationStyles)
  }

  const getIcon = () => {
    const iconProps = { className: "h-5 w-5 mt-0.5 flex-shrink-0" }
    
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon {...iconProps} className={cn(iconProps.className, "text-green-600")} />
      case 'error':
        return <XCircleIcon {...iconProps} className={cn(iconProps.className, "text-red-600")} />
      case 'warning':
        return <ExclamationTriangleIcon {...iconProps} className={cn(iconProps.className, "text-yellow-600")} />
      case 'info':
        return <InformationCircleIcon {...iconProps} className={cn(iconProps.className, "text-blue-600")} />
    }
  }

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start space-x-3 flex-1">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm opacity-90 mt-1">{toast.message}</p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline mt-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      </div>

      <button
        onClick={handleRemove}
        className="ml-2 flex-shrink-0 p-1 rounded-md hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-colors"
        aria-label="Close notification"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

// Utility functions for common toast patterns
export const toastUtils = {
  // Maintenance Event Operations
  eventCreated: (eventNumber: string) => ({
    type: 'success' as const,
    title: 'Event Created',
    message: `Maintenance event ${eventNumber} has been created successfully.`
  }),

  eventUpdated: (eventNumber: string) => ({
    type: 'success' as const,
    title: 'Event Updated',
    message: `Maintenance event ${eventNumber} has been updated.`
  }),

  eventDeleted: (eventNumber: string) => ({
    type: 'success' as const,
    title: 'Event Deleted',
    message: `Maintenance event ${eventNumber} has been deleted.`
  }),

  eventStatusChanged: (eventNumber: string, newStatus: string) => ({
    type: 'success' as const,
    title: 'Status Changed',
    message: `Event ${eventNumber} status changed to ${newStatus}.`
  }),

  // Inspection Operations
  inspectionCreated: (inspectionNumber: string) => ({
    type: 'success' as const,
    title: 'Inspection Created',
    message: `Inspection ${inspectionNumber} has been created successfully.`
  }),

  inspectionCompleted: (inspectionNumber: string) => ({
    type: 'success' as const,
    title: 'Inspection Completed',
    message: `Inspection ${inspectionNumber} has been marked as completed.`
  }),

  inspectionPlanCreated: (equipmentTag: string) => ({
    type: 'success' as const,
    title: 'Inspection Planned',
    message: `Inspection plan for ${equipmentTag} has been created.`
  }),

  // Daily Report Operations
  reportCreated: (date: string) => ({
    type: 'success' as const,
    title: 'Report Created',
    message: `Daily report for ${date} has been saved.`
  }),

  reportUpdated: (date: string) => ({
    type: 'success' as const,
    title: 'Report Updated',
    message: `Daily report for ${date} has been updated.`
  }),

  // Error Messages
  networkError: () => ({
    type: 'error' as const,
    title: 'Network Error',
    message: 'Unable to connect to the server. Please check your connection and try again.',
    action: {
      label: 'Retry',
      onClick: () => window.location.reload()
    }
  }),

  validationError: (field: string) => ({
    type: 'error' as const,
    title: 'Validation Error',
    message: `Please check the ${field} field and try again.`
  }),

  permissionError: () => ({
    type: 'error' as const,
    title: 'Permission Denied',
    message: 'You do not have permission to perform this action.'
  }),

  // Warning Messages
  unsavedChanges: () => ({
    type: 'warning' as const,
    title: 'Unsaved Changes',
    message: 'You have unsaved changes that will be lost if you continue.',
    persistent: true
  }),

  overdueInspection: (equipmentTag: string, days: number) => ({
    type: 'warning' as const,
    title: 'Overdue Inspection',
    message: `Inspection for ${equipmentTag} is ${days} days overdue.`
  }),

  // Info Messages
  dataRefreshed: () => ({
    type: 'info' as const,
    title: 'Data Refreshed',
    message: 'The latest data has been loaded.',
    duration: 2000
  }),

  exportStarted: () => ({
    type: 'info' as const,
    title: 'Export Started',
    message: 'Your export is being prepared. You will be notified when it\'s ready.'
  }),

  exportReady: (downloadUrl: string) => ({
    type: 'success' as const,
    title: 'Export Ready',
    message: 'Your export has been prepared and is ready for download.',
    action: {
      label: 'Download',
      onClick: () => window.open(downloadUrl, '_blank')
    }
  })
}

// Hook for maintenance-specific toast operations
export function useMaintenanceToasts() {
  const toast = useToast()

  return {
    ...toast,
    
    // Event operations
    notifyEventCreated: (eventNumber: string) => 
      toast.success(...Object.values(toastUtils.eventCreated(eventNumber))),
    
    notifyEventUpdated: (eventNumber: string) => 
      toast.success(...Object.values(toastUtils.eventUpdated(eventNumber))),
    
    notifyEventDeleted: (eventNumber: string) => 
      toast.success(...Object.values(toastUtils.eventDeleted(eventNumber))),
    
    notifyStatusChanged: (eventNumber: string, newStatus: string) => 
      toast.success(...Object.values(toastUtils.eventStatusChanged(eventNumber, newStatus))),
    
    // Inspection operations
    notifyInspectionCreated: (inspectionNumber: string) => 
      toast.success(...Object.values(toastUtils.inspectionCreated(inspectionNumber))),
    
    notifyInspectionCompleted: (inspectionNumber: string) => 
      toast.success(...Object.values(toastUtils.inspectionCompleted(inspectionNumber))),
    
    notifyInspectionPlanCreated: (equipmentTag: string) => 
      toast.success(...Object.values(toastUtils.inspectionPlanCreated(equipmentTag))),
    
    // Report operations
    notifyReportCreated: (date: string) => 
      toast.success(...Object.values(toastUtils.reportCreated(date))),
    
    notifyReportUpdated: (date: string) => 
      toast.success(...Object.values(toastUtils.reportUpdated(date))),
    
    // Error notifications
    notifyNetworkError: () => 
      toast.addToast(toastUtils.networkError()),
    
    notifyValidationError: (field: string) => 
      toast.error(...Object.values(toastUtils.validationError(field))),
    
    notifyPermissionError: () => 
      toast.error(...Object.values(toastUtils.permissionError())),
    
    // Warning notifications
    notifyUnsavedChanges: () => 
      toast.addToast(toastUtils.unsavedChanges()),
    
    notifyOverdueInspection: (equipmentTag: string, days: number) => 
      toast.warning(...Object.values(toastUtils.overdueInspection(equipmentTag, days))),
    
    // Info notifications
    notifyDataRefreshed: () => 
      toast.info(...Object.values(toastUtils.dataRefreshed())),
    
    notifyExportStarted: () => 
      toast.info(...Object.values(toastUtils.exportStarted())),
    
    notifyExportReady: (downloadUrl: string) => 
      toast.addToast(toastUtils.exportReady(downloadUrl))
  }
}
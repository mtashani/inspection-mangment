'use client'

import { cn } from '@/lib/utils'
import { 
  getMaintenanceEventStatusColor,
  getInspectionStatusColor,
  getPriorityColor,
  isOverdue,
  overdueColors
} from '@/lib/utils/status-colors'

interface StatusIndicatorProps {
  status: string
  type: 'maintenance-event' | 'inspection' | 'priority'
  endDate?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showPulse?: boolean
}

export function StatusIndicator({ 
  status, 
  type, 
  endDate,
  size = 'md',
  className,
  showPulse = false
}: StatusIndicatorProps) {
  const isItemOverdue = endDate ? isOverdue(endDate, status) : false
  
  // Get appropriate colors
  let colors: any
  
  if (isItemOverdue) {
    colors = overdueColors
  } else {
    switch (type) {
      case 'maintenance-event':
        colors = getMaintenanceEventStatusColor(status)
        break
      case 'inspection':
        colors = getInspectionStatusColor(status)
        break
      case 'priority':
        colors = getPriorityColor(status)
        break
      default:
        colors = { dot: 'bg-gray-500' }
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  return (
    <div className={cn('relative', className)}>
      <div 
        className={cn(
          'rounded-full',
          sizeClasses[size],
          colors.dot,
          // Fixed blinking issue - prevent pulse animation for In Progress status
          (showPulse || isItemOverdue) && (status !== 'InProgress' && status !== 'In Progress') && 'animate-pulse'
        )}
      />
      {/* Fixed blinking issue - prevent pulse animation for In Progress status */}
      {(showPulse || isItemOverdue) && (status !== 'InProgress' && status !== 'In Progress') && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full animate-ping',
            sizeClasses[size],
            colors.dot,
            'opacity-75'
          )}
        />
      )}
    </div>
  )
}

// Specialized status indicators
export function MaintenanceEventStatusIndicator({ 
  status, 
  endDate, 
  size = 'md', 
  className,
  showPulse = false
}: Omit<StatusIndicatorProps, 'type'>) {
  return (
    <StatusIndicator
      status={status}
      type="maintenance-event"
      endDate={endDate}
      size={size}
      className={className}
      showPulse={showPulse}
    />
  )
}

export function InspectionStatusIndicator({ 
  status, 
  endDate, 
  size = 'md', 
  className,
  showPulse = false
}: Omit<StatusIndicatorProps, 'type'>) {
  return (
    <StatusIndicator
      status={status}
      type="inspection"
      endDate={endDate}
      size={size}
      className={className}
      showPulse={showPulse}
    />
  )
}
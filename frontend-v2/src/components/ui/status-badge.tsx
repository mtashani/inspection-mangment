'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  getMaintenanceEventBadgeVariant,
  getInspectionBadgeVariant,
  getPriorityBadgeVariant,
  getMaintenanceEventStatusColor,
  getInspectionStatusColor,
  getPriorityColor,
  isOverdue,
  overdueColors
} from '@/lib/utils/status-colors'
import { AlertTriangle, Clock, CheckCircle, XCircle, Pause } from 'lucide-react'

interface StatusBadgeProps {
  status: string
  type: 'maintenance-event' | 'inspection' | 'priority'
  endDate?: string
  showIcon?: boolean
  className?: string
}

export function StatusBadge({ 
  status, 
  type, 
  endDate,
  showIcon = true,
  className 
}: StatusBadgeProps) {
  const isItemOverdue = endDate ? isOverdue(endDate, status) : false
  
  // Get appropriate variant and colors
  let variant: any
  let colors: any
  
  if (isItemOverdue) {
    variant = overdueColors.badge
    colors = overdueColors
  } else {
    switch (type) {
      case 'maintenance-event':
        variant = getMaintenanceEventBadgeVariant(status)
        colors = getMaintenanceEventStatusColor(status)
        break
      case 'inspection':
        variant = getInspectionBadgeVariant(status)
        colors = getInspectionStatusColor(status)
        break
      case 'priority':
        variant = getPriorityBadgeVariant(status)
        colors = getPriorityColor(status)
        break
      default:
        variant = 'secondary'
        colors = { icon: 'text-gray-600' }
    }
  }

  // Get appropriate icon
  const getStatusIcon = () => {
    // Don't show alert triangle for overdue in-progress inspections
    if (isItemOverdue && status.toLowerCase() !== 'inprogress' && status.toLowerCase() !== 'in_progress') {
      return <AlertTriangle className={cn('h-3 w-3', colors.icon)} />
    }
    
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className={cn('h-3 w-3', colors.icon)} />
      case 'inprogress':
      case 'in_progress':
        return <Clock className={cn('h-3 w-3', colors.icon)} />
      case 'cancelled':
        return <XCircle className={cn('h-3 w-3', colors.icon)} />
      case 'onhold':
      case 'on_hold':
      case 'postponed':
        return <Pause className={cn('h-3 w-3', colors.icon)} />
      default:
        return <Clock className={cn('h-3 w-3', colors.icon)} />
    }
  }

  // Format status text - show "In Progress" for overdue items instead of "Overdue"
  const formatStatus = (status: string) => {
    return status
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('_', ' ')
      .trim()
  }

  const displayText = isItemOverdue ? 'In Progress' : formatStatus(status)

  return (
    <Badge 
      variant={variant}
      className={cn(
        'gap-1 font-medium',
        // Fixed blinking issue - removed animate-pulse for In Progress status
        isItemOverdue && status.toLowerCase() !== 'inprogress' && status.toLowerCase() !== 'in_progress' && 'animate-pulse',
        className
      )}
    >
      {showIcon && getStatusIcon()}
      {displayText}
    </Badge>
  )
}

// Specialized status badges
export function MaintenanceEventStatusBadge({ 
  status, 
  endDate, 
  showIcon = true, 
  className 
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="maintenance-event"
      endDate={endDate}
      showIcon={showIcon}
      className={className}
    />
  )
}

export function InspectionStatusBadge({ 
  status, 
  endDate, 
  showIcon = true, 
  className 
}: Omit<StatusBadgeProps, 'type'>) {
  return (
    <StatusBadge
      status={status}
      type="inspection"
      endDate={endDate}
      showIcon={showIcon}
      className={className}
    />
  )
}

export function PriorityBadge({ 
  priority, 
  showIcon = true, 
  className 
}: { priority: string; showIcon?: boolean; className?: string }) {
  return (
    <StatusBadge
      status={priority}
      type="priority"
      showIcon={showIcon}
      className={className}
    />
  )
}
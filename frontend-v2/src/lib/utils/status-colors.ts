import { type VariantProps } from 'class-variance-authority'
import { badgeVariants } from '@/components/ui/badge'

// Status color mappings for different entity types
export const maintenanceEventStatusColors = {
  Planned: {
    badge: 'secondary' as const,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    dot: 'bg-blue-500'
  },
  InProgress: {
    badge: 'default' as const,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200', 
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
    dot: 'bg-yellow-500'
  },
  Completed: {
    badge: 'secondary' as const,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
    dot: 'bg-green-500'
  },
  Cancelled: {
    badge: 'destructive' as const,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
    dot: 'bg-red-500'
  },
  Postponed: {
    badge: 'outline' as const,
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'text-gray-600',
    dot: 'bg-gray-500'
  }
} as const

export const inspectionStatusColors = {
  InProgress: {
    badge: 'default' as const,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    dot: 'bg-blue-500',
    header: 'bg-blue-50 border-blue-200'
  },
  Completed: {
    badge: 'secondary' as const,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
    dot: 'bg-green-500',
    header: 'bg-green-50 border-green-200'
  },
  Cancelled: {
    badge: 'destructive' as const,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
    dot: 'bg-red-500',
    header: 'bg-red-50 border-red-200'
  },
  OnHold: {
    badge: 'outline' as const,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: 'text-orange-600',
    dot: 'bg-orange-500',
    header: 'bg-orange-50 border-orange-200'
  }
} as const

export const priorityColors = {
  Low: {
    badge: 'outline' as const,
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'text-gray-600',
    dot: 'bg-gray-500'
  },
  Medium: {
    badge: 'secondary' as const,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
    dot: 'bg-yellow-500'
  },
  High: {
    badge: 'destructive' as const,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
    dot: 'bg-red-500'
  },
  Critical: {
    badge: 'destructive' as const,
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-800',
    icon: 'text-red-700',
    dot: 'bg-red-600'
  }
} as const

// Utility functions
export function getMaintenanceEventStatusColor(status: string) {
  return maintenanceEventStatusColors[status as keyof typeof maintenanceEventStatusColors] || maintenanceEventStatusColors.Planned
}

export function getInspectionStatusColor(status: string) {
  return inspectionStatusColors[status as keyof typeof inspectionStatusColors] || inspectionStatusColors.InProgress
}

export function getPriorityColor(priority: string) {
  return priorityColors[priority as keyof typeof priorityColors] || priorityColors.Medium
}

// Badge variant helpers
export function getMaintenanceEventBadgeVariant(status: string): VariantProps<typeof badgeVariants>['variant'] {
  return getMaintenanceEventStatusColor(status).badge
}

export function getInspectionBadgeVariant(status: string): VariantProps<typeof badgeVariants>['variant'] {
  return getInspectionStatusColor(status).badge
}

export function getPriorityBadgeVariant(priority: string): VariantProps<typeof badgeVariants>['variant'] {
  return getPriorityColor(priority).badge
}

// Overdue detection - but show as "In Progress" instead of "Overdue"
export function isOverdue(endDate: string, status: string): boolean {
  // Fixed logic - In Progress inspections should not be considered overdue
  if (status === 'Completed' || status === 'Cancelled' || status === 'InProgress' || status === 'In Progress') {
    return false
  }
  
  const end = new Date(endDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Start of today
  
  return end < now
}

// Updated styling for overdue items - show as "In Progress" with warning indicators
export const overdueColors = {
  badge: 'default' as const, // Changed from 'destructive' to 'default'
  bg: 'bg-blue-50', // Changed from red to blue (In Progress color)
  border: 'border-blue-200', // Changed from red to blue
  text: 'text-blue-700', // Changed from red to blue
  icon: 'text-blue-600', // Changed from red to blue  
  dot: 'bg-blue-500', // Changed from red to blue
  header: 'bg-blue-50 border-blue-200', // Changed from red to blue
  pulse: 'animate-pulse' // Keep pulse for attention
}

export function getOverdueStyles(endDate: string, status: string) {
  return isOverdue(endDate, status) ? overdueColors : null
}
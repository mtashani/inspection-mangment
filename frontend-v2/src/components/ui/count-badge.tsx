'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CountBadgeProps {
  count: number
  label?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  showZero?: boolean
  className?: string
  animate?: boolean
}

export function CountBadge({ 
  count, 
  label,
  variant = 'secondary',
  size = 'md',
  showZero = false,
  className,
  animate = false
}: CountBadgeProps) {
  if (count === 0 && !showZero) {
    return null
  }

  const sizeClasses = {
    sm: 'h-4 min-w-4 text-xs px-1',
    md: 'h-5 min-w-5 text-xs px-1.5',
    lg: 'h-6 min-w-6 text-sm px-2'
  }

  const displayText = label ? `${count} ${label}` : count.toString()

  return (
    <Badge 
      variant={variant}
      className={cn(
        'rounded-full font-medium tabular-nums',
        sizeClasses[size],
        animate && count > 0 && 'animate-pulse',
        className
      )}
    >
      {displayText}
    </Badge>
  )
}

// Specialized count badges
export function TabCountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <CountBadge
      count={count}
      variant="secondary"
      size="sm"
      className={cn('ml-2', className)}
    />
  )
}

export function NotificationBadge({ count, className }: { count: number; className?: string }) {
  return (
    <CountBadge
      count={count}
      variant="destructive"
      size="sm"
      animate={count > 0}
      className={cn('absolute -top-1 -right-1', className)}
    />
  )
}

export function StatsBadge({ 
  count, 
  label, 
  variant = 'outline',
  className 
}: { 
  count: number
  label: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string 
}) {
  return (
    <CountBadge
      count={count}
      label={label}
      variant={variant}
      size="md"
      showZero={true}
      className={className}
    />
  )
}
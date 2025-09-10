'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (text) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {text}
        </span>
      </div>
    )
  }

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  )
}

// Centered loading spinner for full page/section loading
export function CenteredLoadingSpinner({ 
  size = 'lg',
  text = 'Loading...',
  className 
}: LoadingSpinnerProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-12 space-y-4',
      className
    )}>
      <LoadingSpinner size={size} />
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}

// Inline loading spinner for buttons and small spaces
export function InlineLoadingSpinner({ 
  size = 'sm',
  className 
}: Omit<LoadingSpinnerProps, 'text'>) {
  return (
    <LoadingSpinner 
      size={size} 
      className={cn('inline-block', className)} 
    />
  )
}

// Loading overlay for cards and sections
export function LoadingOverlay({ 
  isLoading,
  children,
  text = 'Loading...',
  className
}: {
  isLoading: boolean
  children: React.ReactNode
  text?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  )
}
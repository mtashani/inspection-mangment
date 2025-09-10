'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { useTouchOptimization } from '@/hooks/use-mobile-optimization'

interface MobileOptimizedProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  touchFeedback?: boolean
  minTouchTarget?: boolean
}

export const MobileOptimized = forwardRef<HTMLDivElement, MobileOptimizedProps>(
  ({ children, className, touchFeedback = false, minTouchTarget = false, onClick, ...props }, ref) => {
    const { getTouchProps, getMinTouchTarget, isTouchDevice } = useTouchOptimization()

    const touchProps = touchFeedback ? getTouchProps(onClick) : { onClick }
    const touchTargetStyles = minTouchTarget ? getMinTouchTarget() : {}

    return (
      <div
        ref={ref}
        className={cn(
          // Base responsive classes
          'transition-all duration-200',
          // Touch-friendly spacing on mobile
          isTouchDevice && 'touch-manipulation',
          className
        )}
        style={touchTargetStyles}
        {...touchProps}
        {...props}
      >
        {children}
      </div>
    )
  }
)

MobileOptimized.displayName = 'MobileOptimized'

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function ResponsiveContainer({ 
  children, 
  className, 
  maxWidth = 'full',
  padding = 'md'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-2 sm:px-4',
    md: 'px-4 sm:px-6',
    lg: 'px-6 sm:px-8'
  }

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

// Mobile-friendly button component
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ children, className, variant = 'default', size = 'md', fullWidth = false, ...props }, ref) => {
    const { getMinTouchTarget, isTouchDevice } = useTouchOptimization()

    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground'
    }

    const sizeClasses = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8 text-lg'
    }

    // Ensure minimum touch target on touch devices
    const touchTargetStyles = isTouchDevice ? getMinTouchTarget() : {}

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          isTouchDevice && 'touch-manipulation active:scale-95',
          className
        )}
        style={touchTargetStyles}
        {...props}
      >
        {children}
      </button>
    )
  }
)

MobileButton.displayName = 'MobileButton'

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile: number
    tablet: number
    desktop: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={cn(
      'grid',
      `grid-cols-${cols.mobile}`,
      `md:grid-cols-${cols.tablet}`,
      `lg:grid-cols-${cols.desktop}`,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}
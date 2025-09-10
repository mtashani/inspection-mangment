'use client'

import { cn } from '@/lib/utils'
import { useMobileOptimization } from '@/hooks/use-mobile-optimization'

interface ResponsiveShowProps {
  children: React.ReactNode
  on?: 'mobile' | 'tablet' | 'desktop' | 'mobile-tablet' | 'tablet-desktop'
  className?: string
}

export function ResponsiveShow({ children, on = 'desktop', className }: ResponsiveShowProps) {
  const showClasses = {
    mobile: 'block md:hidden',
    tablet: 'hidden md:block lg:hidden',
    desktop: 'hidden lg:block',
    'mobile-tablet': 'block lg:hidden',
    'tablet-desktop': 'hidden md:block'
  }

  return (
    <div className={cn(showClasses[on], className)}>
      {children}
    </div>
  )
}

interface ResponsiveHideProps {
  children: React.ReactNode
  on?: 'mobile' | 'tablet' | 'desktop' | 'mobile-tablet' | 'tablet-desktop'
  className?: string
}

export function ResponsiveHide({ children, on = 'mobile', className }: ResponsiveHideProps) {
  const hideClasses = {
    mobile: 'hidden md:block',
    tablet: 'block md:hidden lg:block',
    desktop: 'block lg:hidden',
    'mobile-tablet': 'hidden lg:block',
    'tablet-desktop': 'block md:hidden'
  }

  return (
    <div className={cn(hideClasses[on], className)}>
      {children}
    </div>
  )
}

interface MobileStackProps {
  children: React.ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
}

export function MobileStack({ children, className, spacing = 'md' }: MobileStackProps) {
  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center',
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  )
}

interface TouchFriendlyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function TouchFriendlyButton({ 
  children, 
  className, 
  variant = 'default', 
  size = 'md',
  ...props 
}: TouchFriendlyButtonProps) {
  const { isTouchDevice } = useMobileOptimization()

  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  }

  const sizeClasses = {
    sm: isTouchDevice ? 'h-10 px-3 text-sm' : 'h-9 px-3 text-sm',
    md: isTouchDevice ? 'h-12 px-4 py-2' : 'h-10 px-4 py-2',
    lg: isTouchDevice ? 'h-14 px-8 text-lg' : 'h-11 px-8'
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        isTouchDevice && 'touch-manipulation active:scale-95',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface MobileCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  hover?: boolean
}

export function MobileCard({ 
  children, 
  className, 
  padding = 'md',
  hover = true 
}: MobileCardProps) {
  const { isMobile } = useMobileOptimization()

  const paddingClasses = {
    sm: isMobile ? 'p-3' : 'p-4',
    md: isMobile ? 'p-4' : 'p-6',
    lg: isMobile ? 'p-6' : 'p-8'
  }

  return (
    <div className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      paddingClasses[padding],
      hover && 'transition-shadow hover:shadow-md',
      isMobile && 'touch-manipulation',
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
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

  const getGridClass = (count: number) => {
    const gridMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6'
    }
    return gridMap[count] || 'grid-cols-1'
  }

  return (
    <div className={cn(
      'grid',
      cols.mobile && getGridClass(cols.mobile),
      cols.tablet && `md:${getGridClass(cols.tablet)}`,
      cols.desktop && `lg:${getGridClass(cols.desktop)}`,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface MobileModalProps {
  children: React.ReactNode
  className?: string
  fullScreen?: boolean
}

export function MobileModal({ children, className, fullScreen = false }: MobileModalProps) {
  const { isMobile } = useMobileOptimization()

  if (isMobile && fullScreen) {
    return (
      <div className={cn(
        'fixed inset-0 z-50 bg-background p-4 overflow-y-auto',
        className
      )}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn(
      'relative max-h-[90vh] overflow-y-auto',
      isMobile ? 'w-[95vw] max-w-none' : 'w-full max-w-2xl',
      className
    )}>
      {children}
    </div>
  )
}
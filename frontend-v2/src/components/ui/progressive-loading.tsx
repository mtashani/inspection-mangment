'use client'

import { useState, useEffect } from 'react'
import { LoadingSpinner } from './loading-spinner'
import { cn } from '@/lib/utils'

interface ProgressiveLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  skeleton?: React.ReactNode
  delay?: number
  minLoadingTime?: number
  className?: string
}

export function ProgressiveLoading({
  isLoading,
  children,
  skeleton,
  delay = 200,
  minLoadingTime = 500,
  className
}: ProgressiveLoadingProps) {
  const [showLoading, setShowLoading] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)

  useEffect(() => {
    let delayTimer: NodeJS.Timeout
    let minTimeTimer: NodeJS.Timeout

    if (isLoading) {
      // Start loading after delay
      delayTimer = setTimeout(() => {
        setShowLoading(true)
        setLoadingStartTime(Date.now())
      }, delay)
    } else {
      // Handle minimum loading time
      if (loadingStartTime) {
        const elapsed = Date.now() - loadingStartTime
        const remaining = minLoadingTime - elapsed

        if (remaining > 0) {
          minTimeTimer = setTimeout(() => {
            setShowLoading(false)
            setLoadingStartTime(null)
          }, remaining)
        } else {
          setShowLoading(false)
          setLoadingStartTime(null)
        }
      } else {
        setShowLoading(false)
      }
    }

    return () => {
      clearTimeout(delayTimer)
      clearTimeout(minTimeTimer)
    }
  }, [isLoading, delay, minLoadingTime, loadingStartTime])

  if (showLoading) {
    return (
      <div className={className}>
        {skeleton || <LoadingSpinner text="Loading..." />}
      </div>
    )
  }

  return <div className={className}>{children}</div>
}

// Staggered loading for lists
interface StaggeredLoadingProps {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  renderSkeleton: (index: number) => React.ReactNode
  isLoading: boolean
  staggerDelay?: number
  className?: string
}

export function StaggeredLoading({
  items,
  renderItem,
  renderSkeleton,
  isLoading,
  staggerDelay = 100,
  className
}: StaggeredLoadingProps) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (!isLoading && items.length > 0) {
      setVisibleCount(0)
      const timer = setInterval(() => {
        setVisibleCount(prev => {
          if (prev >= items.length) {
            clearInterval(timer)
            return prev
          }
          return prev + 1
        })
      }, staggerDelay)

      return () => clearInterval(timer)
    }
  }, [isLoading, items.length, staggerDelay])

  if (isLoading) {
    return (
      <div className={className}>
        {Array.from({ length: 3 }).map((_, index) => renderSkeleton(index))}
      </div>
    )
  }

  return (
    <div className={className}>
      {items.slice(0, visibleCount).map((item, index) => (
        <div
          key={index}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}

// Shimmer effect for loading states
export function ShimmerEffect({ className }: { className?: string }) {
  return (
    <div className={cn(
      'animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer',
      className
    )} />
  )
}

// Loading state with retry
interface LoadingWithRetryProps {
  isLoading: boolean
  error: Error | null
  onRetry: () => void
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  className?: string
}

export function LoadingWithRetry({
  isLoading,
  error,
  onRetry,
  children,
  loadingComponent,
  className
}: LoadingWithRetryProps) {
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 space-y-4', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={className}>
        {loadingComponent || <LoadingSpinner text="Loading..." />}
      </div>
    )
  }

  return <div className={className}>{children}</div>
}
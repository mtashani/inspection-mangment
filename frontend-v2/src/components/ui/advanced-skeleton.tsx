'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AdvancedSkeletonProps {
  className?: string
}

// Event Card Skeleton
export function EventCardSkeleton({ className }: AdvancedSkeletonProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  )
}

// Inspection Card Skeleton
export function InspectionCardSkeleton({ className }: AdvancedSkeletonProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-px" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

// Daily Report Card Skeleton
export function DailyReportCardSkeleton({ 
  compact = false, 
  className 
}: AdvancedSkeletonProps & { compact?: boolean }) {
  if (compact) {
    return (
      <Card className={cn('p-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-px" />
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex items-center gap-4 pt-2 border-t">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

// Summary Card Skeleton
export function SummaryCardSkeleton({ className }: AdvancedSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <div className="p-2 rounded-md bg-muted">
          <Skeleton className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ 
  columns = 4, 
  className 
}: AdvancedSkeletonProps & { columns?: number }) {
  return (
    <div className={cn('flex items-center space-x-4 p-4 border-b', className)}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className="h-4 flex-1" />
      ))}
    </div>
  )
}

// Form Field Skeleton
export function FormFieldSkeleton({ className }: AdvancedSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// Navigation Skeleton
export function NavigationSkeleton({ className }: AdvancedSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}

// Page Header Skeleton
export function PageHeaderSkeleton({ className }: AdvancedSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  )
}

// Stats Grid Skeleton
export function StatsGridSkeleton({ 
  count = 4, 
  className 
}: AdvancedSkeletonProps & { count?: number }) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SummaryCardSkeleton key={index} />
      ))}
    </div>
  )
}

// List Skeleton
export function ListSkeleton({ 
  count = 3, 
  itemComponent: ItemComponent = DailyReportCardSkeleton,
  className 
}: AdvancedSkeletonProps & { 
  count?: number
  itemComponent?: React.ComponentType<any>
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <ItemComponent key={index} />
      ))}
    </div>
  )
}
// Daily Reports Loading Skeletons
// Loading skeleton components for Daily Reports page

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Main page loading skeleton
 */
export function DailyReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <SummaryCardsSkeleton />

      {/* Filter Panel Skeleton */}
      <FilterPanelSkeleton />

      {/* Results Summary Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Content List Skeleton */}
      <HierarchicalListSkeleton />
    </div>
  )
}

/**
 * Summary cards loading skeleton
 */
export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4 text-center">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Filter panel loading skeleton
 */
export function FilterPanelSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-18" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-22" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Hierarchical list loading skeleton
 */
export function HierarchicalListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <MaintenanceEventCardSkeleton key={index} />
      ))}
    </div>
  )
}

/**
 * Maintenance event card loading skeleton
 */
export function MaintenanceEventCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-18" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-22" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        
        {/* Sub-items skeleton */}
        <div className="ml-6 space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <InspectionCardSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Inspection card loading skeleton
 */
export function InspectionCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-18" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-18" />
          </div>
        </div>

        {/* Daily reports skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          {Array.from({ length: 2 }).map((_, index) => (
            <DailyReportCardSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Daily report card loading skeleton
 */
export function DailyReportCardSkeleton() {
  return (
    <div className="border rounded-lg p-3 bg-muted/50">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center space-x-1">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-6" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

/**
 * Loading spinner for inline loading states
 */
export function InlineLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}

/**
 * Empty state skeleton for when there's no data
 */
export function EmptyStateSkeleton() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </CardContent>
    </Card>
  )
}
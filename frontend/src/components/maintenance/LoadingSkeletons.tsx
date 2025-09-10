'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export const MaintenanceEventSkeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <Card className={cn("mb-4", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>

        <div className="mt-2">
          <Skeleton className="h-5 w-64 mb-1" />
          <Skeleton className="h-4 w-96 mb-2" />
          
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        {/* Statistics */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="text-center p-2 bg-gray-50 rounded-lg">
              <Skeleton className="h-6 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex items-center space-x-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardHeader>
    </Card>
  )
}

export const InspectionCardSkeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <Card className={cn("border-l-4 border-l-blue-500 mb-3", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          
          <Skeleton className="h-3 w-56" />
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-7 w-8" />
        </div>
      </CardHeader>
    </Card>
  )
}

export const DailyReportCardSkeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <Card className={cn("border-l-4 border-l-indigo-500 mb-2", className)}>
      <CardHeader className="py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <div className="flex flex-col">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          
          {/* Findings */}
          <div className="bg-yellow-50 p-2 rounded-md">
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-8" />
        </div>
      </CardHeader>
    </Card>
  )
}

export const FilterPanelSkeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-1 relative">
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>

        {/* Expanded Filters */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const StatisticCardSkeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <Card className={className}>
      <CardContent className="p-4 text-center">
        <Skeleton className="h-8 w-12 mx-auto mb-2" />
        <Skeleton className="h-4 w-20 mx-auto" />
      </CardContent>
    </Card>
  )
}

export const EventStatisticsSkeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-8 mb-1" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-20 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-6 w-8 mx-auto mb-1" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-6 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const ModalSkeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <Skeleton className="h-5 w-40 mb-2" />
        <div className="space-y-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

export const PageLoadingSkeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatisticCardSkeleton key={i} />
        ))}
      </div>

      {/* Filter Panel */}
      <FilterPanelSkeleton />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <MaintenanceEventSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Skeleton variants for different loading states
export const SkeletonVariants = {
  MaintenanceEvent: MaintenanceEventSkeleton,
  InspectionCard: InspectionCardSkeleton,
  DailyReportCard: DailyReportCardSkeleton,
  FilterPanel: FilterPanelSkeleton,
  StatisticCard: StatisticCardSkeleton,
  EventStatistics: EventStatisticsSkeleton,
  Modal: ModalSkeleton,
  PageLoading: PageLoadingSkeleton
}
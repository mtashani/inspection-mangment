'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EventCardSkeleton } from '@/components/ui/advanced-skeleton'

interface EventsListSkeletonProps {
  count?: number
}

export function EventsListSkeleton({ count = 6 }: EventsListSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  )
}
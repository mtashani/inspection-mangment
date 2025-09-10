'use client'

import { useInspections } from '@/hooks/use-maintenance-events'
import { InspectionsFilters } from '@/types/maintenance-events'
import { InspectionCard } from './inspection-card'
import { InspectionsListSkeleton } from './inspections-list-skeleton'
import { InspectionsListError } from './inspections-list-error'
import { InspectionsListEmpty } from './inspections-list-empty'
import { useEffect } from 'react'

interface InspectionsListProps {
  eventId: string
  subEventId?: number
  search?: string
  inspectionStatus?: string
  equipmentTag?: string
}

export function InspectionsList({ 
  eventId, 
  subEventId, 
  search, 
  inspectionStatus, 
  equipmentTag 
}: InspectionsListProps) {
  const filters: InspectionsFilters = {
    eventId,
    subEventId,
    search,
    status: inspectionStatus ? inspectionStatus as any : undefined,
    equipmentTag
  }

  const { data: inspections, isLoading, error } = useInspections(filters)

  // Debug logging
  useEffect(() => {
    console.log('🔍 InspectionsList - Filters changed:', {
      eventId,
      subEventId,
      search,
      inspectionStatus,
      equipmentTag,
      filters
    })
    console.log('📊 InspectionsList - Data received:', {
      isLoading,
      inspectionsCount: inspections?.length || 0,
      error: error?.message
    })
  }, [eventId, subEventId, search, inspectionStatus, equipmentTag, inspections, isLoading, error, filters])

  if (isLoading) {
    return <InspectionsListSkeleton />
  }

  if (error) {
    return <InspectionsListError error={error} />
  }

  if (!inspections || inspections.length === 0) {
    return <InspectionsListEmpty eventId={eventId} subEventId={subEventId} />
  }

  return (
    <div className="space-y-4">
      {inspections.map(inspection => (
        <InspectionCard 
          key={inspection.id} 
          inspection={inspection}
          searchTerm={search}
        />
      ))}
    </div>
  )
}
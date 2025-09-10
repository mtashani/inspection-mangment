'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList } from 'lucide-react'

interface InspectionsListEmptyProps {
  eventId?: string
  subEventId?: number
}

export function InspectionsListEmpty({ eventId, subEventId }: InspectionsListEmptyProps) {
  const isGlobalSearch = !eventId || eventId.trim() === ''
  
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
        <ClipboardList className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">No inspections found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {isGlobalSearch
              ? 'No inspections match your search criteria. Try adjusting your filters or search terms.'
              : subEventId 
                ? 'There are no inspections for this sub-event yet. Use the action buttons in the header to plan or add inspections.'
                : 'There are no direct inspections for this maintenance event yet. Use the action buttons in the header to plan or add inspections.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
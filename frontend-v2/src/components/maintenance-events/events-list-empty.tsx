'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Wrench, Plus } from 'lucide-react'
import { CreateEventModal } from './create-event-modal'

export function EventsListEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
        <Wrench className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">No maintenance events found</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            There are no maintenance events matching your current filters. 
            Try adjusting your search criteria or create a new maintenance event.
          </p>
        </div>
        <CreateEventModal 
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Event
            </Button>
          }
        />
      </CardContent>
    </Card>
  )
}
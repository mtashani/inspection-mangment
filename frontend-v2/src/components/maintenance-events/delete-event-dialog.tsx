'use client'

import { useState } from 'react'
import { MaintenanceEvent } from '@/types/maintenance-events'
import { useDeleteMaintenanceEvent } from '@/hooks/use-maintenance-events'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle, Calendar, FileX } from 'lucide-react'
import { format } from 'date-fns'

interface DeleteEventDialogProps {
  trigger?: React.ReactNode
  event: MaintenanceEvent
  onEventDeleted?: () => void
}

export function DeleteEventDialog({ trigger, event, onEventDeleted }: DeleteEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const deleteEventMutation = useDeleteMaintenanceEvent()

  const expectedConfirmText = 'delete'

  const handleDelete = async () => {
    if (confirmText !== expectedConfirmText) {
      toast.error('Please type the correct confirmation text')
      return
    }

    setIsDeleting(true)
    try {
      await deleteEventMutation.mutateAsync(event.id.toString())
      
      setIsOpen(false)
      onEventDeleted?.()
      toast.success('Event deleted successfully')
      
    } catch (error) {
      console.error('Failed to delete event:', error)
      toast.error('Failed to delete event. Please try again.')
    } finally {
      setIsDeleting(false)
      setConfirmText('')
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setIsOpen(false)
      setConfirmText('')
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Maintenance Event
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this maintenance event? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Event Information */}
          <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-l-destructive">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{event.title}</span>
                <Badge variant="outline">{event.event_number}</Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(event.planned_start_date), 'MMM dd, yyyy')} 
                    {' → '}
                    {format(new Date(event.planned_end_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileX className="h-4 w-4" />
                  <span>Type: {event.event_type}</span>
                </div>
                
                {event.sub_events_count && event.sub_events_count > 0 && (
                  <div className="text-orange-600">
                    ⚠️ Has {event.sub_events_count} sub-event(s)
                  </div>
                )}
                
                {event.inspections_count && event.inspections_count > 0 && (
                  <div className="text-orange-600">
                    ⚠️ Has {event.inspections_count} inspection(s)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting this event will also delete:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>All sub-events associated with this event</li>
                <li>All planned inspections linked to this event</li>
                <li>All historical data and reports</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Type <code className="bg-muted px-2 py-1 rounded text-xs font-mono">delete</code> to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDeleting}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== expectedConfirmText}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
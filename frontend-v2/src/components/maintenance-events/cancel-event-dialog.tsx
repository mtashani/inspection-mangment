'use client'

import { useState } from 'react'
import { MaintenanceEvent, MaintenanceEventStatus } from '@/types/maintenance-events'
import { useUpdateMaintenanceEvent } from '@/hooks/use-maintenance-events'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { X, AlertTriangle, Calendar, FileX } from 'lucide-react'
import { format } from 'date-fns'
import { validateStateTransition } from '@/lib/utils/maintenance-event-state'
import { useAuth } from '@/contexts/auth-context'

interface CancelEventDialogProps {
  trigger?: React.ReactNode
  event: MaintenanceEvent
  onEventCanceled?: () => void
}

export function CancelEventDialog({ trigger, event, onEventCanceled }: CancelEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { user, isAdmin } = useAuth()
  const updateEventMutation = useUpdateMaintenanceEvent()

  const handleCancel = async () => {
    // Validate cancellation reason
    if (!cancelReason.trim()) {
      setErrors({ reason: 'Cancellation reason is required' })
      return
    }

    // Validate state transition
    const validation = validateStateTransition(event, MaintenanceEventStatus.Cancelled, {
      isAdmin: isAdmin(),
      isOwner: user?.username === event.created_by
    })

    if (!validation.isValid) {
      toast.error(validation.error || 'Cannot cancel this event')
      return
    }

    setIsCanceling(true)
    setErrors({})

    try {
      await updateEventMutation.mutateAsync({
        id: event.id.toString(),
        data: {
          status: MaintenanceEventStatus.Cancelled,
          notes: event.notes 
            ? `${event.notes}\n\n[CANCELLED] ${format(new Date(), 'yyyy-MM-dd HH:mm')}: ${cancelReason}`
            : `[CANCELLED] ${format(new Date(), 'yyyy-MM-dd HH:mm')}: ${cancelReason}`
        }
      })
      
      handleClose()
      onEventCanceled?.()
      toast.success('Event cancelled successfully')
      
    } catch (error) {
      console.error('Failed to cancel event:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel event. Please try again.'
      setErrors({ submit: errorMessage })
    } finally {
      setIsCanceling(false)
    }
  }

  const handleClose = () => {
    if (!isCanceling) {
      setIsOpen(false)
      setCancelReason('')
      setErrors({})
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <X className="h-5 w-5" />
            Cancel Maintenance Event
          </DialogTitle>
          <DialogDescription>
            Cancel this maintenance event. You can provide a reason for the cancellation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Event Information */}
          <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-l-orange-500">
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
                  <span>Type: {event.event_type} • Status: {event.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Impact:</strong> Canceling this event will:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Change the event status to &quot;Cancelled&quot;</li>
                <li>Stop any planned sub-events and inspections</li>
                <li>Notify all stakeholders about the cancellation</li>
                <li>Preserve all data for future reference</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancel_reason" className="text-sm font-medium">
              Cancellation Reason *
            </Label>
            <Textarea
              id="cancel_reason"
              placeholder="Please provide a reason for canceling this event..."
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value)
                if (errors.reason) {
                  setErrors(prev => {
                    const newErrors = { ...prev }
                    delete newErrors.reason
                    return newErrors
                  })
                }
              }}
              rows={3}
              className="resize-none"
              disabled={isCanceling}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isCanceling}>
            Keep Event
          </Button>
          
          <Button 
            onClick={handleCancel}
            disabled={isCanceling || !cancelReason.trim()}
            variant="destructive"
            className="min-w-[120px] gap-2"
          >
            {isCanceling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="h-4 w-4" />
                Cancel Event
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
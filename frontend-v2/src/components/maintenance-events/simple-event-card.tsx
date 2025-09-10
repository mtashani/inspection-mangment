'use client'

import { useRouter } from 'next/navigation'
import { MaintenanceEvent } from '@/types/maintenance-events'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Layers, ClipboardList, User, CheckCircle, Clock, XCircle, Edit, Trash2 } from 'lucide-react'
import { EditEventModal } from './edit-event-modal'
import { DeleteEventDialog } from './delete-event-dialog'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface SimpleEventCardProps {
  event: MaintenanceEvent
  onEventUpdated?: () => void
  onEventDeleted?: () => void
}

export function SimpleEventCard({ event, onEventUpdated, onEventDeleted }: SimpleEventCardProps) {
  const router = useRouter()
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons or if we're in a modal
    if ((e.target as HTMLElement).closest('.event-actions') || 
        (e.target as HTMLElement).closest('[role="dialog"]')) {
      return
    }
    router.push(`/maintenance-events/${event.id}`)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault() 
  }

  const handleEventUpdated = () => {
    onEventUpdated?.()
  }

  const handleEventDeleted = () => {
    onEventDeleted?.()
  }
  
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'InProgress':
        return 'default'
      case 'Completed':
        return 'secondary'
      case 'Cancelled':
        return 'destructive'
      case 'Planned':
      case 'Postponed':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // Check if event is approved
  const isApproved = event.approved_by && event.approval_date
  const isPending = !isApproved && event.status !== 'Cancelled'

  // Format dates with better detail
  const formatDateRange = () => {
    const startDate = new Date(event.planned_start_date)
    const endDate = new Date(event.planned_end_date)
    const actualStart = event.actual_start_date ? new Date(event.actual_start_date) : null
    const actualEnd = event.actual_end_date ? new Date(event.actual_end_date) : null

    if (actualStart && actualEnd) {
      return `Actual: ${format(actualStart, 'MMM dd')} - ${format(actualEnd, 'MMM dd, yyyy')}`
    } else if (actualStart) {
      return `Started: ${format(actualStart, 'MMM dd')} (Planned end: ${format(endDate, 'MMM dd')})`
    } else {
      return `Planned: ${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
    }
  }

  const getApprovalIcon = () => {
    if (isApproved) return <CheckCircle className="h-3 w-3 text-green-600" />
    if (isPending) return <Clock className="h-3 w-3 text-orange-600" />
    return <XCircle className="h-3 w-3 text-gray-400" />
  }
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 h-full relative"
      onClick={handleClick}
    >
      {/* Action Buttons - Positioned inline with header content */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{event.event_number}</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant={getStatusVariant(event.status)} className="shrink-0">
              {event.status}
            </Badge>
            <div className="flex space-x-1 event-actions">
              <EditEventModal 
                event={event}
                onEventUpdated={handleEventUpdated}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    type="button"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                }
              />
              <DeleteEventDialog 
                event={event}
                onEventDeleted={handleEventDeleted}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-50 text-gray-500 hover:text-red-600"
                    type="button"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Enhanced Date Information */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="flex-1">
            {formatDateRange()}
          </span>
        </div>
        
        {/* Sub-events and Inspections Count */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>{event.sub_events_count || 0} Sub-events</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span>{event.inspections_count || 0} Inspections</span>
          </div>
        </div>

        {/* Creator and Approver Information */}
        <div className="space-y-2">
          {/* Creator */}
          {event.created_by && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Created by: {event.created_by}</span>
            </div>
          )}
          
          {/* Approval Status */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {getApprovalIcon()}
              <span className={`${
                isApproved ? 'text-green-700' : 
                isPending ? 'text-orange-700' : 'text-gray-500'
              }`}>
                {isApproved ? 'Approved' : isPending ? 'Pending Approval' : 'Not Approved'}
              </span>
            </div>
            {event.approved_by && (
              <span className="text-muted-foreground">by {event.approved_by}</span>
            )}
          </div>
          
          {/* Approval Date */}
          {event.approval_date && (
            <div className="text-xs text-muted-foreground">
              Approved on: {format(new Date(event.approval_date), 'MMM dd, yyyy')}
            </div>
          )}
        </div>
        
        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
        
        {/* Event Type */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {event.event_type}
          </Badge>
          
          {/* Created Date */}
          <span className="text-xs text-muted-foreground">
            Created: {format(new Date(event.created_at), 'MMM dd')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

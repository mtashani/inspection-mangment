'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { MaintenanceEvent } from '@/types/maintenance-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MaintenanceEventStatusBadge } from '@/components/ui/status-badge'
import { MaintenanceEventStatusIndicator } from '@/components/ui/status-indicator'
import { Calendar, Layers, ClipboardList, User, AlertTriangle, Edit, Trash2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditEventModal } from './edit-event-modal'
import { DeleteEventDialog } from './delete-event-dialog'
import { cn } from '@/lib/utils'
import { getMaintenanceEventStatusColor, isOverdue } from '@/lib/utils/status-colors'

interface EventCardProps {
  event: MaintenanceEvent
  onHeightChange?: (height: number) => void
  onEventUpdated?: () => void
  onEventDeleted?: () => void
}

export function EventCard({ event, onHeightChange, onEventUpdated, onEventDeleted }: EventCardProps) {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering card click
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering card click
  }

  // Report height changes for virtualization
  useEffect(() => {
    if (onHeightChange && cardRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          onHeightChange(entry.contentRect.height)
        }
      })
      
      resizeObserver.observe(cardRef.current)
      
      // Initial height report
      onHeightChange(cardRef.current.offsetHeight)
      
      return () => resizeObserver.disconnect()
    }
  }, [onHeightChange])

  const eventIsOverdue = isOverdue(event.planned_end_date, event.status)
  const statusColors = getMaintenanceEventStatusColor(event.status)

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'Overhaul':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'Inspection':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'Repair':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'Preventive':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'Emergency':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 h-full relative group",
        eventIsOverdue && "ring-2 ring-red-200 shadow-red-100"
      )}
      onClick={(e) => {
        // Don't navigate if clicking on action buttons
        if ((e.target as HTMLElement).closest('.event-actions')) {
          return
        }
        router.push(`/maintenance-events/${event.id}`)
      }}
    >
      {/* Status Indicator */}
      <div className="absolute top-3 left-3">
        <MaintenanceEventStatusIndicator 
          status={event.status}
          endDate={event.planned_end_date}
          size="sm"
          showPulse={eventIsOverdue}
        />
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex space-x-2 z-10 event-actions">
        <EditEventModal 
          event={event}
          onEventUpdated={handleEventUpdated}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm border border-gray-200"
              onClick={handleEditClick}
            >
              <Edit className="h-4 w-4" />
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
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm border border-gray-200"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      <CardHeader className="pb-3 pl-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <CardTitle className="text-base sm:text-lg line-clamp-2 flex-1">{event.title}</CardTitle>
              {eventIsOverdue && (
                <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse flex-shrink-0 mt-0.5" />
              )}
            </div>
            <CardDescription className="text-sm mt-1">
              {event.event_number}
            </CardDescription>
          </div>
          <div className="flex flex-row sm:flex-col gap-2 sm:gap-1 flex-wrap sm:flex-nowrap">
            <MaintenanceEventStatusBadge 
              status={event.status}
              endDate={event.planned_end_date}
              className="text-xs"
            />
            <Badge 
              variant="outline"
              className={cn("text-xs", getEventTypeColor(event.event_type))}
            >
              {event.event_type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={cn(
          "flex items-center gap-2 text-sm",
          eventIsOverdue ? "text-red-600" : "text-muted-foreground"
        )}>
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(event.planned_start_date), 'MMM dd, yyyy')} - 
            {format(new Date(event.planned_end_date), 'MMM dd, yyyy')}
          </span>
          {eventIsOverdue && (
            <Badge variant="destructive" className="text-xs ml-2">
              Overdue
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Sub-events:</span>
            <span className="font-medium">{event.sub_events_count || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Inspections:</span>
            <span className="font-medium">{event.inspections_count || 0}</span>
          </div>
        </div>
        
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
        
        {event.created_by && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <User className="h-3 w-3" />
            <span>Created by {event.created_by}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
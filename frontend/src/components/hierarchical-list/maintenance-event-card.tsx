'use client'

import React from 'react'
import { 
  WrenchScrewdriverIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ExpandButton, 
  SelectionCheckbox, 
  StatusBadge, 
  ActionButtons,
  ProgressIndicator,
  HierarchicalItemRenderOptions 
} from './base-hierarchical-list'
import { 
  MaintenanceEventGroup, 
  MaintenanceEventType, 
  MaintenanceEventStatus,
  MaintenanceSubEvent,
  OverhaulSubType
} from '@/types/maintenance'

export interface MaintenanceEventCardProps {
  event: MaintenanceEventGroup
  renderOptions: HierarchicalItemRenderOptions
  enableMultiSelect?: boolean
  showSubEvents?: boolean
  onCreateSubEvent?: (eventId: string) => void
  onEditSubEvent?: (subEventId: string) => void
  onDeleteSubEvent?: (subEventId: string) => void
  onUpdateSubEventStatus?: (subEventId: string, status: MaintenanceEventStatus) => void
  className?: string
}

export function MaintenanceEventCard({
  event,
  renderOptions,
  enableMultiSelect = true,
  showSubEvents = true,
  onCreateSubEvent,
  onEditSubEvent,
  onDeleteSubEvent,
  onUpdateSubEventStatus,
  className
}: MaintenanceEventCardProps) {
  const {
    isExpanded,
    isSelected,
    hasChildren,
    level,
    onToggleExpand,
    onToggleSelect,
    onAction
  } = renderOptions

  // Get status variant for styling
  const getStatusVariant = (status: MaintenanceEventStatus) => {
    switch (status) {
      case MaintenanceEventStatus.PLANNED:
        return 'info'
      case MaintenanceEventStatus.IN_PROGRESS:
        return 'warning'
      case MaintenanceEventStatus.COMPLETED:
        return 'success'
      case MaintenanceEventStatus.CANCELLED:
        return 'error'
      case MaintenanceEventStatus.ON_HOLD:
        return 'default'
      default:
        return 'default'
    }
  }

  // Get event type color and icon
  const getEventTypeInfo = (eventType: MaintenanceEventType) => {
    switch (eventType) {
      case MaintenanceEventType.PREVENTIVE:
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: '🔧',
          label: 'Preventive'
        }
      case MaintenanceEventType.CORRECTIVE:
        return {
          color: 'bg-orange-100 text-orange-800',
          icon: '⚠️',
          label: 'Corrective'
        }
      case MaintenanceEventType.OVERHAUL:
        return {
          color: 'bg-purple-100 text-purple-800',
          icon: '🔄',
          label: 'Overhaul'
        }
      case MaintenanceEventType.EMERGENCY:
        return {
          color: 'bg-red-100 text-red-800',
          icon: '🚨',
          label: 'Emergency'
        }
      case MaintenanceEventType.INSPECTION:
        return {
          color: 'bg-green-100 text-green-800',
          icon: '🔍',
          label: 'Inspection'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: '🔧',
          label: 'Maintenance'
        }
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Calculate days from now
  const getDaysFromNow = (dateString: string) => {
    const now = new Date()
    const targetDate = new Date(dateString)
    const diffTime = targetDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `In ${diffDays} days`
    return `${Math.abs(diffDays)} days ago`
  }

  // Check if event is overdue
  const isOverdue = new Date() > new Date(event.plannedEndDate) && 
    event.status !== MaintenanceEventStatus.COMPLETED

  // Get progress variant based on status and completion
  const getProgressVariant = () => {
    if (event.status === MaintenanceEventStatus.COMPLETED) return 'success'
    if (isOverdue) return 'error'
    if (event.completionPercentage >= 75) return 'success'
    if (event.completionPercentage >= 50) return 'default'
    return 'warning'
  }

  const eventTypeInfo = getEventTypeInfo(event.eventType)

  // Main action buttons
  const mainActions = [
    {
      key: 'start',
      label: 'Start',
      icon: PlayIcon,
      variant: 'default' as const,
      disabled: !event.canStart,
      hidden: !event.canStart || event.status !== MaintenanceEventStatus.PLANNED
    },
    {
      key: 'complete',
      label: 'Complete',
      icon: CheckCircleIcon,
      variant: 'default' as const,
      disabled: !event.canComplete,
      hidden: !event.canComplete || event.status !== MaintenanceEventStatus.IN_PROGRESS
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: PencilIcon,
      variant: 'outline' as const,
      disabled: !event.canEdit,
      hidden: !event.canEdit
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      variant: 'destructive' as const,
      disabled: !event.canDelete,
      hidden: !event.canDelete
    }
  ]

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isSelected && 'ring-2 ring-primary ring-offset-2',
      isOverdue && 'border-red-200 bg-red-50/50',
      event.eventType === MaintenanceEventType.EMERGENCY && 'border-red-300 bg-red-50',
      className
    )}>
      <CardContent className=\"p-4\">
        {/* Main event header */}
        <div className=\"flex items-start space-x-3\">
          {/* Expand/collapse button */}
          <div className=\"flex-shrink-0 mt-1\">
            <ExpandButton
              isExpanded={isExpanded}
              hasChildren={hasChildren}
              onToggle={onToggleExpand}
            />
          </div>

          {/* Selection checkbox */}
          {enableMultiSelect && (
            <div className=\"flex-shrink-0 mt-1\">
              <SelectionCheckbox
                isSelected={isSelected}
                onToggle={onToggleSelect}
              />
            </div>
          )}

          {/* Event icon */}
          <div className=\"flex-shrink-0 mt-1\">
            <WrenchScrewdriverIcon className=\"h-5 w-5 text-primary\" />
          </div>

          {/* Main content */}
          <div className=\"flex-1 min-w-0\">
            {/* Title and status row */}
            <div className=\"flex items-start justify-between mb-2\">
              <div className=\"flex-1 min-w-0\">
                <div className=\"flex items-center space-x-2 mb-1\">
                  <h3 className=\"text-sm font-medium text-gray-900 truncate\">
                    {event.title}
                  </h3>
                  {isOverdue && (
                    <ExclamationTriangleIcon className=\"h-4 w-4 text-red-500 flex-shrink-0\" />
                  )}
                  {event.eventType === MaintenanceEventType.EMERGENCY && (
                    <Badge className=\"bg-red-100 text-red-800 text-xs px-1.5 py-0.5\">
                      URGENT
                    </Badge>
                  )}
                </div>
                <div className=\"flex items-center space-x-2 text-xs text-muted-foreground\">
                  <span className=\"font-mono\">{event.eventNumber}</span>
                  {event.description && (
                    <>
                      <span>•</span>
                      <span className=\"truncate\">{event.description}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status and actions */}
              <div className=\"flex items-center space-x-2 flex-shrink-0 ml-4\">
                <StatusBadge
                  status={event.status}
                  variant={getStatusVariant(event.status)}
                  size=\"sm\"
                />
                <ActionButtons
                  actions={mainActions}
                  onAction={onAction}
                  size=\"sm\"
                />
              </div>
            </div>

            {/* Event type and progress row */}
            <div className=\"flex items-center justify-between mb-3\">
              <div className=\"flex items-center space-x-3\">
                {/* Event type */}
                <Badge className={cn('text-xs px-2 py-1', eventTypeInfo.color)}>
                  <span className=\"mr-1\">{eventTypeInfo.icon}</span>
                  {eventTypeInfo.label}
                </Badge>

                {/* Date info */}
                <div className=\"flex items-center space-x-1 text-xs text-muted-foreground\">
                  <CalendarIcon className=\"h-3 w-3\" />
                  <span>{formatDate(event.plannedStartDate)}</span>
                  <span>-</span>
                  <span>{formatDate(event.plannedEndDate)}</span>
                </div>

                {/* Time indicator */}
                <div className=\"flex items-center space-x-1 text-xs text-muted-foreground\">
                  <ClockIcon className=\"h-3 w-3\" />
                  <span className={cn(
                    isOverdue && 'text-red-600 font-medium'
                  )}>
                    {getDaysFromNow(event.plannedEndDate)}
                  </span>
                </div>
              </div>

              {/* Progress indicator */}
              <div className=\"flex items-center space-x-2\">
                <ProgressIndicator
                  percentage={event.completionPercentage}
                  variant={getProgressVariant()}
                  size=\"sm\"
                  className=\"w-24\"
                />
              </div>
            </div>

            {/* Sub-events summary */}
            {event.subEvents.length > 0 && (
              <div className=\"flex items-center justify-between text-xs text-muted-foreground\">
                <div className=\"flex items-center space-x-4\">
                  <div className=\"flex items-center space-x-1\">
                    <ChartBarIcon className=\"h-3 w-3\" />
                    <span>{event.completedSubEvents}/{event.subEvents.length} sub-events completed</span>
                  </div>
                  {event.overdueSubEvents > 0 && (
                    <div className=\"flex items-center space-x-1 text-red-600\">
                      <ExclamationTriangleIcon className=\"h-3 w-3\" />
                      <span>{event.overdueSubEvents} overdue</span>
                    </div>
                  )}
                </div>

                {/* Actual dates if available */}
                <div className=\"flex items-center space-x-2\">
                  {event.actualStartDate && (
                    <span>Started: {formatDate(event.actualStartDate)}</span>
                  )}
                  {event.actualEndDate && (
                    <span>Completed: {formatDate(event.actualEndDate)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expanded content: Sub-events */}
        {isExpanded && hasChildren && showSubEvents && (
          <div className=\"mt-4 pl-8 border-l-2 border-gray-100\">
            <div className=\"space-y-2\">
              {/* Sub-events header */}
              <div className=\"flex items-center justify-between mb-3\">
                <h4 className=\"text-sm font-medium text-gray-700 flex items-center\">
                  <ChartBarIcon className=\"h-4 w-4 mr-2\" />
                  Sub-Events ({event.subEvents.length})
                </h4>
                {onCreateSubEvent && event.status === MaintenanceEventStatus.IN_PROGRESS && (
                  <Button
                    size=\"sm\"
                    variant=\"outline\"
                    onClick={() => onCreateSubEvent(event.id)}
                    className=\"h-7 text-xs\"
                  >
                    <PlayIcon className=\"h-3 w-3 mr-1\" />
                    Add Sub-Event
                  </Button>
                )}
              </div>

              {/* Sub-events list */}
              {event.subEvents.length > 0 ? (
                <div className=\"space-y-2\">
                  {event.subEvents.map(subEvent => (
                    <MaintenanceSubEventItem
                      key={subEvent.id}
                      subEvent={subEvent}
                      onEdit={onEditSubEvent}
                      onDelete={onDeleteSubEvent}
                      onUpdateStatus={onUpdateSubEventStatus}
                    />
                  ))}
                </div>
              ) : (
                <div className=\"text-center py-4 text-sm text-muted-foreground\">
                  No sub-events yet
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sub-event item component
interface MaintenanceSubEventItemProps {
  subEvent: MaintenanceSubEvent
  onEdit?: (subEventId: string) => void
  onDelete?: (subEventId: string) => void
  onUpdateStatus?: (subEventId: string, status: MaintenanceEventStatus) => void
}

function MaintenanceSubEventItem({ 
  subEvent, 
  onEdit, 
  onDelete, 
  onUpdateStatus 
}: MaintenanceSubEventItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = new Date() > new Date(subEvent.plannedEndDate) && 
    subEvent.status !== MaintenanceEventStatus.COMPLETED

  const getSubTypeInfo = (subType?: OverhaulSubType) => {
    if (!subType) return null
    
    switch (subType) {
      case OverhaulSubType.PREPARATION:
        return { icon: '📋', label: 'Preparation' }
      case OverhaulSubType.DISASSEMBLY:
        return { icon: '🔧', label: 'Disassembly' }
      case OverhaulSubType.INSPECTION:
        return { icon: '🔍', label: 'Inspection' }
      case OverhaulSubType.REPAIR:
        return { icon: '🛠️', label: 'Repair' }
      case OverhaulSubType.REPLACEMENT:
        return { icon: '🔄', label: 'Replacement' }
      case OverhaulSubType.REASSEMBLY:
        return { icon: '⚙️', label: 'Reassembly' }
      case OverhaulSubType.TESTING:
        return { icon: '🧪', label: 'Testing' }
      case OverhaulSubType.COMMISSIONING:
        return { icon: '✅', label: 'Commissioning' }
      default:
        return null
    }
  }

  const subTypeInfo = getSubTypeInfo(subEvent.subType)

  const subEventActions = [
    {
      key: 'start',
      label: 'Start',
      icon: PlayIcon,
      variant: 'ghost' as const,
      hidden: subEvent.status !== MaintenanceEventStatus.PLANNED || !onUpdateStatus
    },
    {
      key: 'complete',
      label: 'Complete',
      icon: CheckCircleIcon,
      variant: 'ghost' as const,
      hidden: subEvent.status !== MaintenanceEventStatus.IN_PROGRESS || !onUpdateStatus
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: PencilIcon,
      variant: 'ghost' as const,
      hidden: !onEdit
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      variant: 'ghost' as const,
      hidden: !onDelete
    }
  ]

  const handleAction = (actionKey: string) => {
    switch (actionKey) {
      case 'start':
        onUpdateStatus?.(subEvent.id, MaintenanceEventStatus.IN_PROGRESS)
        break
      case 'complete':
        onUpdateStatus?.(subEvent.id, MaintenanceEventStatus.COMPLETED)
        break
      case 'edit':
        onEdit?.(subEvent.id)
        break
      case 'delete':
        onDelete?.(subEvent.id)
        break
    }
  }

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors',
      isOverdue && 'border-red-200 bg-red-50/30'
    )}>
      <div className=\"flex items-start justify-between\">
        <div className=\"flex-1 min-w-0\">
          <div className=\"flex items-center space-x-2 mb-1\">
            <span className=\"text-sm font-medium\">{subEvent.title}</span>
            {subTypeInfo && (
              <Badge variant=\"secondary\" className=\"text-xs px-1.5 py-0.5\">
                <span className=\"mr-1\">{subTypeInfo.icon}</span>
                {subTypeInfo.label}
              </Badge>
            )}
            {isOverdue && (
              <ExclamationTriangleIcon className=\"h-3 w-3 text-red-500\" />
            )}
          </div>
          
          <div className=\"flex items-center space-x-4 text-xs text-muted-foreground mb-2\">
            <div className=\"flex items-center space-x-1\">
              <CalendarIcon className=\"h-3 w-3\" />
              <span>{formatDate(subEvent.plannedStartDate)} - {formatDate(subEvent.plannedEndDate)}</span>
            </div>
            <StatusBadge
              status={subEvent.status}
              variant={subEvent.status === MaintenanceEventStatus.COMPLETED ? 'success' : 
                      subEvent.status === MaintenanceEventStatus.IN_PROGRESS ? 'warning' : 'default'}
              size=\"sm\"
            />
          </div>

          {/* Progress bar */}
          <ProgressIndicator
            percentage={subEvent.completionPercentage}
            variant={subEvent.status === MaintenanceEventStatus.COMPLETED ? 'success' : 
                    isOverdue ? 'error' : 'default'}
            size=\"sm\"
            className=\"mb-2\"
          />

          {subEvent.notes && (
            <p className=\"text-sm text-gray-600 line-clamp-1\">
              {subEvent.notes}
            </p>
          )}
        </div>
        
        <div className=\"flex-shrink-0 ml-4\">
          <ActionButtons
            actions={subEventActions}
            onAction={handleAction}
            size=\"sm\"
          />
        </div>
      </div>
    </div>
  )
}

export { MaintenanceSubEventItem }
export type { MaintenanceEventCardProps }
'use client'

import React from 'react'
import { MaintenanceEvent, MaintenanceEventStatus } from '@/types/maintenance-events'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  getEventWorkflowState
} from '@/lib/utils/maintenance-event-state'
import { useStateTransitionValidation } from '@/lib/utils/state-transition-validation'
import { useAuth } from '@/contexts/auth-context'
import { 
  Edit, 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  Check,
  X,
  Trash2,
  ClipboardList,
  AlertTriangle,
  RotateCcw,
  Undo2,
  RefreshCw
} from 'lucide-react'
import { CreateSubEventModal, EditEventModal, DeleteEventDialog, CancelEventDialog, CreatePlanInspectionModal, CreateUnplannedInspectionModal } from './'
import { 
  useReopenMaintenanceEvent, 
  useRevertMaintenanceEvent, 
  useReactivateMaintenanceEvent,
  useRevertApprovalMaintenanceEvent
} from '@/hooks/use-maintenance-events'
import { toast } from 'sonner'

interface StateBasedActionsProps {
  event: MaintenanceEvent
  onEventUpdated?: () => void
  onStartEvent?: () => void
  onCompleteEvent?: () => void
  onApproveEvent?: () => void
  onInspectionPlanned?: () => void
  onStateChanged?: (newStatus: MaintenanceEventStatus) => void // New prop for state changes
  className?: string
}

export function StateBasedActions({ 
  event, 
  onEventUpdated, 
  onStartEvent, 
  onCompleteEvent, 
  onApproveEvent,
  onInspectionPlanned,
  onStateChanged,
  className 
}: StateBasedActionsProps) {
  const { user, isAdmin } = useAuth()
  const workflowState = getEventWorkflowState(event, isAdmin(), user?.username === event.created_by)
  const validation = useStateTransitionValidation({ event })
  
  // Debug logging to understand workflow state
  React.useEffect(() => {
    console.log('🔧 StateBasedActions Debug:', {
      event: {
        id: event.id,
        status: event.status,
        created_by: event.created_by,
        approved_by: event.approved_by,
        event_category: event.event_category
      },
      user: {
        username: user?.username,
        isAdmin: isAdmin()
      },
      isOwner: user?.username === event.created_by,
      workflowState: {
        canEdit: workflowState.canEdit,
        canDelete: workflowState.canDelete,
        canCancel: workflowState.canCancel,
        canStart: workflowState.canStart,
        canComplete: workflowState.canComplete,
        canApprove: workflowState.canApprove,
        canAddSubEvents: workflowState.canAddSubEvents,
        canPlanInspections: workflowState.canPlanInspections,
        canCreatePlannedInspections: workflowState.canCreatePlannedInspections,
        canCreateUnplannedInspections: workflowState.canCreateUnplannedInspections,
        canCreateDirectInspections: workflowState.canCreateDirectInspections,
        isInPlanMode: workflowState.isInPlanMode,
        requiresApproval: workflowState.requiresApproval
      },
      shouldShowManagementSection: (
        workflowState.canAddSubEvents || 
        workflowState.canPlanInspections || 
        workflowState.canCreateDirectInspections || 
        workflowState.canCreatePlannedInspections || 
        workflowState.canCreateUnplannedInspections ||
        event.status === 'Planned'
      ),
      individualChecks: {
        showPlanButton: workflowState.canCreatePlannedInspections,
        showUnplannedButton: workflowState.canCreateUnplannedInspections,
        eventStatus: event.status,
        eventApprovedBy: event.approved_by
      }
    })
    
    // Additional detailed logging for inspection buttons
    console.log('🔍 Inspection Buttons Debug:', {
      'Plan Button Should Show': workflowState.canCreatePlannedInspections,
      'Unplanned Button Should Show': workflowState.canCreateUnplannedInspections,
      'Event Status': event.status,
      'Event Approved By': event.approved_by,
      'Is Approved': !!event.approved_by,
      'Management Section Should Show': (
        workflowState.canAddSubEvents || 
        workflowState.canPlanInspections || 
        workflowState.canCreateDirectInspections || 
        workflowState.canCreatePlannedInspections || 
        workflowState.canCreateUnplannedInspections ||
        event.status === 'Planned'
      )
    })
  }, [event, user, workflowState, isAdmin])
  
  // State reversal hooks
  const reopenEventMutation = useReopenMaintenanceEvent()
  const revertEventMutation = useRevertMaintenanceEvent()
  const reactivateEventMutation = useReactivateMaintenanceEvent()
  const revertApprovalMutation = useRevertApprovalMaintenanceEvent()

  const handleStartEvent = () => {
    if (validation.canStart()) {
      onStartEvent?.()
    }
  }

  const handleCompleteEvent = () => {
    if (validation.canComplete()) {
      onCompleteEvent?.()
    }
  }

  const handleApproveEvent = () => {
    if (validation.canApprove()) {
      onApproveEvent?.()
    }
  }

  const handleStateReversal = (action: 'reopen' | 'revert' | 'reactivate' | 'revert-approval') => {
    const eventId = event.id.toString()
    
    switch (action) {
      case 'reopen':
        reopenEventMutation.mutate(eventId, {
          onSuccess: () => {
            onEventUpdated?.()
          }
        })
        break
      case 'revert':
        revertEventMutation.mutate(eventId, {
          onSuccess: () => {
            onEventUpdated?.()
          }
        })
        break
      case 'reactivate':
        reactivateEventMutation.mutate(eventId, {
          onSuccess: () => {
            onEventUpdated?.()
          }
        })
        break
      case 'revert-approval':
        revertApprovalMutation.mutate(eventId, {
          onSuccess: () => {
            onEventUpdated?.()
          }
        })
        break
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Primary Actions for Each State */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {/* Approval Action (for unapproved events) */}
          {workflowState.canApprove && (
            <Button
              onClick={handleApproveEvent}
              size="sm"
              className="gap-1 text-xs px-2 py-1 h-6"
            >
              <Check className="h-2.5 w-2.5" />
              Approve
            </Button>
          )}
          
          {/* Approval Reversal Action (for mistakenly approved events that are in progress) */}
          {event.approved_by && event.status === 'InProgress' && isAdmin() && (
            <Button
              onClick={() => handleStateReversal('revert-approval')}
              variant="outline"
              size="sm"
              className="gap-1 text-xs px-2 py-1 h-6 border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <X className="h-2.5 w-2.5" />
              Revert Approval
            </Button>
          )}

          {/* Start Action (for approved planned events) */}
          {workflowState.canStart && (
            <Button
              onClick={handleStartEvent}
              size="sm"
              className="gap-1 text-xs px-2 py-1 h-6"
            >
              <Play className="h-2.5 w-2.5" />
              Start
            </Button>
          )}

          {/* Complete Action (for in-progress events) */}
          {workflowState.canComplete && (
            <Button
              onClick={handleCompleteEvent}
              size="sm"
              className="gap-1 text-xs px-2 py-1 h-6"
              variant="default"
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              Complete
            </Button>
          )}

          {/* Edit Action (for planned and completed events) */}
          {workflowState.canEdit && (
            <EditEventModal 
              event={event}
              onEventUpdated={onEventUpdated}
              trigger={
                <Button variant="outline" size="sm" className="gap-1 text-xs px-2 py-1 h-6">
                  <Edit className="h-2.5 w-2.5" />
                  Edit
                </Button>
              }
            />
          )}

          {/* State Reversal Actions */}
          {workflowState.canReopen && (
            <Button
              onClick={() => handleStateReversal('reopen')}
              variant="outline"
              size="sm"
              className="gap-1 text-xs px-2 py-1 h-6"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Reopen
            </Button>
          )}

          {workflowState.canRevert && (
            <Button
              onClick={() => handleStateReversal('revert')}
              variant="outline"
              size="sm"
              className="gap-1 text-xs px-2 py-1 h-6"
            >
              <Undo2 className="h-2.5 w-2.5" />
              Revert
            </Button>
          )}

          {workflowState.canReactivate && (
            <Button
              onClick={() => handleStateReversal('reactivate')}
              variant="outline"
              size="sm"
              className="gap-1 text-xs px-2 py-1 h-6"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Management Actions Section */}
      {(workflowState.canAddSubEvents || workflowState.canPlanInspections || workflowState.canCreateDirectInspections || workflowState.canCreatePlannedInspections || workflowState.canCreateUnplannedInspections || event.status === MaintenanceEventStatus.Planned) && (
        <div className="bg-muted/30 border rounded-lg p-3">
          <div className="space-y-2">
            {/* Management Header */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-2 py-1">
                <ClipboardList className="h-3 w-3 mr-1" />
                Management
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                {event.status === 'Planned' && !event.approved_by ? 'Planning' : 
                 event.status === 'Planned' && event.approved_by ? 'Ready' : 
                 event.status === 'InProgress' ? 'Active' :
                 event.status === 'Completed' ? 'Completed' : 'Cancelled'}
              </span>
              {/* Event Category Badge */}
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {event.event_category || 'Simple'}
              </Badge>
            </div>
            
            {/* Management Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sub-event Management - Only for Complex events */}
              {workflowState.canAddSubEvents && (
                <CreateSubEventModal 
                  parentEvent={event}
                  onSubEventCreated={onEventUpdated}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-1 text-xs px-2 py-1 h-7">
                      <Plus className="h-3 w-3" />
                      Sub-event
                    </Button>
                  }
                />
              )}

              {/* Inspection Planning - For Complex events or when planning is preferred */}
              {workflowState.canCreatePlannedInspections && (
                <CreatePlanInspectionModal 
                  parentEvent={event}
                  onInspectionPlanned={onInspectionPlanned}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-1 text-xs px-2 py-1 h-7">
                      <ClipboardList className="h-3 w-3" />
                      Plan Inspection
                    </Button>
                  }
                />
              )}
              
              {/* Unplanned Inspection Creation - For emergency inspections */}
              {workflowState.canCreateUnplannedInspections && (
                <CreateUnplannedInspectionModal 
                  parentEvent={event}
                  subEvent={undefined}
                  onInspectionCreated={onInspectionPlanned}
                  trigger={
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 text-xs px-2 py-1 h-7 border-orange-200 text-orange-600"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Unplanned
                    </Button>
                  }
                />
              )}
            </div>
            
            {/* Category-specific Help Text */}
            {(event.event_category || 'Simple') === 'Complex' && workflowState.canPlanInspections && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 Complex events should use planned inspection workflow for better organization
              </p>
            )}
            {(event.event_category || 'Simple') === 'Simple' && workflowState.canCreateDirectInspections && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 Simple events can create direct inspections immediately when approved
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="space-y-2">
        {/* Approval Status */}
        {(workflowState.requiresApproval && !isAdmin()) && (
          <div className="bg-muted border rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-muted rounded">
                <Clock className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Waiting for Approval</h4>
                <p className="text-muted-foreground text-xs">Requires admin approval.</p>
              </div>
            </div>
          </div>
        )}

        {/* Ready Status */}
        {event.approved_by && event.status === 'Planned' && (
          <div className="bg-muted border rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-muted rounded">
                <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Ready to Start</h4>
                <p className="text-muted-foreground text-xs">Approved by <span className="font-medium">{event.approved_by}</span>.</p>
              </div>
            </div>
          </div>
        )}

        {/* Restrictions */}
        {workflowState.planModeRestrictions.cannotStartInspections && (
          <div className="bg-muted border rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-muted rounded">
                <AlertTriangle className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Inspections Restricted</h4>
                <p className="text-muted-foreground text-xs">Complete planning and start event first.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Destructive Actions */}
      {(workflowState.canCancel || workflowState.canDelete) && (
        <div className="pt-2 border-t">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Destructive Actions</h4>
          <div className="flex flex-wrap gap-2">
            {workflowState.canCancel && (
              <CancelEventDialog 
                event={event}
                onEventCanceled={onEventUpdated}
                trigger={
                  <Button variant="destructive" size="sm" className="gap-1 text-xs px-2 py-1 h-6">
                    <X className="h-2.5 w-2.5" />
                    Cancel
                  </Button>
                }
              />
            )}

            {workflowState.canDelete && (
              <DeleteEventDialog 
                event={event}
                onEventDeleted={() => {
                  // Navigate back to events list after deletion
                  window.location.href = '/maintenance-events'
                }}
                trigger={
                  <Button variant="destructive" size="sm" className="gap-1 text-xs px-2 py-1 h-6">
                    <Trash2 className="h-2.5 w-2.5" />
                    Delete
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
import { MaintenanceEvent, MaintenanceEventStatus, MaintenanceEventCategory } from '@/types/maintenance-events'

/**
 * Maintenance Event State Management Utility
 * Provides comprehensive state validation and transition logic
 */

// State transition matrix - defines valid transitions (now more flexible)
const STATE_TRANSITIONS: Record<MaintenanceEventStatus, MaintenanceEventStatus[]> = {
  [MaintenanceEventStatus.Planned]: [
    MaintenanceEventStatus.InProgress,
    MaintenanceEventStatus.Cancelled,
    MaintenanceEventStatus.Postponed
  ],
  [MaintenanceEventStatus.InProgress]: [
    MaintenanceEventStatus.Completed,
    MaintenanceEventStatus.Cancelled,
    MaintenanceEventStatus.Postponed,
    MaintenanceEventStatus.Planned // Allow going back to planning if needed
  ],
  [MaintenanceEventStatus.Completed]: [
    MaintenanceEventStatus.InProgress, // Allow reopening if needed
    MaintenanceEventStatus.Cancelled   // Allow marking as cancelled if there were issues
  ],
  [MaintenanceEventStatus.Cancelled]: [
    MaintenanceEventStatus.Planned // Can be reactivated
  ],
  [MaintenanceEventStatus.Postponed]: [
    MaintenanceEventStatus.Planned,
    MaintenanceEventStatus.InProgress,
    MaintenanceEventStatus.Cancelled
  ]
}

// Workflow state definitions
export interface WorkflowState {
  canEdit: boolean
  canDelete: boolean
  canCancel: boolean
  canStart: boolean
  canComplete: boolean
  canApprove: boolean
  canAddSubEvents: boolean
  canPlanInspections: boolean
  canStartInspections: boolean
  canCreateDirectInspections: boolean
  canEditInspections: boolean
  // New state reversal capabilities
  canReopen: boolean        // Reopen completed events
  canRevert: boolean        // Revert in-progress to planned
  canReactivate: boolean    // Reactivate cancelled events
  // Enhanced inspection controls
  canCreatePlannedInspections: boolean    // Plan inspections (different from direct)
  canCreateUnplannedInspections: boolean  // Create unplanned inspections
  canAssignInspectionTeam: boolean        // Assign team members
  canCreateDailyReports: boolean          // Create daily reports
  canGenerateFinalReports: boolean        // Generate final reports
  // State flags
  requiresApproval: boolean
  isInPlanMode: boolean
  isActive: boolean
  isTerminal: boolean
  planModeRestrictions: PlanModeRestrictions
}

/**
 * Plan mode specific restrictions
 */
export interface PlanModeRestrictions {
  canOnlyPlanInspections: boolean
  cannotStartInspections: boolean
  cannotCompleteInspections: boolean
  canOnlyViewExistingInspections: boolean
  message: string
}

/**
 * Check if a state transition is valid
 */
export function isValidStateTransition(
  currentStatus: MaintenanceEventStatus,
  targetStatus: MaintenanceEventStatus
): boolean {
  return STATE_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false
}

/**
 * Get all valid next states for a given current state
 */
export function getValidNextStates(currentStatus: MaintenanceEventStatus): MaintenanceEventStatus[] {
  return STATE_TRANSITIONS[currentStatus] ?? []
}

/**
 * Determine if an event is in "plan mode"
 * Plan mode: event is planned but not yet approved by admin
 */
export function isInPlanMode(event: MaintenanceEvent): boolean {
  return event.status === MaintenanceEventStatus.Planned && !event.approved_by
}

/**
 * Determine if an event is approved and ready to start
 */
export function isApprovedAndReady(event: MaintenanceEvent): boolean {
  return event.status === MaintenanceEventStatus.Planned && !!event.approved_by
}

/**
 * Determine if an event is currently active (in progress)
 */
export function isEventActive(event: MaintenanceEvent): boolean {
  return event.status === MaintenanceEventStatus.InProgress
}

/**
 * Determine if an event is in a terminal state (cannot be modified)
 * Updated: Completed events are now modifiable for corrections
 */
export function isEventTerminal(event: MaintenanceEvent): boolean {
  // No events are truly terminal - all can be modified if needed
  return false
}

/**
 * Check if an event requires admin approval
 */
export function requiresAdminApproval(event: MaintenanceEvent): boolean {
  return event.status === MaintenanceEventStatus.Planned && !event.approved_by
}

/**
 * Get plan mode restrictions for inspections
 */
export function getPlanModeRestrictions(event: MaintenanceEvent): PlanModeRestrictions {
  const inPlanMode = isInPlanMode(event)
  
  if (inPlanMode) {
    return {
      canOnlyPlanInspections: true,
      cannotStartInspections: true,
      cannotCompleteInspections: true,
      canOnlyViewExistingInspections: false,
      message: 'Event is in planning phase. You can plan inspections but cannot start them until approved.'
    }
  }
  
  return {
    canOnlyPlanInspections: false,
    cannotStartInspections: false,
    cannotCompleteInspections: false,
    canOnlyViewExistingInspections: false,
    message: ''
  }
}

/**
 * Check if event category allows sub-events
 */
export function canEventHaveSubEvents(event: MaintenanceEvent): boolean {
  // Only Complex events can have sub-events
  return (event.event_category || MaintenanceEventCategory.Simple) === MaintenanceEventCategory.Complex
}

/**
 * Check if event should use planned vs direct inspection workflow
 */
export function shouldUsePlannedInspectionWorkflow(event: MaintenanceEvent): boolean {
  // Complex events should use planned workflow, Simple events can use direct
  return (event.event_category || MaintenanceEventCategory.Simple) === MaintenanceEventCategory.Complex
}
/**
 * Check if inspection actions are allowed based on event state and category
 */
export function canPerformInspectionAction(
  event: MaintenanceEvent, 
  action: 'create' | 'start' | 'complete' | 'edit' | 'delete' | 'plan' | 'assign_team' | 'daily_report' | 'final_report'
): { allowed: boolean; reason?: string } {
  const inPlanMode = isInPlanMode(event)
  const isActive = isEventActive(event)
  const isTerminal = isEventTerminal(event)
  const isComplexEvent = (event.event_category || MaintenanceEventCategory.Simple) === MaintenanceEventCategory.Complex
  const isSimpleEvent = (event.event_category || MaintenanceEventCategory.Simple) === MaintenanceEventCategory.Simple
  
  switch (action) {
    case 'plan':
      // Complex events should use planning workflow, Simple events can but not required
      return { 
        allowed: !isTerminal,
        reason: isTerminal ? 'Cannot plan inspections for completed events' : undefined
      }
      
    case 'create':
      // Simple events can create direct inspections, Complex events should use planning first
      if (inPlanMode && isComplexEvent) {
        return {
          allowed: false,
          reason: 'Complex events in plan mode should use "Plan Inspection" workflow instead of direct creation.'
        }
      }
      if (inPlanMode && isSimpleEvent) {
        return {
          allowed: false,
          reason: 'Cannot create direct inspections in plan mode. Event must be approved first.'
        }
      }
      return {
        allowed: !isTerminal,
        reason: isTerminal ? 'Cannot create inspections for completed events' : undefined
      }
      
    case 'start':
      // Can only start inspections if event is approved and active
      if (inPlanMode) {
        return {
          allowed: false,
          reason: 'Cannot start inspections in plan mode. Event must be approved first.'
        }
      }
      return {
        allowed: isActive,
        reason: !isActive ? 'Event must be in progress to start inspections' : undefined
      }
      
    case 'complete':
      // Can only complete inspections if event is active
      if (inPlanMode) {
        return {
          allowed: false,
          reason: 'Cannot complete inspections in plan mode.'
        }
      }
      return {
        allowed: isActive,
        reason: !isActive ? 'Event must be in progress to complete inspections' : undefined
      }
      
    case 'assign_team':
      // Can assign team members if event is not terminal
      return {
        allowed: !isTerminal,
        reason: isTerminal ? 'Cannot assign team for completed events' : undefined
      }
      
    case 'daily_report':
      // Can create daily reports if inspections are active
      return {
        allowed: isActive,
        reason: !isActive ? 'Event must be in progress to create daily reports' : undefined
      }
      
    case 'final_report':
      // Can create final reports if inspections are completed or event is completed
      return {
        allowed: isActive || event.status === MaintenanceEventStatus.Completed,
        reason: (!isActive && event.status !== MaintenanceEventStatus.Completed) ? 
          'Event must be in progress or completed to generate final reports' : undefined
      }
      
    case 'edit':
      // Can edit inspections if event is not terminal
      return {
        allowed: !isTerminal,
        reason: isTerminal ? 'Cannot edit inspections for completed events' : undefined
      }
      
    case 'delete':
      // Can delete inspections if event is in plan mode or not terminal
      return {
        allowed: inPlanMode || !isTerminal,
        reason: !inPlanMode && isTerminal ? 'Cannot delete inspections for completed events' : undefined
      }
      
    default:
      return { allowed: false, reason: 'Unknown action' }
  }
}

/**
 * Get comprehensive workflow state for an event based on user role
 */
export function getEventWorkflowState(
  event: MaintenanceEvent,
  isAdmin: boolean = false,
  isOwner: boolean = false
): WorkflowState {
  const inPlanMode = isInPlanMode(event)
  const isApproved = !!event.approved_by
  const isActive = isEventActive(event)
  const isTerminal = isEventTerminal(event)
  const needsApproval = requiresAdminApproval(event)
  const planModeRestrictions = getPlanModeRestrictions(event)
  const isCompleted = event.status === MaintenanceEventStatus.Completed
  const isCancelled = event.status === MaintenanceEventStatus.Cancelled

  return {
    // Edit permissions - more flexible editing capabilities
    canEdit: (
      (event.status === MaintenanceEventStatus.Planned && (isOwner || isAdmin)) ||
      (event.status === MaintenanceEventStatus.InProgress && (isOwner || isAdmin)) || // Allow editing in-progress events
      (isCompleted && isAdmin) || // Admins can edit completed events for corrections
      (isCancelled && (isOwner || isAdmin)) // Can edit cancelled events to reactivate
    ),
    
    // Delete permissions - can delete non-active events (admins can delete completed)
    canDelete: (
      (event.status === MaintenanceEventStatus.Planned && (isOwner || isAdmin)) ||
      (isCompleted && isAdmin) || // Admins can delete completed events if needed
      (isCancelled && (isOwner || isAdmin)) // Note: typically shouldn't delete in-progress events
    ),
    
    // Cancel permissions - can cancel most events except already cancelled
    canCancel: !isCancelled && (isOwner || isAdmin),
    
    // Start permissions - can start approved planned events
    canStart: event.status === MaintenanceEventStatus.Planned && isApproved,
    
    // Complete permissions - can complete in-progress events
    canComplete: event.status === MaintenanceEventStatus.InProgress,
    
    // Approval permissions - admins can approve unapproved planned events
    canApprove: needsApproval && isAdmin,
    
    // Sub-event management - ONLY for Complex events and not in completed state
    canAddSubEvents: (
      canEventHaveSubEvents(event) && (
        event.status === MaintenanceEventStatus.Planned ||
        event.status === MaintenanceEventStatus.InProgress
        // Removed: completed state should not allow sub-event creation
      )
    ),
    
    // Inspection planning - different logic for Simple vs Complex events
    canPlanInspections: (
      [MaintenanceEventStatus.Planned, MaintenanceEventStatus.InProgress].includes(event.status) ||
      (isCompleted && isAdmin) // Admins can add retrospective inspections
    ),
    
    // Enhanced inspection controls based on event category and state
    canCreatePlannedInspections: (
      // All Planned status events can plan inspections (both approved and unapproved)
      event.status === MaintenanceEventStatus.Planned ||
      // In InProgress: Both planned and unplanned allowed
      event.status === MaintenanceEventStatus.InProgress ||
      // Admins can add retrospective inspections to completed events
      (isCompleted && isAdmin)
    ),
    
    canCreateUnplannedInspections: (
      // Only in InProgress state: unplanned inspections are for active events
      event.status === MaintenanceEventStatus.InProgress
    ),
    
    canCreateDirectInspections: (
      // Simple events can create direct inspections when approved/active
      // Complex events should use planning workflow
      ((event.event_category || MaintenanceEventCategory.Simple) === MaintenanceEventCategory.Simple && 
       ((event.status === MaintenanceEventStatus.Planned && isApproved) || isActive)) ||
      // For Complex events, allow direct creation only if already in progress
      ((event.event_category || MaintenanceEventCategory.Simple) === MaintenanceEventCategory.Complex && isActive)
    ),
    
    // Start inspections - can start for in-progress events
    canStartInspections: isActive,
    
    // Edit inspections - can edit for most states
    canEditInspections: !isCancelled,
    
    canAssignInspectionTeam: !isCancelled,
    
    canCreateDailyReports: isActive,
    
    canGenerateFinalReports: (
      isActive || isCompleted
    ),
    
    // State reversal capabilities
    canReopen: isCompleted && isAdmin, // Admins can reopen completed events
    canRevert: isActive && (isOwner || isAdmin), // Can revert in-progress to planned
    canReactivate: isCancelled && (isOwner || isAdmin), // Can reactivate cancelled events
    
    // State flags
    requiresApproval: needsApproval,
    isInPlanMode: inPlanMode,
    isActive,
    isTerminal,
    planModeRestrictions
  }
}

/**
 * Validate if a user can perform a specific action on an event
 */
export function canPerformAction(
  event: MaintenanceEvent,
  action: keyof WorkflowState,
  isAdmin: boolean = false,
  isOwner: boolean = false
): boolean {
  const workflowState = getEventWorkflowState(event, isAdmin, isOwner)
  return workflowState[action] as boolean
}

/**
 * Get user-friendly status description
 */
export function getStatusDescription(status: MaintenanceEventStatus, approved_by?: string): string {
  switch (status) {
    case MaintenanceEventStatus.Planned:
      return approved_by ? 'Approved and ready to start' : 'Planning phase - awaiting approval'
    case MaintenanceEventStatus.InProgress:
      return 'Currently in progress'
    case MaintenanceEventStatus.Completed:
      return 'Successfully completed'
    case MaintenanceEventStatus.Cancelled:
      return 'Cancelled'
    case MaintenanceEventStatus.Postponed:
      return 'Postponed'
    default:
      return 'Unknown status'
  }
}

/**
 * Get status badge configuration
 */
export function getStatusBadgeConfig(status: MaintenanceEventStatus, approved_by?: string) {
  const baseConfig = {
    [MaintenanceEventStatus.Planned]: {
      variant: 'secondary' as const,
      className: approved_by ? 'text-green-600 bg-green-50 border-green-200' : 'text-blue-600 bg-blue-50 border-blue-200'
    },
    [MaintenanceEventStatus.InProgress]: {
      variant: 'default' as const,
      className: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    },
    [MaintenanceEventStatus.Completed]: {
      variant: 'default' as const,
      className: 'text-green-600 bg-green-50 border-green-200'
    },
    [MaintenanceEventStatus.Cancelled]: {
      variant: 'destructive' as const,
      className: 'text-red-600 bg-red-50 border-red-200'
    },
    [MaintenanceEventStatus.Postponed]: {
      variant: 'outline' as const,
      className: 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return baseConfig[status] ?? {
    variant: 'secondary' as const,
    className: 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

/**
 * Validate state transition with detailed error messages
 */
export function validateStateTransition(
  event: MaintenanceEvent,
  targetStatus: MaintenanceEventStatus,
  userRole: { isAdmin: boolean; isOwner: boolean }
): { isValid: boolean; error?: string } {
  // Check if transition is valid in state machine
  if (!isValidStateTransition(event.status, targetStatus)) {
    return {
      isValid: false,
      error: `Cannot transition from ${event.status} to ${targetStatus}`
    }
  }

  // Additional validation based on approval requirements
  if (targetStatus === MaintenanceEventStatus.InProgress && !event.approved_by) {
    return {
      isValid: false,
      error: 'Event must be approved by an admin before it can be started'
    }
  }

  // Check user permissions
  const workflowState = getEventWorkflowState(event, userRole.isAdmin, userRole.isOwner)
  
  if (targetStatus === MaintenanceEventStatus.InProgress && !workflowState.canStart) {
    return {
      isValid: false,
      error: 'You do not have permission to start this event'
    }
  }

  if (targetStatus === MaintenanceEventStatus.Completed && !workflowState.canComplete) {
    return {
      isValid: false,
      error: 'You do not have permission to complete this event'
    }
  }

  if (targetStatus === MaintenanceEventStatus.Cancelled && !workflowState.canCancel) {
    return {
      isValid: false,
      error: 'You do not have permission to cancel this event'
    }
  }

  return { isValid: true }
}

/**
 * Get next recommended action for an event
 */
export function getNextRecommendedAction(
  event: MaintenanceEvent,
  isAdmin: boolean = false
): { action: string; description: string } | null {
  const workflowState = getEventWorkflowState(event, isAdmin)

  if (workflowState.requiresApproval && isAdmin) {
    return {
      action: 'approve',
      description: 'Approve this event to allow it to be started'
    }
  }

  if (workflowState.canStart) {
    return {
      action: 'start',
      description: 'Start this approved event'
    }
  }

  if (workflowState.canComplete) {
    return {
      action: 'complete',
      description: 'Mark this event as completed'
    }
  }

  if (workflowState.isInPlanMode) {
    return {
      action: 'plan',
      description: 'Continue planning by adding sub-events and inspections'
    }
  }

  return null
}

/**
 * Get workflow recommendations based on event category and state
 */
export function getWorkflowRecommendations(event: MaintenanceEvent): {
  preferredInspectionWorkflow: 'planned' | 'direct' | 'mixed'
  allowsSubEvents: boolean
  recommendedActions: string[]
} {
  const isComplex = (event.event_category || MaintenanceEventCategory.Simple) === MaintenanceEventCategory.Complex
  const isSimple = (event.event_category || MaintenanceEventCategory.Simple) === MaintenanceEventCategory.Simple
  const inPlanMode = isInPlanMode(event)
  const isActive = isEventActive(event)
  const isApproved = !!event.approved_by
  
  const recommendations = {
    preferredInspectionWorkflow: 'direct' as 'planned' | 'direct' | 'mixed',
    allowsSubEvents: false,
    recommendedActions: [] as string[]
  }
  
  if (isComplex) {
    recommendations.preferredInspectionWorkflow = inPlanMode ? 'planned' : 'mixed'
    recommendations.allowsSubEvents = true
    
    if (inPlanMode) {
      recommendations.recommendedActions.push('Plan sub-events for better organization')
      recommendations.recommendedActions.push('Use planned inspection workflow')
    } else if (isActive) {
      recommendations.recommendedActions.push('Use planned inspections for scheduled work')
      recommendations.recommendedActions.push('Use direct inspections for urgent needs')
    }
  }
  
  if (isSimple) {
    recommendations.preferredInspectionWorkflow = 'direct'
    recommendations.allowsSubEvents = false
    
    if (isApproved || isActive) {
      recommendations.recommendedActions.push('Create direct inspections as needed')
    }
  }
  
  return recommendations
}
export function formatEventWithState(event: MaintenanceEvent, isAdmin: boolean = false) {
  const workflowState = getEventWorkflowState(event, isAdmin)
  const statusConfig = getStatusBadgeConfig(event.status, event.approved_by)
  const statusDescription = getStatusDescription(event.status, event.approved_by)
  const nextAction = getNextRecommendedAction(event, isAdmin)

  return {
    ...event,
    workflowState,
    statusConfig,
    statusDescription,
    nextAction
  }
}
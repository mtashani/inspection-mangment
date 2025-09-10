'use client'

import React from 'react'
import { toast } from 'sonner'
import { MaintenanceEvent, MaintenanceEventStatus } from '@/types/maintenance-events'
import { validateStateTransition, isValidStateTransition } from '@/lib/utils/maintenance-event-state'
import { useAuth } from '@/contexts/auth-context'

/**
 * State transition validation middleware
 * Provides hooks and utilities to validate state transitions before they happen
 */

interface ValidationResult {
  isValid: boolean
  error?: string
  canProceed: boolean
}

interface UseStateTransitionValidationProps {
  event: MaintenanceEvent
  showToast?: boolean
}

export function useStateTransitionValidation({ event, showToast = true }: UseStateTransitionValidationProps) {
  const { user, isAdmin } = useAuth()

  const validateTransition = (targetStatus: MaintenanceEventStatus): ValidationResult => {
    // Check basic state machine validity
    if (!isValidStateTransition(event.status, targetStatus)) {
      const error = `Invalid transition: Cannot change from ${event.status} to ${targetStatus}`
      if (showToast) {
        toast.error(error)
      }
      return { isValid: false, error, canProceed: false }
    }

    // Check user permissions and business rules
    const validation = validateStateTransition(event, targetStatus, {
      isAdmin: isAdmin(),
      isOwner: user?.username === event.created_by
    })

    if (!validation.isValid) {
      if (showToast) {
        toast.error(validation.error || 'State transition not allowed')
      }
      return { 
        isValid: false, 
        error: validation.error, 
        canProceed: false 
      }
    }

    return { isValid: true, canProceed: true }
  }

  const validateEventStart = (): ValidationResult => {
    return validateTransition(MaintenanceEventStatus.InProgress)
  }

  const validateEventComplete = (): ValidationResult => {
    return validateTransition(MaintenanceEventStatus.Completed)
  }

  const validateEventCancel = (): ValidationResult => {
    return validateTransition(MaintenanceEventStatus.Cancelled)
  }

  const validateEventApproval = (): ValidationResult => {
    if (event.approved_by) {
      const error = 'Event is already approved'
      if (showToast) {
        toast.error(error)
      }
      return { isValid: false, error, canProceed: false }
    }

    if (!isAdmin()) {
      const error = 'Only administrators can approve events'
      if (showToast) {
        toast.error(error)
      }
      return { isValid: false, error, canProceed: false }
    }

    if (event.status !== MaintenanceEventStatus.Planned) {
      const error = 'Only planned events can be approved'
      if (showToast) {
        toast.error(error)
      }
      return { isValid: false, error, canProceed: false }
    }

    return { isValid: true, canProceed: true }
  }

  const validateEventEdit = (): ValidationResult => {
    if (event.status !== MaintenanceEventStatus.Planned) {
      const error = 'Only planned events can be edited'
      if (showToast) {
        toast.error(error)
      }
      return { isValid: false, error, canProceed: false }
    }

    const isOwner = user?.username === event.created_by
    if (!isOwner && !isAdmin()) {
      const error = 'You can only edit events you created or if you are an administrator'
      if (showToast) {
        toast.error(error)
      }
      return { isValid: false, error, canProceed: false }
    }

    return { isValid: true, canProceed: true }
  }

  const validateEventDelete = (): ValidationResult => {
    if (event.status !== MaintenanceEventStatus.Planned || event.approved_by) {
      const error = 'Only unapproved planned events can be deleted'
      if (showToast) {
        toast.error(error)
      }
      return { isValid: false, error, canProceed: false }
    }

    const isOwner = user?.username === event.created_by
    if (!isOwner && !isAdmin()) {
      const error = 'You can only delete events you created or if you are an administrator'
      if (showToast) {
        toast.error(error)
      }
      return { isValid: false, error, canProceed: false }
    }

    return { isValid: true, canProceed: true }
  }

  return {
    validateTransition,
    validateEventStart,
    validateEventComplete,
    validateEventCancel,
    validateEventApproval,
    validateEventEdit,
    validateEventDelete,
    // Helper functions
    canStart: () => validateEventStart().canProceed,
    canComplete: () => validateEventComplete().canProceed,
    canCancel: () => validateEventCancel().canProceed,
    canApprove: () => validateEventApproval().canProceed,
    canEdit: () => validateEventEdit().canProceed,
    canDelete: () => validateEventDelete().canProceed,
  }
}

/**
 * Higher-order component that wraps actions with validation
 */
interface ValidationWrapperProps {
  event: MaintenanceEvent
  children: React.ReactNode
  action?: 'start' | 'complete' | 'cancel' | 'approve' | 'edit' | 'delete'
  onValidationFailed?: (error: string) => void
}

export function ValidationWrapper({ 
  event, 
  children, 
  action, 
  onValidationFailed 
}: ValidationWrapperProps) {
  const validation = useStateTransitionValidation({ event, showToast: false })

  const handleClick = (originalHandler: () => void) => {
    let validationResult: ValidationResult

    switch (action) {
      case 'start':
        validationResult = validation.validateEventStart()
        break
      case 'complete':
        validationResult = validation.validateEventComplete()
        break
      case 'cancel':
        validationResult = validation.validateEventCancel()
        break
      case 'approve':
        validationResult = validation.validateEventApproval()
        break
      case 'edit':
        validationResult = validation.validateEventEdit()
        break
      case 'delete':
        validationResult = validation.validateEventDelete()
        break
      default:
        validationResult = { isValid: true, canProceed: true }
    }

    if (validationResult.canProceed) {
      originalHandler()
    } else {
      toast.error(validationResult.error || 'Action not allowed')
      onValidationFailed?.(validationResult.error || 'Action not allowed')
    }
  }

  // Clone children and wrap their onClick handlers with validation
  const wrappedChildren = React.cloneElement(children as React.ReactElement, {
    onClick: () => handleClick((children as any).props.onClick || (() => {}))
  })

  return wrappedChildren
}

/**
 * State transition validation errors
 */
export class StateTransitionError extends Error {
  constructor(
    message: string,
    public fromStatus: MaintenanceEventStatus,
    public toStatus: MaintenanceEventStatus,
    public eventId: number
  ) {
    super(message)
    this.name = 'StateTransitionError'
  }
}

/**
 * Utility function to get all possible next states for an event
 */
export function getAvailableTransitions(event: MaintenanceEvent): {
  status: MaintenanceEventStatus
  label: string
  description: string
  requiresAdmin: boolean
}[] {
  const transitions = []

  if (event.status === MaintenanceEventStatus.Planned) {
    if (!event.approved_by) {
      transitions.push({
        status: MaintenanceEventStatus.InProgress,
        label: 'Start Event',
        description: 'Requires admin approval first',
        requiresAdmin: true
      })
    } else {
      transitions.push({
        status: MaintenanceEventStatus.InProgress,
        label: 'Start Event',
        description: 'Begin the maintenance event',
        requiresAdmin: false
      })
    }
    
    transitions.push({
      status: MaintenanceEventStatus.Cancelled,
      label: 'Cancel Event',
      description: 'Cancel the planned event',
      requiresAdmin: false
    })
    
    transitions.push({
      status: MaintenanceEventStatus.Postponed,
      label: 'Postpone Event',
      description: 'Postpone the event to a later date',
      requiresAdmin: false
    })
  }

  if (event.status === MaintenanceEventStatus.InProgress) {
    transitions.push({
      status: MaintenanceEventStatus.Completed,
      label: 'Complete Event',
      description: 'Mark the event as completed',
      requiresAdmin: false
    })
    
    transitions.push({
      status: MaintenanceEventStatus.Cancelled,
      label: 'Cancel Event',
      description: 'Cancel the in-progress event',
      requiresAdmin: true
    })
  }

  if (event.status === MaintenanceEventStatus.Cancelled) {
    transitions.push({
      status: MaintenanceEventStatus.Planned,
      label: 'Reactivate Event',
      description: 'Reactivate the cancelled event',
      requiresAdmin: true
    })
  }

  return transitions
}
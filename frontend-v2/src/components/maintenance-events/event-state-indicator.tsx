'use client'

import { MaintenanceEvent } from '@/types/maintenance-events'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  getEventWorkflowState, 
  getStatusBadgeConfig, 
  getStatusDescription,
  getNextRecommendedAction 
} from '@/lib/utils/maintenance-event-state'
import { useAuth } from '@/contexts/auth-context'
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Settings, 
  Shield,
  Calendar,
  Users,
  Info
} from 'lucide-react'
import { format } from 'date-fns'

interface EventStateIndicatorProps {
  event: MaintenanceEvent
  className?: string
}

export function EventStateIndicator({ event, className }: EventStateIndicatorProps) {
  const { user, isAdmin } = useAuth()
  const workflowState = getEventWorkflowState(event, isAdmin(), user?.username === event.created_by)
  const statusConfig = getStatusBadgeConfig(event.status, event.approved_by)
  const statusDescription = getStatusDescription(event.status, event.approved_by)
  const nextAction = getNextRecommendedAction(event, isAdmin())

  const getStateIcon = () => {
    if (workflowState.isInPlanMode) {
      return <Settings className="h-4 w-4" />
    }
    if (workflowState.isActive) {
      return <Play className="h-4 w-4" />
    }
    if (workflowState.isTerminal) {
      return <CheckCircle className="h-4 w-4" />
    }
    return <Clock className="h-4 w-4" />
  }

  const getStateColor = () => {
    if (workflowState.isInPlanMode) {
      return 'border-blue-200 bg-blue-50'
    }
    if (workflowState.isActive) {
      return 'border-yellow-200 bg-yellow-50'
    }
    if (workflowState.isTerminal) {
      return 'border-green-200 bg-green-50'
    }
    return 'border-gray-200 bg-gray-50'
  }

  return (
    <Card className={`${getStateColor()} ${className}`}>
      <CardContent className="p-4 space-y-3">
        {/* Main Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStateIcon()}
            <span className="font-medium text-sm">Event Status</span>
          </div>
          <Badge 
            variant={statusConfig.variant}
            className={statusConfig.className}
          >
            {event.status}
          </Badge>
        </div>

        {/* Status Description */}
        <p className="text-xs text-muted-foreground">
          {statusDescription}
        </p>

        {/* Plan Mode Specific Information */}
        {workflowState.isInPlanMode && (
          <Alert className="border-blue-200 bg-blue-50/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Plan Mode:</strong> {workflowState.planModeRestrictions.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Approval Information */}
        {event.status === 'Planned' && (
          <div className="space-y-2">
            {event.approved_by ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-3 w-3" />
                <span className="text-xs">
                  Approved by {event.approved_by}
                  {event.approval_date && (
                    <span className="text-muted-foreground ml-1">
                      on {format(new Date(event.approval_date), 'MMM dd')}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="h-3 w-3" />
                <span className="text-xs">Waiting for admin approval</span>
                {isAdmin() && (
                  <Badge variant="outline" className="text-xs">
                    Action Required
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Capabilities */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Available Actions:</div>
          <div className="flex flex-wrap gap-1">
            {workflowState.canEdit && (
              <Badge variant="outline" className="text-xs">
                ✏️ Edit
              </Badge>
            )}
            {workflowState.canAddSubEvents && (
              <Badge variant="outline" className="text-xs">
                ➕ Add Sub-events
              </Badge>
            )}
            {workflowState.canPlanInspections && (
              <Badge variant="outline" className="text-xs">
                📋 Plan Inspections
              </Badge>
            )}
            {workflowState.canStartInspections && (
              <Badge variant="outline" className="text-xs">
                🚀 Start Inspections
              </Badge>
            )}
            {workflowState.canStart && (
              <Badge variant="outline" className="text-xs">
                ▶️ Start Event
              </Badge>
            )}
            {workflowState.canComplete && (
              <Badge variant="outline" className="text-xs">
                ✅ Complete Event
              </Badge>
            )}
            {workflowState.canApprove && (
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                🛡️ Approve
              </Badge>
            )}
          </div>
        </div>

        {/* Next Recommended Action */}
        {nextAction && (
          <Alert className="border-primary/20 bg-primary/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Next Step:</strong> {nextAction.description}
            </AlertDescription>
          </Alert>
        )}

        {/* Restrictions */}
        {workflowState.planModeRestrictions.cannotStartInspections && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Restricted:</strong> Cannot start inspections until event is approved and active.
            </AlertDescription>
          </Alert>
        )}

        {/* Timeline Information */}
        <div className="pt-2 border-t border-muted">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(event.planned_start_date), 'MMM dd')} - {format(new Date(event.planned_end_date), 'MMM dd, yyyy')}
            </span>
          </div>
          
          {event.created_by && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3" />
              <span>Created by {event.created_by}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
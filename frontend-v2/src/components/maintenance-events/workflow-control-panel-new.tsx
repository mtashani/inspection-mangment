'use client'

import React, { useState } from 'react'
import {
  Calendar,
  Play,
  CheckCircle,
  XCircle,
  Pause,
  Settings,
  AlertTriangle,
  Plus,
  FileText
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { MaintenanceEvent, MaintenanceEventStatus, WorkflowPermissions } from '@/types/maintenance-events'

interface PermissionItemProps {
  label: string
  allowed: boolean
  reason?: string
}

const PermissionItem: React.FC<PermissionItemProps> = ({ label, allowed, reason }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        {reason && (
          <p className="text-xs text-muted-foreground">{reason}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {allowed ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <Badge variant={allowed ? "default" : "secondary"} className="text-xs">
          {allowed ? "Allowed" : "Blocked"}
        </Badge>
      </div>
    </div>
  )
}

interface WorkflowControlPanelProps {
  event: MaintenanceEvent
  permissions?: WorkflowPermissions
  onStatusChange?: (status: MaintenanceEventStatus) => Promise<void>
  onCreateSubEvent?: () => void
  onCreateInspectionPlan?: () => void
  onAddUnplannedInspection?: () => void
  className?: string
}

export function WorkflowControlPanel({
  event,
  permissions,
  onStatusChange,
  onCreateSubEvent,
  onCreateInspectionPlan,
  onAddUnplannedInspection,
  className
}: WorkflowControlPanelProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!permissions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleStatusTransition = async (newStatus: MaintenanceEventStatus) => {
    setIsLoading(true)
    try {
      await onStatusChange?.(newStatus)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Planned': return 'secondary'
      case 'InProgress': return 'default'
      case 'Completed': return 'default'
      case 'Cancelled': return 'destructive'
      case 'Postponed': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Planned': return <Calendar className="h-4 w-4" />
      case 'InProgress': return <Play className="h-4 w-4" />
      case 'Completed': return <CheckCircle className="h-4 w-4" />
      case 'Cancelled': return <XCircle className="h-4 w-4" />
      case 'Postponed': return <Pause className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Workflow Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Type & Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Event Category</p>
            <Badge variant={permissions.is_complex_event ? "default" : "secondary"} className="text-xs">
              {permissions.is_complex_event ? "Complex Event" : "Simple Event"}
            </Badge>
            {permissions.is_simple_event && (
              <p className="text-xs text-muted-foreground">Sub-events not allowed</p>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Current Status</p>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(permissions.current_status)} className="text-xs">
                {getStatusIcon(permissions.current_status)}
                {permissions.current_status}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Event Type</p>
            <Badge variant="outline" className="text-xs">
              {event.event_type}
            </Badge>
          </div>
        </div>

        {/* Workflow Rules Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Workflow Rules:</strong>
            {permissions.is_simple_event ? (
              " Simple events cannot have sub-events. "
            ) : (
              " Complex events support sub-events and advanced planning. "
            )}
            Current status: <strong>{permissions.current_status}</strong> determines available actions.
          </AlertDescription>
        </Alert>

        {/* Available Actions */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Available Actions</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Start Event */}
            {permissions.current_status === 'Planned' && permissions.can_start_event && (
              <Button
                size="sm"
                onClick={() => handleStatusTransition(MaintenanceEventStatus.InProgress)}
                disabled={isLoading}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Event
              </Button>
            )}

            {/* Complete Event */}
            {permissions.current_status === 'InProgress' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleStatusTransition(MaintenanceEventStatus.Completed)}
                disabled={isLoading}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Event
              </Button>
            )}

            {/* Create Sub-Event */}
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateSubEvent}
              disabled={!permissions.can_create_sub_event || isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Sub-Event
            </Button>

            {/* Create Inspection Plan */}
            <Button
              size="sm"
              variant="outline"
              onClick={onCreateInspectionPlan}
              disabled={!permissions.can_create_inspection_plan || isLoading}
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Plan Inspection
            </Button>

            {/* Add Unplanned Inspection */}
            <Button
              size="sm"
              variant="outline"
              onClick={onAddUnplannedInspection}
              disabled={!permissions.can_add_unplanned_inspection || isLoading}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Add Unplanned
            </Button>
          </div>
        </div>

        {/* Permission Status */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Current Permissions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PermissionItem
              label="Create Sub-Events"
              allowed={permissions.can_create_sub_event}
              reason={!permissions.can_create_sub_event ? 
                (permissions.is_simple_event ? "Simple events don't support sub-events" : 
                 permissions.current_status !== 'Planned' ? "Only available in Planning state" : 
                 "Not allowed in current state") : undefined
              }
            />
            <PermissionItem
              label="Create Inspection Plans"
              allowed={permissions.can_create_inspection_plan}
              reason={!permissions.can_create_inspection_plan ? 
                "Only available in Planning or InProgress state" : undefined
              }
            />
            <PermissionItem
              label="Start Event"
              allowed={permissions.can_start_event}
              reason={!permissions.can_start_event ? 
                "Event must be in Planned state" : undefined
              }
            />
            <PermissionItem
              label="Add Unplanned Inspections"
              allowed={permissions.can_add_unplanned_inspection}
              reason={!permissions.can_add_unplanned_inspection ? 
                "Only available when event is InProgress" : undefined
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
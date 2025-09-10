'use client'

import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid'

import {
  EnhancedMaintenanceEvent,
  MaintenanceEventCategory
} from '@/types/enhanced-maintenance'

import { MaintenanceEventStatus, MaintenanceEventType, MaintenanceEventStatusEnum } from '@/types/maintenance'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import EventStatusIndicator from './EventStatusIndicator'
import SubEventsList from './SubEventsList'
import InspectionsList from './InspectionsList'
import EventStatistics from './EventStatistics'

interface MaintenanceEventGroupProps {
  event: EnhancedMaintenanceEvent
  onEventUpdate?: (event: EnhancedMaintenanceEvent) => void
  onInspectionCreate?: (eventId: string, subEventId?: string) => void
  onInspectionUpdate?: (inspectionId: string, data: Partial<EnhancedInspection>) => void
  onStatusChange?: (eventId: string, status: MaintenanceEventStatus) => void
  expanded?: boolean
  onToggleExpanded?: (eventId: string) => void
  showActions?: boolean
  showStatistics?: boolean
}

const MaintenanceEventGroup: React.FC<MaintenanceEventGroupProps> = ({
  event,
  onEventUpdate,
  onInspectionCreate,
  onInspectionUpdate,
  onStatusChange,
  expanded = false,
  onToggleExpanded,
  showActions = true,
  showStatistics = true
}) => {
  const [showFullStatistics, setShowFullStatistics] = useState(false)

  const handleToggleExpanded = () => {
    if (onToggleExpanded) {
      onToggleExpanded(event.id)
    }
  }

  const handleStatusChange = (newStatus: MaintenanceEventStatus) => {
    if (onStatusChange) {
      onStatusChange(event.id, newStatus)
    }
  }

  const handleCreateInspection = (subEventId?: string) => {
    if (onInspectionCreate) {
      onInspectionCreate(event.id, subEventId)
    }
  }

  const getEventTypeColor = (eventType: MaintenanceEventType): string => {
    switch (eventType) {
      case 'OVERHAUL':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'REPAIR':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'PREVENTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CORRECTIVE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'INSPECTION':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: MaintenanceEventCategory) => {
    return category === MaintenanceEventCategory.Complex ? (
      <UserGroupIcon className="h-4 w-4" />
    ) : (
      <CheckCircleIcon className="h-4 w-4" />
    )
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDaysRemaining = (): { days: number; isOverdue: boolean } => {
    const now = new Date()
    const endDate = new Date(event.actualEndDate || event.plannedEndDate)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return {
      days: Math.abs(diffDays),
      isOverdue: diffDays < 0 && event.status !== MaintenanceEventStatusEnum.COMPLETED
    }
  }

  const { days, isOverdue } = calculateDaysRemaining()

  const canStart = event.status === MaintenanceEventStatusEnum.PLANNED
  const canComplete = event.status === MaintenanceEventStatusEnum.IN_PROGRESS
  const canEdit = event.status === MaintenanceEventStatusEnum.PLANNED

  return (
    <Card className={cn(
      "mb-4 transition-all duration-200",
      expanded ? "ring-2 ring-blue-200" : "",
      isOverdue ? "border-red-300 bg-red-50" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpanded}
              className="p-1 h-8 w-8"
            >
              {expanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center space-x-2">
              {getCategoryIcon(event.category)}
              <h3 className="text-lg font-semibold text-gray-900">
                {event.eventNumber}
              </h3>
              <Badge className={cn("text-xs", getEventTypeColor(event.eventType))}>
                {event.eventType}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <EventStatusIndicator
              status={event.status}
              completionPercentage={event.completionPercentage}
              canChangeStatus={showActions && canEdit}
              onStatusChange={handleStatusChange}
              size="md"
            />

            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                {days} days overdue
              </Badge>
            )}

            {!isOverdue && event.status !== MaintenanceEventStatusEnum.COMPLETED && (
              <Badge variant="outline" className="text-xs">
                <ClockIcon className="h-3 w-3 mr-1" />
                {days} days remaining
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-2">
          <h4 className="text-base font-medium text-gray-800 mb-1">
            {event.title}
          </h4>
          {event.description && (
            <p className="text-sm text-gray-600 mb-2">
              {event.description}
            </p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {formatDate(event.plannedStartDate)} - {formatDate(event.plannedEndDate)}
              </span>
            </div>

            {event.actualStartDate && (
              <div className="flex items-center space-x-1">
                <PlayIcon className="h-4 w-4 text-green-600" />
                <span>Started: {formatDate(event.actualStartDate)}</span>
              </div>
            )}

            {event.actualEndDate && (
              <div className="flex items-center space-x-1">
                <StopIcon className="h-4 w-4 text-red-600" />
                <span>Completed: {formatDate(event.actualEndDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {event.status === MaintenanceEventStatusEnum.IN_PROGRESS && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{event.completionPercentage}%</span>
            </div>
            <Progress value={event.completionPercentage} className="h-2" />
          </div>
        )}

        {/* Quick Statistics */}
        {showStatistics && event.statistics && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">
                {event.statistics.totalPlannedInspections}
              </div>
              <div className="text-xs text-blue-800">Planned</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <div className="text-lg font-semibold text-yellow-600">
                {event.statistics.activeInspections}
              </div>
              <div className="text-xs text-yellow-800">Active</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-600">
                {event.statistics.completedInspections}
              </div>
              <div className="text-xs text-green-800">Completed</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <div className="text-lg font-semibold text-purple-600">
                {event.statistics.firstTimeInspectionsCount}
              </div>
              <div className="text-xs text-purple-800">First Time</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-3 flex items-center space-x-2">
            {canStart && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(MaintenanceEventStatusEnum.IN_PROGRESS)}
                className="bg-green-600 hover:bg-green-700"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                Start Event
              </Button>
            )}

            {canComplete && (
              <Button
                size="sm"
                onClick={() => handleStatusChange(MaintenanceEventStatusEnum.COMPLETED)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Complete Event
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCreateInspection()}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Inspection
            </Button>

            {showStatistics && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFullStatistics(!showFullStatistics)}
              >
                <ChartBarIcon className="h-4 w-4 mr-1" />
                {showFullStatistics ? 'Hide' : 'Show'} Statistics
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />

          {/* Full Statistics */}
          {showFullStatistics && event.statistics && (
            <div className="mb-6">
              <EventStatistics
                statistics={event.statistics}
                requesterBreakdown={event.requesterBreakdown}
                eventId={event.id}
              />
              <Separator className="mt-4 mb-4" />
            </div>
          )}

          {/* Sub-Events or Direct Inspections */}
          {event.category === MaintenanceEventCategory.Complex ? (
            <SubEventsList
              subEvents={event.subEvents}
              plannedInspections={event.plannedInspections}
              activeInspections={event.activeInspections}
              completedInspections={event.completedInspections}
              onInspectionCreate={handleCreateInspection}
              onInspectionUpdate={onInspectionUpdate}
              showActions={showActions}
            />
          ) : (
            <InspectionsList
              plannedInspections={event.plannedInspections}
              activeInspections={event.activeInspections}
              completedInspections={event.completedInspections}
              onInspectionCreate={() => handleCreateInspection()}
              onInspectionUpdate={onInspectionUpdate}
              showActions={showActions}
              title="Direct Inspections"
            />
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default MaintenanceEventGroup

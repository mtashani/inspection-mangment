'use client'

import React, { useState } from 'react'
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline'

import { 
  InspectionPlan, 
  EnhancedInspection,
  InspectionStatus,
  InspectionPriority,
  RefineryDepartment,
  DailyReport
} from '@/types/enhanced-maintenance'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import DailyReportsList from './DailyReportsList'

interface InspectionsListProps {
  plannedInspections: InspectionPlan[]
  activeInspections: EnhancedInspection[]
  completedInspections: EnhancedInspection[]
  onInspectionCreate?: () => void
  onInspectionUpdate?: (inspectionId: string, data: Partial<EnhancedInspection>) => void
  showActions?: boolean
  compact?: boolean
  title?: string
}

interface InspectionPlanCardProps {
  plan: InspectionPlan
  onConvertToInspection?: (planId: string) => void
  onEdit?: (planId: string) => void
  onDelete?: (planId: string) => void
  showActions?: boolean
  compact?: boolean
}

interface InspectionCardProps {
  inspection: EnhancedInspection
  onUpdate?: (inspectionId: string, data: Partial<EnhancedInspection>) => void
  onView?: (inspectionId: string) => void
  onEdit?: (inspectionId: string) => void
  onDelete?: (inspectionId: string) => void
  showActions?: boolean
  compact?: boolean
  expanded?: boolean
  onToggleExpanded?: () => void
}

const InspectionPlanCard: React.FC<InspectionPlanCardProps> = ({
  plan,
  onConvertToInspection,
  onEdit,
  onDelete,
  showActions = true,
  compact = false
}) => {
  const getPriorityColor = (priority: InspectionPriority): string => {
    switch (priority) {
      case InspectionPriority.Critical:
        return 'bg-red-100 text-red-800 border-red-200'
      case InspectionPriority.High:
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case InspectionPriority.Medium:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case InspectionPriority.Low:
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className={cn(
      "border-l-4 border-l-blue-500",
      compact ? "mb-2" : "mb-3"
    )}>
      <CardHeader className={cn("pb-2", compact && "py-2")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-blue-600" />
            <span className={cn(
              "font-medium text-gray-900",
              compact ? "text-sm" : "text-base"
            )}>
              {plan.equipmentTag}
            </span>
            <Badge className={cn(
              compact ? "text-xs" : "text-xs",
              getPriorityColor(plan.priority)
            )}>
              {plan.priority}
            </Badge>
          </div>

          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              Planned
            </Badge>
          </div>
        </div>

        <div className={cn("space-y-1", compact ? "text-xs" : "text-sm")}>
          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center space-x-1">
              <UserIcon className="h-3 w-3" />
              <span>{plan.requester}</span>
            </div>
            
            {plan.plannedStartDate && (
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-3 w-3" />
                <span>
                  {formatDate(plan.plannedStartDate)}
                  {plan.plannedEndDate && ` - ${formatDate(plan.plannedEndDate)}`}
                </span>
              </div>
            )}
          </div>

          {plan.description && !compact && (
            <p className="text-gray-600 text-sm">{plan.description}</p>
          )}
        </div>

        {showActions && (
          <div className="flex items-center space-x-2 mt-2">
            <Button
              size="sm"
              onClick={() => onConvertToInspection?.(plan.id)}
              className="bg-blue-600 hover:bg-blue-700 text-xs h-7"
            >
              Start Inspection
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(plan.id)}
              className="text-xs h-7"
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(plan.id)}
              className="text-xs h-7 text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardHeader>
    </Card>
  )
}

const InspectionCard: React.FC<InspectionCardProps> = ({
  inspection,
  onUpdate,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
  expanded = false,
  onToggleExpanded
}) => {
  const getStatusColor = (status: InspectionStatus): string => {
    switch (status) {
      case InspectionStatus.Planned:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case InspectionStatus.InProgress:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case InspectionStatus.Completed:
        return 'bg-green-100 text-green-800 border-green-200'
      case InspectionStatus.Cancelled:
        return 'bg-red-100 text-red-800 border-red-200'
      case InspectionStatus.OnHold:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDepartmentColor = (department: RefineryDepartment): string => {
    switch (department) {
      case RefineryDepartment.Operations:
        return 'bg-blue-100 text-blue-800'
      case RefineryDepartment.Maintenance:
        return 'bg-orange-100 text-orange-800'
      case RefineryDepartment.Engineering:
        return 'bg-purple-100 text-purple-800'
      case RefineryDepartment.Safety:
        return 'bg-red-100 text-red-800'
      case RefineryDepartment.Quality:
        return 'bg-green-100 text-green-800'
      case RefineryDepartment.Inspection:
        return 'bg-teal-100 text-teal-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    })
  }

  const getBorderColor = (status: InspectionStatus): string => {
    switch (status) {
      case InspectionStatus.InProgress:
        return 'border-l-yellow-500'
      case InspectionStatus.Completed:
        return 'border-l-green-500'
      case InspectionStatus.Cancelled:
        return 'border-l-red-500'
      case InspectionStatus.OnHold:
        return 'border-l-gray-500'
      default:
        return 'border-l-blue-500'
    }
  }

  const canToggleExpanded = inspection.dailyReports.length > 0

  return (
    <Card className={cn(
      "border-l-4",
      getBorderColor(inspection.status),
      compact ? "mb-2" : "mb-3",
      expanded ? "ring-1 ring-blue-200" : ""
    )}>
      <CardHeader className={cn("pb-2", compact && "py-2")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {canToggleExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="p-1 h-6 w-6"
              >
                {expanded ? (
                  <ChevronDownIcon className="h-3 w-3" />
                ) : (
                  <ChevronRightIcon className="h-3 w-3" />
                )}
              </Button>
            )}

            <div className="flex items-center space-x-2">
              <span className={cn(
                "font-medium text-gray-900",
                compact ? "text-sm" : "text-base"
              )}>
                {inspection.equipment?.tag || 'Unknown Equipment'}
              </span>
              
              {inspection.isFirstTimeInspection && (
                <StarIcon className="h-4 w-4 text-yellow-500" title="First Time Inspection" />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Badge className={cn(
              compact ? "text-xs" : "text-xs",
              getStatusColor(inspection.status)
            )}>
              {inspection.status}
            </Badge>
          </div>
        </div>

        <div className={cn("space-y-1", compact ? "text-xs" : "text-sm", canToggleExpanded ? "ml-8" : "")}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">{inspection.inspectionNumber}</span>
            <span className="text-gray-600">{inspection.title}</span>
          </div>

          <div className="flex items-center space-x-4 text-gray-600">
            <div className="flex items-center space-x-1">
              <BuildingOfficeIcon className="h-3 w-3" />
              <Badge className={cn("text-xs", getDepartmentColor(inspection.requestingDepartment))}>
                {inspection.requestingDepartment}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-3 w-3" />
              <span>
                {formatDate(inspection.startDate)}
                {inspection.endDate && ` - ${formatDate(inspection.endDate)}`}
              </span>
            </div>

            {inspection.dailyReports.length > 0 && (
              <div className="flex items-center space-x-1">
                <DocumentTextIcon className="h-3 w-3" />
                <span>{inspection.dailyReports.length} reports</span>
              </div>
            )}
          </div>

          {inspection.requesterDetails && !compact && (
            <div className="flex items-center space-x-1 text-gray-600">
              <UserIcon className="h-3 w-3" />
              <span>{inspection.requesterDetails.name}</span>
            </div>
          )}

          {inspection.description && !compact && (
            <p className="text-gray-600 text-sm">{inspection.description}</p>
          )}
        </div>

        {showActions && (
          <div className={cn("flex items-center space-x-2 mt-2", canToggleExpanded && "ml-8")}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView?.(inspection.id)}
              className="text-xs h-7"
            >
              <EyeIcon className="h-3 w-3 mr-1" />
              View
            </Button>
            
            {inspection.canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit?.(inspection.id)}
                className="text-xs h-7"
              >
                <PencilIcon className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}

            {inspection.canComplete && inspection.status === InspectionStatus.InProgress && (
              <Button
                size="sm"
                onClick={() => onUpdate?.(inspection.id, { status: InspectionStatus.Completed })}
                className="bg-green-600 hover:bg-green-700 text-xs h-7"
              >
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Complete
              </Button>
            )}

            {inspection.canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete?.(inspection.id)}
                className="text-xs h-7 text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      {expanded && inspection.dailyReports.length > 0 && (
        <CardContent className={cn("pt-0", canToggleExpanded && "ml-8")}>
          <Separator className="mb-3" />
          <DailyReportsList
            reports={inspection.dailyReports}
            inspectionId={inspection.id}
            compact={true}
            showActions={showActions}
          />
        </CardContent>
      )}
    </Card>
  )
}

const InspectionsList: React.FC<InspectionsListProps> = ({
  plannedInspections,
  activeInspections,
  completedInspections,
  onInspectionCreate,
  onInspectionUpdate,
  showActions = true,
  compact = false,
  title = "Inspections"
}) => {
  const [expandedInspections, setExpandedInspections] = useState<Set<string>>(new Set())

  const toggleInspectionExpanded = (inspectionId: string) => {
    const newExpanded = new Set(expandedInspections)
    if (newExpanded.has(inspectionId)) {
      newExpanded.delete(inspectionId)
    } else {
      newExpanded.add(inspectionId)
    }
    setExpandedInspections(newExpanded)
  }

  const totalInspections = plannedInspections.length + activeInspections.length + completedInspections.length

  if (totalInspections === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p className="text-sm">No inspections found.</p>
        {showActions && onInspectionCreate && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={onInspectionCreate}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Inspection
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={cn(
          "font-medium text-gray-900",
          compact ? "text-base" : "text-lg"
        )}>
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {totalInspections} total
          </Badge>
          {showActions && onInspectionCreate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onInspectionCreate}
              className="text-xs h-7"
            >
              <PlusIcon className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Planned Inspections */}
      {plannedInspections.length > 0 && (
        <div>
          <h4 className={cn(
            "font-medium text-blue-700 mb-2",
            compact ? "text-sm" : "text-base"
          )}>
            Planned ({plannedInspections.length})
          </h4>
          {plannedInspections.map((plan) => (
            <InspectionPlanCard
              key={plan.id}
              plan={plan}
              showActions={showActions}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Active Inspections */}
      {activeInspections.length > 0 && (
        <div>
          <h4 className={cn(
            "font-medium text-yellow-700 mb-2",
            compact ? "text-sm" : "text-base"
          )}>
            Active ({activeInspections.length})
          </h4>
          {activeInspections.map((inspection) => (
            <InspectionCard
              key={inspection.id}
              inspection={inspection}
              onUpdate={onInspectionUpdate}
              showActions={showActions}
              compact={compact}
              expanded={expandedInspections.has(inspection.id)}
              onToggleExpanded={() => toggleInspectionExpanded(inspection.id)}
            />
          ))}
        </div>
      )}

      {/* Completed Inspections */}
      {completedInspections.length > 0 && (
        <div>
          <h4 className={cn(
            "font-medium text-green-700 mb-2",
            compact ? "text-sm" : "text-base"
          )}>
            Completed ({completedInspections.length})
          </h4>
          {completedInspections.map((inspection) => (
            <InspectionCard
              key={inspection.id}
              inspection={inspection}
              onUpdate={onInspectionUpdate}
              showActions={showActions}
              compact={compact}
              expanded={expandedInspections.has(inspection.id)}
              onToggleExpanded={() => toggleInspectionExpanded(inspection.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default InspectionsList

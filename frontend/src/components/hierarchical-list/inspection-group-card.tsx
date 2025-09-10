'use client'

import React from 'react'
import { 
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ExpandButton, 
  SelectionCheckbox, 
  StatusBadge, 
  ActionButtons,
  HierarchicalItemRenderOptions 
} from './base-hierarchical-list'
import { InspectionGroup, InspectionStatus, RefineryDepartment } from '@/types/enhanced-daily-reports'
import { DailyReport } from '@/types/enhanced-daily-reports'

export interface InspectionGroupCardProps {
  inspection: InspectionGroup
  renderOptions: HierarchicalItemRenderOptions
  enableMultiSelect?: boolean
  showDailyReports?: boolean
  onCreateDailyReport?: (inspectionId: string) => void
  onEditDailyReport?: (reportId: string) => void
  onDeleteDailyReport?: (reportId: string) => void
  onViewReport?: (reportId: string) => void
  className?: string
}

export function InspectionGroupCard({
  inspection,
  renderOptions,
  enableMultiSelect = true,
  showDailyReports = true,
  onCreateDailyReport,
  onEditDailyReport,
  onDeleteDailyReport,
  onViewReport,
  className
}: InspectionGroupCardProps) {
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
  const getStatusVariant = (status: InspectionStatus) => {
    switch (status) {
      case InspectionStatus.PLANNED:
        return 'info'
      case InspectionStatus.IN_PROGRESS:
        return 'warning'
      case InspectionStatus.COMPLETED:
        return 'success'
      case InspectionStatus.CANCELLED:
        return 'error'
      case InspectionStatus.ON_HOLD:
        return 'default'
      default:
        return 'default'
    }
  }

  // Get department color
  const getDepartmentColor = (department: RefineryDepartment) => {
    switch (department) {
      case RefineryDepartment.OPERATIONS:
        return 'bg-blue-100 text-blue-800'
      case RefineryDepartment.MAINTENANCE:
        return 'bg-orange-100 text-orange-800'
      case RefineryDepartment.ENGINEERING:
        return 'bg-purple-100 text-purple-800'
      case RefineryDepartment.SAFETY:
        return 'bg-red-100 text-red-800'
      case RefineryDepartment.QUALITY:
        return 'bg-green-100 text-green-800'
      case RefineryDepartment.INSPECTION:
        return 'bg-teal-100 text-teal-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  // Check if inspection is overdue
  const isOverdue = inspection.endDate && 
    new Date() > new Date(inspection.endDate) && 
    inspection.status !== InspectionStatus.COMPLETED

  // Main action buttons
  const mainActions = [
    {
      key: 'create-report',
      label: 'Create Report',
      icon: PlusIcon,
      variant: 'default' as const,
      disabled: !inspection.canCreateReport,
      hidden: !inspection.canCreateReport
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: PencilIcon,
      variant: 'outline' as const,
      disabled: !inspection.canEdit,
      hidden: !inspection.canEdit
    },
    {
      key: 'complete',
      label: 'Complete',
      icon: CheckCircleIcon,
      variant: 'outline' as const,
      disabled: !inspection.canComplete,
      hidden: !inspection.canComplete || inspection.status === InspectionStatus.COMPLETED
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      variant: 'destructive' as const,
      disabled: !inspection.canDelete,
      hidden: !inspection.canDelete
    }
  ]

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isSelected && 'ring-2 ring-primary ring-offset-2',
      isOverdue && 'border-red-200 bg-red-50/50',
      className
    )}>
      <CardContent className=\"p-4\">
        {/* Main inspection header */}
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

          {/* Inspection icon */}
          <div className=\"flex-shrink-0 mt-1\">
            <ClipboardDocumentCheckIcon className=\"h-5 w-5 text-primary\" />
          </div>

          {/* Main content */}
          <div className=\"flex-1 min-w-0\">
            {/* Title and status row */}
            <div className=\"flex items-start justify-between mb-2\">
              <div className=\"flex-1 min-w-0\">
                <div className=\"flex items-center space-x-2 mb-1\">
                  <h3 className=\"text-sm font-medium text-gray-900 truncate\">
                    {inspection.title}
                  </h3>
                  {isOverdue && (
                    <ExclamationTriangleIcon className=\"h-4 w-4 text-red-500 flex-shrink-0\" />
                  )}
                </div>
                <div className=\"flex items-center space-x-2 text-xs text-muted-foreground\">
                  <span className=\"font-mono\">{inspection.inspectionNumber}</span>
                  <span>•</span>
                  <span>{inspection.equipmentTag}</span>
                  {inspection.equipmentDescription && (
                    <>
                      <span>•</span>
                      <span className=\"truncate\">{inspection.equipmentDescription}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status and actions */}
              <div className=\"flex items-center space-x-2 flex-shrink-0 ml-4\">
                <StatusBadge
                  status={inspection.status}
                  variant={getStatusVariant(inspection.status)}
                  size=\"sm\"
                />
                <ActionButtons
                  actions={mainActions}
                  onAction={onAction}
                  size=\"sm\"
                />
              </div>
            </div>

            {/* Details row */}
            <div className=\"flex items-center justify-between text-xs text-muted-foreground\">
              <div className=\"flex items-center space-x-4\">
                {/* Department */}
                <div className=\"flex items-center space-x-1\">
                  <UserGroupIcon className=\"h-3 w-3\" />
                  <Badge 
                    className={cn('text-xs px-2 py-0.5', getDepartmentColor(inspection.requestingDepartment))}
                  >
                    {inspection.requestingDepartment}
                  </Badge>
                </div>

                {/* Date info */}
                <div className=\"flex items-center space-x-1\">
                  <CalendarIcon className=\"h-3 w-3\" />
                  <span>{formatDate(inspection.startDate)}</span>
                  {inspection.endDate && (
                    <>
                      <span>-</span>
                      <span>{formatDate(inspection.endDate)}</span>
                    </>
                  )}
                </div>

                {/* Time indicator */}
                {inspection.endDate && (
                  <div className=\"flex items-center space-x-1\">
                    <ClockIcon className=\"h-3 w-3\" />
                    <span className={cn(
                      isOverdue && 'text-red-600 font-medium'
                    )}>
                      {getDaysFromNow(inspection.endDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Report count and last report date */}
              <div className=\"flex items-center space-x-4\">
                {inspection.reportCount > 0 && (
                  <div className=\"flex items-center space-x-1\">
                    <DocumentTextIcon className=\"h-3 w-3\" />
                    <span>{inspection.reportCount} reports</span>
                  </div>
                )}
                {inspection.lastReportDate && (
                  <div className=\"flex items-center space-x-1\">
                    <span>Last: {formatDate(inspection.lastReportDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded content: Daily reports */}
        {isExpanded && hasChildren && showDailyReports && (
          <div className=\"mt-4 pl-8 border-l-2 border-gray-100\">
            <div className=\"space-y-2\">
              {/* Daily reports header */}
              <div className=\"flex items-center justify-between mb-3\">
                <h4 className=\"text-sm font-medium text-gray-700 flex items-center\">
                  <DocumentTextIcon className=\"h-4 w-4 mr-2\" />
                  Daily Reports ({inspection.dailyReports.length})
                </h4>
                {onCreateDailyReport && (
                  <Button
                    size=\"sm\"
                    variant=\"outline\"
                    onClick={() => onCreateDailyReport(inspection.id)}
                    className=\"h-7 text-xs\"
                  >
                    <PlusIcon className=\"h-3 w-3 mr-1\" />
                    Add Report
                  </Button>
                )}
              </div>

              {/* Daily reports list */}
              {inspection.dailyReports.length > 0 ? (
                <div className=\"space-y-2\">
                  {inspection.dailyReports.map(report => (
                    <DailyReportItem
                      key={report.id}
                      report={report}
                      onEdit={onEditDailyReport}
                      onDelete={onDeleteDailyReport}
                      onView={onViewReport}
                    />
                  ))}
                </div>
              ) : (
                <div className=\"text-center py-4 text-sm text-muted-foreground\">
                  No daily reports yet
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Daily report item component
interface DailyReportItemProps {
  report: DailyReport
  onEdit?: (reportId: string) => void
  onDelete?: (reportId: string) => void
  onView?: (reportId: string) => void
}

function DailyReportItem({ report, onEdit, onDelete, onView }: DailyReportItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const reportActions = [
    {
      key: 'view',
      label: 'View',
      variant: 'ghost' as const,
      hidden: !onView
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
      case 'view':
        onView?.(report.id)
        break
      case 'edit':
        onEdit?.(report.id)
        break
      case 'delete':
        onDelete?.(report.id)
        break
    }
  }

  return (
    <div className=\"bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors\">
      <div className=\"flex items-start justify-between\">
        <div className=\"flex-1 min-w-0\">
          <div className=\"flex items-center space-x-2 mb-1\">
            <CalendarIcon className=\"h-3 w-3 text-muted-foreground flex-shrink-0\" />
            <span className=\"text-sm font-medium\">{formatDate(report.reportDate)}</span>
          </div>
          <p className=\"text-sm text-gray-600 line-clamp-2 mb-2\">
            {report.description}
          </p>
          {report.inspectorNames && (
            <div className=\"flex items-center space-x-1 text-xs text-muted-foreground\">
              <UserGroupIcon className=\"h-3 w-3\" />
              <span>{report.inspectorNames}</span>
            </div>
          )}
        </div>
        
        <div className=\"flex-shrink-0 ml-4\">
          <ActionButtons
            actions={reportActions}
            onAction={handleAction}
            size=\"sm\"
          />
        </div>
      </div>
    </div>
  )
}

export { DailyReportItem }
export type { InspectionGroupCardProps }
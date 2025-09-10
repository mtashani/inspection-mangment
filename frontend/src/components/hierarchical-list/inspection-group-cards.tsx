'use client'

import React, { useState, useEffect } from 'react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InspectionGroup, DailyReport, InspectionStatus } from '@/types/inspections'

export interface InspectionGroupCardProps {
  inspectionGroup: InspectionGroup
  isExpanded: boolean
  onToggleExpanded: () => void
  onCreateDailyReport: (groupId: string) => void
  onViewDailyReport: (reportId: string) => void
  onEditDailyReport: (reportId: string) => void
  onStartInspection: (groupId: string) => void
  onPauseInspection: (groupId: string) => void
  onCompleteInspection: (groupId: string) => void
  onCreateProfessionalReport: (groupId: string) => void
  className?: string
}

export function InspectionGroupCard({
  inspectionGroup,
  isExpanded,
  onToggleExpanded,
  onCreateDailyReport,
  onViewDailyReport,
  onEditDailyReport,
  onStartInspection,
  onPauseInspection,
  onCompleteInspection,
  onCreateProfessionalReport,
  className
}: InspectionGroupCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Calculate completion percentage
  const completionPercentage = inspectionGroup.dailyReports.length > 0 
    ? Math.round((inspectionGroup.dailyReports.filter(report => report.isCompleted).length / inspectionGroup.dailyReports.length) * 100)
    : 0

  // Get status color
  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case InspectionStatus.NOT_STARTED:
        return 'bg-gray-100 text-gray-800'
      case InspectionStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800'
      case InspectionStatus.PAUSED:
        return 'bg-yellow-100 text-yellow-800'
      case InspectionStatus.COMPLETED:
        return 'bg-green-100 text-green-800'
      case InspectionStatus.OVERDUE:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status icon
  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case InspectionStatus.NOT_STARTED:
        return <ClockIcon className="h-4 w-4" />
      case InspectionStatus.IN_PROGRESS:
        return <PlayIcon className="h-4 w-4" />
      case InspectionStatus.PAUSED:
        return <PauseIcon className="h-4 w-4" />
      case InspectionStatus.COMPLETED:
        return <CheckCircleIcon className="h-4 w-4" />
      case InspectionStatus.OVERDUE:
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle action with loading state
  const handleAction = async (action: () => void | Promise<void>) => {
    try {
      setIsLoading(true)
      await action()
    } finally {
      setIsLoading(false)
    }
  }

  // Get available actions based on status
  const getAvailableActions = () => {
    const actions = []

    switch (inspectionGroup.status) {
      case InspectionStatus.NOT_STARTED:
        actions.push({
          label: 'Start Inspection',
          icon: PlayIcon,
          action: () => handleAction(() => onStartInspection(inspectionGroup.id)),
          variant: 'default' as const
        })
        break
      
      case InspectionStatus.IN_PROGRESS:
        actions.push({
          label: 'Pause Inspection',
          icon: PauseIcon,
          action: () => handleAction(() => onPauseInspection(inspectionGroup.id)),
          variant: 'outline' as const
        })
        if (completionPercentage >= 100) {
          actions.push({
            label: 'Complete Inspection',
            icon: CheckCircleIcon,
            action: () => handleAction(() => onCompleteInspection(inspectionGroup.id)),
            variant: 'default' as const
          })
        }
        break
      
      case InspectionStatus.PAUSED:
        actions.push({
          label: 'Resume Inspection',
          icon: PlayIcon,
          action: () => handleAction(() => onStartInspection(inspectionGroup.id)),
          variant: 'default' as const
        })
        break
      
      case InspectionStatus.COMPLETED:
        actions.push({
          label: 'Create Report',
          icon: DocumentTextIcon,
          action: () => handleAction(() => onCreateProfessionalReport(inspectionGroup.id)),
          variant: 'default' as const
        })
        break
    }

    return actions
  }

  const availableActions = getAvailableActions()

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="h-6 w-6 p-0 flex-shrink-0 mt-0.5"
              disabled={inspectionGroup.dailyReports.length === 0}
            >
              {inspectionGroup.dailyReports.length > 0 ? (
                isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )
              ) : (
                <div className="h-4 w-4" />
              )}
            </Button>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-medium truncate">
                    {inspectionGroup.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {inspectionGroup.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                  <Badge className={cn('text-xs', getStatusColor(inspectionGroup.status))}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(inspectionGroup.status)}
                      <span>{inspectionGroup.status.replace('_', ' ')}</span>
                    </div>
                  </Badge>
                </div>
              </div>

              {/* Progress and Stats */}
              <div className="space-y-3">
                {/* Progress Bar */}
                {inspectionGroup.dailyReports.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <DocumentTextIcon className="h-3 w-3" />
                    <span>{inspectionGroup.dailyReports.length} reports</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="h-3 w-3" />
                    <span>{inspectionGroup.dailyReports.filter(r => r.isCompleted).length} completed</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>Due: {formatDate(inspectionGroup.dueDate)}</span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  {inspectionGroup.assignedTo && (
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-3 w-3" />
                      <span>Assigned to: {inspectionGroup.assignedTo}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>Created: {formatDate(inspectionGroup.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
            {/* Primary Action */}
            {availableActions.length > 0 && (
              <Button
                variant={availableActions[0].variant}
                size="sm"
                onClick={availableActions[0].action}
                disabled={isLoading}
                className="h-7 text-xs"
              >
                <availableActions[0].icon className="h-3 w-3 mr-1" />
                {availableActions[0].label}
              </Button>
            )}

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={isLoading}
                >
                  <span className="sr-only">More actions</span>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onCreateDailyReport(inspectionGroup.id)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Daily Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {availableActions.slice(1).map((action, index) => (
                  <DropdownMenuItem key={index} onClick={action.action}>
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Expanded Content - Daily Reports */}
      {isExpanded && inspectionGroup.dailyReports.length > 0 && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Daily Reports</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateDailyReport(inspectionGroup.id)}
                className="h-7 text-xs"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Report
              </Button>
            </div>
            <div className="space-y-2">
              {inspectionGroup.dailyReports.map(report => (
                <DailyReportCard
                  key={report.id}
                  report={report}
                  onView={() => onViewDailyReport(report.id)}
                  onEdit={() => onEditDailyReport(report.id)}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Daily Report Card Component
interface DailyReportCardProps {
  report: DailyReport
  onView: () => void
  onEdit: () => void
  formatDate: (dateString: string) => string
  formatTime: (dateString: string) => string
}

function DailyReportCard({ 
  report, 
  onView, 
  onEdit, 
  formatDate, 
  formatTime 
}: DailyReportCardProps) {
  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              {report.isCompleted ? (
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              ) : (
                <ClockIcon className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h5 className="text-sm font-medium truncate">
                  Daily Report - {formatDate(report.date)}
                </h5>
                <Badge 
                  variant={report.isCompleted ? "default" : "secondary"}
                  className="text-xs"
                >
                  {report.isCompleted ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-3 w-3" />
                  <span>{formatTime(report.createdAt)}</span>
                </div>
                {report.completedAt && (
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="h-3 w-3" />
                    <span>Completed: {formatTime(report.completedAt)}</span>
                  </div>
                )}
                {report.equipmentCount && (
                  <div className="flex items-center space-x-1">
                    <DocumentTextIcon className="h-3 w-3" />
                    <span>{report.equipmentCount} equipment</span>
                  </div>
                )}
              </div>
              {report.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {report.notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onView}
              className="h-6 w-6 p-0"
            >
              <EyeIcon className="h-3 w-3" />
            </Button>
            {!report.isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-6 w-6 p-0"
              >
                <PencilIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for managing inspection group state
export function useInspectionGroupCards() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [loadingGroups, setLoadingGroups] = useState<Set<string>>(new Set())

  const toggleExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const setGroupLoading = (groupId: string, loading: boolean) => {
    const newLoading = new Set(loadingGroups)
    if (loading) {
      newLoading.add(groupId)
    } else {
      newLoading.delete(groupId)
    }
    setLoadingGroups(newLoading)
  }

  const isExpanded = (groupId: string) => expandedGroups.has(groupId)
  const isLoading = (groupId: string) => loadingGroups.has(groupId)

  const expandAll = (groupIds: string[]) => {
    setExpandedGroups(new Set(groupIds))
  }

  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  return {
    expandedGroups,
    loadingGroups,
    toggleExpanded,
    setGroupLoading,
    isExpanded,
    isLoading,
    expandAll,
    collapseAll
  }
}

export type { InspectionGroupCardProps }
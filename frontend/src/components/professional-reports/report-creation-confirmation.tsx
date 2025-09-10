'use client'

import React from 'react'
import {
  DocumentTextIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface InspectionSummary {
  id: string
  name: string
  type: string
  completedAt: string
  completedBy: string
  equipmentCount: number
  issuesFound: number
  status: 'completed' | 'partial'
  location?: string
  duration?: number // in minutes
}

export interface ReportCreationConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  inspection: InspectionSummary
  isLoading?: boolean
  className?: string
}

export function ReportCreationConfirmation({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  inspection,
  isLoading = false,
  className
}: ReportCreationConfirmationProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Fully Completed'
      case 'partial':
        return 'Partially Completed'
      default:
        return 'Unknown Status'
    }
  }

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (!isLoading) {
      onCancel()
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn('max-w-2xl', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span>Inspection Completed</span>
          </DialogTitle>
          <DialogDescription>
            Your inspection has been completed successfully. Would you like to create a professional report?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Inspection Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{inspection.name}</CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <span>{inspection.type}</span>
                    {inspection.location && (
                      <>
                        <span>•</span>
                        <span>{inspection.location}</span>
                      </>
                    )}
                  </CardDescription>
                </div>
                <Badge className={cn('text-xs', getStatusColor(inspection.status))}>
                  {getStatusText(inspection.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Completion Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Completed</span>
                  </div>
                  <div className="font-medium">
                    {formatDate(inspection.completedAt)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span>Inspector</span>
                  </div>
                  <div className="font-medium">
                    {inspection.completedBy}
                  </div>
                </div>
                {inspection.duration && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <ClockIcon className="h-4 w-4" />
                      <span>Duration</span>
                    </div>
                    <div className="font-medium">
                      {formatDuration(inspection.duration)}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>Equipment</span>
                  </div>
                  <div className="font-medium">
                    {inspection.equipmentCount} items inspected
                  </div>
                </div>
              </div>

              <Separator />

              {/* Issues Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Issues Found</span>
                  <Badge 
                    variant={inspection.issuesFound > 0 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {inspection.issuesFound} issues
                  </Badge>
                </div>
                {inspection.issuesFound > 0 && (
                  <Alert>
                    <InformationCircleIcon className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {inspection.issuesFound} issue{inspection.issuesFound !== 1 ? 's' : ''} found during inspection. 
                      Creating a professional report will help document these findings properly.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Report Creation Benefits */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-900">
                Why Create a Professional Report?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800">
              <ul className="space-y-1">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Document findings with detailed analysis and recommendations</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Generate professional PDF reports for stakeholders</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Maintain compliance with industry standards and regulations</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Track maintenance history and equipment condition trends</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium">What would you like to do?</div>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="justify-start h-auto p-4"
              >
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Create Professional Report</div>
                    <div className="text-xs text-muted-foreground">
                      Generate a detailed report with templates and auto-filled data
                    </div>
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="justify-start h-auto p-4"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Complete Without Report</div>
                    <div className="text-xs text-muted-foreground">
                      Mark inspection as complete and return to dashboard
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            You can always create a report later from the inspection history
          </div>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
            size="sm"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing report creation confirmation state
export function useReportCreationConfirmation() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inspection, setInspection] = React.useState<InspectionSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const showConfirmation = (inspectionData: InspectionSummary) => {
    setInspection(inspectionData)
    setIsOpen(true)
  }

  const hideConfirmation = () => {
    setIsOpen(false)
    setInspection(null)
    setIsLoading(false)
  }

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  return {
    isOpen,
    inspection,
    isLoading,
    showConfirmation,
    hideConfirmation,
    setLoading
  }
}

export type { ReportCreationConfirmationProps, InspectionSummary }
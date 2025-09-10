'use client'

import React, { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  XMarkIcon
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FinalReport, 
  ReportStatus, 
  ExportFormat,
  ReportSubmissionResult 
} from '@/types/professional-reports'

// Report Submission Dialog
export interface ReportSubmissionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (submissionData: { notes?: string }) => void
  report: FinalReport
  submissionResult?: ReportSubmissionResult
  isSubmitting?: boolean
  className?: string
}

export function ReportSubmissionDialog({
  isOpen,
  onClose,
  onSubmit,
  report,
  submissionResult,
  isSubmitting = false,
  className
}: ReportSubmissionDialogProps) {
  const [submissionNotes, setSubmissionNotes] = useState('')

  const handleSubmit = () => {
    if (!isSubmitting) {
      onSubmit({ notes: submissionNotes.trim() || undefined })
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  // Reset notes when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSubmissionNotes('')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn('max-w-2xl', className)}>
        <DialogHeader>
          <DialogTitle className=\"flex items-center space-x-2\">
            <DocumentTextIcon className=\"h-5 w-5 text-primary\" />
            <span>Submit Report</span>
          </DialogTitle>
          <DialogDescription>
            Review and submit your report for approval.
          </DialogDescription>
        </DialogHeader>

        <div className=\"space-y-4\">
          {/* Report Summary */}
          <Card>
            <CardHeader className=\"pb-3\">
              <CardTitle className=\"text-base\">Report Summary</CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-3\">
              <div className=\"grid grid-cols-2 gap-4 text-sm\">
                <div>
                  <span className=\"text-muted-foreground\">Report ID:</span>
                  <p className=\"font-medium\">{report.id}</p>
                </div>
                <div>
                  <span className=\"text-muted-foreground\">Serial Number:</span>
                  <p className=\"font-medium\">{report.serialNumber}</p>
                </div>
                <div>
                  <span className=\"text-muted-foreground\">Template:</span>
                  <p className=\"font-medium\">{report.template?.name || 'Unknown'}</p>
                </div>
                <div>
                  <span className=\"text-muted-foreground\">Status:</span>
                  <Badge variant={report.status === ReportStatus.DRAFT ? 'secondary' : 'default'}>
                    {report.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Notes */}
          <div className=\"space-y-2\">
            <Label htmlFor=\"submission-notes\">Submission Notes (Optional)</Label>
            <Textarea
              id=\"submission-notes\"
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder=\"Add any notes for the reviewer...\"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Submission Result */}
          {submissionResult && (
            <Alert className={cn(
              submissionResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            )}>
              {submissionResult.success ? (
                <CheckCircleIcon className=\"h-4 w-4 text-green-600\" />
              ) : (
                <ExclamationTriangleIcon className=\"h-4 w-4 text-red-600\" />
              )}
              <AlertDescription>
                {submissionResult.success ? (
                  <div>
                    <p className=\"font-medium text-green-800\">Report submitted successfully!</p>
                    <p className=\"text-green-700 text-sm mt-1\">
                      Your report has been submitted for review and approval.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className=\"font-medium text-red-800\">Submission failed</p>
                    {submissionResult.errors.length > 0 && (
                      <ul className=\"text-red-700 text-sm mt-1 space-y-1\">
                        {submissionResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {submissionResult?.warnings && submissionResult.warnings.length > 0 && (
            <Alert>
              <InformationCircleIcon className=\"h-4 w-4\" />
              <AlertDescription>
                <p className=\"font-medium\">Please note:</p>
                <ul className=\"text-sm mt-1 space-y-1\">
                  {submissionResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <div className=\"flex items-center space-x-2\">
            <Button
              variant=\"outline\"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || submissionResult?.success}
              className=\"flex items-center space-x-1\"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className=\"h-4 w-4 animate-spin\" />
                  <span>Submitting...</span>
                </>
              ) : submissionResult?.success ? (
                <>
                  <CheckCircleIcon className=\"h-4 w-4\" />
                  <span>Submitted</span>
                </>
              ) : (
                <>
                  <DocumentTextIcon className=\"h-4 w-4\" />
                  <span>Submit Report</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Report Management List
export interface ReportManagementListProps {
  reports: FinalReport[]
  onViewReport: (reportId: string) => void
  onEditReport: (reportId: string) => void
  onDeleteReport: (reportId: string) => void
  onExportReport: (reportId: string, format: ExportFormat) => void
  onDuplicateReport: (reportId: string) => void
  isLoading?: boolean
  className?: string
}

export function ReportManagementList({
  reports,
  onViewReport,
  onEditReport,
  onDeleteReport,
  onExportReport,
  onDuplicateReport,
  isLoading = false,
  className
}: ReportManagementListProps) {
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'status'>('updated')
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all')

  // Filter and sort reports
  const filteredAndSortedReports = reports
    .filter(report => filterStatus === 'all' || report.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

  // Get status color
  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.DRAFT:
        return 'bg-gray-100 text-gray-800'
      case ReportStatus.SUBMITTED:
        return 'bg-blue-100 text-blue-800'
      case ReportStatus.UNDER_REVIEW:
        return 'bg-yellow-100 text-yellow-800'
      case ReportStatus.APPROVED:
        return 'bg-green-100 text-green-800'
      case ReportStatus.REJECTED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle bulk actions
  const handleBulkExport = (format: ExportFormat) => {
    selectedReports.forEach(reportId => {
      onExportReport(reportId, format)
    })
    setSelectedReports(new Set())
  }

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedReports.size} reports?`)) {
      selectedReports.forEach(reportId => {
        onDeleteReport(reportId)
      })
      setSelectedReports(new Set())
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className=\"p-8 text-center\">
          <ArrowPathIcon className=\"h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground\" />
          <p className=\"text-muted-foreground\">Loading reports...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className=\"flex items-center justify-between\">
          <div>
            <CardTitle>Report Management</CardTitle>
            <CardDescription>
              Manage and track your professional reports
            </CardDescription>
          </div>
          
          {/* Filters and Actions */}
          <div className=\"flex items-center space-x-2\">
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className=\"w-32\">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"all\">All Status</SelectItem>
                <SelectItem value={ReportStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={ReportStatus.SUBMITTED}>Submitted</SelectItem>
                <SelectItem value={ReportStatus.UNDER_REVIEW}>Under Review</SelectItem>
                <SelectItem value={ReportStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={ReportStatus.REJECTED}>Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className=\"w-32\">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=\"updated\">Last Updated</SelectItem>
                <SelectItem value=\"created\">Date Created</SelectItem>
                <SelectItem value=\"status\">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedReports.size > 0 && (
          <div className=\"flex items-center space-x-2 p-3 bg-blue-50 rounded-lg\">
            <span className=\"text-sm font-medium\">
              {selectedReports.size} reports selected
            </span>
            <Separator orientation=\"vertical\" className=\"h-4\" />
            <Button
              variant=\"outline\"
              size=\"sm\"
              onClick={() => handleBulkExport(ExportFormat.PDF)}
            >
              Export PDF
            </Button>
            <Button
              variant=\"outline\"
              size=\"sm\"
              onClick={() => handleBulkExport(ExportFormat.EXCEL)}
            >
              Export Excel
            </Button>
            <Button
              variant=\"destructive\"
              size=\"sm\"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
            <Button
              variant=\"ghost\"
              size=\"sm\"
              onClick={() => setSelectedReports(new Set())}
            >
              <XMarkIcon className=\"h-4 w-4\" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredAndSortedReports.length === 0 ? (
          <div className=\"text-center py-8\">
            <DocumentTextIcon className=\"h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50\" />
            <p className=\"text-muted-foreground\">
              {filterStatus === 'all' ? 'No reports found' : `No ${filterStatus.toLowerCase()} reports found`}
            </p>
          </div>
        ) : (
          <div className=\"space-y-3\">
            {filteredAndSortedReports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={selectedReports.has(report.id)}
                onSelect={(selected) => {
                  const newSelected = new Set(selectedReports)
                  if (selected) {
                    newSelected.add(report.id)
                  } else {
                    newSelected.delete(report.id)
                  }
                  setSelectedReports(newSelected)
                }}
                onView={() => onViewReport(report.id)}
                onEdit={() => onEditReport(report.id)}
                onDelete={() => onDeleteReport(report.id)}
                onExport={(format) => onExportReport(report.id, format)}
                onDuplicate={() => onDuplicateReport(report.id)}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Individual Report Card
interface ReportCardProps {
  report: FinalReport
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onExport: (format: ExportFormat) => void
  onDuplicate: () => void
  getStatusColor: (status: ReportStatus) => string
  formatDate: (dateString: string) => string
}

function ReportCard({
  report,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onExport,
  onDuplicate,
  getStatusColor,
  formatDate
}: ReportCardProps) {
  const canEdit = report.status === ReportStatus.DRAFT
  const canDelete = report.status === ReportStatus.DRAFT

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isSelected && 'ring-2 ring-primary ring-offset-2'
    )}>
      <CardContent className=\"p-4\">
        <div className=\"flex items-start space-x-4\">
          {/* Selection Checkbox */}
          <input
            type=\"checkbox\"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className=\"mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary\"
          />

          {/* Report Icon */}
          <div className=\"flex-shrink-0 mt-1\">
            <DocumentTextIcon className=\"h-5 w-5 text-primary\" />
          </div>

          {/* Main Content */}
          <div className=\"flex-1 min-w-0\">
            <div className=\"flex items-start justify-between mb-2\">
              <div className=\"flex-1 min-w-0\">
                <h3 className=\"text-sm font-medium text-gray-900 truncate\">
                  {report.template?.name || 'Unknown Template'}
                </h3>
                <p className=\"text-xs text-muted-foreground\">
                  Serial: {report.serialNumber}
                </p>
              </div>
              <Badge className={cn('text-xs', getStatusColor(report.status))}>
                {report.status}
              </Badge>
            </div>

            {/* Metadata */}
            <div className=\"flex items-center space-x-4 text-xs text-muted-foreground mb-3\">
              <div className=\"flex items-center space-x-1\">
                <CalendarIcon className=\"h-3 w-3\" />
                <span>Created: {formatDate(report.createdAt)}</span>
              </div>
              <div className=\"flex items-center space-x-1\">
                <ClockIcon className=\"h-3 w-3\" />
                <span>Updated: {formatDate(report.updatedAt)}</span>
              </div>
              {report.createdBy && (
                <div className=\"flex items-center space-x-1\">
                  <UserIcon className=\"h-3 w-3\" />
                  <span>By: {report.createdBy}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className=\"flex items-center space-x-2\">
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={onView}
                className=\"h-7 text-xs\"
              >
                <EyeIcon className=\"h-3 w-3 mr-1\" />
                View
              </Button>
              
              {canEdit && (
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={onEdit}
                  className=\"h-7 text-xs\"
                >
                  <PencilIcon className=\"h-3 w-3 mr-1\" />
                  Edit
                </Button>
              )}

              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={() => onExport(ExportFormat.PDF)}
                className=\"h-7 text-xs\"
              >
                <ArrowDownTrayIcon className=\"h-3 w-3 mr-1\" />
                PDF
              </Button>

              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={onDuplicate}
                className=\"h-7 text-xs\"
              >
                <DocumentDuplicateIcon className=\"h-3 w-3 mr-1\" />
                Copy
              </Button>

              {canDelete && (
                <Button
                  variant=\"destructive\"
                  size=\"sm\"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this report?')) {
                      onDelete()
                    }
                  }}
                  className=\"h-7 text-xs\"
                >
                  <TrashIcon className=\"h-3 w-3 mr-1\" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for managing report submission
export function useReportSubmission() {
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<FinalReport | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<ReportSubmissionResult | null>(null)

  const showSubmission = (report: FinalReport) => {
    setSelectedReport(report)
    setIsSubmissionOpen(true)
    setSubmissionResult(null)
  }

  const hideSubmission = () => {
    setIsSubmissionOpen(false)
    setSelectedReport(null)
    setIsSubmitting(false)
    setSubmissionResult(null)
  }

  const setSubmitting = (submitting: boolean) => {
    setIsSubmitting(submitting)
  }

  const setResult = (result: ReportSubmissionResult) => {
    setSubmissionResult(result)
  }

  return {
    isSubmissionOpen,
    selectedReport,
    isSubmitting,
    submissionResult,
    showSubmission,
    hideSubmission,
    setSubmitting,
    setResult
  }
}

export type { 
  ReportSubmissionDialogProps, 
  ReportManagementListProps 
}
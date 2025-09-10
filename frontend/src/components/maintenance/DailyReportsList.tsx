'use client'

import React from 'react'
import { 
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  PhotoIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

import { DailyReport } from '@/types/enhanced-maintenance'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface DailyReportsListProps {
  reports: DailyReport[]
  inspectionId: string
  onReportUpdate?: (reportId: string, data: Partial<DailyReport>) => void
  onReportDelete?: (reportId: string) => void
  onReportView?: (reportId: string) => void
  showActions?: boolean
  compact?: boolean
}

interface DailyReportCardProps {
  report: DailyReport
  onUpdate?: (reportId: string, data: Partial<DailyReport>) => void
  onDelete?: (reportId: string) => void
  onView?: (reportId: string) => void
  showActions?: boolean
  compact?: boolean
}

const DailyReportCard: React.FC<DailyReportCardProps> = ({
  report,
  onUpdate,
  onDelete,
  onView,
  showActions = true,
  compact = false
}) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    })
  }

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasAttachments = (report.imageUrls && report.imageUrls.length > 0) || 
                        (report.attachmentUrls && report.attachmentUrls.length > 0)

  const hasFindings = report.findings && report.findings.trim().length > 0
  const hasRecommendations = report.recommendations && report.recommendations.trim().length > 0
  const hasSafetyNotes = report.safetyNotes && report.safetyNotes.trim().length > 0

  return (
    <Card className={cn(
      "border-l-4 border-l-indigo-500",
      compact ? "mb-2" : "mb-3"
    )}>
      <CardHeader className={cn("pb-2", compact && "py-2")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-4 w-4 text-indigo-600" />
            <div className="flex flex-col">
              <span className={cn(
                "font-medium text-gray-900",
                compact ? "text-sm" : "text-base"
              )}>
                {formatDate(report.reportDate)}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(report.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {hasAttachments && (
              <Badge variant="outline" className="text-xs">
                <PaperClipIcon className="h-3 w-3 mr-1" />
                Files
              </Badge>
            )}
            
            {hasSafetyNotes && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                Safety
              </Badge>
            )}
          </div>
        </div>

        <div className={cn("space-y-2", compact ? "text-xs" : "text-sm")}>
          {/* Inspector Information */}
          <div className="flex items-center space-x-1 text-gray-600">
            <UserIcon className="h-3 w-3" />
            <span>{report.inspectorNames || 'Unknown Inspector'}</span>
          </div>

          {/* Description */}
          <div className="text-gray-800">
            <p className={cn(compact ? "text-xs" : "text-sm")}>
              {report.description}
            </p>
          </div>

          {/* Weather Conditions */}
          {report.weatherConditions && !compact && (
            <div className="text-gray-600 text-xs">
              <span className="font-medium">Weather:</span> {report.weatherConditions}
            </div>
          )}

          {/* Findings */}
          {hasFindings && (
            <div className="bg-yellow-50 p-2 rounded-md">
              <div className="flex items-start space-x-1">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-yellow-800">Findings:</span>
                  <p className="text-xs text-yellow-700 mt-1">{report.findings}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {hasRecommendations && (
            <div className="bg-blue-50 p-2 rounded-md">
              <div className="flex items-start space-x-1">
                <CheckCircleIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-blue-800">Recommendations:</span>
                  <p className="text-xs text-blue-700 mt-1">{report.recommendations}</p>
                </div>
              </div>
            </div>
          )}

          {/* Safety Notes */}
          {hasSafetyNotes && (
            <div className="bg-red-50 p-2 rounded-md">
              <div className="flex items-start space-x-1">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-red-800">Safety Notes:</span>
                  <p className="text-xs text-red-700 mt-1">{report.safetyNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attachments Summary */}
          {hasAttachments && !compact && (
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              {report.imageUrls && report.imageUrls.length > 0 && (
                <div className="flex items-center space-x-1">
                  <PhotoIcon className="h-3 w-3" />
                  <span>{report.imageUrls.length} images</span>
                </div>
              )}
              
              {report.attachmentUrls && report.attachmentUrls.length > 0 && (
                <div className="flex items-center space-x-1">
                  <PaperClipIcon className="h-3 w-3" />
                  <span>{report.attachmentUrls.length} files</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center space-x-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView?.(report.id)}
              className="text-xs h-7"
            >
              <EyeIcon className="h-3 w-3 mr-1" />
              View
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdate?.(report.id, {})}
              className="text-xs h-7"
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              Edit
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(report.id)}
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

const DailyReportsList: React.FC<DailyReportsListProps> = ({
  reports,
  inspectionId,
  onReportUpdate,
  onReportDelete,
  onReportView,
  showActions = true,
  compact = false
}) => {
  if (reports.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No daily reports found.</p>
        {showActions && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 text-xs"
          >
            Add Report
          </Button>
        )}
      </div>
    )
  }

  // Sort reports by date (newest first)
  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  )

  // Group reports by date
  const groupedReports = sortedReports.reduce((groups, report) => {
    const date = new Date(report.reportDate).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(report)
    return groups
  }, {} as Record<string, DailyReport[]>)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={cn(
          "font-medium text-gray-900",
          compact ? "text-sm" : "text-base"
        )}>
          Daily Reports ({reports.length})
        </h4>
        
        {showActions && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
          >
            Add Report
          </Button>
        )}
      </div>

      {Object.entries(groupedReports).map(([date, dateReports]) => (
        <div key={date} className="space-y-2">
          {!compact && Object.keys(groupedReports).length > 1 && (
            <>
              <div className="flex items-center space-x-2">
                <h5 className="text-sm font-medium text-gray-700">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h5>
                <Badge variant="outline" className="text-xs">
                  {dateReports.length} reports
                </Badge>
              </div>
              <Separator className="my-2" />
            </>
          )}

          {dateReports.map((report) => (
            <DailyReportCard
              key={report.id}
              report={report}
              onUpdate={onReportUpdate}
              onDelete={onReportDelete}
              onView={onReportView}
              showActions={showActions}
              compact={compact}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default DailyReportsList

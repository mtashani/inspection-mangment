'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { DailyReport } from '@/types/maintenance-events'
import { useDeleteDailyReport } from '@/hooks/use-maintenance-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Edit, 
  Trash2, 
  User,
  FileText,
  AlertTriangle,
  Eye,
  CheckCircle,
  Shield,
  Lightbulb,
  ClipboardList
} from 'lucide-react'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'
import Link from 'next/link'

interface DailyReportCardProps {
  report: DailyReport
  compact?: boolean
  showInspectionInfo?: boolean
  onEdit?: () => void
  onView?: () => void
  onHeightChange?: (height: number) => void
}

export function DailyReportCard({ 
  report, 
  compact = false, 
  showInspectionInfo = false,
  onEdit, 
  onView,
  onHeightChange
}: DailyReportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Report height changes for virtualization
  useEffect(() => {
    if (onHeightChange && cardRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          onHeightChange(entry.contentRect.height)
        }
      })
      
      resizeObserver.observe(cardRef.current)
      
      // Initial height report
      onHeightChange(cardRef.current.offsetHeight)
      
      return () => resizeObserver.disconnect()
    }
  }, [onHeightChange])
  const deleteReportMutation = useDeleteDailyReport()

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else {
      // TODO: Open edit modal
      console.log('Edit report:', report.id)
    }
  }

  const handleView = () => {
    if (onView) {
      onView()
    }
    // Default behavior is handled by Link component
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    deleteReportMutation.mutate(report.id)
    setShowDeleteDialog(false)
  }

  if (compact) {
    return (
      <>
        <Card ref={cardRef} className="p-3 hover:shadow-sm transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(report.report_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                {report.inspector_names && (
                  <div className="flex items-center gap-2">
                    <Separator orientation="vertical" className="h-3 hidden sm:block" />
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      {report.inspector_names}
                    </span>
                  </div>
                )}
              </div>
              {report.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-1">
                  {report.description}
                </p>
              )}
              {/* Show professional summary for compact view */}
              {(report.findings || report.recommendations || report.safety_notes) && (
                <div className="space-y-3 mt-3">
                  {report.findings && (
                    <div className="border-l-2 border-blue-400 bg-blue-50/50 p-2 rounded-r-md">
                      <div className="flex items-center gap-1 mb-1">
                        <ClipboardList className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Findings</span>
                      </div>
                      <p className="text-xs text-blue-800 line-clamp-2">{report.findings}</p>
                    </div>
                  )}
                  {report.recommendations && (
                    <div className="border-l-2 border-green-400 bg-green-50/50 p-2 rounded-r-md">
                      <div className="flex items-center gap-1 mb-1">
                        <Lightbulb className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Recommendations</span>
                      </div>
                      <p className="text-xs text-green-800 line-clamp-2">{report.recommendations}</p>
                    </div>
                  )}
                  {report.safety_notes && (
                    <div className="border-l-2 border-orange-400 bg-orange-50/50 p-2 rounded-r-md">
                      <div className="flex items-center gap-1 mb-1">
                        <Shield className="h-3 w-3 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">Safety Notes</span>
                      </div>
                      <p className="text-xs text-orange-800 line-clamp-2">{report.safety_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 justify-end sm:ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 sm:h-7 sm:w-7 p-0 touch-manipulation"
                title="Edit report"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 sm:h-7 sm:w-7 p-0 text-destructive hover:text-destructive touch-manipulation"
                title="Delete report"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>

        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Daily Report"
          description={`Are you sure you want to delete the daily report from ${format(new Date(report.report_date), 'MMM dd, yyyy')}? This action cannot be undone.`}
          confirmText="delete"
          isLoading={deleteReportMutation.isPending}
        />
      </>
    )
  }

  // Full card view for standalone display
  return (
    <>
      <Card ref={cardRef}>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="line-clamp-2">
                  Daily Report - {format(new Date(report.report_date), 'MMM dd, yyyy')}
                </span>
              </CardTitle>
              {report.inspector_names && (
                <CardDescription className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4" />
                  Inspector(s): {report.inspector_names}
                </CardDescription>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2 flex-1 sm:flex-none">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete}
                className="gap-2 text-destructive hover:text-destructive flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {report.description && (
            <div>
              <h4 className="font-medium text-sm mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </div>
          )}
          
          {report.findings && (
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-700">
                <ClipboardList className="h-4 w-4" />
                Findings
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">{report.findings}</p>
              </div>
            </div>
          )}
          
          {report.recommendations && (
            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-700">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-green-800 whitespace-pre-wrap leading-relaxed">{report.recommendations}</p>
              </div>
            </div>
          )}
          
          {report.safety_notes && (
            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-orange-700">
                <Shield className="h-4 w-4" />
                Safety Notes
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-orange-800 whitespace-pre-wrap leading-relaxed">{report.safety_notes}</p>
              </div>
            </div>
          )}
          
          {report.attachments && report.attachments.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Attachments</h4>
              <div className="flex flex-wrap gap-2">
                {report.attachments.map((attachment, index) => (
                  <Badge key={index} variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {attachment}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span>Created: {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}</span>
            {report.updated_at !== report.created_at && (
              <span>Updated: {format(new Date(report.updated_at), 'MMM dd, yyyy HH:mm')}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Daily Report"
        description={`Are you sure you want to delete the daily report from ${format(new Date(report.report_date), 'MMM dd, yyyy')}? This action cannot be undone.`}
        confirmText="delete"
        isLoading={deleteReportMutation.isPending}
      />
    </>
  )
}
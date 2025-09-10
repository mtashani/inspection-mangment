'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Inspection, DailyReport, InspectionStatus } from '@/types/maintenance-events'
import { useDailyReports, useMaintenanceEvent, useStartInspection, useDeleteInspection, useCompleteInspection } from '@/hooks/use-maintenance-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { InspectionStatusBadge } from '@/components/ui/status-badge'
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Plus, 
  Calendar,
  Settings,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Clock,
  Play
} from 'lucide-react'
import { DailyReportsList } from './daily-reports-list'
import { CreateReportModal } from './create-report-modal'
import { EditReportModal } from './edit-report-modal'
import { InspectionTimelineModal } from './inspection-timeline-modal'
import { EditInspectionModal } from './edit-inspection-modal'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'
import { StartConfirmationDialog } from './start-confirmation-dialog'
import { cn } from '@/lib/utils'
import { getInspectionStatusColor, isOverdue } from '@/lib/utils/status-colors'
import { getInspectionTypeBadge } from '@/lib/utils/inspection-utils'

interface InspectionCardProps {
  inspection: Inspection
  searchTerm?: string
  onHeightChange?: (height: number) => void
  onEdit?: (inspection: Inspection) => void
  onDelete?: (inspection: Inspection) => void
}

export function InspectionCard({ inspection, searchTerm, onHeightChange, onEdit, onDelete }: InspectionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null)
  const [showTimelineView, setShowTimelineView] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditInspectionModal, setShowEditInspectionModal] = useState(false)
  const [showStartConfirmDialog, setShowStartConfirmDialog] = useState(false)
  
  const { data: dailyReports, isLoading: reportsLoading } = useDailyReports({ 
    inspectionId: inspection.id 
  })

  // Fetch parent event data for proper date validation
  const { data: parentEvent } = useMaintenanceEvent(
    inspection.maintenance_event_id ? inspection.maintenance_event_id.toString() : ''
  )

  // Add start inspection hook
  const startInspectionMutation = useStartInspection()
  
  // Add delete inspection hook
  const deleteInspectionMutation = useDeleteInspection()
  
  // Add complete inspection hook
  const completeInspectionMutation = useCompleteInspection()

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
  }, [onHeightChange, isExpanded]) // Include isExpanded to recalculate on expand/collapse

  const inspectionIsOverdue = inspection.end_date ? isOverdue(inspection.end_date, inspection.status) : false
  const statusColors = getInspectionStatusColor(inspection.status)
  const typeBadge = getInspectionTypeBadge(inspection)

  const highlightText = (text: string, searchTerm?: string) => {
    if (!searchTerm || !text) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
  }

  const handleCreateReport = () => {
    setShowCreateModal(true)
  }

  const handleEditReport = (report: DailyReport) => {
    setEditingReport(report)
    setShowEditModal(true)
  }

  const handleCompleteInspection = async () => {
    if (inspection.status === InspectionStatus.InProgress) {
      // TODO: Add validation for incomplete child inspections
      // This should check if there are any sub-events or child inspections that are not completed
      // For now, allow completion but log warning for future implementation
      console.warn('⚠️ Completion validation needed: Check for incomplete child inspections/sub-events')
      
      try {
        await completeInspectionMutation.mutateAsync(inspection.id)
        // Success is handled by the mutation hook
      } catch (error) {
        // Error handling is done by the mutation hook with toast
        console.error('Failed to complete inspection:', error)
      }
    }
  }

  const handleStartInspection = async () => {
    if (inspection.status === InspectionStatus.Planned) {
      setShowStartConfirmDialog(true)
    }
  }

  const handleConfirmStart = async () => {
    try {
      await startInspectionMutation.mutateAsync(inspection.id)
      setShowStartConfirmDialog(false)
      // Success is handled by the mutation hook
    } catch (error) {
      // Error handling is done by the mutation hook with toast
      console.error('Failed to start inspection:', error)
      setShowStartConfirmDialog(false)
    }
  }

  const handleEditInspection = () => {
    setShowEditInspectionModal(true)
  }

  const handleDeleteInspection = () => {
    setShowDeleteDialog(true)
  }
  
  const handleConfirmDelete = async () => {
    try {
      await deleteInspectionMutation.mutateAsync(inspection.id)
      setShowDeleteDialog(false)
      // Success is handled by the mutation hook
      if (onDelete) {
        onDelete(inspection)
      }
    } catch (error) {
      // Error handling is done by the mutation hook with toast
      console.error('Failed to delete inspection:', error)
      setShowDeleteDialog(false)
    }
  }

  const handleHeaderClick = () => {
    setIsExpanded(!isExpanded)
  }

  const handleTimelineView = () => {
    setShowTimelineView(true)
  }

  const canComplete = inspection.status === InspectionStatus.InProgress
  const canCreateReport = inspection.status === InspectionStatus.InProgress // Only allow reports for started inspections
  const canStartInspection = inspection.status === InspectionStatus.Planned // Only show start button for planned inspections
  const reportsCount = dailyReports?.length || inspection.daily_reports_count || 0

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "transition-all duration-200 relative",
        isExpanded && "shadow-md"
      )}
    >
      {/* Status Indicator - REMOVED as requested */}

      {/* Sticky Header - Made clickable */}
      <div className={cn(
        "sticky top-0 border-b border-border z-10 rounded-t-lg cursor-pointer",
        statusColors.header || "bg-card"
      )}
      onClick={handleHeaderClick}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation() // Prevent header click
                    setIsExpanded(!isExpanded)
                  }}
                  className="p-1 h-auto flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <CardTitle 
                      className="text-base sm:text-lg line-clamp-2 flex-1"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(inspection.title, searchTerm)
                      }}
                    />
                    {/* Fixed warning icon condition - only show for truly overdue inspections */}
                    {inspectionIsOverdue && inspection.status !== InspectionStatus.InProgress && (
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{inspection.inspection_number}</span>
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    <span 
                      className="truncate"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(inspection.equipment_tag || 'No equipment', searchTerm)
                      }}
                    />
                    {inspection.equipment_description && (
                      <>
                        <Separator orientation="vertical" className="h-4 hidden sm:block" />
                        <span className="text-xs text-muted-foreground truncate">
                          {inspection.equipment_description}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action buttons - prevent click propagation */}
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditInspection}
                  className="p-2"
                  title="Edit Inspection"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteInspection}
                  className="p-2 text-red-600 hover:text-red-700"
                  title="Delete Inspection"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {reportsCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTimelineView}
                    className="p-2"
                    title="Timeline View"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {/* Badges and Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Fixed status badge to prevent blinking for In Progress */}
                <InspectionStatusBadge 
                  status={inspection.status}
                  endDate={inspection.end_date}
                  className={inspection.status === InspectionStatus.InProgress ? '' : undefined}
                />
                
                {/* Planned/Unplanned Badge */}
                <Badge 
                  variant={typeBadge.variant as "default" | "secondary" | "destructive" | "outline" | null | undefined}
                  className={cn("text-xs", typeBadge.className)}
                >
                  {typeBadge.fullLabel}
                </Badge>
                
                {reportsCount > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {reportsCount}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {canStartInspection && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleStartInspection}
                    disabled={startInspectionMutation.isPending}
                    className="gap-1 flex-1 sm:flex-none"
                  >
                    {startInspectionMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span className="hidden sm:inline">Starting...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Start Inspection</span>
                        <span className="sm:hidden">Start</span>
                      </>
                    )}
                  </Button>
                )}
                
                {canCreateReport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateReport}
                    className="gap-1 flex-1 sm:flex-none"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Report</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                )}
                
                {canComplete && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCompleteInspection}
                    disabled={completeInspectionMutation.isPending}
                    className="gap-1 flex-1 sm:flex-none"
                  >
                    {completeInspectionMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span className="hidden sm:inline">Completing...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Complete</span>
                        <span className="sm:hidden">Done</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </div>
      
      {/* Expandable Content */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Inspection Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <div className="font-medium">
                      {format(new Date(inspection.start_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">End Date:</span>
                    <div className="font-medium">
                      {inspection.end_date ? 
                        format(new Date(inspection.end_date), 'MMM dd, yyyy') : 
                        'Not set'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <div className="font-medium">{inspection.requesting_department}</div>
                  </div>
                </div>
              </div>
              
              {inspection.description && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{inspection.description}</p>
                </div>
              )}
              
              {(inspection.work_order || inspection.permit_number) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {inspection.work_order && (
                    <div>
                      <span className="text-muted-foreground">Work Order:</span>
                      <span className="ml-2 font-medium">{inspection.work_order}</span>
                    </div>
                  )}
                  {inspection.permit_number && (
                    <div>
                      <span className="text-muted-foreground">Permit Number:</span>
                      <span className="ml-2 font-medium">{inspection.permit_number}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Daily Reports List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Daily Reports</h4>
                  {reportsCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {reportsCount} report{reportsCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                <DailyReportsList 
                  reports={dailyReports || []}
                  compact={true}
                  onEdit={handleEditReport}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Modals */}
      <CreateReportModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        inspectionId={inspection.id}
        inspectionTitle={inspection.title}
        inspectionStartDate={inspection.actual_start_date}
        eventStartDate={
          parentEvent?.actual_start_date || 
          parentEvent?.planned_start_date ||
          undefined
        }
        onSuccess={() => {
          setShowCreateModal(false)
          // Data will be automatically refreshed by TanStack Query
        }}
      />

      <EditReportModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingReport(null)
        }}
        report={editingReport}
        onSuccess={() => {
          setShowEditModal(false)
          setEditingReport(null)
          // Data will be automatically refreshed by TanStack Query
        }}
      />

      <InspectionTimelineModal
        isOpen={showTimelineView}
        onClose={() => setShowTimelineView(false)}
        inspection={inspection}
      />

      <EditInspectionModal
        isOpen={showEditInspectionModal}
        onClose={() => setShowEditInspectionModal(false)}
        inspection={inspection}
        onSuccess={() => {
          setShowEditInspectionModal(false)
          // Data will be automatically refreshed by TanStack Query
        }}
      />

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Inspection"
        description={`Are you sure you want to delete inspection "${inspection.title}"? This action cannot be undone.`}
        requireConfirmation={true}
        confirmText="delete"
        isLoading={deleteInspectionMutation.isPending}
      />

      <StartConfirmationDialog
        isOpen={showStartConfirmDialog}
        onClose={() => setShowStartConfirmDialog(false)}
        onConfirm={handleConfirmStart}
        title="Start Inspection"
        description={`Are you sure you want to start inspection "${inspection.title}"? This will change its status to In Progress and allow report creation.`}
        isLoading={startInspectionMutation.isPending}
      />
    </Card>
  )
}
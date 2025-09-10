"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Trash2, ClipboardCheck, Timer } from "lucide-react"
import { InspectionGroup, InspectionStatus } from "./types"
import { ReportCard } from "./report-card"
import { EditReportForm } from "./edit-report-form"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ReportFormValues {
  date: string
  description: string
  inspectors: string[]
}

interface ReportFormValues {
  date: string
  description: string
  inspectors: string[]
}

interface InspectionGroupCardProps {
  group: InspectionGroup
  isExpanded: boolean
  editingReportId: string | null
  onToggle: () => void
  onEditReport: (reportId: string) => void
  onSaveEdit: (reportId: string, data: ReportFormValues) => void
  onCancelEdit: () => void
  onAddReport: () => void
  onDeleteReport: (reportId: string) => void
  onDeleteInspection: (inspectionId: string) => void
  showAddForm: boolean
  dateRange?: { from: Date; to: Date }
  selectedInspector?: string
}

const getStatusDisplay = (status: InspectionStatus): string => {
  return status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'
}

const getStatusStyles = (status: InspectionStatus) => {
  const styles = {
    background: status === 'IN_PROGRESS' 
      ? 'bg-gradient-to-br from-[var(--color-info)]/5 via-[var(--color-info)]/10 to-[var(--color-info)]/15'
      : 'bg-gradient-to-br from-[var(--color-success)]/5 via-[var(--color-success)]/10 to-[var(--color-success)]/15',
    badge: status === 'IN_PROGRESS'
      ? 'bg-[var(--color-info)]/10 text-[var(--color-info)]'
      : 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    icon: status === 'IN_PROGRESS' ? Timer : ClipboardCheck,
    shadow: status === 'IN_PROGRESS' 
      ? 'shadow-[var(--color-info)]/10'
      : 'shadow-[var(--color-success)]/10'
  }
  return styles
}

export const InspectionGroupCard = ({
  group,
  isExpanded,
  editingReportId,
  onToggle,
  onEditReport,
  onSaveEdit,
  onCancelEdit,
  onAddReport,
  onDeleteReport,
  onDeleteInspection,
  showAddForm,
  dateRange,
  selectedInspector,
}: InspectionGroupCardProps) => {
  const [showReportDeleteDialog, setShowReportDeleteDialog] = useState(false)
  const [showInspectionDeleteDialog, setShowInspectionDeleteDialog] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [isHeaderSticky, setIsHeaderSticky] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const statusStyles = getStatusStyles(group.status)
  const StatusIcon = statusStyles.icon

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderSticky(!entry.isIntersecting)
      },
      {
        threshold: [1],
        rootMargin: "-1px 0px 0px 0px"
      }
    )

    if (headerRef.current && cardRef.current) {
      observer.observe(headerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleReportDelete = (reportId: string) => {
    setReportToDelete(reportId)
    setShowReportDeleteDialog(true)
  }

  const confirmReportDelete = () => {
    if (reportToDelete) {
      onDeleteReport(reportToDelete)
    }
    setShowReportDeleteDialog(false)
    setReportToDelete(null)
  }

  const confirmInspectionDelete = () => {
    onDeleteInspection(group.id)
    setShowInspectionDeleteDialog(false)
  }

  const isInDateRange = (date: string) => {
    if (!dateRange?.from || !dateRange?.to) return false
    const reportDate = new Date(date)
    const endDate = new Date(dateRange.to)
    endDate.setHours(23, 59, 59, 999)
    return reportDate >= dateRange.from && reportDate <= endDate
  }

  const lastReport = group.reports[group.reports.length - 1]
  const completionDate = group.status === 'COMPLETED' ? lastReport?.date : null
  const isInProgress = group.status === 'IN_PROGRESS'

  return (
    <Card 
      ref={cardRef}
      variant="elevated"
      className={cn(
        "backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-0.5 relative overflow-visible",
        statusStyles.background,
        statusStyles.shadow,
        isExpanded && "shadow-[calc(var(--depth)*2)]",
        !isExpanded && "hover:shadow-[calc(var(--depth)*1.5)] shadow-[var(--depth)]"
      )}
    >
      <div
        ref={headerRef}
        className={cn(
          "sticky top-0 z-20 transition-colors duration-200",
          "cursor-pointer bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          isHeaderSticky && "shadow-sm border-b border-border/50",
          !isExpanded && "rounded-lg",
          isExpanded && "rounded-t-lg"
        )}
        style={{ top: isHeaderSticky ? 0 : 'auto' }}
        onClick={onToggle}
      >
        <div className="p-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                group.status === 'IN_PROGRESS' ? "bg-blue-100" : "bg-green-100"
              )}>
                <StatusIcon className={cn(
                  "h-4 w-4",
                  group.status === 'IN_PROGRESS' ? "text-blue-600" : "text-green-600"
                )} />
              </div>
              <div>
                <div className="font-medium flex items-center gap-2">
                  <span>{group.equipmentTag}</span>
                  {isExpanded ? 
                    <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
                <div className="text-xs text-muted-foreground space-x-2">
                  <span>Started: {format(new Date(group.startDate), "MMM d, yyyy")}</span>
                  {completionDate && (
                    <>
                      <span>•</span>
                      <span>Completed: {format(new Date(completionDate), "MMM d, yyyy")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                statusStyles.badge
              )}>
                {getStatusDisplay(group.status)}
              </span>
              {isInProgress && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowInspectionDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <CardContent className="px-6 py-4">
          <div className="space-y-3">
            {[...group.reports]
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((report) => (
                <div key={report.id}>
                  {editingReportId === report.id ? (
                    <EditReportForm
                      onSubmit={(data) => onSaveEdit(report.id, data)}
                      onCancel={onCancelEdit}
                      inspectionStartDate={group.startDate}
                      initialValues={{
                        date: format(new Date(report.date), 'yyyy-MM-dd'),
                        description: report.description,
                        inspectors: report.inspectors.map(i => i.toString())
                      }}
                    />
                  ) : (
                    <div className="flex items-start gap-2 w-full">
                      <ReportCard
                        report={report}
                        onEdit={() => onEditReport(report.id)}
                        isInDateRange={isInDateRange(report.date)}
                        inspectionStatus={group.status}
                        selectedInspector={selectedInspector}
                      />
                      {isInProgress && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReportDelete(report.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {isInProgress && (
            <div className="mt-4">
              {showAddForm ? (
                <EditReportForm
                  onSubmit={(data) => onSaveEdit("new", data)}
                  onCancel={onCancelEdit}
                  inspectionStartDate={group.startDate}
                  initialValues={{
                    date: format(new Date(), 'yyyy-MM-dd'),
                    inspectors: [],
                    description: ""
                  }}
                />
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full hover:bg-background/50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddReport()
                  }}
                >
                  + Add Daily Report
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}

      {/* Delete Report Dialog */}
      <DeleteConfirmationDialog
        isOpen={showReportDeleteDialog}
        onClose={() => {
          setShowReportDeleteDialog(false)
          setReportToDelete(null)
        }}
        onConfirm={confirmReportDelete}
        title="Delete Daily Report"
        description="Are you sure you want to delete this daily report? This action cannot be undone."
      />

      {/* Delete Inspection Dialog */}
      <DeleteConfirmationDialog
        isOpen={showInspectionDeleteDialog}
        onClose={() => setShowInspectionDeleteDialog(false)}
        onConfirm={confirmInspectionDelete}
        title="Delete Inspection"
        description="Are you sure you want to delete this inspection? All daily reports associated with this inspection will be permanently deleted. This action cannot be undone."
      />
    </Card>
  )
}
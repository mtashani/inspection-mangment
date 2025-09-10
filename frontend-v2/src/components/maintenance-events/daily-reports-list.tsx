'use client'

import { DailyReport } from '@/types/maintenance-events'
import { DailyReportCard } from './daily-report-card'
import { VirtualizedDailyReportsList } from './virtualized-daily-reports-list'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Calendar, User } from 'lucide-react'
import { shouldVirtualize, getVirtualizationConfig } from '@/lib/virtualization-config'

interface DailyReportsListProps {
  reports: DailyReport[]
  compact?: boolean
  showInspectionInfo?: boolean
  onEdit?: (report: DailyReport) => void
  onView?: (report: DailyReport) => void
  onDelete?: (report: DailyReport) => void
  enableVirtualization?: boolean
}

export function DailyReportsList({ 
  reports, 
  compact = false,
  showInspectionInfo = false,
  onEdit,
  onView,
  onDelete,
  enableVirtualization = true
}: DailyReportsListProps) {
  // Determine if we should use virtualization
  const useVirtualization = enableVirtualization && 
    shouldVirtualize(reports.length, 'dailyReportsList')

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">No daily reports found</h3>
            <p className="text-sm text-muted-foreground">
              No daily reports have been created yet for this inspection.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use virtualized list for large datasets
  if (useVirtualization) {
    const config = getVirtualizationConfig('dailyReportsList')
    
    return (
      <VirtualizedDailyReportsList
        reports={reports}
        compact={compact}
        showInspectionInfo={showInspectionInfo}
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete}
        enableVirtualization={true}
        height={config.containerHeight}
        threshold={config.threshold}
      />
    )
  }

  // Use regular list layout for smaller datasets
  return (
    <div className="space-y-4">
      {/* Reports Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>
          {reports.length} report{reports.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Reports List */}
      <div className={compact ? "space-y-2" : "space-y-4"}>
        {reports.map((report) => (
          <DailyReportCard
            key={report.id}
            report={report}
            compact={compact}
            onEdit={onEdit ? () => onEdit(report) : undefined}
            onView={onView ? () => onView(report) : undefined}
            onDelete={onDelete ? () => onDelete(report) : undefined}
            showInspectionInfo={showInspectionInfo}
          />
        ))}
      </div>
    </div>
  )
}
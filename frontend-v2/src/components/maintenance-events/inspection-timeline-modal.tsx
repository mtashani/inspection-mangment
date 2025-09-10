'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Inspection, DailyReport } from '@/types/maintenance-events'
import { useDailyReports } from '@/hooks/use-maintenance-events'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  Clock,
  ClipboardList,
  Lightbulb,
  Shield,
  User,
  FileText,
  CheckCircle,
  Play
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InspectionTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  inspection: Inspection
}

interface TimelineEvent {
  id: string
  type: 'inspection_start' | 'report' | 'inspection_end'
  date: string
  title: string
  description?: string
  report?: DailyReport
  icon: React.ReactNode
  color: string
}

export function InspectionTimelineModal({ 
  isOpen, 
  onClose, 
  inspection 
}: InspectionTimelineModalProps) {
  const { data: dailyReports, isLoading } = useDailyReports({ 
    inspectionId: inspection.id 
  })

  // Create timeline events
  const createTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = []

    // Inspection start event
    events.push({
      id: 'start',
      type: 'inspection_start',
      date: inspection.start_date,
      title: 'Inspection Started',
      description: `${inspection.title} began`,
      icon: <Play className="h-4 w-4" />,
      color: 'bg-blue-500'
    })

    // Daily reports
    if (dailyReports) {
      dailyReports.forEach((report) => {
        events.push({
          id: report.id.toString(),
          type: 'report',
          date: report.report_date,
          title: `Daily Report`,
          description: report.description,
          report: report,
          icon: <FileText className="h-4 w-4" />,
          color: 'bg-green-500'
        })
      })
    }

    // Inspection end event (if completed)
    if (inspection.status === 'Completed' && (inspection.end_date || inspection.actual_end_date)) {
      const endDate = inspection.actual_end_date || inspection.end_date
      events.push({
        id: 'end',
        type: 'inspection_end',
        date: endDate!,
        title: 'Inspection Completed',
        description: `Inspection was completed on ${format(new Date(endDate!), 'MMM dd, yyyy')}`,
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'bg-emerald-500'
      })
    }

    // Sort by date
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const timelineEvents = createTimelineEvents()

  const renderReportContent = (report: DailyReport) => (
    <div className="space-y-3 mt-3">
      {/* Inspector */}
      {report.inspector_names && (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Inspector(s):</span>
          <span className="font-medium">{report.inspector_names}</span>
        </div>
      )}

      {/* Professional sections */}
      {report.findings && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-700 text-sm">Findings</span>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
            {report.findings}
          </p>
        </div>
      )}

      {report.recommendations && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-700 text-sm">Recommendations</span>
          </div>
          <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">
            {report.recommendations}
          </p>
        </div>
      )}

      {report.safety_notes && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-700 text-sm">Safety Notes</span>
          </div>
          <p className="text-sm text-orange-800 leading-relaxed whitespace-pre-wrap">
            {report.safety_notes}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Inspection Timeline
          </DialogTitle>
          <DialogDescription className="mt-1">
            {inspection.inspection_number} - {inspection.title}
          </DialogDescription>
        </DialogHeader>

        {/* Timeline Header Info */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <div className="font-medium">
                  {inspection.actual_end_date || inspection.end_date ? (
                    <>
                      {Math.ceil((
                        new Date(inspection.actual_end_date || inspection.end_date!).getTime() - 
                        new Date(inspection.start_date).getTime()
                      ) / (1000 * 60 * 60 * 24))} days
                      {inspection.actual_end_date && inspection.end_date && inspection.actual_end_date !== inspection.end_date && (
                        <span className="text-xs text-muted-foreground block">
                          (Planned: {Math.ceil((new Date(inspection.end_date).getTime() - new Date(inspection.start_date).getTime()) / (1000 * 60 * 60 * 24))} days)
                        </span>
                      )}
                    </>
                  ) : (
                    'Ongoing'
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Reports:</span>
                <div className="font-medium">
                  {dailyReports?.length || 0} daily reports
                </div>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline events */}
            <div className="space-y-6">
              {timelineEvents.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={cn(
                    "relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-white",
                    event.color
                  )}>
                    {event.icon}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="bg-card border rounded-lg p-4 shadow-sm">
                      {/* Event header */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-lg">{event.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(event.date), 'MMM dd, yyyy')}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {format(new Date(event.date), 'HH:mm')}
                          </Badge>
                        </div>
                      </div>

                      {/* Event description */}
                      {event.description && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {event.description}
                        </p>
                      )}

                      {/* Report content */}
                      {event.report && renderReportContent(event.report)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading timeline...</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && timelineEvents.length === 1 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Daily reports will appear here as they are created.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
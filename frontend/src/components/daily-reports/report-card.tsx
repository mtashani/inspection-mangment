"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Users } from "lucide-react"
import { DailyReport, InspectionStatus } from "./types"
import { useInspectors } from "@/contexts/inspectors-context"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ReportCardProps {
  report: DailyReport
  onEdit: () => void
  isInDateRange?: boolean
  inspectionStatus: InspectionStatus
  selectedInspector?: string
}

export const ReportCard = ({ 
  report, 
  onEdit, 
  isInDateRange,
  inspectionStatus,
  selectedInspector
}: ReportCardProps) => {
  const { getInspectorName } = useInspectors()

  const inspectorNames = report.inspectors
    .map(id => getInspectorName(id))
    .filter(Boolean)
    .join(", ")

  const hasSelectedInspector = selectedInspector && selectedInspector !== "all" &&
    report.inspectors.includes(selectedInspector)

  const isEditable = inspectionStatus === 'IN_PROGRESS'
  const statusDisplayClass = isEditable ? "hover:shadow-sm transition-shadow" : ""

  return (
    <Card className={cn(
      "w-full",
      isInDateRange && "bg-green-200",
      hasSelectedInspector && "bg-cyan-200",
      statusDisplayClass
    )}>
      <CardContent className="p-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">
                {format(new Date(report.date), "MMM d, yyyy")}
              </div>
              {inspectorNames && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {inspectorNames}
                </div>
              )}
            </div>
            {isEditable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {report.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
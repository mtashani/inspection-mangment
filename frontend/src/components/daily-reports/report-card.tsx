"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { InspectionStatus } from "./types"
import { useInspectors } from "@/contexts/inspectors-context"

interface ReportCardProps {
  report: {
    id: string
    date: string
    inspectors: string[]
    description: string
  }
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
  const isHighlighted = selectedInspector && report.inspectors.includes(selectedInspector)
  const isDateHighlighted = isInDateRange && inspectionStatus === 'IN_PROGRESS'
  
  return (
    <Card
      className={cn(
        "flex-1 group relative overflow-hidden",
        "transition-all duration-300",
        "hover:shadow-md",
        isHighlighted && "ring-1 ring-primary/20",
        inspectionStatus === 'COMPLETED' ? "bg-gradient-to-br from-green-500/2 via-green-500/5 to-green-500/10" :
        isDateHighlighted ? "bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20 shadow-primary/10" :
        "bg-gradient-to-br from-gray-500/2 via-gray-500/5 to-gray-500/10"
      )}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium",
              isDateHighlighted && "text-primary"
            )}>
              {format(new Date(report.date), "MMM d, yyyy")}
            </span>
            {isHighlighted && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                Selected Inspector
              </span>
            )}
            {isDateHighlighted && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                In Range
              </span>
            )}
          </div>
          {inspectionStatus === 'IN_PROGRESS' && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-1">
          {report.inspectors.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {report.inspectors.map((inspectorId) => (
                <span
                  key={inspectorId}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    selectedInspector === inspectorId
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {getInspectorName(inspectorId)}
                </span>
              ))}
            </div>
          )}

          {report.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {report.description}
            </p>
          )}
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={cn(
          "absolute inset-0 opacity-[0.08] mix-blend-multiply dark:mix-blend-soft-light",
          "bg-gradient-to-br from-transparent via-background/5 to-background/10"
        )} />
      </div>
    </Card>
  )
}
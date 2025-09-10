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
      variant="elevated"
      className={cn(
        "flex-1 group relative overflow-hidden",
        "transition-all duration-300",
        "hover:shadow-[calc(var(--depth)*2)]",
        isHighlighted && "ring-1 ring-[var(--color-primary)]/20",
        inspectionStatus === 'COMPLETED' ? "bg-gradient-to-br from-[var(--color-success)]/5 via-[var(--color-success)]/10 to-[var(--color-success)]/15" :
        isDateHighlighted ? "bg-gradient-to-br from-[var(--color-primary)]/5 via-[var(--color-primary)]/10 to-[var(--color-primary)]/20 shadow-[var(--color-primary)]/10" :
        "bg-gradient-to-br from-[var(--color-base-300)]/20 via-[var(--color-base-300)]/30 to-[var(--color-base-300)]/40"
      )}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium",
              isDateHighlighted ? "text-[var(--color-primary)]" : "text-[var(--color-base-content)]"
            )}>
              {format(new Date(report.date), "MMM d, yyyy")}
            </span>
            {isHighlighted && (
              <span className="px-1.5 py-0.5 rounded-[var(--radius-selector)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs">
                Selected Inspector
              </span>
            )}
            {isDateHighlighted && (
              <span className="px-1.5 py-0.5 rounded-[var(--radius-selector)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs">
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
                    "inline-flex items-center px-2 py-0.5 rounded-[var(--radius-selector)] text-xs font-medium",
                    selectedInspector === inspectorId
                      ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)]"
                      : "bg-[var(--color-secondary)] text-[var(--color-secondary-content)]"
                  )}
                >
                  {getInspectorName(inspectorId)}
                </span>
              ))}
            </div>
          )}

          {report.description && (
            <p className="text-sm text-[var(--color-base-content)]/70 line-clamp-2">
              {report.description}
            </p>
          )}
        </div>
      </div>

      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={cn(
          "absolute inset-0 opacity-[0.08] mix-blend-multiply",
          "bg-gradient-to-br from-transparent via-[var(--color-base-content)]/5 to-[var(--color-base-content)]/10"
        )} />
      </div>
    </Card>
  )
}
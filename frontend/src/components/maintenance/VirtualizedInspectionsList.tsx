'use client'

import React, { useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { EnhancedInspection, InspectionGroup } from '@/types/enhanced-maintenance'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VirtualizedInspectionsListProps {
  inspections: EnhancedInspection[]
  height: number
  itemHeight: number
  onInspectionClick?: (inspection: EnhancedInspection) => void
  onInspectionUpdate?: (inspectionId: string, data: Partial<EnhancedInspection>) => void
  className?: string
}

interface InspectionItemProps {
  index: number
  style: React.CSSProperties
  data: {
    inspections: EnhancedInspection[]
    onInspectionClick?: (inspection: EnhancedInspection) => void
    onInspectionUpdate?: (inspectionId: string, data: Partial<EnhancedInspection>) => void
  }
}

const InspectionItem: React.FC<InspectionItemProps> = ({ index, style, data }) => {
  const { inspections, onInspectionClick, onInspectionUpdate } = data
  const inspection = inspections[index]

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Planned':
        return 'bg-blue-100 text-blue-800'
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    })
  }

  const handleClick = useCallback(() => {
    if (onInspectionClick) {
      onInspectionClick(inspection)
    }
  }, [inspection, onInspectionClick])

  const handleUpdate = useCallback((data: Partial<EnhancedInspection>) => {
    if (onInspectionUpdate) {
      onInspectionUpdate(inspection.id, data)
    }
  }, [inspection.id, onInspectionUpdate])

  return (
    <div style={style} className="px-2 py-1">
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-md transition-shadow duration-200",
          "border-l-4 border-l-blue-500"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {inspection.equipment?.tag || 'Unknown Equipment'}
              </span>
              {inspection.isFirstTimeInspection && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                  First Time
                </Badge>
              )}
            </div>
            <Badge className={cn("text-xs", getStatusColor(inspection.status))}>
              {inspection.status}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span className="font-medium">{inspection.inspectionNumber}</span>
              <span>{inspection.title}</span>
            </div>

            <div className="flex items-center space-x-4">
              <span>
                {formatDate(inspection.startDate)}
                {inspection.endDate && ` - ${formatDate(inspection.endDate)}`}
              </span>
              
              {inspection.dailyReports.length > 0 && (
                <span>{inspection.dailyReports.length} reports</span>
              )}
            </div>

            {inspection.requesterDetails && (
              <div className="text-xs text-gray-500">
                Requested by: {inspection.requesterDetails.name}
              </div>
            )}
          </div>

          {inspection.canEdit && (
            <div className="mt-3 flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpdate({ status: 'Completed' })
                }}
                className="text-xs h-7"
              >
                Complete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const VirtualizedInspectionsList: React.FC<VirtualizedInspectionsListProps> = ({
  inspections,
  height,
  itemHeight = 120,
  onInspectionClick,
  onInspectionUpdate,
  className
}) => {
  const itemData = useMemo(() => ({
    inspections,
    onInspectionClick,
    onInspectionUpdate
  }), [inspections, onInspectionClick, onInspectionUpdate])

  if (inspections.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <div className="text-center text-gray-500">
          <p>No inspections found</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={inspections.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5} // Render 5 extra items for smooth scrolling
      >
        {InspectionItem}
      </List>
    </div>
  )
}

export default VirtualizedInspectionsList

'use client'

// Hierarchical List Component
// Displays maintenance events, inspections, and daily reports in a hierarchical structure

import React, { useMemo } from 'react'
import { 
  ChevronRight,
  ChevronDown,
  Settings,
  FileText,
  Calendar,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Play,
  Square
} from 'lucide-react'

import {
  HierarchicalItem,
  MaintenanceEventItem,
  InspectionItem,
  DailyReportItem,
  MaintenanceEventStatus,
  InspectionStatus,
  HierarchicalListProps
} from '@/types/daily-reports'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format, isValid, parseISO } from 'date-fns'
import { InlineLoadingSkeleton } from './daily-reports-skeleton'

// Helper function for safe date formatting
function safeFormatDate(dateString: string | undefined, formatStr: string = 'MMM dd, yyyy'): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
    if (!isValid(date)) return 'Invalid Date'
    return format(date, formatStr)
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', dateString)
    return 'Invalid Date'
  }
}

/**
 * Hierarchical List Component
 * 
 * Displays items in a hierarchical structure:
 * - Maintenance Events (top level)
 *   - Inspections (second level)
 *     - Daily Reports (third level)
 * - Standalone Inspections (top level)
 *   - Daily Reports (second level)
 */
export function HierarchicalList({
  items,
  loading = false,
  onCreateReport,
  onEditReport,
  onDeleteReport,
  onStatusChange,
  onCompleteInspection,
  expandedItems = new Set(),
  onToggleExpanded
}: HierarchicalListProps) {
  if (loading) {
    return <InlineLoadingSkeleton />
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No items found</h3>
          <p className="text-muted-foreground">
            No maintenance events or inspections match your current filters.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <HierarchicalItemCard
          key={item.id}
          item={item}
          expanded={expandedItems.has(item.id)}
          onToggleExpanded={() => onToggleExpanded?.(item.id)}
          onCreateReport={onCreateReport}
          onEditReport={onEditReport}
          onDeleteReport={onDeleteReport}
          onStatusChange={onStatusChange}
          onCompleteInspection={onCompleteInspection}
          expandedItems={expandedItems}
          onToggleChildExpanded={onToggleExpanded}
        />
      ))}
    </div>
  )
}

/**
 * Individual Hierarchical Item Card
 */
interface HierarchicalItemCardProps {
  item: HierarchicalItem
  expanded: boolean
  onToggleExpanded: () => void
  onCreateReport?: (inspectionId: number) => void
  onEditReport?: (reportId: number) => void
  onDeleteReport?: (reportId: number) => void
  onStatusChange?: (eventId: number, status: MaintenanceEventStatus) => void
  onCompleteInspection?: (inspectionId: number) => void
  expandedItems?: Set<string>
  onToggleChildExpanded?: (itemId: string) => void
}

function HierarchicalItemCard({
  item,
  expanded,
  onToggleExpanded,
  onCreateReport,
  onEditReport,
  onDeleteReport,
  onStatusChange,
  onCompleteInspection,
  expandedItems,
  onToggleChildExpanded
}: HierarchicalItemCardProps) {
  if (item.type === 'maintenance') {
    return (
      <MaintenanceEventCard
        event={item}
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
        onStatusChange={onStatusChange}
        onCreateReport={onCreateReport}
        onEditReport={onEditReport}
        onDeleteReport={onDeleteReport}
        onCompleteInspection={onCompleteInspection}
        expandedItems={expandedItems}
        onToggleChildExpanded={onToggleChildExpanded}
      />
    )
  } else {
    return (
      <InspectionCard
        inspection={item}
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
        onCreateReport={onCreateReport}
        onEditReport={onEditReport}
        onDeleteReport={onDeleteReport}
        onCompleteInspection={onCompleteInspection}
        expandedItems={expandedItems}
        onToggleChildExpanded={onToggleChildExpanded}
      />
    )
  }
}

/**
 * Maintenance Event Card Component
 */
interface MaintenanceEventCardProps {
  event: MaintenanceEventItem
  expanded: boolean
  onToggleExpanded: () => void
  onStatusChange?: (eventId: number, status: MaintenanceEventStatus) => void
  onCreateReport?: (inspectionId: number) => void
  onEditReport?: (reportId: number) => void
  onDeleteReport?: (reportId: number) => void
  onCompleteInspection?: (inspectionId: number) => void
  expandedItems?: Set<string>
  onToggleChildExpanded?: (itemId: string) => void
}

function MaintenanceEventCard({
  event,
  expanded,
  onToggleExpanded,
  onStatusChange,
  onCreateReport,
  onEditReport,
  onDeleteReport,
  onCompleteInspection,
  expandedItems,
  onToggleChildExpanded
}: MaintenanceEventCardProps) {
  const { data: eventData, children = [] } = event

  const statusColor = getMaintenanceEventStatusColor(eventData.status)
  const hasChildren = children.length > 0

  return (
    <Card className={cn("border-l-4", `border-l-${statusColor}`)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="p-1 h-6 w-6"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Settings className={cn("h-5 w-5", `text-${statusColor}`)} />
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-base">{eventData.title}</h3>
                <Badge variant={getStatusVariant(eventData.status)}>
                  {eventData.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {eventData.eventNumber} • {eventData.eventType}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {eventData.completionPercentage !== undefined && (
              <div className="text-right">
                <div className="text-sm font-medium">
                  {eventData.completionPercentage}%
                </div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            )}
            
            <MaintenanceEventActions
              event={eventData}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Planned Start</div>
            <div className="font-medium">
              {safeFormatDate(eventData.plannedStartDate)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Planned End</div>
            <div className="font-medium">
              {safeFormatDate(eventData.plannedEndDate)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Category</div>
            <div className="font-medium">{eventData.category || 'Standard'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Inspections</div>
            <div className="font-medium">{children.length}</div>
          </div>
        </div>

        {eventData.description && (
          <p className="text-sm text-muted-foreground">{eventData.description}</p>
        )}

        {/* Sub-events and Inspections */}
        {expanded && hasChildren && (
          <div className="space-y-3 ml-6 border-l-2 border-muted pl-4">
            {children.map((inspection) => (
              <InspectionCard
                key={inspection.id}
                inspection={inspection}
                expanded={expandedItems?.has(inspection.id) || false}
                onToggleExpanded={() => onToggleChildExpanded?.(inspection.id)}
                onCreateReport={onCreateReport}
                onEditReport={onEditReport}
                onDeleteReport={onDeleteReport}
                onCompleteInspection={onCompleteInspection}
                isNested={true}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Inspection Card Component
 */
interface InspectionCardProps {
  inspection: InspectionItem
  expanded: boolean
  onToggleExpanded: () => void
  onCreateReport?: (inspectionId: number) => void
  onEditReport?: (reportId: number) => void
  onDeleteReport?: (reportId: number) => void
  onCompleteInspection?: (inspectionId: number) => void
  expandedItems?: Set<string>
  onToggleChildExpanded?: (itemId: string) => void
  isNested?: boolean
}

function InspectionCard({
  inspection,
  expanded,
  onToggleExpanded,
  onCreateReport,
  onEditReport,
  onDeleteReport,
  onCompleteInspection,
  isNested = false
}: InspectionCardProps) {
  const { data: inspectionData, children = [] } = inspection
  const statusColor = getInspectionStatusColor(inspectionData.status)
  const hasReports = children.length > 0

  const CardComponent = isNested ? 'div' : Card

  return (
    <CardComponent className={cn(
      isNested ? "border rounded-lg p-4 bg-card" : "",
      `border-l-4 border-l-${statusColor}`
    )}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {hasReports && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="p-1 h-6 w-6"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <FileText className={cn("h-4 w-4", `text-${statusColor}`)} />
            
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{inspectionData.title}</h4>
                <Badge variant={getStatusVariant(inspectionData.status)} className="text-xs">
                  {inspectionData.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {inspectionData.inspectionNumber}
                {inspectionData.equipment?.tag && ` • ${inspectionData.equipment.tag}`}
              </p>
            </div>
          </div>

          <InspectionActions
            inspection={inspectionData}
            onCreateReport={onCreateReport}
            onCompleteInspection={onCompleteInspection}
          />
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">Start Date</div>
            <div className="font-medium">
              {safeFormatDate(inspectionData.startDate)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Department</div>
            <div className="font-medium">{inspectionData.requestingDepartment}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Reports</div>
            <div className="font-medium">{children.length}</div>
          </div>
        </div>

        {/* Daily Reports */}
        {expanded && hasReports && (
          <div className="space-y-2 ml-6">
            <div className="text-xs font-medium text-muted-foreground">Daily Reports</div>
            {children.map((report) => (
              <DailyReportCard
                key={report.id}
                report={report}
                onEdit={onEditReport}
                onDelete={onDeleteReport}
              />
            ))}
          </div>
        )}
      </div>
    </CardComponent>
  )
}

/**
 * Daily Report Card Component
 */
interface DailyReportCardProps {
  report: DailyReportItem
  onEdit?: (reportId: number) => void
  onDelete?: (reportId: number) => void
}

function DailyReportCard({ report, onEdit, onDelete }: DailyReportCardProps) {
  const { data: reportData } = report

  return (
    <div className="border rounded-lg p-3 bg-muted/50 hover:bg-muted/70 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">
          {safeFormatDate(reportData.reportDate)}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(reportData.id)}
            className="h-6 w-6 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(reportData.id)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {reportData.description}
      </p>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {reportData.inspectorNames || 'No inspector assigned'}
        </span>
        <span className="text-muted-foreground">
          {safeFormatDate(reportData.createdAt, 'HH:mm')}
        </span>
      </div>
    </div>
  )
}

/**
 * Maintenance Event Actions Component
 */
function MaintenanceEventActions({
  event,
  onStatusChange
}: {
  event: any
  onStatusChange?: (eventId: number, status: MaintenanceEventStatus) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {event.status === MaintenanceEventStatus.PLANNED && (
          <DropdownMenuItem onClick={() => onStatusChange?.(event.id, MaintenanceEventStatus.IN_PROGRESS)}>
            <Play className="h-4 w-4 mr-2" />
            Start Event
          </DropdownMenuItem>
        )}
        
        {event.status === MaintenanceEventStatus.IN_PROGRESS && (
          <DropdownMenuItem onClick={() => onStatusChange?.(event.id, MaintenanceEventStatus.COMPLETED)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Event
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => onStatusChange?.(event.id, MaintenanceEventStatus.ON_HOLD)}>
          <Square className="h-4 w-4 mr-2" />
          Put on Hold
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          <Edit className="h-4 w-4 mr-2" />
          Edit Event
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Inspection Actions Component
 */
function InspectionActions({
  inspection,
  onCreateReport,
  onCompleteInspection
}: {
  inspection: any
  onCreateReport?: (inspectionId: number) => void
  onCompleteInspection?: (inspectionId: number) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onCreateReport?.(inspection.id)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Report
        </DropdownMenuItem>
        
        {inspection.status !== InspectionStatus.COMPLETED && (
          <DropdownMenuItem onClick={() => onCompleteInspection?.(inspection.id)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Inspection
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          <Edit className="h-4 w-4 mr-2" />
          Edit Inspection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Utility functions
function getMaintenanceEventStatusColor(status: MaintenanceEventStatus): string {
  switch (status) {
    case MaintenanceEventStatus.PLANNED:
      return 'blue-500'
    case MaintenanceEventStatus.IN_PROGRESS:
      return 'yellow-500'
    case MaintenanceEventStatus.COMPLETED:
      return 'green-500'
    case MaintenanceEventStatus.ON_HOLD:
      return 'gray-500'
    case MaintenanceEventStatus.CANCELLED:
      return 'red-500'
    default:
      return 'gray-500'
  }
}

function getInspectionStatusColor(status: InspectionStatus): string {
  switch (status) {
    case InspectionStatus.PLANNED:
      return 'blue-500'
    case InspectionStatus.IN_PROGRESS:
      return 'yellow-500'
    case InspectionStatus.COMPLETED:
      return 'green-500'
    case InspectionStatus.ON_HOLD:
      return 'gray-500'
    case InspectionStatus.CANCELLED:
      return 'red-500'
    default:
      return 'gray-500'
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case MaintenanceEventStatus.COMPLETED:
    case InspectionStatus.COMPLETED:
      return 'default'
    case MaintenanceEventStatus.IN_PROGRESS:
    case InspectionStatus.IN_PROGRESS:
      return 'secondary'
    case MaintenanceEventStatus.CANCELLED:
    case InspectionStatus.CANCELLED:
      return 'destructive'
    default:
      return 'outline'
  }
}
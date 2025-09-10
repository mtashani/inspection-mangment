// Daily Reports Types
// This file contains all TypeScript interfaces and types for the Daily Reports system

// Enums
export enum InspectionStatus {
  Planned = 'Planned',
  InProgress = 'InProgress',
  Completed = 'Completed', 
  Cancelled = 'Cancelled',
  Postponed = 'Postponed'
}

export enum MaintenanceEventStatus {
  Planned = 'Planned',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Postponed = 'Postponed'
}

export enum MaintenanceEventType {
  Routine = 'Routine',
  Overhaul = 'Overhaul',
  Emergency = 'Emergency',
  Preventive = 'Preventive',
  Corrective = 'Corrective',
  Custom = 'Custom'
}

export enum RefineryDepartment {
  Operations = 'Operations',
  Inspection = 'Inspection',
  Maintenance = 'Maintenance',
  Engineering = 'Engineering',
  Safety = 'Safety',
  QualityControl = 'QualityControl',
  ProcessEngineering = 'ProcessEngineering',
  Instrumentation = 'Instrumentation',
  Electrical = 'Electrical',
  Mechanical = 'Mechanical'
}

// Core data interfaces
export interface DailyReport {
  id: number
  inspectionId: number
  reportDate: string
  description: string
  inspectorIds: number[]
  inspectorNames?: string
  findings?: string
  recommendations?: string
  weatherConditions?: string
  safetyNotes?: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

export interface Equipment {
  id: number
  tag: string
  description?: string
  unit: string
  train?: string
  equipment_type: string
  installation_date?: string
  operating_pressure?: number
  operating_temperature?: number
  material?: string
  inspection_interval_months?: number
  p_and_id?: string
  data_sheet_path?: string
  properties?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: number
  inspectionNumber: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  status: InspectionStatus
  equipmentId: number
  equipment?: Equipment
  requestingDepartment: RefineryDepartment
  workOrder?: string
  permitNumber?: string
  dailyReports?: DailyReport[]
  canCreateReport?: boolean
  canEdit?: boolean
  canComplete?: boolean
  canDelete?: boolean
  createdAt: string
  updatedAt: string
}

export interface MaintenanceSubEvent {
  id: number
  parentEventId: number
  subEventNumber: string
  title: string
  description?: string
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  status: MaintenanceEventStatus
  notes?: string
  inspections?: Inspection[]
}

export interface MaintenanceEvent {
  id: number
  eventNumber: string
  title: string
  description?: string
  eventType: MaintenanceEventType
  status: MaintenanceEventStatus
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  subEvents?: MaintenanceSubEvent[]
  inspections?: Inspection[]
  completionPercentage?: number
  category?: 'Simple' | 'Complex'
  createdBy?: string
  createdAt: string
  updatedAt: string
}

// Summary and statistics interfaces
export interface DailyReportsSummary {
  activeInspections: number
  completedInspections: number
  activeMaintenanceEvents: number
  completedMaintenanceEvents: number
  reportsThisMonth: number
  activeInspectors: number
  overdueItems: number
  upcomingDeadlines: number
}

export interface EquipmentStatusBreakdown {
  planned: number
  underInspection: number
  completed: number
}

export interface RequesterBreakdown {
  requester: string
  department: string
  plannedCount: number
  activeCount: number
  completedCount: number
  totalCount: number
}

export interface EventStatistics {
  totalPlannedInspections: number
  activeInspections: number
  completedInspections: number
  firstTimeInspectionsCount: number
  equipmentStatusBreakdown: EquipmentStatusBreakdown
}

// Filter and search interfaces
export interface DailyReportsFilters {
  search?: string
  status?: InspectionStatus | MaintenanceEventStatus
  inspector?: string
  requester?: string
  department?: RefineryDepartment
  equipmentTag?: string
  dateRange?: {
    from: string
    to: string
  }
  hasReports?: boolean
  showCompleted?: boolean
  inspectionNumber?: string
  eventNumber?: string
  reportDateRange?: {
    from: string
    to: string
  }
  inspectorName?: string
  weatherConditions?: string[]
  safetyIssues?: boolean
  findingsPresent?: boolean
  recommendationsPresent?: boolean
  inspectionIds?: number[]  // Add support for multiple inspection IDs
}

export interface DailyReportsSearchParams {
  query?: string
  filters: DailyReportsFilters
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

// Hierarchical display types
export type HierarchicalItem = MaintenanceEventItem | InspectionItem

export interface MaintenanceEventItem {
  type: 'maintenance'
  id: string
  data: MaintenanceEvent
  children?: InspectionItem[]
}

export interface InspectionItem {
  type: 'inspection'
  id: string
  data: Inspection
  children?: DailyReportItem[]
}

export interface DailyReportItem {
  type: 'daily-report'
  id: string
  data: DailyReport
}

// API request/response types
export interface CreateDailyReportRequest {
  inspectionId: number
  reportDate: string
  description: string
  inspectorIds: number[]
  findings?: string
  recommendations?: string
  weatherConditions?: string
  safetyNotes?: string
}

export interface UpdateDailyReportRequest {
  description?: string
  inspectorIds?: number[]
  findings?: string
  recommendations?: string
  weatherConditions?: string
  safetyNotes?: string
}

export interface CreateInspectionRequest {
  inspectionNumber: string
  title: string
  description?: string
  startDate: string
  equipmentId: number
  requestingDepartment: RefineryDepartment
  workOrder?: string
  permitNumber?: string
}

export interface UpdateInspectionRequest {
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  status?: InspectionStatus
}

export interface UpdateMaintenanceEventStatusRequest {
  status: MaintenanceEventStatus
  notes?: string
}

// API response wrapper types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  meta?: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

export interface ApiErrorResponse {
  success: false
  error: string
  message: string
  details?: unknown
  statusCode: number
}

export interface PaginationInfo {
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Component prop types
export interface DailyReportsPageProps {
  searchParams?: {
    search?: string
    status?: string
    inspector?: string
    dateFrom?: string
    dateTo?: string
  }
}

export interface DailyReportsContainerProps {
  initialFilters?: DailyReportsFilters
}

export interface SummaryCardsProps {
  summary: DailyReportsSummary
  loading?: boolean
  onCardClick?: (metric: string) => void
}

export interface FilterPanelProps {
  filters: DailyReportsFilters
  onFiltersChange: (filters: DailyReportsFilters) => void
  onClearFilters: () => void
  availableOptions: {
    inspectors: string[]
    requesters: string[]
    equipmentTags: string[]
  }
}

export interface HierarchicalListProps {
  items: HierarchicalItem[]
  loading?: boolean
  onItemUpdate?: (item: HierarchicalItem) => void
  onCreateReport?: (inspectionId: number) => void
  expandedItems?: Set<string>
  onToggleExpanded?: (itemId: string) => void
}

export interface MaintenanceEventCardProps {
  event: MaintenanceEvent
  expanded?: boolean
  onToggleExpanded?: () => void
  onStatusChange?: (status: MaintenanceEventStatus) => void
  showActions?: boolean
}

export interface InspectionCardProps {
  inspection: Inspection
  onUpdate?: (inspection: Inspection) => void
  onCreateReport?: () => void
  onComplete?: () => void
  showActions?: boolean
}

export interface DailyReportCardProps {
  report: DailyReport
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
}

export interface CreateReportModalProps {
  isOpen: boolean
  onClose: () => void
  inspectionId: number
  onSuccess?: (report: DailyReport) => void
}

export interface EditReportModalProps {
  isOpen: boolean
  onClose: () => void
  report: DailyReport
  onSuccess?: (report: DailyReport) => void
}

// Form validation types
export interface DailyReportFormData {
  reportDate: string
  description: string
  inspectorIds: number[]
  findings?: string
  recommendations?: string
  weatherConditions?: string
  safetyNotes?: string
}

export interface InspectionFormData {
  inspectionNumber: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  equipmentId: number
  requestingDepartment: RefineryDepartment
  workOrder?: string
  permitNumber?: string
}

// Utility types for type safety
export type ItemType<T extends HierarchicalItem> = T extends MaintenanceEventItem ? 'maintenance' : 'inspection'

export type StatusType<T extends HierarchicalItem> = T extends MaintenanceEventItem 
  ? MaintenanceEventStatus 
  : InspectionStatus

export type UpdateDataType<T extends HierarchicalItem> = T extends MaintenanceEventItem
  ? Partial<MaintenanceEvent>
  : Partial<Inspection>

// Error types
export class DailyReportsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message)
    this.name = 'DailyReportsApiError'
  }
}

// Hook return types
export interface UseDailyReportsResult {
  data: DailyReport[] | undefined
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseDailyReportsSummaryResult {
  data: DailyReportsSummary | undefined
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseMaintenanceEventsResult {
  data: MaintenanceEvent[] | undefined
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseInspectionsResult {
  data: Inspection[] | undefined
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}
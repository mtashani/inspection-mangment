// Enhanced Daily Reports Types
// This file contains types for the enhanced daily reports system

import { 
  EnhancedInspection, 
  DailyReport, 
  InspectionStatus, 
  RefineryDepartment,
  HierarchicalItem,
  InspectionGroup,
  MaintenanceEventGroup,
  FilterOptions,
  DailyReportsSummary,
  DailyReportsSearchParams
} from './enhanced-maintenance'

import { MaintenanceEvent, MaintenanceEventStatus, MaintenanceEventType } from './maintenance'
import { Equipment } from './equipment'

// Re-export commonly used types
export {
  InspectionStatus,
  RefineryDepartment,
  HierarchicalItem,
  InspectionGroup,
  MaintenanceEventGroup,
  FilterOptions,
  DailyReportsSummary,
  DailyReportsSearchParams
}

// Enhanced Daily Reports specific types
export interface Inspection extends EnhancedInspection {
  // Additional fields specific to daily reports view
  reportCount?: number
  lastReportDate?: string
  overdueReports?: number
  averageReportInterval?: number
}

// Extended filter options for daily reports
export interface DailyReportsFilters extends FilterOptions {
  inspectionNumber?: string
  eventNumber?: string
  hasReports?: boolean
  reportDateRange?: {
    from: string
    to: string
  }
  inspectorName?: string
  weatherConditions?: string[]
  safetyIssues?: boolean
  findingsPresent?: boolean
  recommendationsPresent?: boolean
}

// Hierarchical data response
export interface HierarchicalDataResponse {
  items: HierarchicalItem[]
  total: number
  hasMore: boolean
  summary: DailyReportsSummary
  filters: {
    availableInspectors: string[]
    availableRequesters: string[]
    availableDepartments: RefineryDepartment[]
    availableEquipmentTags: string[]
    dateRange: {
      earliest: string
      latest: string
    }
  }
}

// Enhanced search parameters
export interface EnhancedDailyReportsSearchParams extends DailyReportsSearchParams {
  groupBy?: 'date' | 'equipment' | 'inspector' | 'department' | 'status'
  includeSubEvents?: boolean
  includeCompletedEvents?: boolean
  showOnlyOverdue?: boolean
  showOnlyWithReports?: boolean
}

// Statistics and analytics
export interface DailyReportsAnalytics {
  reportingTrends: {
    date: string
    reportCount: number
    inspectionCount: number
    averageReportsPerInspection: number
  }[]
  inspectorProductivity: {
    inspectorName: string
    reportCount: number
    inspectionCount: number
    averageReportsPerDay: number
    lastReportDate: string
  }[]
  departmentBreakdown: {
    department: RefineryDepartment
    activeInspections: number
    completedInspections: number
    totalReports: number
    averageInspectionDuration: number
  }[]
  equipmentUtilization: {
    equipmentTag: string
    equipmentName?: string
    inspectionCount: number
    reportCount: number
    lastInspectionDate?: string
    utilizationScore: number
  }[]
  timelineData: {
    date: string
    events: {
      type: 'inspection_started' | 'inspection_completed' | 'report_created' | 'event_started' | 'event_completed'
      id: string
      title: string
      description?: string
    }[]
  }[]
}

// Component-specific types
export interface EnhancedDailyReportsPageProps {
  initialFilters?: DailyReportsFilters
  defaultView?: 'hierarchical' | 'timeline' | 'analytics'
  enableExport?: boolean
  enableBulkOperations?: boolean
}

export interface HierarchicalListProps {
  items: HierarchicalItem[]
  loading?: boolean
  error?: string | null
  onItemClick?: (item: HierarchicalItem) => void
  onItemUpdate?: (item: HierarchicalItem) => void
  onItemDelete?: (itemId: string, itemType: 'inspection' | 'maintenance') => void
  selectedItems?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  groupBy?: 'date' | 'equipment' | 'inspector' | 'department' | 'status'
  showActions?: boolean
  showSelection?: boolean
  expandedItems?: string[]
  onToggleExpanded?: (itemId: string) => void
}

export interface InspectionCardProps {
  inspection: InspectionGroup
  expanded?: boolean
  onToggleExpanded?: (inspectionId: string) => void
  onUpdate?: (inspection: InspectionGroup) => void
  onDelete?: (inspectionId: string) => void
  onCreateReport?: (inspectionId: string) => void
  onComplete?: (inspectionId: string) => void
  showActions?: boolean
  selected?: boolean
  onSelectionChange?: (inspectionId: string, selected: boolean) => void
}

export interface MaintenanceEventCardProps {
  event: MaintenanceEventGroup
  expanded?: boolean
  onToggleExpanded?: (eventId: string) => void
  onUpdate?: (event: MaintenanceEventGroup) => void
  onDelete?: (eventId: string) => void
  onStart?: (eventId: string) => void
  onComplete?: (eventId: string) => void
  showActions?: boolean
  selected?: boolean
  onSelectionChange?: (eventId: string, selected: boolean) => void
}

export interface DailyReportCardProps {
  report: DailyReport
  onUpdate?: (report: DailyReport) => void
  onDelete?: (reportId: string) => void
  showActions?: boolean
  compact?: boolean
}

// Bulk operations
export interface BulkOperationOptions {
  operation: 'update_status' | 'delete' | 'export' | 'assign_inspector'
  itemIds: string[]
  itemType: 'inspection' | 'maintenance'
  parameters?: {
    status?: InspectionStatus | MaintenanceEventStatus
    inspectorId?: number
    notes?: string
  }
}

export interface BulkOperationResult {
  success: boolean
  successCount: number
  failureCount: number
  failures: {
    id: string
    error: string
    details?: string
  }[]
  message: string
}

// Export and reporting
export interface ReportExportOptions {
  format: 'excel' | 'csv' | 'pdf'
  filters: DailyReportsFilters
  includeImages: boolean
  includeAttachments: boolean
  groupBy?: 'date' | 'equipment' | 'inspector' | 'department'
  dateRange: {
    from: string
    to: string
  }
  customFields?: string[]
}

export interface ReportExportResult {
  success: boolean
  exportUrl: string
  format: string
  fileName: string
  fileSize: number
  exportedAt: string
  recordCount: number
  message: string
}

// Real-time updates
export interface RealtimeUpdate {
  type: 'inspection_created' | 'inspection_updated' | 'inspection_deleted' | 
        'report_created' | 'report_updated' | 'report_deleted' |
        'event_created' | 'event_updated' | 'event_deleted'
  id: string
  data: any
  timestamp: string
  userId?: string
  userName?: string
}

export interface RealtimeSubscription {
  subscribe: (callback: (update: RealtimeUpdate) => void) => void
  unsubscribe: () => void
  isConnected: boolean
  reconnect: () => void
}

// Notification types
export interface NotificationMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
  relatedItemId?: string
  relatedItemType?: 'inspection' | 'maintenance' | 'report'
}

// User preferences
export interface UserPreferences {
  defaultView: 'hierarchical' | 'timeline' | 'analytics'
  itemsPerPage: number
  defaultFilters: DailyReportsFilters
  autoRefresh: boolean
  refreshInterval: number
  notifications: {
    emailEnabled: boolean
    pushEnabled: boolean
    overdueReminders: boolean
    reportDeadlines: boolean
    statusChanges: boolean
  }
  displayOptions: {
    showCompletedItems: boolean
    showCancelledItems: boolean
    groupByDefault: 'date' | 'equipment' | 'inspector' | 'department' | 'status' | 'none'
    sortByDefault: 'date' | 'status' | 'equipment' | 'inspector'
    sortOrderDefault: 'asc' | 'desc'
  }
}

// Validation types
export interface ValidationRule {
  field: string
  rule: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: {
    field: string
    message: string
  }[]
}

// Form types
export interface InspectionFormData {
  inspectionNumber: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  equipmentId: string
  requestingDepartment: RefineryDepartment
  requesterDetails: {
    name: string
    department: RefineryDepartment
    contactInfo?: string
  }
  workOrder?: string
  permitNumber?: string
  priority?: string
  notes?: string
}

export interface DailyReportFormData {
  reportDate: string
  description: string
  inspectorIds: number[]
  findings?: string
  recommendations?: string
  weatherConditions?: string
  safetyNotes?: string
  images?: File[]
  attachments?: File[]
}

export interface MaintenanceEventFormData {
  eventNumber: string
  title: string
  description?: string
  eventType: MaintenanceEventType
  category: 'Simple' | 'Complex'
  plannedStartDate: string
  plannedEndDate: string
  notes?: string
  subEvents?: {
    title: string
    description?: string
    plannedStartDate: string
    plannedEndDate: string
  }[]
}

// Hook return types
export interface UseEnhancedDailyReportsResult {
  data: HierarchicalDataResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateFilters: (filters: DailyReportsFilters) => void
  updateSearch: (query: string) => void
  updateSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  loadMore: () => Promise<void>
  hasMore: boolean
}

export interface UseRealtimeUpdatesResult {
  subscription: RealtimeSubscription | null
  connected: boolean
  lastUpdate: RealtimeUpdate | null
  connect: () => void
  disconnect: () => void
}

export interface UseBulkOperationsResult {
  selectedItems: string[]
  selectItem: (id: string) => void
  deselectItem: (id: string) => void
  selectAll: (items: HierarchicalItem[]) => void
  deselectAll: () => void
  executeOperation: (operation: BulkOperationOptions) => Promise<BulkOperationResult>
  isExecuting: boolean
}

// Context types
export interface DailyReportsContextValue {
  filters: DailyReportsFilters
  searchQuery: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  selectedItems: string[]
  expandedItems: string[]
  userPreferences: UserPreferences
  updateFilters: (filters: Partial<DailyReportsFilters>) => void
  updateSearch: (query: string) => void
  updateSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  toggleItemSelection: (id: string) => void
  toggleItemExpansion: (id: string) => void
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  clearFilters: () => void
  resetView: () => void
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
  details?: any
  statusCode: number
}

// Utility types for type safety
export type ItemType<T extends HierarchicalItem> = T extends InspectionGroup ? 'inspection' : 'maintenance'

export type StatusType<T extends HierarchicalItem> = T extends InspectionGroup 
  ? InspectionStatus 
  : MaintenanceEventStatus

export type UpdateDataType<T extends HierarchicalItem> = T extends InspectionGroup
  ? Partial<InspectionGroup>
  : Partial<MaintenanceEventGroup>
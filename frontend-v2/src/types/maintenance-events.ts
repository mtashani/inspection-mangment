// Enums
export enum MaintenanceEventType {
  Routine = 'Routine',
  Overhaul = 'Overhaul',
  Emergency = 'Emergency',
  Preventive = 'Preventive',
  Corrective = 'Corrective',
  Custom = 'Custom'
}

export enum MaintenanceEventStatus {
  Planned = 'Planned',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Postponed = 'Postponed'
}

export enum InspectionStatus {
  Planned = 'Planned',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Postponed = 'Postponed'
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

export enum OverhaulSubType {
  TotalOverhaul = 'TotalOverhaul',
  TrainOverhaul = 'TrainOverhaul', 
  UnitOverhaul = 'UnitOverhaul',
  NormalOverhaul = 'NormalOverhaul'
}

export enum MaintenanceEventCategory {
  Simple = 'Simple',
  Complex = 'Complex'
}

// Core data types
export interface MaintenanceEvent {
  id: number
  event_number: string
  title: string
  description?: string
  event_type: MaintenanceEventType
  event_category?: MaintenanceEventCategory
  status: MaintenanceEventStatus
  planned_start_date: string
  planned_end_date: string
  actual_start_date?: string
  actual_end_date?: string
  created_by?: string
  approved_by?: string
  approval_date?: string
  notes?: string
  sub_events_count?: number
  inspections_count?: number
  direct_inspections_count?: number
  created_at: string
  updated_at: string
}

export interface MaintenanceSubEvent {
  id: number
  parent_event_id: number
  sub_event_number: string
  title: string
  description?: string
  sub_type?: OverhaulSubType
  status: MaintenanceEventStatus
  planned_start_date: string
  planned_end_date: string
  actual_start_date?: string
  actual_end_date?: string
  completion_percentage: number
  notes?: string
  inspections_count?: number
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: number
  inspection_number: string
  title: string
  description?: string
  // Unified model date fields
  planned_start_date?: string
  planned_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  // Legacy compatibility (for old data)
  start_date: string
  end_date?: string
  status: InspectionStatus
  equipment_id: number
  equipment_tag?: string
  equipment_description?: string
  requesting_department: RefineryDepartment
  final_report?: string
  work_order?: string
  permit_number?: string
  daily_reports_count?: number
  maintenance_event_id?: number
  maintenance_sub_event_id?: number
  inspection_plan_id?: number
  // Enhanced fields for planned vs unplanned tracking
  is_planned: boolean
  unplanned_reason?: string
  created_at: string
  updated_at: string
}

export interface DailyReport {
  id: number
  inspection_id: number
  report_date: string
  description: string
  inspector_ids: number[]
  inspector_names?: string
  findings?: string
  recommendations?: string
  weather_conditions?: string
  safety_notes?: string
  attachments?: string[]
  man_hours?: number
  created_at: string
  updated_at: string
}

// New types for analytics and equipment tracking
export interface Equipment {
  id: number
  tag: string
  description?: string
  equipment_type: string
  unit: string
  status: string
}

export interface EventSummary {
  event_id: number
  event_number: string
  event_title: string
  planned_count: number
  planned_done: number
  unplanned_count: number
  unplanned_done: number
  completion_rate_planned?: number
  overall_completion_rate: number
  total_inspections: number
  total_completed: number
}

export interface EquipmentAnalysis {
  equipment_tag: string
  equipment_description?: string
  planned_count: number
  planned_done: number
  unplanned_done: number
  gap: number
  coverage_rate?: number
}

export interface GapAnalysis {
  event_id: number
  equipment_analysis: EquipmentAnalysis[]
  summary: {
    total_equipment: number
    equipment_with_gaps: number
    fully_covered_equipment: number
  }
}

export interface DepartmentPerformance {
  department: string
  planned_count: number
  completed_count: number
  completion_rate: number
}

export interface DepartmentAnalysis {
  event_id: number
  department_performance: DepartmentPerformance[]
  summary: {
    total_departments: number
    best_performer?: string
    average_completion_rate: number
  }
}

export interface TimelineAnalysis {
  inspection_id: number
  inspection_number: string
  equipment_tag: string
  start_delay_days: number
  end_delay_days: number
  is_on_time: boolean
}

export interface TimelineAnalysisResponse {
  event_id: number
  timeline_analysis: TimelineAnalysis[]
  summary: {
    total_completed_inspections: number
    on_time_count: number
    on_time_rate: number
    avg_start_delay_days: number
    avg_end_delay_days: number
  }
}

export interface InspectionTeam {
  id: number
  inspection_id: number
  inspector_id: number
  role: string
  man_hours: number
  assigned_at: string
}

export interface StatusHistory {
  id: number
  entity_type: string
  entity_id: number
  from_status?: string
  to_status: string
  changed_by?: string
  changed_at: string
  note?: string
}

export interface Equipment {
  id: number
  tag: string
  description?: string
  equipment_type: string
  unit: string
  status: string
}

// New Analytics Types
export interface SubEventAnalysis {
  sub_event_id: number
  sub_event_number: string
  title: string
  status: MaintenanceEventStatus
  planned_count: number
  planned_done: number
  completion_rate?: number
  planned_start_date: string
  planned_end_date: string
  actual_start_date?: string
  actual_end_date?: string
  is_overdue: boolean
  completion_percentage: number
}

export interface SubEventsBreakdown {
  event_id: number
  event_number: string
  event_title: string
  sub_events_analysis: SubEventAnalysis[]
  summary: {
    total_sub_events: number
    completed_sub_events: number
    overdue_sub_events: number
    completion_rate: number
  }
}

export interface UnplannedReasonBreakdown {
  reason: string
  count: number
  completed: number
  completion_rate: number
}

export interface UnplannedAnalysis {
  event_id: number
  event_number: string
  event_title: string
  unplanned_count: number
  unplanned_completed: number
  unplanned_share_percent: number
  unplanned_completion_rate: number
  reason_breakdown: UnplannedReasonBreakdown[]
  total_inspections: number
  total_completed: number
}

export interface BacklogItem {
  plan_id: number
  equipment_tag: string
  plan_description?: string
  planned_start_date?: string
  planned_end_date?: string
  priority: string
  requester: string
  inspection_id?: number
  current_status: string
  days_overdue: number
  is_overdue: boolean
}

export interface EventBacklog {
  event_id: number
  event_number: string
  event_title: string
  backlog_items: BacklogItem[]
  summary: {
    total_backlog: number
    overdue_items: number
    critical_items: number
    oldest_overdue_days: number
  }
}

export interface InspectorWorkload {
  inspector_id: number
  inspector_name: string
  inspections_count: number
  total_man_hours: number
  avg_hours_per_inspection: number
  completed_inspections: number
  completion_rate: number
}

export interface InspectorsWorkloadResponse {
  event_id: number
  event_number: string
  event_title: string
  inspector_workload: InspectorWorkload[]
  summary: {
    total_inspectors: number
    total_man_hours: number
    avg_hours_per_inspector: number
    top_performer?: string
  }
}

export interface EquipmentCoverageItem {
  equipment_id: number
  equipment_tag: string
  equipment_description?: string
  is_inspected: boolean
  inspection_count: number
  is_first_time: boolean
}

export interface EquipmentCoverage {
  event_id: number
  event_number: string
  event_title: string
  equipment_coverage: EquipmentCoverageItem[]
  summary: {
    total_equipment: number
    inspected_equipment: number
    first_time_equipment: number
    coverage_percentage: number
    first_time_percentage: number
  }
}

export interface DailyReportCoverage {
  inspection_id: number
  inspection_number: string
  start_date: string
  end_date: string
  expected_report_days: number
  actual_report_days: number
  coverage_percentage: number
  missing_days: string[]
  is_compliant: boolean
  reports_summary: {
    total_reports: number
    unique_days: number
    missing_count: number
  }
}

export interface WorkflowPermissions {
  can_create_sub_event: boolean
  can_create_inspection_plan: boolean
  can_start_event: boolean
  can_add_unplanned_inspection: boolean
  is_simple_event: boolean
  is_complex_event: boolean
  current_status: string
}

export interface WorkflowPermissionsResponse {
  event_id: number
  permissions: WorkflowPermissions
}

export interface EquipmentDetail extends Equipment {
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

// Summary and filter types
export interface EventsSummary {
  totalEvents: number
  activeEvents: number
  completedEvents: number
  overdueEvents: number
  totalInspections: number
  activeInspections: number
  plannedInspections: number
  unplannedInspections: number
  completedInspections: number
  totalReports: number
  reportsThisMonth: number
}

export interface EventStatistics {
  event_id: number
  event_number: string
  event_title: string
  total_planned_inspections: number
  active_inspections: number
  completed_inspections: number
  first_time_inspections_count: number
  equipment_status_breakdown: {
    planned: number
    under_inspection: number
    completed: number
  }
  inspection_status_breakdown: Record<string, number>
  priority_breakdown: Record<string, number>
  completion_percentage: number
  event_dates: {
    planned_start_date: string
    planned_end_date: string
    actual_start_date?: string
    actual_end_date?: string
  }
}

export interface EventsFilters {
  search?: string
  status?: MaintenanceEventStatus
  eventType?: MaintenanceEventType
  dateFrom?: string
  dateTo?: string
}

export interface InspectionsFilters {
  eventId?: string
  subEventId?: number
  search?: string
  status?: InspectionStatus
  equipmentTag?: string
  dateFrom?: string
  dateTo?: string
  dateField?: 'planned_start_date' | 'planned_end_date' | 'actual_start_date' | 'actual_end_date'
  // Pagination parameters
  skip?: number
  limit?: number
}

// Pagination response types
export interface PaginationInfo {
  total_count: number
  total_pages: number
  current_page: number
  page_size: number
  has_next: boolean
  has_previous: boolean
}

export interface PaginatedInspectionsResponse {
  data: Inspection[]
  pagination: PaginationInfo
}

export interface DailyReportsFilters {
  inspectionId?: number
  search?: string
  dateFrom?: string
  dateTo?: string
}

// API request/response types
export interface CreateDailyReportRequest {
  inspection_id: number
  report_date: string
  description: string
  inspector_ids: number[]
  findings?: string
  recommendations?: string
  weather_conditions?: string
  safety_notes?: string
  attachments?: string[]
}

export interface UpdateDailyReportRequest {
  report_date?: string
  description?: string
  inspector_ids?: number[]
  findings?: string
  recommendations?: string
  weather_conditions?: string
  safety_notes?: string
  attachments?: string[]
}

export interface CreateMaintenanceEventRequest {
  event_number: string
  title: string
  description?: string
  event_type: MaintenanceEventType
  planned_start_date: string
  planned_end_date: string
  created_by?: string
  notes?: string
}

export interface UpdateMaintenanceEventRequest {
  title?: string
  description?: string
  event_type?: MaintenanceEventType
  status?: MaintenanceEventStatus
  planned_start_date?: string
  planned_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  approved_by?: string
  notes?: string
}

// Utility types
export type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface TabItem {
  id: string
  label: string
  badge?: number
  icon?: React.ComponentType<{ className?: string }>
  subEvent?: MaintenanceSubEvent
  isHeader?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

// Plan Inspection types
export interface CreatePlanInspectionRequest {
  inspection_number: string
  title: string
  description?: string
  equipment_id: number
  maintenance_event_id?: number
  maintenance_sub_event_id?: number
  // For planned inspections: use planned date fields
  planned_start_date?: string
  planned_end_date?: string
  // For unplanned inspections: use actual date (starts immediately)
  actual_start_date?: string
  requesting_department: RefineryDepartment
  work_order?: string
  permit_number?: string
  is_planned: boolean
  // For unplanned inspections
  unplanned_reason?: string
}

export interface UpdateInspectionRequest {
  inspection_number?: string
  title?: string
  description?: string
  equipment_id?: number
  planned_start_date?: string
  planned_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  requesting_department?: RefineryDepartment
  work_order?: string
  permit_number?: string
  unplanned_reason?: string
  status?: InspectionStatus
}
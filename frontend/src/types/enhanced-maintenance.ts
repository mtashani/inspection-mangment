// Enhanced Maintenance Event Management Types
// This file contains the enhanced types for the maintenance event management system

import {
  MaintenanceEvent,
  MaintenanceSubEvent,
  MaintenanceEventStatus,
  MaintenanceEventType,
} from "./maintenance";
import { Equipment } from "./equipment";

// Enhanced Enums
export enum InspectionPlanStatus {
  Planned = "Planned",
  InProgress = "InProgress",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export enum MaintenanceEventCategory {
  Simple = "Simple",
  Complex = "Complex",
}

export enum InspectionPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Critical = "Critical",
}

export enum InspectionStatus {
  Planned = "Planned",
  InProgress = "InProgress",
  Completed = "Completed",
  Cancelled = "Cancelled",
  OnHold = "OnHold",
}

export enum RefineryDepartment {
  Operations = "Operations",
  Maintenance = "Maintenance",
  Engineering = "Engineering",
  Safety = "Safety",
  Quality = "Quality",
  Inspection = "Inspection",
}

// Core Enhanced Interfaces

export interface InspectionPlan {
  id: string;
  maintenanceEventId?: string;
  maintenanceSubEventId?: string;
  equipmentTag: string;
  requester: string;
  priority: InspectionPriority;
  status: InspectionPlanStatus;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedInspection {
  id: string;
  inspectionNumber: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: InspectionStatus;
  equipmentId: string;
  equipment?: Equipment;
  inspectionPlanId?: string;
  inspectionPlan?: InspectionPlan;
  requestingDepartment: RefineryDepartment;
  requesterDetails?: {
    name: string;
    department: RefineryDepartment;
    contactInfo?: string;
  };
  workOrder?: string;
  permitNumber?: string;
  isFirstTimeInspection: boolean;
  dailyReports: DailyReport[];
  reports: ProfessionalReport[]; // Professional reports
  canCreateReport: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReport {
  id: string;
  inspectionId: string;
  reportDate: string;
  description: string;
  inspectorIds: number[];
  inspectorNames: string;
  findings?: string;
  recommendations?: string;
  weatherConditions?: string;
  safetyNotes?: string;
  imageUrls?: string[];
  attachmentUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedMaintenanceEvent extends MaintenanceEvent {
  category: MaintenanceEventCategory;
  plannedInspections: InspectionPlan[];
  activeInspections: EnhancedInspection[];
  completedInspections: EnhancedInspection[];
  statistics: EventStatistics;
  requesterBreakdown: RequesterBreakdown[];
}

export interface EventStatistics {
  totalPlannedInspections: number;
  activeInspections: number;
  completedInspections: number;
  firstTimeInspectionsCount: number;
  equipmentStatusBreakdown: {
    planned: number;
    underInspection: number;
    completed: number;
  };
}

export interface RequesterBreakdown {
  requester: string;
  department: RefineryDepartment;
  plannedCount: number;
  activeCount: number;
  completedCount: number;
  totalCount: number;
}

// Filter and Search Interfaces

export interface FilterOptions {
  dateRange?: {
    from: string;
    to: string;
  };
  status?: InspectionStatus[];
  inspectors?: string[];
  equipmentTag?: string;
  requester?: string[];
  department?: RefineryDepartment[];
  priority?: InspectionPriority[];
  eventType?: MaintenanceEventType[];
  eventStatus?: MaintenanceEventStatus[];
}

export interface DailyReportsSearchParams {
  query?: string;
  filters: FilterOptions;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}

export interface DailyReportsSummary {
  activeInspections: number;
  completedInspections: number;
  activeMaintenanceEvents: number;
  completedMaintenanceEvents: number;
  reportsThisMonth: number;
  activeInspectors: number;
  overdueItems: number;
  upcomingDeadlines: number;
}

// Hierarchical Display Types

export type HierarchicalItemType = "maintenance" | "inspection";

export interface BaseHierarchicalItem {
  type: HierarchicalItemType;
  id: string;
  title: string;
  status: InspectionStatus | MaintenanceEventStatus;
  canEdit: boolean;
  canDelete: boolean;
}

export interface InspectionGroup extends BaseHierarchicalItem {
  type: "inspection";
  equipmentTag: string;
  equipmentDescription?: string;
  inspectionNumber: string;
  startDate: string;
  endDate?: string;
  status: InspectionStatus;
  requestingDepartment: RefineryDepartment;
  dailyReports: DailyReport[];
  reports: ProfessionalReport[];
  canCreateReport: boolean;
  canComplete: boolean;
  reportCount: number;
  lastReportDate?: string;
  isFirstTime: boolean;
  priority?: InspectionPriority;
}

export interface MaintenanceEventGroup extends BaseHierarchicalItem {
  type: "maintenance";
  eventNumber: string;
  description?: string;
  eventType: MaintenanceEventType;
  status: MaintenanceEventStatus;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  subEvents: MaintenanceSubEvent[];
  completionPercentage: number;
  canStart: boolean;
  canComplete: boolean;
  overdueSubEvents: number;
  completedSubEvents: number;
  category: MaintenanceEventCategory;
  statistics?: EventStatistics;
}

export type HierarchicalItem = InspectionGroup | MaintenanceEventGroup;

// API Request/Response Types

export interface InspectionPlanCreateRequest {
  maintenanceEventId?: string;
  maintenanceSubEventId?: string;
  equipmentTag: string;
  requester: string;
  priority: InspectionPriority;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export interface InspectionPlanUpdateRequest {
  equipmentTag?: string;
  requester?: string;
  priority?: InspectionPriority;
  status?: InspectionPlanStatus;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export interface InspectionCreateRequest {
  inspectionNumber: string;
  title: string;
  description?: string;
  startDate: string;
  equipmentId: string;
  inspectionPlanId?: string;
  requestingDepartment: RefineryDepartment;
  requesterDetails?: {
    name: string;
    department: RefineryDepartment;
    contactInfo?: string;
  };
  workOrder?: string;
  permitNumber?: string;
}

export interface InspectionUpdateRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: InspectionStatus;
  requestingDepartment?: RefineryDepartment;
  requesterDetails?: {
    name: string;
    department: RefineryDepartment;
    contactInfo?: string;
  };
  workOrder?: string;
  permitNumber?: string;
}

export interface DailyReportCreateRequest {
  inspectionId: string;
  reportDate: string;
  description: string;
  inspectorIds: number[];
  findings?: string;
  recommendations?: string;
  weatherConditions?: string;
  safetyNotes?: string;
}

export interface DailyReportUpdateRequest {
  reportDate?: string;
  description?: string;
  inspectorIds?: number[];
  findings?: string;
  recommendations?: string;
  weatherConditions?: string;
  safetyNotes?: string;
}

// Statistics and Analytics Types

export interface EventStatisticsResponse {
  eventId: string;
  totalPlannedInspections: number;
  activeInspections: number;
  completedInspections: number;
  firstTimeInspectionsCount: number;
  equipmentStatusBreakdown: {
    planned: number;
    underInspection: number;
    completed: number;
  };
  completionPercentage: number;
  averageInspectionDuration: number;
  overdueInspections: number;
}

export interface RequesterBreakdownResponse {
  eventId: string;
  breakdown: RequesterBreakdown[];
  totalRequesters: number;
  mostActiveRequester: string;
  departmentDistribution: Record<RefineryDepartment, number>;
}

export interface EquipmentStatusResponse {
  eventId: string;
  equipmentStatuses: {
    equipmentTag: string;
    equipmentName?: string;
    status: "planned" | "under_inspection" | "completed";
    inspectionCount: number;
    lastInspectionDate?: string;
    nextInspectionDate?: string;
    isFirstTime: boolean;
  }[];
  totalEquipment: number;
  statusCounts: {
    planned: number;
    underInspection: number;
    completed: number;
  };
}

// Error Types

export interface ApiError {
  error: string;
  message: string;
  details?: {
    field?: string;
    constraint?: string;
    suggestion?: string;
  };
}

export class MaintenanceApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "MaintenanceApiError";
  }
}

// Utility Types

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface BulkOperationResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  failures: {
    id: string;
    error: string;
  }[];
}

export interface ExportOptions {
  format: "excel" | "csv" | "pdf";
  filters?: FilterOptions;
  includeImages?: boolean;
  includeAttachments?: boolean;
}

export interface ExportResult {
  success: boolean;
  exportUrl: string;
  format: string;
  message: string;
  exportedAt: string;
  fileSize?: number;
}

// Component Props Types

export interface MaintenanceEventGroupProps {
  event: EnhancedMaintenanceEvent;
  onEventUpdate?: (event: EnhancedMaintenanceEvent) => void;
  onInspectionCreate?: (inspectionPlan: InspectionPlanCreateRequest) => void;
  onInspectionUpdate?: (
    inspectionId: string,
    data: InspectionUpdateRequest
  ) => void;
  onStatusChange?: (eventId: string, status: MaintenanceEventStatus) => void;
  expanded?: boolean;
  onToggleExpanded?: (eventId: string) => void;
}

export interface FilterAndSearchPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onClearFilters?: () => void;
  availableInspectors?: string[];
  availableRequesters?: string[];
  availableDepartments?: RefineryDepartment[];
}

export interface InspectionPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  subEventId?: string;
  onSubmit: (data: InspectionPlanCreateRequest) => void;
  availableEquipment?: Equipment[];
  availableRequesters?: string[];
}

export interface EventStatusIndicatorProps {
  status: MaintenanceEventStatus;
  completionPercentage?: number;
  canChangeStatus?: boolean;
  onStatusChange?: (newStatus: MaintenanceEventStatus) => void;
  size?: "sm" | "md" | "lg";
}

// Hook Types

export interface UseMaintenanceEventsOptions {
  filters?: FilterOptions;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseMaintenanceEventsResult {
  events: EnhancedMaintenanceEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createEvent: (data: Partial<EnhancedMaintenanceEvent>) => Promise<EnhancedMaintenanceEvent>;
  updateEvent: (id: string, data: unknown) => Promise<EnhancedMaintenanceEvent>;
  deleteEvent: (id: string) => Promise<void>;
}

export interface UseInspectionPlanningOptions {
  eventId?: string;
  subEventId?: string;
  autoRefresh?: boolean;
}

export interface UseInspectionPlanningResult {
  plans: InspectionPlan[];
  loading: boolean;
  error: string | null;
  createPlan: (data: InspectionPlanCreateRequest) => Promise<InspectionPlan>;
  updatePlan: (
    id: string,
    data: InspectionPlanUpdateRequest
  ) => Promise<InspectionPlan>;
  deletePlan: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// Inspection Plan Request Types
export interface InspectionPlanCreateRequest {
  equipmentTag: string
  inspectionType: string
  priority: InspectionPriority
  scheduledDate: string
  requester: string
  department: RefineryDepartment
  description?: string
  notes?: string
}

export interface InspectionPlanUpdateRequest extends Partial<InspectionPlanCreateRequest> {
  id: string
}

// Professional Report Types
export interface ProfessionalReport {
  id: string
  title: string
  type: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  content?: Record<string, unknown>
}

// Toast Notification Types
export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

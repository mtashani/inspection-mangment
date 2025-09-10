/**
 * Admin Panel Types and Interfaces
 * Comprehensive type definitions for the admin panel functionality
 */

// Base types
export type InspectorType = 'INTERNAL' | 'EXTERNAL' | 'CONTRACTOR'
export type SpecialtyCode = 'PSV' | 'CRANE' | 'CORROSION'
export type AttendanceStatus = 'WORKING' | 'RESTING' | 'OVERTIME' | 'ABSENT' | 'SICK_LEAVE' | 'VACATION'
export type WorkCycleType = 'CONTINUOUS' | 'SHIFT_BASED' | 'CUSTOM'
export type ReportType = 'PSV' | 'CRANE' | 'CORROSION' | 'GENERAL' | 'MAINTENANCE'
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'file' | 'image'
export type BulkOperationType = 'IMPORT' | 'EXPORT' | 'UPDATE' | 'DELETE'
export type OperationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

// Enum-like constants for iteration
export const AttendanceStatus = {
  WORKING: 'WORKING' as const,
  RESTING: 'RESTING' as const,
  OVERTIME: 'OVERTIME' as const,
  ABSENT: 'ABSENT' as const,
  SICK_LEAVE: 'SICK_LEAVE' as const,
  VACATION: 'VACATION' as const,
} as const

export const InspectorType = {
  mechanical: 'mechanical' as const,
  corrosion: 'corrosion' as const,
  ndt: 'ndt' as const,
  electrical: 'electrical' as const,
  instrumentation: 'instrumentation' as const,
  civil: 'civil' as const,
  general: 'general' as const,
  psv_operator: 'psv_operator' as const,
  lifting_equipment_operator: 'lifting_equipment_operator' as const,
} as const

export const SpecialtyCode = {
  PSV: 'PSV' as const,
  CRANE: 'CRANE' as const,
  CORROSION: 'CORROSION' as const,
} as const

// Dashboard Statistics
export interface AdminDashboardStats {
  totalInspectors: number
  activeInspectors: number
  specialtyCounts: {
    psv: number
    crane: number
    corrosion: number
  }
  upcomingBirthdays: number
  attendanceOverview: {
    presentToday: number
    totalScheduled: number
    attendanceRate: number
  }
  recentActivity: {
    newInspectors: number
    completedInspections: number
    pendingReports: number
  }
}

// Inspector Management
export interface Inspector {
  id: number
  firstName: string
  lastName: string
  employeeId: string
  nationalId: string
  email: string
  phone?: string
  department?: string
  dateOfBirth?: string
  birthPlace?: string
  maritalStatus?: string
  inspectorType: InspectorType
  specialties: SpecialtyCode[]
  // Education
  educationDegree?: string
  educationField?: string
  educationInstitute?: string
  graduationYear?: number
  // Experience
  yearsExperience: number
  previousCompanies?: string[]
  // Status and authentication
  active: boolean
  username?: string
  canLogin: boolean
  attendanceTrackingEnabled: boolean
  // Payroll
  baseHourlyRate?: number
  overtimeMultiplier?: number
  nightShiftMultiplier?: number
  onCallMultiplier?: number
  // Other
  workCycle?: WorkCycle
  profileImageUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface InspectorFormData {
  firstName: string
  lastName: string
  employeeId: string
  nationalId: string
  email: string
  phone?: string
  department?: string
  dateOfBirth?: string
  birthPlace?: string
  maritalStatus?: string
  inspectorType: InspectorType
  specialties: SpecialtyCode[]
  // Education
  educationDegree?: string
  educationField?: string
  educationInstitute?: string
  graduationYear?: number
  // Experience
  yearsExperience: number
  previousCompanies?: string[]
  // Status and authentication
  active: boolean
  username?: string
  password?: string
  canLogin: boolean
  attendanceTrackingEnabled: boolean
  workCycleStartDate?: string
  workCycleType?: string
  // Payroll
  baseHourlyRate?: number
  overtimeMultiplier?: number
  nightShiftMultiplier?: number
  onCallMultiplier?: number
  // Other
  workCycle?: WorkCycleData
  notes?: string
}

export interface InspectorFilters {
  search?: string
  inspectorType?: InspectorType
  specialties?: SpecialtyCode[]
  active?: boolean
  canLogin?: boolean
}

export interface SpecialtyPermissions {
  PSV: boolean
  CRANE: boolean
  CORROSION: boolean
}

// Attendance Management
export interface AttendanceRecord {
  id: number
  inspectorId: number
  date: string
  status: AttendanceStatus
  workHours: number
  overtimeHours: number
  notes?: string
  isOverride: boolean
  overrideReason?: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceDay {
  date: string
  status: AttendanceStatus
  workHours: number
  overtimeHours: number
  isOverride: boolean
  overrideReason?: string
}

export interface WorkCycle {
  id: number
  inspectorId: number
  type: WorkCycleType
  startDate: string
  workDays: number
  restDays: number
  customPattern?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkCycleData {
  type: WorkCycleType
  startDate: string
  workDays: number
  restDays: number
  customPattern?: string[]
}

export interface AttendanceFilters {
  inspectorId?: number
  startDate?: string
  endDate?: string
  status?: AttendanceStatus[]
  includeOverrides?: boolean
}

// Template Management
export interface ReportTemplate {
  id: string
  name: string
  description: string
  reportType: ReportType
  isActive: boolean
  sections: TemplateSection[]
  fieldsCount: number
  version: number
  createdBy: string
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
}

export interface TemplateSection {
  id: string
  title: string
  description?: string
  order: number
  fields: TemplateField[]
  isRequired: boolean
}

export interface TemplateField {
  id: string
  name: string
  type: FieldType
  label: string
  description?: string
  required: boolean
  options?: string[]
  validation?: FieldValidation
  defaultValue?: unknown
  order: number
}

export interface FieldValidation {
  min?: number
  max?: number
  pattern?: string
  customRules?: string[]
}

export interface TemplateFormData {
  name: string
  description: string
  reportType: ReportType
  isActive: boolean
  sections: TemplateSectionData[]
}

export interface TemplateSectionData {
  title: string
  description?: string
  order: number
  fields: TemplateFieldData[]
  isRequired: boolean
}

export interface TemplateFieldData {
  name: string
  type: FieldType
  label: string
  description?: string
  required: boolean
  options?: string[]
  validation?: FieldValidation
  defaultValue?: unknown
  order: number
}

export interface TemplateFilters {
  search?: string
  reportType?: ReportType
  isActive?: boolean
  createdBy?: string
}

// Payroll Management
export interface PayrollRecord {
  id: number
  inspectorId: number
  inspector: Pick<Inspector, 'id' | 'name' | 'employeeId'>
  month: number
  year: number
  workingDays: number
  restingDays: number
  overtimeDays: number
  totalHours: number
  overtimeHours: number
  baseSalary: number
  overtimePay: number
  bonuses: number
  deductions: number
  totalPay: number
  netPay: number
  isPaid: boolean
  paidAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PayrollCalculation {
  workingDays: number
  restingDays: number
  overtimeDays: number
  totalHours: number
  overtimeHours: number
  baseSalary: number
  overtimePay: number
  bonuses: number
  deductions: number
  totalPay: number
  netPay: number
}

export interface PayrollSettings {
  inspectorId: number
  baseHourlyRate: number
  overtimeMultiplier: number
  standardWorkHours: number
  bonusRules: BonusRule[]
  deductionRules: DeductionRule[]
}

export interface BonusRule {
  id: string
  name: string
  type: 'FIXED' | 'PERCENTAGE' | 'HOURLY'
  value: number
  condition?: string
  isActive: boolean
}

export interface DeductionRule {
  id: string
  name: string
  type: 'FIXED' | 'PERCENTAGE'
  value: number
  condition?: string
  isActive: boolean
}

export interface PayrollFilters {
  inspectorId?: number
  month?: number
  year?: number
  isPaid?: boolean
}

// Bulk Operations
export interface BulkOperation {
  id: string
  type: BulkOperationType
  status: OperationStatus
  fileName?: string
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  errors: BulkOperationError[]
  result?: unknown
  startedAt: string
  completedAt?: string
  createdBy: string
}

export interface BulkOperationError {
  row: number
  field?: string
  message: string
  value?: unknown
}

export interface BulkImportData {
  file: File
  type: 'INSPECTORS' | 'ATTENDANCE' | 'TEMPLATES'
  options: BulkImportOptions
}

export interface BulkImportOptions {
  skipHeader: boolean
  updateExisting: boolean
  validateOnly: boolean
  mapping: Record<string, string>
}

export interface BulkExportOptions {
  type: 'INSPECTORS' | 'ATTENDANCE' | 'PAYROLL' | 'TEMPLATES'
  format: 'CSV' | 'EXCEL' | 'JSON'
  filters?: Record<string, unknown>
  includeHeaders: boolean
  dateRange?: {
    startDate: string
    endDate: string
  }
}

// API Response Types
export interface AdminApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface AdminPaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
  success: boolean
}

export interface AdminApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
  status: number
}

// Navigation and UI
export interface BreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

export interface AdminNavItem {
  title: string
  href: string
  icon?: string
  badge?: string | number
  children?: AdminNavItem[]
}

export interface QuickAction {
  title: string
  description: string
  href: string
  icon: string
  color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

// Permissions and Security
export interface AdminPermissions {
  canManageInspectors: boolean
  canManageAttendance: boolean
  canManageTemplates: boolean
  canViewPayroll: boolean
  canManagePayroll: boolean
  canPerformBulkOperations: boolean
  canViewAuditLogs: boolean
  canManageUsers: boolean
  canAccessSystemSettings: boolean
}

export interface AuditLog {
  id: string
  userId: number
  userName: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, unknown>
  ipAddress: string
  userAgent: string
  createdAt: string
}

// Form and Validation Types
export interface FormFieldError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: FormFieldError[]
}

// Statistics and Analytics
export interface AdminAnalytics {
  inspectorStats: {
    totalActive: number
    totalInactive: number
    bySpecialty: Record<SpecialtyCode, number>
    byType: Record<InspectorType, number>
    recentlyAdded: number
  }
  attendanceStats: {
    averageAttendanceRate: number
    totalWorkingDays: number
    totalOvertimeHours: number
    absenteeismRate: number
  }
  templateStats: {
    totalTemplates: number
    activeTemplates: number
    byType: Record<ReportType, number>
    recentlyUsed: number
  }
  payrollStats: {
    totalPayroll: number
    averageSalary: number
    totalOvertimePay: number
    pendingPayments: number
  }
}

// Export all types for easy importing
export type {
  // Re-export all interfaces and types for convenience
}
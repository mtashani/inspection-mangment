/**
 * Admin Panel Validation Schemas using Zod
 */

import { z } from 'zod'

// Base validation schemas - specialty validation removed
export const inspectorTypeSchema = z.enum(['INTERNAL', 'EXTERNAL', 'CONTRACTOR'])
// specialtyCodeSchema removed - no longer used
export const attendanceStatusSchema = z.enum([
  'WORKING',
  'RESTING', 
  'OVERTIME',
  'ABSENT',
  'SICK_LEAVE',
  'VACATION'
])
export const workCycleTypeSchema = z.enum(['CONTINUOUS', 'SHIFT_BASED', 'CUSTOM'])
export const reportTypeSchema = z.enum(['PSV', 'CRANE', 'CORROSION', 'GENERAL', 'MAINTENANCE'])
export const fieldTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'select',
  'multiselect',
  'textarea',
  'checkbox',
  'file',
  'image'
])

// Inspector validation schemas
export const inspectorFormSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, 'First name can only contain letters and spaces'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, 'Last name can only contain letters and spaces'),
  
  employeeId: z.string()
    .min(1, 'Employee ID is required')
    .min(3, 'Employee ID must be at least 3 characters')
    .max(20, 'Employee ID must be less than 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Employee ID can only contain uppercase letters, numbers, and hyphens'),
  
  nationalId: z.string()
    .min(1, 'National ID is required')
    .length(10, 'National ID must be exactly 10 digits')
    .regex(/^\d{10}$/, 'National ID must contain only digits'),
  
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || /^(\+98|0)?9\d{9}$/.test(val),
      'Invalid Iranian phone number format'
    ),
  
  department: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 100,
      'Department name must be less than 100 characters'
    ),
  
  dateOfBirth: z.string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Invalid date format'
    )
    .refine(
      (val) => !val || new Date(val) < new Date(),
      'Date of birth must be in the past'
    ),
  
  birthPlace: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 100,
      'Birth place must be less than 100 characters'
    ),
  
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'])
    .optional(),
  
  inspectorType: inspectorTypeSchema,
  
  // specialties field removed - no longer required
  
  // Education fields
  educationDegree: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 100,
      'Education degree must be less than 100 characters'
    ),
  
  educationField: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 100,
      'Education field must be less than 100 characters'
    ),
  
  educationInstitute: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 200,
      'Education institute must be less than 200 characters'
    ),
  
  graduationYear: z.number()
    .optional()
    .refine(
      (val) => val === undefined || (val >= 1950 && val <= new Date().getFullYear()),
      'Graduation year must be between 1950 and current year'
    ),
  
  // Experience fields
  yearsExperience: z.number()
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience cannot exceed 50'),
  
  previousCompanies: z.array(z.string())
    .optional(),
  
  // Status and authentication
  active: z.boolean(),
  
  username: z.string()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9_-]{3,20}$/.test(val),
      'Username must be 3-20 characters and contain only letters, numbers, underscore, and hyphen'
    ),
  
  password: z.string()
    .optional(),
  
  canLogin: z.boolean(),
  
  attendanceTrackingEnabled: z.boolean(),
  
  workCycleStartDate: z.string()
    .optional(),
  
  workCycleType: z.enum([
    'full_time',
    'part_time', 
    'contract',
    'fourteen_fourteen',
    'seven_seven',
    'office',
    'guest'
  ]).optional(),
  
  // Payroll fields
  baseHourlyRate: z.number()
    .optional()
    .refine(
      (val) => val === undefined || val >= 0,
      'Base hourly rate must be positive'
    ),
  
  overtimeMultiplier: z.number()
    .optional()
    .refine(
      (val) => val === undefined || (val >= 1 && val <= 5),
      'Overtime multiplier must be between 1 and 5'
    ),
  
  nightShiftMultiplier: z.number()
    .optional()
    .refine(
      (val) => val === undefined || (val >= 1 && val <= 5),
      'Night shift multiplier must be between 1 and 5'
    ),
  
  onCallMultiplier: z.number()
    .optional()
    .refine(
      (val) => val === undefined || (val >= 1 && val <= 5),
      'On-call multiplier must be between 1 and 5'
    ),
  
  notes: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 1000,
      'Notes must be less than 1000 characters'
    )
})

export const inspectorFiltersSchema = z.object({
  search: z.string().optional(),
  inspectorType: inspectorTypeSchema.optional(),
  // specialties filter removed
  active: z.boolean().optional(),
  canLogin: z.boolean().optional()
})

// specialtyPermissionsSchema removed - no longer used

// Attendance validation schemas
export const workCycleDataSchema = z.object({
  type: workCycleTypeSchema,
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid date format'
    ),
  workDays: z.number()
    .min(1, 'Work days must be at least 1')
    .max(30, 'Work days cannot exceed 30'),
  restDays: z.number()
    .min(0, 'Rest days cannot be negative')
    .max(30, 'Rest days cannot exceed 30'),
  customPattern: z.array(z.string()).optional()
}).refine(
  (data) => data.type !== 'CUSTOM' || (data.customPattern && data.customPattern.length > 0),
  'Custom pattern is required for custom work cycle type'
)

export const attendanceRecordSchema = z.object({
  inspectorId: z.number().min(1, 'Inspector ID is required'),
  date: z.string()
    .min(1, 'Date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid date format'
    ),
  status: attendanceStatusSchema,
  workHours: z.number()
    .min(0, 'Work hours cannot be negative')
    .max(24, 'Work hours cannot exceed 24'),
  overtimeHours: z.number()
    .min(0, 'Overtime hours cannot be negative')
    .max(12, 'Overtime hours cannot exceed 12')
    .optional(),
  notes: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Notes must be less than 500 characters'
    ),
  isOverride: z.boolean().optional(),
  overrideReason: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 200,
      'Override reason must be less than 200 characters'
    )
})

export const attendanceFiltersSchema = z.object({
  inspectorId: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.array(attendanceStatusSchema).optional(),
  includeOverrides: z.boolean().optional()
})

// Template validation schemas
export const fieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  customRules: z.array(z.string()).optional()
})

export const templateFieldSchema = z.object({
  name: z.string()
    .min(1, 'Field name is required')
    .max(50, 'Field name must be less than 50 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with letter and contain only letters, numbers, and underscores'),
  
  type: fieldTypeSchema,
  
  label: z.string()
    .min(1, 'Field label is required')
    .max(100, 'Field label must be less than 100 characters'),
  
  description: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Field description must be less than 500 characters'
    ),
  
  required: z.boolean(),
  
  options: z.array(z.string()).optional(),
  
  validation: fieldValidationSchema.optional(),
  
  defaultValue: z.unknown().optional(),
  
  order: z.number().min(0, 'Order must be non-negative')
})

export const templateSectionSchema = z.object({
  title: z.string()
    .min(1, 'Section title is required')
    .max(100, 'Section title must be less than 100 characters'),
  
  description: z.string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Section description must be less than 500 characters'
    ),
  
  order: z.number().min(0, 'Order must be non-negative'),
  
  fields: z.array(templateFieldSchema)
    .min(1, 'At least one field is required per section'),
  
  isRequired: z.boolean()
})

export const templateFormSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name must be less than 100 characters'),
  
  description: z.string()
    .min(1, 'Template description is required')
    .max(500, 'Template description must be less than 500 characters'),
  
  reportType: reportTypeSchema,
  
  isActive: z.boolean(),
  
  sections: z.array(templateSectionSchema)
    .min(1, 'At least one section is required')
    .max(20, 'Maximum 20 sections allowed')
}).refine(
  (data) => {
    // Check for unique section orders
    const orders = data.sections.map(s => s.order)
    return orders.length === new Set(orders).size
  },
  'Section orders must be unique'
).refine(
  (data) => {
    // Check for unique field names across all sections
    const fieldNames = data.sections.flatMap(s => s.fields.map(f => f.name))
    return fieldNames.length === new Set(fieldNames).size
  },
  'Field names must be unique across all sections'
)

export const templateFiltersSchema = z.object({
  search: z.string().optional(),
  reportType: reportTypeSchema.optional(),
  isActive: z.boolean().optional(),
  createdBy: z.string().optional()
})

// Payroll validation schemas
export const payrollCalculationSchema = z.object({
  workingDays: z.number().min(0, 'Working days cannot be negative'),
  restingDays: z.number().min(0, 'Resting days cannot be negative'),
  overtimeDays: z.number().min(0, 'Overtime days cannot be negative'),
  totalHours: z.number().min(0, 'Total hours cannot be negative'),
  overtimeHours: z.number().min(0, 'Overtime hours cannot be negative'),
  baseSalary: z.number().min(0, 'Base salary cannot be negative'),
  overtimePay: z.number().min(0, 'Overtime pay cannot be negative'),
  bonuses: z.number().min(0, 'Bonuses cannot be negative'),
  deductions: z.number().min(0, 'Deductions cannot be negative'),
  totalPay: z.number().min(0, 'Total pay cannot be negative'),
  netPay: z.number().min(0, 'Net pay cannot be negative')
})

export const bonusRuleSchema = z.object({
  name: z.string()
    .min(1, 'Bonus rule name is required')
    .max(100, 'Bonus rule name must be less than 100 characters'),
  
  type: z.enum(['FIXED', 'PERCENTAGE', 'HOURLY']),
  
  value: z.number()
    .min(0, 'Bonus value cannot be negative'),
  
  condition: z.string().optional(),
  isActive: z.boolean()
})

export const deductionRuleSchema = z.object({
  name: z.string()
    .min(1, 'Deduction rule name is required')
    .max(100, 'Deduction rule name must be less than 100 characters'),
  
  type: z.enum(['FIXED', 'PERCENTAGE']),
  
  value: z.number()
    .min(0, 'Deduction value cannot be negative'),
  
  condition: z.string().optional(),
  isActive: z.boolean()
})

export const payrollFiltersSchema = z.object({
  inspectorId: z.number().optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).max(2030).optional(),
  isPaid: z.boolean().optional()
})

// Bulk operations validation schemas
export const bulkImportOptionsSchema = z.object({
  skipHeader: z.boolean(),
  updateExisting: z.boolean(),
  validateOnly: z.boolean(),
  mapping: z.record(z.string(), z.string())
})

export const bulkExportOptionsSchema = z.object({
  type: z.enum(['INSPECTORS', 'ATTENDANCE', 'PAYROLL', 'TEMPLATES']),
  format: z.enum(['CSV', 'EXCEL', 'JSON']),
  filters: z.record(z.string(), z.unknown()).optional(),
  includeHeaders: z.boolean(),
  dateRange: z.object({
    startDate: z.string(),
    endDate: z.string()
  }).optional()
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1'),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')
})

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid start date format'
    ),
  endDate: z.string()
    .min(1, 'End date is required')
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Invalid end date format'
    )
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  'Start date must be before or equal to end date'
)

// Export all schemas for easy importing
export type InspectorFormData = z.infer<typeof inspectorFormSchema>
export type InspectorFilters = z.infer<typeof inspectorFiltersSchema>
// SpecialtyPermissions type removed - no longer used
export type WorkCycleData = z.infer<typeof workCycleDataSchema>
export type AttendanceRecordData = z.infer<typeof attendanceRecordSchema>
export type AttendanceFilters = z.infer<typeof attendanceFiltersSchema>
export type TemplateFormData = z.infer<typeof templateFormSchema>
export type TemplateFilters = z.infer<typeof templateFiltersSchema>
export type PayrollCalculation = z.infer<typeof payrollCalculationSchema>
export type BonusRule = z.infer<typeof bonusRuleSchema>
export type DeductionRule = z.infer<typeof deductionRuleSchema>
export type PayrollFilters = z.infer<typeof payrollFiltersSchema>
export type BulkImportOptions = z.infer<typeof bulkImportOptionsSchema>
export type BulkExportOptions = z.infer<typeof bulkExportOptionsSchema>
export type PaginationParams = z.infer<typeof paginationSchema>
export type DateRange = z.infer<typeof dateRangeSchema>
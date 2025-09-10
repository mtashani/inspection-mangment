/**
 * Bulk Operations Data Validation
 */

import { z } from 'zod'

// Base validation schemas
export const inspectorImportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  employeeId: z.string().min(1, 'Employee ID is required').max(50, 'Employee ID too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  inspectorType: z.enum(['INTERNAL', 'EXTERNAL', 'CONTRACTOR'], {
    errorMap: () => ({ message: 'Inspector type must be INTERNAL, EXTERNAL, or CONTRACTOR' })
  }),
  specialties: z.string().optional().transform((val) => {
    if (!val) return []
    return val.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0)
  }),
  active: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'string') {
      const lower = val.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes'
    }
    return true
  }),
  canLogin: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'string') {
      const lower = val.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes'
    }
    return false
  }),
  attendanceTrackingEnabled: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'string') {
      const lower = val.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes'
    }
    return true
  }),
  baseHourlyRate: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (val === undefined || val === '') return undefined
    const num = typeof val === 'number' ? val : parseFloat(val)
    return isNaN(num) ? undefined : num
  }),
  overtimeMultiplier: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (val === undefined || val === '') return undefined
    const num = typeof val === 'number' ? val : parseFloat(val)
    return isNaN(num) ? undefined : num
  })
})

export const attendanceImportSchema = z.object({
  inspectorId: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseInt(val)
    if (isNaN(num)) throw new Error('Inspector ID must be a valid number')
    return num
  }),
  date: z.string().refine((val) => {
    const date = new Date(val)
    return !isNaN(date.getTime())
  }, 'Invalid date format. Use YYYY-MM-DD'),
  status: z.enum(['WORKING', 'RESTING', 'OVERTIME', 'ABSENT', 'SICK_LEAVE', 'VACATION'], {
    errorMap: () => ({ message: 'Status must be one of: WORKING, RESTING, OVERTIME, ABSENT, SICK_LEAVE, VACATION' })
  }),
  workHours: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    if (isNaN(num) || num < 0 || num > 24) {
      throw new Error('Work hours must be between 0 and 24')
    }
    return num
  }),
  overtimeHours: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (val === undefined || val === '') return 0
    const num = typeof val === 'number' ? val : parseFloat(val)
    if (isNaN(num) || num < 0 || num > 24) {
      throw new Error('Overtime hours must be between 0 and 24')
    }
    return num
  }),
  notes: z.string().optional()
})

export const templateImportSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
  description: z.string().optional(),
  reportType: z.enum(['PSV', 'CRANE', 'CORROSION', 'GENERAL'], {
    errorMap: () => ({ message: 'Report type must be PSV, CRANE, CORROSION, or GENERAL' })
  }),
  isActive: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === 'boolean') return val
    if (typeof val === 'string') {
      const lower = val.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes'
    }
    return true
  }),
  sections: z.string().optional().transform((val) => {
    if (!val) return []
    try {
      return JSON.parse(val)
    } catch {
      throw new Error('Sections must be valid JSON format')
    }
  })
})

// Validation error types
export interface ValidationError {
  row: number
  field?: string
  message: string
  value?: unknown
}

export interface ValidationResult {
  isValid: boolean
  totalRows: number
  validRows: number
  errors: ValidationError[]
  validData: unknown[]
}

// Data type validation functions
export function validateInspectorData(data: unknown[], options: { skipFirstRow?: boolean } = {}): ValidationResult {
  const errors: ValidationError[] = []
  const validData: unknown[] = []
  const startRow = options.skipFirstRow ? 1 : 0

  for (let i = startRow; i < data.length; i++) {
    const row = data[i]
    const rowNumber = i + 1

    try {
      const validatedRow = inspectorImportSchema.parse(row)
      
      // Additional business logic validation
      if (validatedRow.specialties) {
        const validSpecialties = ['PSV', 'CRANE', 'CORROSION']
        const invalidSpecialties = validatedRow.specialties.filter(s => !validSpecialties.includes(s))
        if (invalidSpecialties.length > 0) {
          errors.push({
            row: rowNumber,
            field: 'specialties',
            message: `Invalid specialties: ${invalidSpecialties.join(', ')}. Valid options: ${validSpecialties.join(', ')}`,
            value: validatedRow.specialties
          })
          continue
        }
      }

      validData.push(validatedRow)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push({
            row: rowNumber,
            field: err.path.join('.'),
            message: err.message,
            value: err.path.reduce((obj, key) => obj?.[key], row)
          })
        })
      } else {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown validation error',
          value: row
        })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    totalRows: data.length - startRow,
    validRows: validData.length,
    errors,
    validData
  }
}

export function validateAttendanceData(data: unknown[], options: { skipFirstRow?: boolean } = {}): ValidationResult {
  const errors: ValidationError[] = []
  const validData: unknown[] = []
  const startRow = options.skipFirstRow ? 1 : 0

  for (let i = startRow; i < data.length; i++) {
    const row = data[i]
    const rowNumber = i + 1

    try {
      const validatedRow = attendanceImportSchema.parse(row)
      
      // Additional business logic validation
      const totalHours = validatedRow.workHours + (validatedRow.overtimeHours || 0)
      if (totalHours > 24) {
        errors.push({
          row: rowNumber,
          field: 'workHours',
          message: 'Total work hours and overtime cannot exceed 24 hours',
          value: totalHours
        })
        continue
      }

      // Validate date is not in the future
      const recordDate = new Date(validatedRow.date)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      
      if (recordDate > today) {
        errors.push({
          row: rowNumber,
          field: 'date',
          message: 'Attendance date cannot be in the future',
          value: validatedRow.date
        })
        continue
      }

      validData.push(validatedRow)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push({
            row: rowNumber,
            field: err.path.join('.'),
            message: err.message,
            value: err.path.reduce((obj, key) => obj?.[key], row)
          })
        })
      } else {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown validation error',
          value: row
        })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    totalRows: data.length - startRow,
    validRows: validData.length,
    errors,
    validData
  }
}

export function validateTemplateData(data: unknown[], options: { skipFirstRow?: boolean } = {}): ValidationResult {
  const errors: ValidationError[] = []
  const validData: unknown[] = []
  const startRow = options.skipFirstRow ? 1 : 0

  for (let i = startRow; i < data.length; i++) {
    const row = data[i]
    const rowNumber = i + 1

    try {
      const validatedRow = templateImportSchema.parse(row)
      validData.push(validatedRow)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push({
            row: rowNumber,
            field: err.path.join('.'),
            message: err.message,
            value: err.path.reduce((obj, key) => obj?.[key], row)
          })
        })
      } else {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown validation error',
          value: row
        })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    totalRows: data.length - startRow,
    validRows: validData.length,
    errors,
    validData
  }
}

// Generic validation function
export function validateBulkData(
  data: unknown[], 
  type: 'INSPECTORS' | 'ATTENDANCE' | 'TEMPLATES',
  options: { skipFirstRow?: boolean } = {}
): ValidationResult {
  switch (type) {
    case 'INSPECTORS':
      return validateInspectorData(data, options)
    case 'ATTENDANCE':
      return validateAttendanceData(data, options)
    case 'TEMPLATES':
      return validateTemplateData(data, options)
    default:
      throw new Error(`Unsupported data type: ${type}`)
  }
}

// File validation utilities
export function validateFileFormat(file: File): { isValid: boolean; error?: string } {
  const validExtensions = ['.xlsx', '.xls', '.csv']
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  
  if (!validExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Invalid file format. Supported formats: ${validExtensions.join(', ')}`
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 10MB limit'
    }
  }

  return { isValid: true }
}

// Data preview utilities
export function generateDataPreview(data: unknown[], maxRows: number = 5): unknown[] {
  return data.slice(0, maxRows)
}

// Error reporting utilities
export function groupErrorsByField(errors: ValidationError[]): Record<string, ValidationError[]> {
  return errors.reduce((groups, error) => {
    const field = error.field || 'general'
    if (!groups[field]) {
      groups[field] = []
    }
    groups[field].push(error)
    return groups
  }, {} as Record<string, ValidationError[]>)
}

export function getErrorSummary(errors: ValidationError[]): {
  totalErrors: number
  errorsByField: Record<string, number>
  mostCommonErrors: Array<{ message: string; count: number }>
} {
  const errorsByField = groupErrorsByField(errors)
  const errorCounts = Object.entries(errorsByField).reduce((counts, [field, fieldErrors]) => {
    counts[field] = fieldErrors.length
    return counts
  }, {} as Record<string, number>)

  const messageCounts = errors.reduce((counts, error) => {
    counts[error.message] = (counts[error.message] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const mostCommonErrors = Object.entries(messageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([message, count]) => ({ message, count }))

  return {
    totalErrors: errors.length,
    errorsByField: errorCounts,
    mostCommonErrors
  }
}

// Rollback utilities
export interface RollbackOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entityType: 'INSPECTOR' | 'ATTENDANCE' | 'TEMPLATE'
  entityId: string | number
  originalData?: unknown
  newData?: unknown
  timestamp: string
}

export function createRollbackPlan(
  operations: RollbackOperation[]
): Array<{ action: string; description: string; data: unknown }> {
  return operations.reverse().map(op => {
    switch (op.type) {
      case 'CREATE':
        return {
          action: 'DELETE',
          description: `Delete ${op.entityType.toLowerCase()} ${op.entityId}`,
          data: { id: op.entityId }
        }
      case 'UPDATE':
        return {
          action: 'UPDATE',
          description: `Restore ${op.entityType.toLowerCase()} ${op.entityId} to original state`,
          data: { id: op.entityId, ...op.originalData }
        }
      case 'DELETE':
        return {
          action: 'CREATE',
          description: `Recreate ${op.entityType.toLowerCase()} ${op.entityId}`,
          data: op.originalData
        }
      default:
        throw new Error(`Unknown operation type: ${op.type}`)
    }
  })
}
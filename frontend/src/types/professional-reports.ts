export type FieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX' | 'IMAGE' | 'FILE'
export type ValueSource = 'MANUAL' | 'AUTO'
export type SectionType = 'HEADER' | 'BODY' | 'FOOTER' | 'ATTACHMENTS' | 'CUSTOM'
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
export type ExportFormat = 'PDF' | 'EXCEL' | 'JSON'

export interface Template {
  id: string
  name: string
  description?: string
  reportType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  sections: TemplateSection[]
}

export interface TemplateSection {
  id: string
  templateId: string
  title: string
  sectionType: SectionType
  order: number
  subsections: TemplateSubSection[]
}

export interface TemplateSubSection {
  id: string
  sectionId: string
  title?: string
  order: number
  fields: TemplateField[]
}

export interface TemplateField {
  id: string
  subsectionId: string
  label: string
  fieldType: FieldType
  valueSource: ValueSource
  order: number
  row: number
  col: number
  rowspan: number
  colspan: number
  options?: string[] // For select fields
  isRequired: boolean
  placeholder?: string
  autoSourceKey?: string // For auto-filled fields
  purpose?: string // For RBI analysis
}

export interface FinalReport {
  id: string
  inspectionId: string
  templateId: string
  createdBy: string
  status: ReportStatus
  reportSerialNumber?: string
  createdAt: string
  updatedAt: string
  template?: Template
  fieldValues: Record<string, any>
}

export interface ReportFieldValue {
  id: string
  finalReportId: string
  templateFieldId: string
  textValue?: string
  numberValue?: number
  dateValue?: string
  booleanValue?: boolean
  jsonValue?: string
}

export interface ReportType {
  id: string
  name: string
  description: string
  icon?: string
}

export interface AutoSource {
  key: string
  label: string
  description: string
  dataType: string
}

export interface ReportCreationFlowData {
  inspectionId: string
  selectedReportType?: ReportType
  selectedTemplate?: Template
  fieldValues: Record<string, any>
  currentStep: 'confirmation' | 'type-selection' | 'template-selection' | 'form-filling'
}

export interface DynamicFormField {
  field: TemplateField
  value: any
  error?: string
  isAutoFilled: boolean
}

export interface ReportExportRequest {
  reportId: string
  format: ExportFormat
  includeImages?: boolean
  customLayout?: any
}

// Auto-field sources mapping
export const AUTO_SOURCES: Record<string, AutoSource> = {
  'inspection.start_date': {
    key: 'inspection.start_date',
    label: 'Inspection Start Date',
    description: 'Start date of the inspection',
    dataType: 'date'
  },
  'inspection.end_date': {
    key: 'inspection.end_date',
    label: 'Inspection End Date',
    description: 'End date of the inspection',
    dataType: 'date'
  },
  'inspection.status': {
    key: 'inspection.status',
    label: 'Inspection Status',
    description: 'Current status of the inspection',
    dataType: 'text'
  },
  'inspection.number': {
    key: 'inspection.number',
    label: 'Inspection Number',
    description: 'Unique inspection identifier',
    dataType: 'text'
  },
  'equipment.tag': {
    key: 'equipment.tag',
    label: 'Equipment Tag',
    description: 'Equipment tag number',
    dataType: 'text'
  },
  'equipment.name': {
    key: 'equipment.name',
    label: 'Equipment Name',
    description: 'Equipment name or description',
    dataType: 'text'
  },
  'equipment.location': {
    key: 'equipment.location',
    label: 'Equipment Location',
    description: 'Physical location of equipment',
    dataType: 'text'
  },
  'user.full_name': {
    key: 'user.full_name',
    label: 'Inspector Name',
    description: 'Full name of the report creator',
    dataType: 'text'
  },
  'user.department': {
    key: 'user.department',
    label: 'User Department',
    description: 'Department of the report creator',
    dataType: 'text'
  },
  'current.date': {
    key: 'current.date',
    label: 'Current Date',
    description: 'Current date when report is created',
    dataType: 'date'
  },
  'current.time': {
    key: 'current.time',
    label: 'Current Time',
    description: 'Current time when report is created',
    dataType: 'time'
  },
  'report.serial_number': {
    key: 'report.serial_number',
    label: 'Report Serial Number',
    description: 'Unique report serial number',
    dataType: 'text'
  }
}
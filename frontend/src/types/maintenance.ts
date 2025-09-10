export type MaintenanceEventType = 'OVERHAUL' | 'REPAIR' | 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION'
export type MaintenanceEventStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED'
export type OverhaulSubType = 'PREPARATION' | 'DISASSEMBLY' | 'INSPECTION' | 'REPAIR' | 'REASSEMBLY' | 'TESTING'

// Enum versions for easier usage in components
export enum MaintenanceEventStatusEnum {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED'
}

export enum MaintenanceEventTypeEnum {
  OVERHAUL = 'OVERHAUL',
  REPAIR = 'REPAIR',
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  INSPECTION = 'INSPECTION'
}

export interface MaintenanceEvent {
  id: string
  eventNumber: string
  title: string
  description?: string
  eventType: MaintenanceEventType
  status: MaintenanceEventStatus
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  createdBy?: string
  approvedBy?: string
  approvalDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  subEvents: MaintenanceSubEvent[]
  completionPercentage: number
}

export interface MaintenanceSubEvent {
  id: string
  parentEventId: string
  subEventNumber: string
  title: string
  description?: string
  subType?: OverhaulSubType
  status: MaintenanceEventStatus
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  completionPercentage: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceEventCreateRequest {
  eventNumber: string
  title: string
  description?: string
  eventType: MaintenanceEventType
  plannedStartDate: string
  plannedEndDate: string
  createdBy?: string
  notes?: string
}

export interface MaintenanceEventUpdateRequest {
  title?: string
  description?: string
  eventType?: MaintenanceEventType
  status?: MaintenanceEventStatus
  plannedStartDate?: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  approvedBy?: string
  notes?: string
}

export interface MaintenanceSubEventCreateRequest {
  parentEventId: string
  subEventNumber: string
  title: string
  description?: string
  subType?: OverhaulSubType
  plannedStartDate: string
  plannedEndDate: string
  notes?: string
}

export interface MaintenanceSubEventUpdateRequest {
  title?: string
  description?: string
  subType?: OverhaulSubType
  status?: MaintenanceEventStatus
  plannedStartDate?: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  completionPercentage?: number
  notes?: string
}

export interface MaintenanceEventGroup {
  id: string
  eventNumber: string
  title: string
  eventType: MaintenanceEventType
  status: MaintenanceEventStatus
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  subEvents: MaintenanceSubEvent[]
  completionPercentage: number
}
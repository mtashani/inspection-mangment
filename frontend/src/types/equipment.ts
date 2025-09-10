export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type EquipmentStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE'
export type InspectionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
export type MaintenanceStatus = 'UP_TO_DATE' | 'DUE_SOON' | 'OVERDUE' | 'IN_MAINTENANCE'

export interface Equipment {
  id: string
  tagNumber: string
  name: string
  location: string
  type: string
  description?: string
  status: EquipmentStatus
  installationDate: string
  designPressure: number
  designTemperature: number
  material: string
  riskLevel: RiskLevel
  lastInspectionDate?: string
  nextInspectionDate?: string
  inspectionStatus: InspectionStatus
  maintenanceStatus: MaintenanceStatus
  rbiCalculationDate?: string
  criticality: string
  unit: string
  createdAt: string
  updatedAt: string
}

export interface EquipmentDetail extends Equipment {
  inspectionHistory: InspectionHistoryItem[]
  maintenanceHistory: MaintenanceHistoryItem[]
  reports: ReportSummary[]
  rbiData?: RBICalculationResult
  specifications: EquipmentSpecification[]
}

export interface InspectionHistoryItem {
  id: string
  inspectionNumber: string
  inspectionDate: string
  inspectorName: string
  status: string
  findings: string
  recommendations: string
  reportCount: number
}

export interface MaintenanceHistoryItem {
  id: string
  eventNumber: string
  eventType: string
  scheduledDate: string
  completedDate?: string
  status: string
  description: string
  cost?: number
}

export interface ReportSummary {
  id: string
  templateName: string
  createdDate: string
  status: string
  createdBy: string
}

export interface EquipmentSpecification {
  id: string
  name: string
  value: string
  unit?: string
  category: string
}

export interface EquipmentFilters {
  search?: string
  type?: string[]
  riskLevel?: RiskLevel[]
  inspectionStatus?: InspectionStatus[]
  maintenanceStatus?: MaintenanceStatus[]
  location?: string[]
  dateRange?: {
    from: string
    to: string
  }
}

export interface EquipmentSortOptions {
  field: keyof Equipment
  direction: 'asc' | 'desc'
}

// RBI related types (imported from RBI system)
export interface RBICalculationResult {
  equipmentId: string
  calculationLevel: number
  requestedLevel: number
  fallbackOccurred: boolean
  nextInspectionDate: string
  riskLevel: RiskLevel
  pofScore: number
  cofScores: {
    safety: number
    environmental: number
    economic: number
  }
  confidenceScore: number
  dataQualityScore: number
  calculationTimestamp: string
  inputParameters: Record<string, any>
  missingData: string[]
  estimatedParameters: string[]
  details?: Record<string, any>
}

export interface RBIConfiguration {
  id: string
  name: string
  level: number
  isActive: boolean
  description: string
  settings: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ScoringTable {
  parameterName: string
  scoringRules: Record<string, number>
  weights: Record<string, number>
  description: string
}

export interface RiskMatrix {
  matrix: Record<string, string> // (PoF, CoF) -> Risk Level
  inspectionIntervals: Record<string, number> // Risk Level -> Months
  fallbackSafetyFactors: Record<string, number> // Fallback scenario -> multiplier
}
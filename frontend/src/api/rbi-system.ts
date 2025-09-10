// RBI (Risk-Based Inspection) System API Functions

import {
  RBIConfiguration,
  RBICalculationInput,
  RBICalculationResult,
  RBICalculationRequest,
  RBIConfigurationCreateRequest,
  RBIConfigurationUpdateRequest,
  RBILevel,
  RiskLevel,
  RiskCategory,
  RBIStats,
  RBITrends,
  ScoringTables,
  RiskMatrix,
  IntervalSettings
} from '../types/rbi'

const API_BASE = '/api/v1/rbi'

// Utility function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// RBI Configuration API
export const rbiConfigurationApi = {
  // Get all RBI configurations
  async getConfigurations(): Promise<RBIConfiguration[]> {
    return apiCall<RBIConfiguration[]>('/configurations')
  },

  // Get active RBI configuration
  async getActiveConfiguration(): Promise<RBIConfiguration> {
    return apiCall<RBIConfiguration>('/configurations/active')
  },

  // Get specific RBI configuration
  async getConfiguration(configId: string): Promise<RBIConfiguration> {
    return apiCall<RBIConfiguration>(`/configurations/${configId}`)
  },

  // Create new RBI configuration (Admin only)
  async createConfiguration(configData: RBIConfigurationCreateRequest): Promise<{
    success: boolean
    configuration_id: string
    message: string
    created_at: string
  }> {
    return apiCall('/configurations', {
      method: 'POST',
      body: JSON.stringify(configData),
    })
  },

  // Update RBI configuration (Admin only)
  async updateConfiguration(
    configId: string,
    configData: RBIConfigurationUpdateRequest
  ): Promise<{
    success: boolean
    configuration_id: string
    message: string
    updated_at: string
  }> {
    return apiCall(`/configurations/${configId}`, {
      method: 'PUT',
      body: JSON.stringify(configData),
    })
  },

  // Activate RBI configuration (Admin only)
  async activateConfiguration(configId: string): Promise<{
    success: boolean
    configuration_id: string
    message: string
    activated_at: string
  }> {
    return apiCall(`/configurations/${configId}/activate`, {
      method: 'POST',
    })
  },

  // Delete RBI configuration (Admin only)
  async deleteConfiguration(configId: string): Promise<{
    success: boolean
    message: string
    deleted_at: string
  }> {
    return apiCall(`/configurations/${configId}`, {
      method: 'DELETE',
    })
  },

  // Clone RBI configuration (Admin only)
  async cloneConfiguration(
    configId: string,
    newName: string
  ): Promise<{
    success: boolean
    original_config_id: string
    cloned_config_id: string
    message: string
    created_at: string
  }> {
    const params = new URLSearchParams({ new_name: newName })
    return apiCall(`/configurations/${configId}/clone?${params.toString()}`, {
      method: 'POST',
    })
  },

  // Validate RBI configuration (Admin only)
  async validateConfiguration(configId: string): Promise<{
    success: boolean
    validation_result: {
      isValid: boolean
      errors: string[]
      warnings: string[]
    }
    message: string
  }> {
    return apiCall(`/configurations/${configId}/validate`)
  },

  // Export RBI configuration
  async exportConfiguration(
    configId: string,
    format: 'json' | 'excel'
  ): Promise<{
    success: boolean
    export_url: string
    format: string
    message: string
    exported_at: string
  }> {
    const params = new URLSearchParams({ format })
    return apiCall(`/configurations/${configId}/export?${params.toString()}`)
  },

  // Import RBI configuration (Admin only)
  async importConfiguration(
    configFile: File,
    name: string
  ): Promise<{
    success: boolean
    configuration_id: string
    message: string
    imported_at: string
  }> {
    const formData = new FormData()
    formData.append('config_file', configFile)
    formData.append('name', name)

    const response = await fetch(`${API_BASE}/configurations/import`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to import configuration: ${response.statusText}`)
    }

    return response.json()
  }
}

// RBI Calculation API
export const rbiCalculationApi = {
  // Perform RBI calculation
  async calculateRBI(calculationData: RBICalculationRequest): Promise<{
    success: boolean
    calculation_id: string
    result: RBICalculationResult
    message: string
    calculated_at: string
  }> {
    return apiCall('/calculations', {
      method: 'POST',
      body: JSON.stringify(calculationData),
    })
  },

  // Get RBI calculation result
  async getCalculationResult(calculationId: string): Promise<{
    success: boolean
    result: RBICalculationResult
    message: string
  }> {
    return apiCall(`/calculations/${calculationId}`)
  },

  // Get RBI calculations for equipment
  async getEquipmentCalculations(
    equipmentId: string,
    limit: number = 10
  ): Promise<{
    success: boolean
    calculations: RBICalculationResult[]
    total: number
    message: string
  }> {
    const params = new URLSearchParams({ limit: limit.toString() })
    return apiCall(`/calculations/equipment/${equipmentId}?${params.toString()}`)
  },

  // Get latest RBI calculation for equipment
  async getLatestCalculation(equipmentId: string): Promise<{
    success: boolean
    result?: RBICalculationResult
    message: string
  }> {
    return apiCall(`/calculations/equipment/${equipmentId}/latest`)
  },

  // Recalculate RBI for equipment
  async recalculateRBI(
    equipmentId: string,
    configurationId?: string,
    requestedLevel?: RBILevel
  ): Promise<{
    success: boolean
    calculation_id: string
    result: RBICalculationResult
    message: string
    calculated_at: string
  }> {
    const requestData: any = { equipment_id: equipmentId }
    if (configurationId) requestData.configuration_id = configurationId
    if (requestedLevel) requestData.requested_level = requestedLevel

    return apiCall('/calculations/recalculate', {
      method: 'POST',
      body: JSON.stringify(requestData),
    })
  },

  // Bulk recalculate RBI for multiple equipment
  async bulkRecalculateRBI(
    equipmentIds: string[],
    configurationId?: string,
    requestedLevel?: RBILevel
  ): Promise<{
    success: boolean
    total_requested: number
    successful_calculations: number
    failed_calculations: number
    results: Array<{
      equipment_id: string
      success: boolean
      calculation_id?: string
      error?: string
    }>
    message: string
    started_at: string
  }> {
    const requestData: any = { equipment_ids: equipmentIds }
    if (configurationId) requestData.configuration_id = configurationId
    if (requestedLevel) requestData.requested_level = requestedLevel

    return apiCall('/calculations/bulk-recalculate', {
      method: 'POST',
      body: JSON.stringify(requestData),
    })
  },

  // Delete RBI calculation
  async deleteCalculation(calculationId: string): Promise<{
    success: boolean
    message: string
    deleted_at: string
  }> {
    return apiCall(`/calculations/${calculationId}`, {
      method: 'DELETE',
    })
  },

  // Export RBI calculation
  async exportCalculation(
    calculationId: string,
    format: 'pdf' | 'excel' | 'json'
  ): Promise<{
    success: boolean
    export_url: string
    format: string
    message: string
    exported_at: string
  }> {
    const params = new URLSearchParams({ format })
    return apiCall(`/calculations/${calculationId}/export?${params.toString()}`)
  },

  // Get calculation history for equipment
  async getCalculationHistory(
    equipmentId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{
    success: boolean
    history: Array<{
      calculation_id: string
      calculated_at: string
      risk_score: number
      risk_level: RiskLevel
      risk_category: RiskCategory
      next_inspection_date: string
      configuration_name: string
    }>
    message: string
  }> {
    const params = new URLSearchParams()
    if (fromDate) params.append('from_date', fromDate)
    if (toDate) params.append('to_date', toDate)

    return apiCall(`/calculations/equipment/${equipmentId}/history?${params.toString()}`)
  }
}

// RBI Statistics and Analytics API
export const rbiAnalyticsApi = {
  // Get RBI statistics
  async getRBIStats(params: {
    fromDate?: string
    toDate?: string
    equipmentType?: string
    unit?: string
  } = {}): Promise<RBIStats> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })

    return apiCall<RBIStats>(`/analytics/statistics?${searchParams.toString()}`)
  },

  // Get RBI trends
  async getRBITrends(params: {
    period: 'month' | 'quarter' | 'year'
    equipmentType?: string
    unit?: string
  }): Promise<RBITrends> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })

    return apiCall<RBITrends>(`/analytics/trends?${searchParams.toString()}`)
  },

  // Get risk distribution
  async getRiskDistribution(params: {
    groupBy: 'equipment_type' | 'unit' | 'risk_level' | 'damage_type'
    equipmentType?: string
    unit?: string
  }): Promise<{
    success: boolean
    distribution: Array<{
      category: string
      count: number
      percentage: number
      averageRisk: number
    }>
    total: number
    message: string
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })

    return apiCall(`/analytics/risk-distribution?${searchParams.toString()}`)
  },

  // Get inspection effectiveness analysis
  async getInspectionEffectiveness(params: {
    fromDate?: string
    toDate?: string
    equipmentType?: string
  } = {}): Promise<{
    success: boolean
    effectiveness: {
      totalInspections: number
      findingsDetected: number
      falsePositives: number
      missedDefects: number
      overallEffectiveness: number
      methodEffectiveness: Array<{
        method: string
        effectiveness: number
        cost: number
        usage: number
      }>
    }
    message: string
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })

    return apiCall(`/analytics/inspection-effectiveness?${searchParams.toString()}`)
  },

  // Get RBI accuracy metrics
  async getRBIAccuracy(params: {
    fromDate?: string
    toDate?: string
    configurationId?: string
  } = {}): Promise<{
    success: boolean
    accuracy: {
      totalPredictions: number
      correctPredictions: number
      overallAccuracy: number
      accuracyByRiskLevel: Record<RiskLevel, number>
      accuracyByEquipmentType: Record<string, number>
      averageError: number
      standardDeviation: number
    }
    message: string
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })

    return apiCall(`/analytics/accuracy?${searchParams.toString()}`)
  }
}

// Helper functions for RBI system
export const rbiHelpers = {
  // Get risk level color
  getRiskLevelColor(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case RiskLevel.LOW:
        return 'green'
      case RiskLevel.MEDIUM:
        return 'yellow'
      case RiskLevel.HIGH:
        return 'orange'
      case RiskLevel.CRITICAL:
        return 'red'
      default:
        return 'gray'
    }
  },

  // Get risk category color
  getRiskCategoryColor(category: RiskCategory): string {
    switch (category) {
      case RiskCategory.E:
        return 'green'
      case RiskCategory.D:
        return 'lime'
      case RiskCategory.C:
        return 'yellow'
      case RiskCategory.B:
        return 'orange'
      case RiskCategory.A:
        return 'red'
      default:
        return 'gray'
    }
  },

  // Get RBI level description
  getRBILevelDescription(level: RBILevel): string {
    switch (level) {
      case RBILevel.LEVEL_1:
        return 'Qualitative - Basic risk assessment using simplified methods'
      case RBILevel.LEVEL_2:
        return 'Semi-quantitative - Intermediate risk assessment with scoring tables'
      case RBILevel.LEVEL_3:
        return 'Quantitative - Advanced risk assessment with detailed calculations'
      default:
        return 'Unknown level'
    }
  },

  // Format risk score
  formatRiskScore(score: number): string {
    return score.toFixed(2)
  },

  // Format confidence score
  formatConfidenceScore(score: number): string {
    return `${Math.round(score * 100)}%`
  },

  // Calculate next inspection date
  calculateNextInspectionDate(
    lastInspectionDate: string,
    intervalMonths: number
  ): string {
    const lastDate = new Date(lastInspectionDate)
    const nextDate = new Date(lastDate)
    nextDate.setMonth(nextDate.getMonth() + intervalMonths)
    return nextDate.toISOString()
  },

  // Check if inspection is overdue
  isInspectionOverdue(nextInspectionDate: string): boolean {
    const now = new Date()
    const nextDate = new Date(nextInspectionDate)
    return now > nextDate
  },

  // Get days until next inspection
  getDaysUntilInspection(nextInspectionDate: string): number {
    const now = new Date()
    const nextDate = new Date(nextInspectionDate)
    const diffTime = nextDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  },

  // Validate RBI input data
  validateRBIInput(input: Partial<RBICalculationInput>): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!input.equipmentId) {
      errors.push('Equipment ID is required')
    }

    if (!input.operatingConditions) {
      errors.push('Operating conditions are required')
    } else {
      if (input.operatingConditions.temperature === undefined) {
        errors.push('Operating temperature is required')
      }
      if (input.operatingConditions.pressure === undefined) {
        errors.push('Operating pressure is required')
      }
    }

    if (!input.materialProperties) {
      errors.push('Material properties are required')
    } else {
      if (!input.materialProperties.material) {
        errors.push('Material type is required')
      }
      if (input.materialProperties.yieldStrength === undefined) {
        errors.push('Yield strength is required')
      }
    }

    if (!input.geometryData) {
      errors.push('Geometry data is required')
    } else {
      if (input.geometryData.thickness === undefined) {
        errors.push('Thickness is required')
      }
      if (input.geometryData.surfaceArea === undefined) {
        warnings.push('Surface area not provided - may affect calculation accuracy')
      }
    }

    // Data quality warnings
    if (!input.inspectionHistory || input.inspectionHistory.length === 0) {
      warnings.push('No inspection history provided - calculation may be less accurate')
    }

    if (!input.maintenanceHistory || input.maintenanceHistory.length === 0) {
      warnings.push('No maintenance history provided - calculation may be less accurate')
    }

    if (!input.damageAssessment || input.damageAssessment.length === 0) {
      warnings.push('No damage assessment provided - using default values')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  },

  // Transform calculation result for UI
  transformCalculationForUI(result: RBICalculationResult): RBICalculationResult & {
    riskLevelColor: string
    riskCategoryColor: string
    confidenceLabel: string
    dataQualityLabel: string
    isOverdue: boolean
    daysUntilInspection: number
    inspectionUrgency: 'low' | 'medium' | 'high' | 'critical'
  } {
    const daysUntilInspection = this.getDaysUntilInspection(result.nextInspectionDate)
    const isOverdue = this.isInspectionOverdue(result.nextInspectionDate)
    
    let inspectionUrgency: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (isOverdue) {
      inspectionUrgency = 'critical'
    } else if (daysUntilInspection <= 30) {
      inspectionUrgency = 'high'
    } else if (daysUntilInspection <= 90) {
      inspectionUrgency = 'medium'
    }

    return {
      ...result,
      riskLevelColor: this.getRiskLevelColor(result.riskLevel),
      riskCategoryColor: this.getRiskCategoryColor(result.riskCategory),
      confidenceLabel: this.formatConfidenceScore(result.confidenceScore),
      dataQualityLabel: this.formatConfidenceScore(result.dataQualityScore),
      isOverdue,
      daysUntilInspection,
      inspectionUrgency
    }
  },

  // Compare two RBI calculations
  compareCalculations(
    current: RBICalculationResult,
    previous: RBICalculationResult
  ): {
    riskTrend: 'increasing' | 'stable' | 'decreasing'
    riskChange: number
    intervalChange: number
    significantChange: boolean
  } {
    const riskChange = current.riskScore - previous.riskScore
    const intervalChange = current.recommendedInterval - previous.recommendedInterval
    
    let riskTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    if (Math.abs(riskChange) > 0.1) { // 10% threshold for significant change
      riskTrend = riskChange > 0 ? 'increasing' : 'decreasing'
    }

    const significantChange = Math.abs(riskChange) > 0.2 || Math.abs(intervalChange) > 6 // 6 months

    return {
      riskTrend,
      riskChange,
      intervalChange,
      significantChange
    }
  }
}

// Error handling utilities
export class RBIApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public validationErrors?: string[]
  ) {
    super(message)
    this.name = 'RBIApiError'
  }
}

// Mock data generators for development
export const mockRBIData = {
  generateMockConfiguration(overrides: Partial<RBIConfiguration> = {}): RBIConfiguration {
    return {
      id: `config-${Date.now()}`,
      name: 'Standard RBI Configuration',
      description: 'Standard configuration for pressure vessels',
      isActive: true,
      level: RBILevel.LEVEL_2,
      scoringTables: {} as ScoringTables, // Would be populated with actual scoring data
      riskMatrix: {} as RiskMatrix, // Would be populated with actual matrix data
      intervalSettings: {} as IntervalSettings, // Would be populated with actual interval data
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      ...overrides
    }
  },

  generateMockCalculationResult(overrides: Partial<RBICalculationResult> = {}): RBICalculationResult {
    const now = new Date()
    const nextInspection = new Date(now.getTime() + (12 * 30 * 24 * 60 * 60 * 1000)) // 12 months

    return {
      id: `calc-${Date.now()}`,
      equipmentId: 'equipment-123',
      configurationId: 'config-456',
      calculationLevel: RBILevel.LEVEL_2,
      requestedLevel: RBILevel.LEVEL_2,
      fallbackOccurred: false,
      pofScore: 3.2,
      cofScores: {
        safety: 2.8,
        environmental: 2.1,
        economic: 3.5,
        total: 8.4
      },
      riskScore: 26.88,
      riskLevel: RiskLevel.MEDIUM,
      riskCategory: RiskCategory.C,
      nextInspectionDate: nextInspection.toISOString(),
      recommendedInterval: 12,
      inspectionMethods: [
        {
          method: 'Visual Inspection',
          coverage: 100,
          priority: 1,
          reason: 'General condition assessment',
          cost: 500
        },
        {
          method: 'Ultrasonic Testing',
          coverage: 25,
          priority: 2,
          reason: 'Thickness measurement',
          cost: 1200
        }
      ],
      inspectionScope: {
        areas: [
          {
            location: 'Shell',
            method: 'Visual + UT',
            coverage: 100,
            priority: 1,
            damageTypes: ['GENERAL_CORROSION' as any]
          }
        ],
        totalCoverage: 100,
        criticalAreas: ['Nozzles', 'Welds'],
        excludedAreas: []
      },
      confidenceScore: 0.75,
      dataQualityScore: 0.68,
      uncertaintyFactors: [
        {
          parameter: 'Corrosion Rate',
          uncertainty: 0.2,
          impact: 0.15,
          description: 'Limited inspection history'
        }
      ],
      calculationTimestamp: now.toISOString(),
      inputParameters: {},
      intermediateResults: {},
      missingData: ['Recent inspection data'],
      estimatedParameters: ['Corrosion rate'],
      assumptions: ['Uniform corrosion pattern'],
      validationResults: [
        {
          check: 'Input completeness',
          passed: true,
          message: 'All required inputs provided',
          severity: 'info'
        }
      ],
      qualityMetrics: [
        {
          metric: 'Data completeness',
          value: 0.68,
          threshold: 0.7,
          status: 'acceptable',
          description: 'Most required data available'
        }
      ],
      previousCalculations: [],
      trendAnalysis: {
        riskTrend: 'stable',
        trendRate: 0.02,
        projectedRisk: 27.5,
        confidence: 0.6
      },
      ...overrides
    }
  }
}
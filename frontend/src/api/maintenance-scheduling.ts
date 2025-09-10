// Maintenance Event Scheduling and Tracking API Functions

import {
  MaintenanceEvent,
  MaintenanceSubEvent,
  MaintenanceEventType,
  MaintenanceEventStatus,
  MaintenanceEventFilters,
  MaintenanceEventStats
} from '../types/maintenance'

const API_BASE = '/api/v1/maintenance'

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

// Maintenance Scheduling API
export const maintenanceSchedulingApi = {
  // Get maintenance schedule for date range
  async getMaintenanceSchedule(params: {
    fromDate: string
    toDate: string
    equipmentIds?: string[]
    eventTypes?: MaintenanceEventType[]
    includeCompleted?: boolean
    groupBy?: 'date' | 'equipment' | 'type' | 'priority'
  }): Promise<{
    success: boolean
    schedule: Array<{
      date: string
      events: Array<{
        id: string
        eventNumber: string
        title: string
        eventType: MaintenanceEventType
        status: MaintenanceEventStatus
        equipmentTag?: string
        plannedStartTime?: string
        plannedEndTime?: string
        estimatedDuration: number
        priority: 'low' | 'medium' | 'high' | 'critical'
        assignedPersonnel: Array<{
          id: string
          name: string
          role: string
        }>
        requiredResources: Array<{
          id: string
          name: string
          type: string
          quantity: number
        }>
        conflicts: Array<{
          type: 'resource' | 'personnel' | 'equipment'
          description: string
          severity: 'minor' | 'major' | 'critical'
        }>
      }>
      totalEvents: number
      conflictCount: number
      resourceUtilization: number
    }>
    summary: {
      totalEvents: number
      eventsByType: Record<MaintenanceEventType, number>
      eventsByStatus: Record<MaintenanceEventStatus, number>
      resourceConflicts: number
      personnelConflicts: number
      equipmentConflicts: number
    }
    message: string
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })

    return apiCall(`/schedule?${searchParams.toString()}`)
  },

  // Create scheduled maintenance event
  async scheduleMaintenanceEvent(eventData: {
    eventNumber: string
    title: string
    description?: string
    eventType: MaintenanceEventType
    plannedStartDate: string
    plannedEndDate: string
    equipmentId?: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    estimatedDuration: number // hours
    requiredSkills: string[]
    assignedPersonnel?: Array<{
      personnelId: string
      role: string
      allocationPercentage: number
    }>
    requiredResources?: Array<{
      resourceId: string
      quantity: number
      startDate: string
      endDate: string
    }>
    prerequisites?: string[]
    safetyRequirements?: string[]
    permitRequired?: boolean
    shutdownRequired?: boolean
    recurrencePattern?: {
      type: 'daily' | 'weekly' | 'monthly' | 'yearly'
      interval: number
      endDate?: string
      maxOccurrences?: number
    }
  }): Promise<{
    success: boolean
    event_id: string
    event_number: string
    scheduled_date: string
    conflicts_detected: Array<{
      type: 'resource' | 'personnel' | 'equipment'
      description: string
      severity: 'minor' | 'major' | 'critical'
      suggestions: string[]
    }>
    resource_reservations: Array<{
      resource_id: string
      reserved_from: string
      reserved_to: string
      status: 'confirmed' | 'pending' | 'failed'
    }>
    personnel_assignments: Array<{
      personnel_id: string
      assigned_role: string
      allocation_percentage: number
      status: 'confirmed' | 'pending' | 'failed'
    }>
    recurring_events?: Array<{
      event_id: string
      scheduled_date: string
      status: 'scheduled' | 'conflict'
    }>
    message: string
    created_at: string
  }> {
    return apiCall('/schedule/create', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
  },

  // Reschedule maintenance event
  async rescheduleMaintenanceEvent(
    eventId: string,
    rescheduleData: {
      newStartDate: string
      newEndDate: string
      reason: string
      notifyStakeholders: boolean
      updateRecurringEvents?: boolean
      rescheduleOptions?: {
        moveSubEvents: boolean
        adjustDependencies: boolean
        reallocateResources: boolean
      }
    }
  ): Promise<{
    success: boolean
    event_id: string
    old_schedule: {
      start_date: string
      end_date: string
    }
    new_schedule: {
      start_date: string
      end_date: string
    }
    impact_analysis: {
      affected_sub_events: number
      affected_dependencies: number
      resource_conflicts: number
      personnel_conflicts: number
      cost_impact: number
    }
    notifications_sent: Array<{
      recipient: string
      method: 'email' | 'sms' | 'system'
      status: 'sent' | 'failed'
    }>
    message: string
    rescheduled_at: string
  }> {
    return apiCall(`/schedule/${eventId}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(rescheduleData),
    })
  },

  // Get scheduling conflicts
  async getSchedulingConflicts(params: {
    fromDate: string
    toDate: string
    severity?: 'minor' | 'major' | 'critical'
    conflictType?: 'resource' | 'personnel' | 'equipment'
    includeResolved?: boolean
  }): Promise<{
    success: boolean
    conflicts: Array<{
      id: string
      type: 'resource' | 'personnel' | 'equipment'
      severity: 'minor' | 'major' | 'critical'
      description: string
      affected_events: Array<{
        event_id: string
        event_number: string
        title: string
        impact: 'delay' | 'resource_shortage' | 'cancellation'
      }>
      conflicting_resource?: {
        resource_id: string
        resource_name: string
        required_quantity: number
        available_quantity: number
      }
      conflicting_personnel?: {
        personnel_id: string
        personnel_name: string
        required_hours: number
        available_hours: number
      }
      suggested_resolutions: Array<{
        resolution_type: 'reschedule' | 'resource_substitution' | 'personnel_reallocation'
        description: string
        estimated_cost: number
        feasibility: 'high' | 'medium' | 'low'
      }>
      status: 'open' | 'in_progress' | 'resolved'
      created_at: string
      resolved_at?: string
    }>
    summary: {
      total_conflicts: number
      by_severity: Record<string, number>
      by_type: Record<string, number>
      resolution_rate: number
    }
    message: string
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return apiCall(`/schedule/conflicts?${searchParams.toString()}`)
  },

  // Resolve scheduling conflict
  async resolveSchedulingConflict(
    conflictId: string,
    resolution: {
      resolution_type: 'reschedule' | 'resource_substitution' | 'personnel_reallocation' | 'cancel_event'
      resolution_details: {
        new_schedule?: {
          start_date: string
          end_date: string
        }
        substitute_resources?: Array<{
          original_resource_id: string
          substitute_resource_id: string
          quantity: number
        }>
        personnel_changes?: Array<{
          original_personnel_id: string
          new_personnel_id?: string
          new_allocation?: number
        }>
        cancellation_reason?: string
      }
      notes?: string
      notify_stakeholders: boolean
    }
  ): Promise<{
    success: boolean
    conflict_id: string
    resolution_applied: string
    affected_events: Array<{
      event_id: string
      changes_made: string[]
    }>
    cost_impact: number
    notifications_sent: number
    message: string
    resolved_at: string
  }> {
    return apiCall(`/schedule/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolution),
    })
  },

  // Get resource availability
  async getResourceAvailability(params: {
    resourceIds?: string[]
    fromDate: string
    toDate: string
    resourceType?: 'personnel' | 'equipment' | 'material' | 'tool'
  }): Promise<{
    success: boolean
    availability: Array<{
      resource_id: string
      resource_name: string
      resource_type: string
      availability_periods: Array<{
        start_date: string
        end_date: string
        available_quantity: number
        total_quantity: number
        utilization_percentage: number
        reservations: Array<{
          event_id: string
          event_title: string
          reserved_quantity: number
          start_date: string
          end_date: string
        }>
      }>
      maintenance_windows: Array<{
        start_date: string
        end_date: string
        reason: string
        impact: 'unavailable' | 'reduced_capacity'
      }>
      overall_utilization: number
    }>
    summary: {
      total_resources: number
      average_utilization: number
      peak_utilization_date: string
      peak_utilization_percentage: number
      underutilized_resources: number
      overutilized_resources: number
    }
    message: string
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })

    return apiCall(`/schedule/resource-availability?${searchParams.toString()}`)
  },

  // Optimize schedule
  async optimizeSchedule(params: {
    fromDate: string
    toDate: string
    optimization_criteria: Array<'minimize_conflicts' | 'maximize_resource_utilization' | 'minimize_cost' | 'minimize_duration'>
    constraints: {
      max_events_per_day?: number
      required_personnel_availability?: number
      budget_limit?: number
      critical_events_priority?: boolean
    }
    dry_run?: boolean
  }): Promise<{
    success: boolean
    optimization_result: {
      original_schedule: {
        total_events: number
        conflicts: number
        resource_utilization: number
        estimated_cost: number
        total_duration: number
      }
      optimized_schedule: {
        total_events: number
        conflicts: number
        resource_utilization: number
        estimated_cost: number
        total_duration: number
      }
      improvements: {
        conflicts_reduced: number
        utilization_improved: number
        cost_savings: number
        duration_reduced: number
      }
      changes_required: Array<{
        event_id: string
        event_title: string
        change_type: 'reschedule' | 'resource_change' | 'personnel_change'
        old_value: string
        new_value: string
        impact: 'low' | 'medium' | 'high'
      }>
    }
    implementation_plan?: Array<{
      step: number
      action: string
      affected_events: string[]
      estimated_time: number
      dependencies: string[]
    }>
    message: string
  }> {
    return apiCall('/schedule/optimize', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // Apply schedule optimization
  async applyScheduleOptimization(
    optimization_id: string,
    application_options: {
      apply_all_changes: boolean
      selected_changes?: string[]
      notification_settings: {
        notify_personnel: boolean
        notify_managers: boolean
        notification_advance_days: number
      }
      rollback_plan: boolean
    }
  ): Promise<{
    success: boolean
    optimization_id: string
    applied_changes: number
    failed_changes: Array<{
      change_id: string
      error: string
      rollback_available: boolean
    }>
    notifications_sent: number
    rollback_id?: string
    message: string
    applied_at: string
  }> {
    return apiCall(`/schedule/optimize/${optimization_id}/apply`, {
      method: 'POST',
      body: JSON.stringify(application_options),
    })
  }
}

// Maintenance Tracking API
export const maintenanceTrackingApi = {
  // Get maintenance progress tracking
  async getMaintenanceProgress(params: {
    eventIds?: string[]
    fromDate?: string
    toDate?: string
    status?: MaintenanceEventStatus[]
    includeSubEvents?: boolean
  }): Promise<{
    success: boolean
    progress_data: Array<{
      event_id: string
      event_number: string
      title: string
      event_type: MaintenanceEventType
      status: MaintenanceEventStatus
      overall_progress: {
        completion_percentage: number
        planned_start: string
        planned_end: string
        actual_start?: string
        estimated_completion?: string
        days_remaining: number
        is_on_schedule: boolean
        delay_days: number
      }
      sub_events_progress: Array<{
        sub_event_id: string
        title: string
        completion_percentage: number
        status: MaintenanceEventStatus
        planned_start: string
        planned_end: string
        actual_start?: string
        actual_end?: string
        is_critical_path: boolean
        delay_impact: number
      }>
      resource_utilization: {
        personnel: Array<{
          personnel_id: string
          name: string
          allocated_hours: number
          actual_hours: number
          efficiency: number
        }>
        equipment: Array<{
          equipment_id: string
          name: string
          utilization_percentage: number
          downtime_hours: number
        }>
        materials: Array<{
          material_id: string
          name: string
          planned_quantity: number
          consumed_quantity: number
          remaining_quantity: number
        }>
      }
      cost_tracking: {
        budgeted_cost: number
        actual_cost: number
        committed_cost: number
        remaining_budget: number
        cost_variance: number
        cost_variance_percentage: number
      }
      quality_metrics: {
        defect_count: number
        rework_hours: number
        inspection_pass_rate: number
        safety_incidents: number
      }
      milestones: Array<{
        milestone_id: string
        name: string
        planned_date: string
        actual_date?: string
        status: 'pending' | 'completed' | 'overdue'
        critical: boolean
      }>
    }>
    summary: {
      total_events: number
      on_schedule_events: number
      delayed_events: number
      completed_events: number
      average_completion: number
      total_budget_variance: number
    }
    message: string
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })

    return apiCall(`/tracking/progress?${searchParams.toString()}`)
  },

  // Update maintenance progress
  async updateMaintenanceProgress(
    eventId: string,
    progressUpdate: {
      completion_percentage?: number
      actual_start_date?: string
      estimated_completion_date?: string
      status_update?: MaintenanceEventStatus
      sub_events_progress?: Array<{
        sub_event_id: string
        completion_percentage: number
        actual_hours?: number
        status?: MaintenanceEventStatus
        notes?: string
      }>
      resource_updates?: {
        personnel_hours?: Array<{
          personnel_id: string
          hours_worked: number
          date: string
        }>
        material_consumption?: Array<{
          material_id: string
          quantity_consumed: number
          date: string
        }>
        equipment_usage?: Array<{
          equipment_id: string
          hours_used: number
          date: string
        }>
      }
      cost_updates?: {
        actual_costs: Array<{
          category: 'labor' | 'materials' | 'equipment' | 'overhead'
          amount: number
          date: string
          description: string
        }>
      }
      quality_updates?: {
        defects_found?: number
        rework_required?: boolean
        inspection_results?: Array<{
          inspection_type: string
          result: 'pass' | 'fail' | 'conditional'
          notes: string
        }>
      }
      milestone_updates?: Array<{
        milestone_id: string
        actual_completion_date: string
        notes?: string
      }>
      notes?: string
      attachments?: Array<{
        file_name: string
        file_url: string
        file_type: string
      }>
    }
  ): Promise<{
    success: boolean
    event_id: string
    previous_completion: number
    new_completion: number
    status_changed: boolean
    new_status?: MaintenanceEventStatus
    schedule_impact: {
      estimated_completion_changed: boolean
      new_estimated_completion?: string
      delay_days: number
      critical_path_affected: boolean
    }
    cost_impact: {
      budget_variance_changed: boolean
      new_budget_variance: number
      cost_alerts: string[]
    }
    notifications_triggered: Array<{
      type: 'milestone_completed' | 'delay_alert' | 'budget_alert' | 'quality_issue'
      recipients: string[]
      message: string
    }>
    message: string
    updated_at: string
  }> {
    return apiCall(`/tracking/${eventId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(progressUpdate),
    })
  },

  // Get maintenance KPIs
  async getMaintenanceKPIs(params: {
    fromDate: string
    toDate: string
    eventTypes?: MaintenanceEventType[]
    equipmentIds?: string[]
    departmentIds?: string[]
  }): Promise<{
    success: boolean
    kpis: {
      schedule_performance: {
        on_time_completion_rate: number
        average_delay_days: number
        schedule_adherence_trend: Array<{
          period: string
          adherence_rate: number
        }>
      }
      cost_performance: {
        budget_adherence_rate: number
        average_cost_variance: number
        cost_efficiency_trend: Array<{
          period: string
          efficiency_ratio: number
        }>
      }
      quality_performance: {
        defect_rate: number
        rework_rate: number
        first_time_right_rate: number
        quality_trend: Array<{
          period: string
          quality_score: number
        }>
      }
      resource_utilization: {
        personnel_utilization: number
        equipment_utilization: number
        resource_efficiency: number
        utilization_trend: Array<{
          period: string
          utilization_rate: number
        }>
      }
      safety_performance: {
        incident_rate: number
        near_miss_rate: number
        safety_score: number
        safety_trend: Array<{
          period: string
          incident_count: number
        }>
      }
    }
    benchmarks: {
      industry_averages: {
        on_time_completion: number
        cost_variance: number
        defect_rate: number
        utilization_rate: number
      }
      organizational_targets: {
        on_time_completion: number
        cost_variance: number
        defect_rate: number
        utilization_rate: number
      }
    }
    recommendations: Array<{
      category: 'schedule' | 'cost' | 'quality' | 'resource' | 'safety'
      priority: 'high' | 'medium' | 'low'
      recommendation: string
      expected_impact: string
      implementation_effort: 'low' | 'medium' | 'high'
    }>
    message: string
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })

    return apiCall(`/tracking/kpis?${searchParams.toString()}`)
  },

  // Generate maintenance reports
  async generateMaintenanceReport(reportConfig: {
    report_type: 'progress' | 'performance' | 'cost' | 'resource_utilization' | 'quality' | 'comprehensive'
    date_range: {
      from_date: string
      to_date: string
    }
    filters: {
      event_types?: MaintenanceEventType[]
      equipment_ids?: string[]
      department_ids?: string[]
      status?: MaintenanceEventStatus[]
    }
    format: 'pdf' | 'excel' | 'json'
    include_charts: boolean
    include_recommendations: boolean
    custom_sections?: Array<{
      section_name: string
      data_points: string[]
    }>
  }): Promise<{
    success: boolean
    report_id: string
    report_url?: string
    format: string
    generation_status: 'completed' | 'in_progress' | 'failed'
    estimated_completion?: string
    file_size?: number
    message: string
    generated_at: string
  }> {
    return apiCall('/tracking/reports/generate', {
      method: 'POST',
      body: JSON.stringify(reportConfig),
    })
  },

  // Get report generation status
  async getReportStatus(reportId: string): Promise<{
    success: boolean
    report_id: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    progress_percentage: number
    estimated_completion?: string
    download_url?: string
    error_message?: string
    message: string
  }> {
    return apiCall(`/tracking/reports/${reportId}/status`)
  }
}

// Helper functions for maintenance scheduling and tracking
export const maintenanceSchedulingHelpers = {
  // Calculate optimal scheduling window
  calculateOptimalSchedulingWindow(
    eventDuration: number,
    resourceAvailability: Array<{
      start: string
      end: string
      utilization: number
    }>,
    constraints: {
      maxUtilization: number
      preferredDays: string[]
      avoidDays: string[]
    }
  ): Array<{
    startDate: string
    endDate: string
    score: number
    conflicts: string[]
  }> {
    // Implementation would analyze availability and constraints
    // to suggest optimal scheduling windows
    return []
  },

  // Calculate resource requirements
  calculateResourceRequirements(
    eventType: MaintenanceEventType,
    equipmentType: string,
    duration: number,
    complexity: 'low' | 'medium' | 'high'
  ): {
    personnel: Array<{
      role: string
      count: number
      skillLevel: string
      hours: number
    }>
    equipment: Array<{
      type: string
      count: number
      hours: number
    }>
    materials: Array<{
      type: string
      quantity: number
      unit: string
    }>
  } {
    // Implementation would use historical data and standards
    // to estimate resource requirements
    return {
      personnel: [],
      equipment: [],
      materials: []
    }
  },

  // Analyze schedule conflicts
  analyzeScheduleConflicts(
    events: MaintenanceEvent[],
    resources: Array<{
      id: string
      type: string
      capacity: number
    }>
  ): Array<{
    conflictType: 'resource' | 'personnel' | 'equipment'
    severity: 'minor' | 'major' | 'critical'
    affectedEvents: string[]
    description: string
    suggestions: string[]
  }> {
    // Implementation would analyze overlapping events and resource constraints
    return []
  },

  // Calculate completion percentage
  calculateCompletionPercentage(
    event: MaintenanceEvent,
    weightingMethod: 'equal' | 'duration' | 'cost' | 'complexity'
  ): number {
    if (!event.subEvents || event.subEvents.length === 0) {
      return event.status === MaintenanceEventStatus.COMPLETED ? 100 : 0
    }

    let totalWeight = 0
    let completedWeight = 0

    event.subEvents.forEach(subEvent => {
      let weight = 1 // Default equal weighting

      switch (weightingMethod) {
        case 'duration':
          const start = new Date(subEvent.plannedStartDate)
          const end = new Date(subEvent.plannedEndDate)
          weight = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) // days
          break
        case 'cost':
          // Would need cost data from subEvent
          weight = 1
          break
        case 'complexity':
          // Would need complexity rating from subEvent
          weight = 1
          break
      }

      totalWeight += weight
      completedWeight += (subEvent.completionPercentage / 100) * weight
    })

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0
  },

  // Format duration for display
  formatDuration(hours: number): string {
    if (hours < 24) {
      return `${hours} hours`
    } else if (hours < 168) { // 7 days
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return remainingHours > 0 ? `${days} days, ${remainingHours} hours` : `${days} days`
    } else {
      const weeks = Math.floor(hours / 168)
      const remainingDays = Math.floor((hours % 168) / 24)
      return remainingDays > 0 ? `${weeks} weeks, ${remainingDays} days` : `${weeks} weeks`
    }
  },

  // Get priority color
  getPriorityColor(priority: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (priority) {
      case 'low':
        return 'green'
      case 'medium':
        return 'yellow'
      case 'high':
        return 'orange'
      case 'critical':
        return 'red'
      default:
        return 'gray'
    }
  },

  // Calculate schedule health score
  calculateScheduleHealthScore(
    events: MaintenanceEvent[],
    conflicts: number,
    resourceUtilization: number
  ): {
    score: number
    level: 'excellent' | 'good' | 'fair' | 'poor'
    factors: {
      onTimePerformance: number
      resourceEfficiency: number
      conflictLevel: number
      overallHealth: number
    }
  } {
    const onTimeEvents = events.filter(e => {
      if (e.status === MaintenanceEventStatus.COMPLETED && e.actualEndDate && e.plannedEndDate) {
        return new Date(e.actualEndDate) <= new Date(e.plannedEndDate)
      }
      return true // Assume on-time for non-completed events
    }).length

    const onTimePerformance = events.length > 0 ? (onTimeEvents / events.length) * 100 : 100
    const resourceEfficiency = Math.min(resourceUtilization, 100)
    const conflictLevel = Math.max(0, 100 - (conflicts * 10)) // Reduce score by 10 per conflict
    
    const overallHealth = (onTimePerformance + resourceEfficiency + conflictLevel) / 3

    let level: 'excellent' | 'good' | 'fair' | 'poor'
    if (overallHealth >= 90) level = 'excellent'
    else if (overallHealth >= 75) level = 'good'
    else if (overallHealth >= 60) level = 'fair'
    else level = 'poor'

    return {
      score: Math.round(overallHealth),
      level,
      factors: {
        onTimePerformance: Math.round(onTimePerformance),
        resourceEfficiency: Math.round(resourceEfficiency),
        conflictLevel: Math.round(conflictLevel),
        overallHealth: Math.round(overallHealth)
      }
    }
  }
}

// Error handling utilities
export class MaintenanceSchedulingApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public conflictDetails?: Array<{
      type: string
      description: string
      severity: string
    }>
  ) {
    super(message)
    this.name = 'MaintenanceSchedulingApiError'
  }
}

// Mock data generators for development
export const mockSchedulingData = {
  generateMockSchedule(dateRange: { from: string; to: string }): any {
    // Generate mock schedule data for development
    return {
      success: true,
      schedule: [],
      summary: {
        totalEvents: 0,
        eventsByType: {},
        eventsByStatus: {},
        resourceConflicts: 0,
        personnelConflicts: 0,
        equipmentConflicts: 0
      },
      message: 'Mock schedule data'
    }
  },

  generateMockProgress(eventIds: string[]): any {
    // Generate mock progress data for development
    return {
      success: true,
      progress_data: [],
      summary: {
        total_events: eventIds.length,
        on_schedule_events: 0,
        delayed_events: 0,
        completed_events: 0,
        average_completion: 0,
        total_budget_variance: 0
      },
      message: 'Mock progress data'
    }
  }
}
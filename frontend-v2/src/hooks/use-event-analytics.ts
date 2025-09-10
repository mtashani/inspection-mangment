'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  EventSummary, 
  GapAnalysis, 
  DepartmentAnalysis, 
  TimelineAnalysisResponse,
  SubEventsBreakdown,
  UnplannedAnalysis,
  EventBacklog,
  InspectorsWorkloadResponse,
  EquipmentCoverage,
  DailyReportCoverage,
  WorkflowPermissionsResponse
} from '@/types/maintenance-events'

/**
 * Hook for fetching event summary analytics
 */
export function useEventSummary(eventId: string | number) {
  return useQuery({
    queryKey: ['event-summary', eventId],
    queryFn: async (): Promise<EventSummary> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/summary`)
      if (!response.ok) throw new Error('Failed to fetch event summary')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook for fetching gap analysis (planned vs actual)
 */
export function useGapAnalysis(eventId: string | number) {
  return useQuery({
    queryKey: ['gap-analysis', eventId],
    queryFn: async (): Promise<GapAnalysis> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/gap-analysis`)
      if (!response.ok) throw new Error('Failed to fetch gap analysis')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000
  })
}

/**
 * Hook for fetching department performance analysis
 */
export function useDepartmentPerformance(eventId: string | number) {
  return useQuery({
    queryKey: ['department-performance', eventId],
    queryFn: async (): Promise<DepartmentAnalysis> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/department-performance`)
      if (!response.ok) throw new Error('Failed to fetch department performance')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000
  })
}

/**
 * Hook for fetching timeline analysis
 */
export function useTimelineAnalysis(eventId: string | number) {
  return useQuery({
    queryKey: ['timeline-analysis', eventId],
    queryFn: async (): Promise<TimelineAnalysisResponse> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/timeline-analysis`)
      if (!response.ok) throw new Error('Failed to fetch timeline analysis')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000
  })
}

/**
 * Hook for fetching sub-events breakdown
 */
export function useSubEventsBreakdown(eventId: string | number) {
  return useQuery({
    queryKey: ['subevents-breakdown', eventId],
    queryFn: async (): Promise<SubEventsBreakdown> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/subevents-breakdown`)
      if (!response.ok) throw new Error('Failed to fetch sub-events breakdown')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000
  })
}

/**
 * Hook for fetching unplanned inspections analysis
 */
export function useUnplannedAnalysis(eventId: string | number) {
  return useQuery({
    queryKey: ['unplanned-analysis', eventId],
    queryFn: async (): Promise<UnplannedAnalysis> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/unplanned-analysis`)
      if (!response.ok) throw new Error('Failed to fetch unplanned analysis')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000
  })
}

/**
 * Hook for fetching event backlog
 */
export function useEventBacklog(eventId: string | number) {
  return useQuery({
    queryKey: ['event-backlog', eventId],
    queryFn: async (): Promise<EventBacklog> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/backlog`)
      if (!response.ok) throw new Error('Failed to fetch event backlog')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook for fetching inspectors workload
 */
export function useInspectorsWorkload(eventId: string | number) {
  return useQuery({
    queryKey: ['inspectors-workload', eventId],
    queryFn: async (): Promise<InspectorsWorkloadResponse> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/inspectors-workload`)
      if (!response.ok) throw new Error('Failed to fetch inspectors workload')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000
  })
}

/**
 * Hook for fetching equipment coverage
 */
export function useEquipmentCoverage(eventId: string | number) {
  return useQuery({
    queryKey: ['equipment-coverage', eventId],
    queryFn: async (): Promise<EquipmentCoverage> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/equipment-coverage`)
      if (!response.ok) throw new Error('Failed to fetch equipment coverage')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 10 * 60 * 1000
  })
}

/**
 * Hook for fetching daily report coverage for an inspection
 */
export function useDailyReportCoverage(inspectionId: string | number) {
  return useQuery({
    queryKey: ['daily-report-coverage', inspectionId],
    queryFn: async (): Promise<DailyReportCoverage> => {
      const response = await fetch(`/api/v1/maintenance/inspections/${inspectionId}/daily-report-coverage`)
      if (!response.ok) throw new Error('Failed to fetch daily report coverage')
      return response.json()
    },
    enabled: !!inspectionId,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * Hook for fetching workflow permissions
 */
export function useWorkflowPermissions(eventId: string | number) {
  return useQuery({
    queryKey: ['workflow-permissions', eventId],
    queryFn: async (): Promise<WorkflowPermissionsResponse> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/workflow-permissions`)
      if (!response.ok) throw new Error('Failed to fetch workflow permissions')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000
  })
}

/**
 * Hook for fetching planned inspections for an event (using unified model)
 */
export function usePlannedInspections(eventId: string | number) {
  return useQuery({
    queryKey: ['planned-inspections', eventId],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch(`/api/v1/maintenance/events/${eventId}/inspections?is_planned=true&status=Planned`)
      if (!response.ok) throw new Error('Failed to fetch planned inspections')
      return response.json()
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000
  })
}

/**
 * Combined hook for all event analytics data
 */
export function useEventAnalytics(eventId: string | number) {
  const summary = useEventSummary(eventId)
  const gapAnalysis = useGapAnalysis(eventId)
  const departmentPerformance = useDepartmentPerformance(eventId)
  const timelineAnalysis = useTimelineAnalysis(eventId)
  const subEventsBreakdown = useSubEventsBreakdown(eventId)
  const unplannedAnalysis = useUnplannedAnalysis(eventId)
  const eventBacklog = useEventBacklog(eventId)
  const inspectorsWorkload = useInspectorsWorkload(eventId)
  const equipmentCoverage = useEquipmentCoverage(eventId)
  const workflowPermissions = useWorkflowPermissions(eventId)
  const plannedInspections = usePlannedInspections(eventId)

  return {
    summary,
    gapAnalysis,
    departmentPerformance,
    timelineAnalysis,
    subEventsBreakdown,
    unplannedAnalysis,
    eventBacklog,
    inspectorsWorkload,
    equipmentCoverage,
    workflowPermissions,
    plannedInspections,
    isLoading: (
      summary.isLoading ||
      gapAnalysis.isLoading ||
      departmentPerformance.isLoading ||
      timelineAnalysis.isLoading
    ),
    hasError: (
      summary.error ||
      gapAnalysis.error ||
      departmentPerformance.error ||
      timelineAnalysis.error
    )
  }
}
'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AttendanceRecord,
  AttendanceFilters,
  WorkCycle,
  WorkCycleData,
  AttendanceDay,
  AttendanceStatus
} from '@/types/admin'
import {
  getAttendanceRecords,
  getInspectorAttendance,
  getMonthlyAttendance,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  bulkUpdateAttendance,
  getInspectorWorkCycle,
  createWorkCycle,
  updateWorkCycle,
  resetWorkCycle,
  deleteWorkCycle,
  getAttendanceStats,
  generateAttendanceReport
} from '@/lib/api/admin/attendance'

// Attendance Records Hooks
export function useAttendanceRecords(
  page: number = 1,
  limit: number = 20,
  filters?: AttendanceFilters
) {
  return useQuery({
    queryKey: ['attendance-records', page, limit, filters],
    queryFn: () => getAttendanceRecords(page, limit, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useInspectorAttendance(
  inspectorId: number,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['inspector-attendance', inspectorId, startDate, endDate],
    queryFn: () => getInspectorAttendance(inspectorId, startDate, endDate),
    enabled: !!inspectorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useMonthlyAttendance(
  inspectorId: number,
  month: number,
  year: number
) {
  return useQuery({
    queryKey: ['monthly-attendance', inspectorId, month, year],
    queryFn: () => getMonthlyAttendance(inspectorId, month, year),
    enabled: !!inspectorId && !!month && !!year,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateAttendanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAttendanceRecord,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
      queryClient.invalidateQueries({ 
        queryKey: ['inspector-attendance', data.inspectorId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['monthly-attendance', data.inspectorId] 
      })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
    },
  })
}

export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      updateAttendanceRecord(id, data),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
      queryClient.invalidateQueries({ 
        queryKey: ['inspector-attendance', data.inspectorId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['monthly-attendance', data.inspectorId] 
      })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
    },
  })
}

export function useDeleteAttendanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAttendanceRecord,
    onSuccess: () => {
      // Invalidate all attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
      queryClient.invalidateQueries({ queryKey: ['inspector-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
    },
  })
}

export function useBulkUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkUpdateAttendance,
    onSuccess: () => {
      // Invalidate all attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
      queryClient.invalidateQueries({ queryKey: ['inspector-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] })
    },
  })
}

// Work Cycle Hooks
export function useInspectorWorkCycle(inspectorId: number) {
  return useQuery({
    queryKey: ['inspector-work-cycle', inspectorId],
    queryFn: () => getInspectorWorkCycle(inspectorId),
    enabled: !!inspectorId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreateWorkCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ inspectorId, data }: { inspectorId: number; data: WorkCycleData }) =>
      createWorkCycle(inspectorId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['inspector-work-cycle', data.inspectorId] 
      })
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
    },
  })
}

export function useUpdateWorkCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkCycleData> }) =>
      updateWorkCycle(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['inspector-work-cycle', data.inspectorId] 
      })
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
    },
  })
}

export function useResetWorkCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ inspectorId, newStartDate }: { inspectorId: number; newStartDate: string }) =>
      resetWorkCycle(inspectorId, newStartDate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['inspector-work-cycle', data.inspectorId] 
      })
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
    },
  })
}

export function useDeleteWorkCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkCycle,
    onSuccess: (_, variables) => {
      // We need to invalidate by inspector ID, but we don't have it in the response
      // So we invalidate all work cycle queries
      queryClient.invalidateQueries({ queryKey: ['inspector-work-cycle'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] })
    },
  })
}

// Statistics and Analytics Hooks
export function useAttendanceStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['attendance-stats', startDate, endDate],
    queryFn: () => getAttendanceStats(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useGenerateAttendanceReport() {
  return useMutation({
    mutationFn: ({
      inspectorId,
      startDate,
      endDate,
      format = 'PDF'
    }: {
      inspectorId?: number
      startDate?: string
      endDate?: string
      format?: 'PDF' | 'EXCEL' | 'CSV'
    }) => generateAttendanceReport(inspectorId, startDate, endDate, format),
  })
}

// Custom Hooks for Complex Operations
export function useAttendanceManagement(inspectorId: number) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const attendanceQuery = useMonthlyAttendance(inspectorId, currentMonth, currentYear)
  const workCycleQuery = useInspectorWorkCycle(inspectorId)
  const createAttendanceMutation = useCreateAttendanceRecord()
  const updateAttendanceMutation = useUpdateAttendanceRecord()
  const createWorkCycleMutation = useCreateWorkCycle()
  const updateWorkCycleMutation = useUpdateWorkCycle()
  const resetWorkCycleMutation = useResetWorkCycle()
  const deleteWorkCycleMutation = useDeleteWorkCycle()

  const handleStatusChange = async (date: Date, status: AttendanceStatus) => {
    const dateString = date.toISOString().split('T')[0]
    
    // Find existing record for this date
    const existingRecord = attendanceQuery.data?.find(
      record => record.date === dateString
    )

    if (existingRecord) {
      // Update existing record
      await updateAttendanceMutation.mutateAsync({
        id: Math.random(), // This would be the actual record ID
        data: {
          status,
          isOverride: true,
          overrideReason: 'Manual status change'
        }
      })
    } else {
      // Create new record
      await createAttendanceMutation.mutateAsync({
        inspectorId,
        date: dateString,
        status,
        workHours: status === 'WORKING' ? 8 : 0,
        overtimeHours: 0,
        notes: 'Manual entry'
      })
    }
  }

  const handleCreateWorkCycle = async (data: WorkCycleData) => {
    await createWorkCycleMutation.mutateAsync({ inspectorId, data })
  }

  const handleUpdateWorkCycle = async (id: number, data: Partial<WorkCycleData>) => {
    await updateWorkCycleMutation.mutateAsync({ id, data })
  }

  const handleResetWorkCycle = async (newStartDate: string) => {
    await resetWorkCycleMutation.mutateAsync({ inspectorId, newStartDate })
  }

  const handleDeleteWorkCycle = async (id: number) => {
    await deleteWorkCycleMutation.mutateAsync(id)
  }

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction
    let newYear = currentYear

    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    } else if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  return {
    // Data
    attendanceData: attendanceQuery.data || [],
    workCycle: workCycleQuery.data,
    currentMonth,
    currentYear,
    
    // Loading states
    loading: attendanceQuery.isLoading || workCycleQuery.isLoading,
    saving: createAttendanceMutation.isPending || 
            updateAttendanceMutation.isPending ||
            createWorkCycleMutation.isPending ||
            updateWorkCycleMutation.isPending ||
            resetWorkCycleMutation.isPending ||
            deleteWorkCycleMutation.isPending,
    
    // Actions
    handleStatusChange,
    handleCreateWorkCycle,
    handleUpdateWorkCycle,
    handleResetWorkCycle,
    handleDeleteWorkCycle,
    navigateMonth,
    
    // Refetch functions
    refetchAttendance: attendanceQuery.refetch,
    refetchWorkCycle: workCycleQuery.refetch,
  }
}

// Utility hook for attendance calculations
export function useAttendanceCalculations(attendanceData: AttendanceDay[]) {
  return {
    totalDays: attendanceData.length,
    workingDays: attendanceData.filter(r => r.status === 'WORKING').length,
    restingDays: attendanceData.filter(r => r.status === 'RESTING').length,
    overtimeDays: attendanceData.filter(r => r.status === 'OVERTIME').length,
    absentDays: attendanceData.filter(r => 
      ['ABSENT', 'SICK_LEAVE', 'VACATION'].includes(r.status)
    ).length,
    totalWorkHours: attendanceData.reduce((sum, r) => sum + r.workHours, 0),
    totalOvertimeHours: attendanceData.reduce((sum, r) => sum + r.overtimeHours, 0),
    attendanceRate: attendanceData.length > 0 
      ? (attendanceData.filter(r => r.status === 'WORKING').length / attendanceData.length) * 100 
      : 0,
    overrideCount: attendanceData.filter(r => r.isOverride).length
  }
}
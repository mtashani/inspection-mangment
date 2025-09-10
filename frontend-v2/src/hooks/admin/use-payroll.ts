'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getPayrollRecords,
  getPayrollStats,
  generatePayrollRecord,
  updatePayrollRecord,
  markPayrollAsPaid,
  bulkGeneratePayroll,
  generatePayrollReport,
  exportPayrollData,
  calculatePayroll,
  getInspectorPayroll
} from '@/lib/api/admin/payroll'
import { PayrollRecord, PayrollFilters } from '@/types/admin'
import { toast } from 'sonner'

interface UsePayrollOptions {
  month?: number
  year?: number
  inspectorId?: number
  filters?: PayrollFilters
}

export function usePayroll(options: UsePayrollOptions = {}) {
  const queryClient = useQueryClient()
  const { month, year, inspectorId, filters } = options

  // Get payroll records
  const {
    data: payrollRecords,
    isLoading: isLoadingRecords,
    error: recordsError
  } = useQuery({
    queryKey: ['payroll-records', { month, year, inspectorId, ...filters }],
    queryFn: () => {
      if (inspectorId) {
        return getInspectorPayroll(inspectorId, year, month)
      }
      return getPayrollRecords(1, 100, { month, year, ...filters }).then(response => response.data)
    },
    enabled: !!(month && year)
  })

  // Get payroll statistics
  const {
    data: payrollStats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['payroll-stats', { month, year }],
    queryFn: () => {
      const startDate = month && year ? `${year}-${month.toString().padStart(2, '0')}-01` : undefined
      const endDate = month && year ? `${year}-${month.toString().padStart(2, '0')}-31` : undefined
      return getPayrollStats(startDate, endDate)
    },
    enabled: !!(month && year)
  })

  // Generate payroll record mutation
  const generatePayrollMutation = useMutation({
    mutationFn: ({ inspectorId, month, year, overrides }: {
      inspectorId: number
      month: number
      year: number
      overrides?: any
    }) => generatePayrollRecord(inspectorId, month, year, overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      toast.success('Payroll record generated successfully')
    },
    onError: (error) => {
      toast.error('Failed to generate payroll record')
      console.error('Generate payroll error:', error)
    }
  })

  // Update payroll record mutation
  const updatePayrollMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => 
      updatePayrollRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      toast.success('Payroll record updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update payroll record')
      console.error('Update payroll error:', error)
    }
  })

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: (id: number) => markPayrollAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      toast.success('Payroll marked as paid')
    },
    onError: (error) => {
      toast.error('Failed to mark payroll as paid')
      console.error('Mark as paid error:', error)
    }
  })

  // Bulk generate payroll mutation
  const bulkGenerateMutation = useMutation({
    mutationFn: ({ inspectorIds, month, year }: {
      inspectorIds: number[]
      month: number
      year: number
    }) => bulkGeneratePayroll(inspectorIds, month, year),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      toast.success(`Generated payroll for ${data.length} inspectors`)
    },
    onError: (error) => {
      toast.error('Failed to generate bulk payroll')
      console.error('Bulk generate error:', error)
    }
  })

  // Calculate payroll mutation
  const calculatePayrollMutation = useMutation({
    mutationFn: ({ inspectorId, month, year }: {
      inspectorId: number
      month: number
      year: number
    }) => calculatePayroll(inspectorId, month, year),
    onError: (error) => {
      toast.error('Failed to calculate payroll')
      console.error('Calculate payroll error:', error)
    }
  })

  // Helper functions for report generation and export
  const generateReport = async (
    month: number,
    year: number,
    inspectorIds?: number[],
    format: 'PDF' | 'EXCEL' | 'CSV' = 'PDF'
  ) => {
    try {
      return await generatePayrollReport(month, year, inspectorIds, format)
    } catch (error) {
      toast.error('Failed to generate payroll report')
      throw error
    }
  }

  const exportData = async (
    startDate: string,
    endDate: string,
    format: 'EXCEL' | 'CSV' = 'EXCEL'
  ) => {
    try {
      return await exportPayrollData(startDate, endDate, format)
    } catch (error) {
      toast.error('Failed to export payroll data')
      throw error
    }
  }

  return {
    // Data
    payrollRecords,
    payrollStats,
    
    // Loading states
    isLoadingRecords,
    isLoadingStats,
    isGenerating: generatePayrollMutation.isPending,
    isUpdating: updatePayrollMutation.isPending,
    isBulkGenerating: bulkGenerateMutation.isPending,
    isCalculating: calculatePayrollMutation.isPending,
    
    // Error states
    error: recordsError || statsError,
    
    // Actions
    generatePayroll: generatePayrollMutation.mutate,
    updatePayroll: updatePayrollMutation.mutate,
    markAsPaid: markAsPaidMutation.mutate,
    bulkGenerate: bulkGenerateMutation.mutate,
    calculatePayroll: calculatePayrollMutation.mutate,
    
    // Async actions
    generateReport,
    exportData,
    
    // Utility functions
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
    }
  }
}

// Helper hook for individual inspector payroll
export function useInspectorPayroll(inspectorId: number, year?: number, month?: number) {
  return usePayroll({ inspectorId, year, month })
}

// Helper hook for payroll statistics only
export function usePayrollStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['payroll-stats', { startDate, endDate }],
    queryFn: () => getPayrollStats(startDate, endDate),
    enabled: !!(startDate && endDate)
  })
}
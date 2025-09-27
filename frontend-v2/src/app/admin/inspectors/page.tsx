'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { InspectorList } from '@/components/admin/inspectors/inspector-list'
import { InspectorSummaryCards } from '@/components/admin/inspectors/inspector-summary-cards'
import { EnhancedDeleteDialog } from '@/components/admin/inspectors/enhanced-delete-dialog'
import { useToast } from '@/hooks/use-toast'
import { deleteInspectorWithForce } from '@/lib/api/admin/inspectors'
import { Inspector } from '@/types/admin'

export default function InspectorsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [inspectorToDelete, setInspectorToDelete] = useState<Inspector | null>(null)

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Admin Panel', href: '/admin' },
    { label: 'Inspectors', href: '/admin/inspectors', isActive: true }
  ]

  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: number; force: boolean }) => deleteInspectorWithForce(id, force),
    onSuccess: (_, { force }) => {
      const inspectorName = inspectorToDelete?.name || 'Inspector'
      toast({
        title: 'Success',
        description: `${inspectorName} has been ${force ? 'force ' : ''}deleted successfully.`
      })
      
      // Reset state and invalidate queries
      setInspectorToDelete(null)
      
      // Invalidate and refetch inspector data
      queryClient.invalidateQueries({ queryKey: ['inspectors'] })
      queryClient.invalidateQueries({ queryKey: ['inspector-statistics'] })
      queryClient.removeQueries({ queryKey: ['inspector-related-records'], exact: false })
    },
    onError: (error) => {
      console.error('Delete error:', error)
      toast({
        variant: 'destructive',
        title: 'Delete Failed', 
        description: error instanceof Error ? error.message : 'Failed to delete inspector'
      })
      // Don't close the dialog on error, let user retry
    },
    onSettled: () => {
      // Always reset loading state
      queryClient.setQueryData(['inspector-deletion-loading'], false)
    }
  })

  const handleDeleteInspector = useCallback((inspector: Inspector) => {
    setInspectorToDelete(inspector)
  }, [])

  const handleConfirmDelete = useCallback((force: boolean) => {
    if (inspectorToDelete) {
      deleteMutation.mutate({ id: inspectorToDelete.id, force })
    }
  }, [inspectorToDelete, deleteMutation])

  const handleCloseDialog = useCallback(() => {
    if (!deleteMutation.isPending) {
      setInspectorToDelete(null)
      // Clear any cached related records queries
      queryClient.removeQueries({ 
        queryKey: ['inspector-related-records'], 
        exact: false 
      })
    }
  }, [deleteMutation.isPending, queryClient])

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspector Management</h1>
          <p className="text-muted-foreground">
            Manage inspector accounts, roles, and permissions
          </p>
        </div>
        <InspectorSummaryCards />
        <InspectorList onDelete={handleDeleteInspector} />
      </div>

      {/* Enhanced Delete Dialog */}
      <EnhancedDeleteDialog
        inspector={inspectorToDelete}
        open={!!inspectorToDelete}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  )
}
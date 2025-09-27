'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, 
  Shield, 
  Check, 
  X, 
  Loader2,
  AlertCircle,
  UserCheck
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

import { Inspector } from '@/types/admin'
import { getAllRoles } from '@/lib/api/admin/roles'
import { bulkAssignRoles } from '@/lib/api/admin/inspector-roles'

interface BulkRoleAssignmentProps {
  selectedInspectors: Inspector[]
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface Role {
  id: number
  name: string
  display_label: string
  description?: string
}

export function BulkRoleAssignment({ 
  selectedInspectors, 
  isOpen, 
  onClose, 
  onSuccess 
}: BulkRoleAssignmentProps) {
  const queryClient = useQueryClient()
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])

  // Get all available roles
  const { 
    data: allRoles, 
    isLoading: rolesLoading,
    error: rolesError
  } = useQuery<Role[]>({
    queryKey: ['all-roles'],
    queryFn: () => getAllRoles(),
    enabled: isOpen
  })

  // Bulk assign roles mutation
  const bulkAssignMutation = useMutation({
    mutationFn: () => {
      const inspectorIds = selectedInspectors.map(i => i.id)
      return bulkAssignRoles(inspectorIds, selectedRoleIds)
    },
    onSuccess: (response) => {
      // Invalidate relevant queries
      selectedInspectors.forEach(inspector => {
        queryClient.invalidateQueries({ queryKey: ['inspector-roles', inspector.id] })
      })
      
      toast.success(response.message || 'Roles assigned successfully to all selected inspectors')
      handleClose()
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign roles')
    }
  })

  const handleClose = () => {
    setSelectedRoleIds([])
    onClose()
  }

  const handleRoleSelection = (roleId: number, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds(prev => [...prev, roleId])
    } else {
      setSelectedRoleIds(prev => prev.filter(id => id !== roleId))
    }
  }

  const handleAssignRoles = () => {
    if (selectedRoleIds.length === 0) {
      toast.error('Please select at least one role')
      return
    }
    
    if (selectedInspectors.length === 0) {
      toast.error('No inspectors selected')
      return
    }
    
    bulkAssignMutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Bulk Role Assignment
          </DialogTitle>
          <DialogDescription>
            Assign roles to {selectedInspectors.length} selected inspector{selectedInspectors.length !== 1 ? 's' : ''}. 
            These roles will be added to each inspector's existing roles.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Selected Inspectors Summary */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Selected Inspectors ({selectedInspectors.length})</h4>
            <div className="flex flex-wrap gap-2">
              {selectedInspectors.slice(0, 5).map((inspector) => (
                <Badge key={inspector.id} variant="secondary">
                  {inspector.name}
                </Badge>
              ))}
              {selectedInspectors.length > 5 && (
                <Badge variant="outline">
                  +{selectedInspectors.length - 5} more
                </Badge>
              )}
            </div>
          </div>
          
          {/* Role Selection */}
          <div>
            <h4 className="text-sm font-medium mb-3">Select Roles to Assign</h4>
            
            {rolesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading roles...
              </div>
            ) : rolesError ? (
              <div className="flex items-center text-red-600 py-4">
                <AlertCircle className="w-5 h-5 mr-2" />
                Failed to load roles
              </div>
            ) : !allRoles || allRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No roles available
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                {allRoles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                    <Checkbox
                      id={`bulk-role-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={(checked) => handleRoleSelection(role.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <label htmlFor={`bulk-role-${role.id}`} className="text-sm font-medium cursor-pointer">
                        {role.display_label}
                      </label>
                      {role.description && (
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected Roles Summary */}
          {selectedRoleIds.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">
                Selected Roles ({selectedRoleIds.length})
              </h5>
              <div className="flex flex-wrap gap-1">
                {selectedRoleIds.map((roleId) => {
                  const role = allRoles?.find(r => r.id === roleId)
                  return role ? (
                    <Badge key={roleId} variant="default" className="text-xs">
                      {role.display_label}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssignRoles}
            disabled={selectedRoleIds.length === 0 || bulkAssignMutation.isPending}
          >
            {bulkAssignMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Assign to {selectedInspectors.length} Inspector{selectedInspectors.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
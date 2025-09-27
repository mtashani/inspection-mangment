/**
 * Inspector Role Management Component
 * Professional role assignment interface with multi-select capabilities
 */

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, X, Shield, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  getAllRoles,
  getInspectorRoles,
  assignRolesToInspector,
  getInspectorEffectivePermissions,
  type Role,
  type InspectorRolesResponse
} from '@/lib/api/admin/roles'

interface InspectorRoleManagementProps {
  inspectorId: number
  inspectorName?: string
  onRolesChanged?: (roles: Role[]) => void
  className?: string
}

export function InspectorRoleManagement({
  inspectorId,
  inspectorName,
  onRolesChanged,
  className = ''
}: InspectorRoleManagementProps) {
  const { toast } = useToast()
  
  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [assignedRoles, setAssignedRoles] = useState<Role[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set())
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([])
  
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadRoleData()
  }, [inspectorId])

  const loadRoleData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Load all available roles and current inspector roles in parallel
      const [rolesResponse, inspectorRolesResponse] = await Promise.all([
        getAllRoles(1, 100), // Get all roles
        getInspectorRoles(inspectorId)
      ])
      
      setAllRoles(rolesResponse.roles)
      setAssignedRoles(inspectorRolesResponse.roles)
      
      // Set initially selected roles
      const assignedRoleIds = new Set(inspectorRolesResponse.roles.map(role => role.id))
      setSelectedRoleIds(assignedRoleIds)
      
      // Load effective permissions
      await loadEffectivePermissions()
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load role data'
      setError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Error Loading Roles',
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadEffectivePermissions = async () => {
    try {
      const permissionsResponse = await getInspectorEffectivePermissions(inspectorId)
      setEffectivePermissions(permissionsResponse.all_permissions.map(p => p.name))
    } catch (error) {
      // Don't show error for permissions loading, just log it
      console.warn('Failed to load effective permissions:', error)
    }
  }

  const handleRoleToggle = (roleId: number) => {
    const newSelected = new Set(selectedRoleIds)
    
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId)
    } else {
      newSelected.add(roleId)
    }
    
    setSelectedRoleIds(newSelected)
  }

  const handleSaveRoles = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      const roleIdsArray = Array.from(selectedRoleIds)
      await assignRolesToInspector(inspectorId, roleIdsArray)
      
      // Update assigned roles state
      const updatedAssignedRoles = allRoles.filter(role => selectedRoleIds.has(role.id))
      setAssignedRoles(updatedAssignedRoles)
      
      // Reload effective permissions
      await loadEffectivePermissions()
      
      // Notify parent component
      onRolesChanged?.(updatedAssignedRoles)
      
      toast({
        title: 'Roles Updated',
        description: `Successfully updated roles for ${inspectorName || 'inspector'}`,
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save roles'
      setError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Error Saving Roles',
        description: errorMessage
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    // Reset to originally assigned roles
    const assignedRoleIds = new Set(assignedRoles.map(role => role.id))
    setSelectedRoleIds(assignedRoleIds)
    setError(null)
  }

  const hasChanges = () => {
    const originalRoleIds = new Set(assignedRoles.map(role => role.id))
    
    if (originalRoleIds.size !== selectedRoleIds.size) return true
    
    for (const roleId of selectedRoleIds) {
      if (!originalRoleIds.has(roleId)) return true
    }
    
    return false
  }

  const getSelectedRoles = () => {
    return allRoles.filter(role => selectedRoleIds.has(role.id))
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading role data...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Roles Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role Assignment
          </CardTitle>
          <CardDescription>
            Assign roles to control access to different inspection domains and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Currently Assigned Roles */}
          <div>
            <h4 className="text-sm font-medium mb-2">Currently Assigned Roles</h4>
            {assignedRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignedRoles.map(role => (
                  <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {role.display_label}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No roles assigned</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">{assignedRoles.length}</div>
              <div className="text-xs text-muted-foreground">Assigned Roles</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{effectivePermissions.length}</div>
              <div className="text-xs text-muted-foreground">Total Permissions</div>
            </div>
          </div>

          {/* Expand/Collapse Role Management */}
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Hide Role Management
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Manage Roles
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Detailed Role Management (Expandable) */}
      {isExpanded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Available Roles
            </CardTitle>
            <CardDescription>
              Select roles to assign to this inspector. Changes are not saved until you click "Save Changes".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allRoles.map(role => {
                const isSelected = selectedRoleIds.has(role.id)
                const isOriginallyAssigned = assignedRoles.some(r => r.id === role.id)
                
                return (
                  <div
                    key={role.id}
                    className={`
                      p-3 border rounded-lg cursor-pointer transition-colors
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-primary/50'
                      }
                    `}
                    onClick={() => handleRoleToggle(role.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleRoleToggle(role.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{role.display_label}</h4>
                          {isOriginallyAssigned && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {role.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {role.permission_count || 0} permissions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Roles Preview */}
            {getSelectedRoles().length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Selected Roles Preview</h4>
                <div className="flex flex-wrap gap-2">
                  {getSelectedRoles().map(role => (
                    <Badge key={role.id} variant="secondary" className="flex items-center gap-1">
                      {role.display_label}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-destructive" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRoleToggle(role.id)
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                onClick={handleSaveRoles}
                disabled={!hasChanges() || isSaving}
                className="flex-1"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges() || isSaving}
              >
                Reset
              </Button>
            </div>

            {hasChanges() && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have unsaved changes. Click "Save Changes" to apply the new role assignments.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
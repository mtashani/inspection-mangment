'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Role {
  id: number
  name: string
  display_label?: string
  description?: string
  permissions?: string[]
  inspector_count?: number
}

interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description?: string
}

interface RoleAssignment {
  id: number
  inspector_id: number
  role_id: number
  assigned_at: string
  assigned_by: number
}

interface ImpactAnalysis {
  affectedInspectors: number
  dependentRoles: string[]
  permissionChanges: string[]
  securityImplications: string[]
}

interface PermissionUsageAnalytics {
  totalPermissions: number
  usedPermissions: number
  unusedPermissions: string[]
  mostUsedPermissions: string[]
  rolePermissionMatrix: Record<string, string[]>
}

interface UseRBACReturn {
  roles: Role[] | null
  permissions: Permission[] | null
  roleAssignments: RoleAssignment[] | null
  isLoadingRoles: boolean
  isLoadingPermissions: boolean
  isLoadingAssignments: boolean
  createRole: (roleData: Partial<Role>) => Promise<Role>
  createRoleWithPermissions: (roleData: Partial<Role>, permissionIds: number[]) => Promise<Role>
  createRoleWithPermissionsAtomic: (roleData: Partial<Role>, permissionIds: number[]) => Promise<Role>
  updateRole: (roleId: number, roleData: Partial<Role>) => Promise<Role>
  deleteRole: (roleId: number) => Promise<void>
  assignPermissionsToRole: (roleId: number, permissionIds: number[]) => Promise<void>
  assignRolesToInspector: (inspectorId: number, roleIds: number[]) => Promise<void>
  getRoleImpactAnalysis: (roleId: number) => Promise<ImpactAnalysis>
  getPermissionUsageAnalytics: () => Promise<PermissionUsageAnalytics>
}

export function useRBAC(): UseRBACReturn {
  const { token } = useAuth()
  const [roles, setRoles] = useState<Role[] | null>(null)
  const [permissions, setPermissions] = useState<Permission[] | null>(null)
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[] | null>(null)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)

  // Fetch roles
  const fetchRoles = async () => {
    if (!token) return
    
    setIsLoadingRoles(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles?page=1&page_size=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      } else {
        console.error('Failed to fetch roles:', response.status)
        setRoles([])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      setRoles([])
    } finally {
      setIsLoadingRoles(false)
    }
  }

  // Fetch permissions
  const fetchPermissions = async () => {
    if (!token) return
    
    setIsLoadingPermissions(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/permissions?page=1&page_size=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
      } else {
        console.error('Failed to fetch permissions:', response.status)
        setPermissions([])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setPermissions([])
    } finally {
      setIsLoadingPermissions(false)
    }
  }

  // Fetch role assignments for all inspectors
  const fetchRoleAssignments = async () => {
    if (!token) {
      console.warn('No token available for fetchRoleAssignments')
      return
    }
    
    setIsLoadingAssignments(true)
    try {
      console.log('Fetching inspectors with token:', token ? 'present' : 'missing')
      
      // First get all inspectors
      const inspectorsResponse = await fetch(`${API_BASE_URL}/api/v1/inspectors?page=1&page_size=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Inspectors response status:', inspectorsResponse.status)
      
      if (inspectorsResponse.ok) {
        const inspectorsData = await inspectorsResponse.json()
        const inspectors = inspectorsData.inspectors || inspectorsData || [] // Handle different response formats
        
        console.log('Found inspectors:', inspectors.length)
        
        // Then get role assignments for each inspector
        const roleAssignments = []
        for (const inspector of inspectors) {
          try {
            const rolesResponse = await fetch(`${API_BASE_URL}/api/v1/admin/inspectors/${inspector.id}/roles`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (rolesResponse.ok) {
              const rolesData = await rolesResponse.json()
              for (const role of rolesData.roles || []) {
                roleAssignments.push({
                  id: `${inspector.id}-${role.id}`,
                  inspector_id: inspector.id,
                  role_id: role.id,
                  assigned_at: new Date().toISOString(), // API doesn't provide this
                  assigned_by: 1 // API doesn't provide this
                })
              }
            }
          } catch (error) {
            console.error(`Error fetching roles for inspector ${inspector.id}:`, error)
          }
        }
        
        console.log('Total role assignments found:', roleAssignments.length)
        setRoleAssignments(roleAssignments)
      } else {
        const errorText = await inspectorsResponse.text()
        console.error('Failed to fetch inspectors:', inspectorsResponse.status, errorText)
        setRoleAssignments([])
      }
    } catch (error) {
      console.error('Error fetching role assignments:', error)
      setRoleAssignments([])
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  // Create role
  const createRole = async (roleData: Partial<Role>): Promise<Role> => {
    if (!token) throw new Error('No authentication token')
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 409) {
        throw new Error(`Role with name '${roleData.name}' already exists. Please choose a different name.`)
      }
      throw new Error(errorData.detail || 'Failed to create role')
    }
    
    const newRole = await response.json()
    setRoles(prev => prev ? [...prev, newRole] : [newRole])
    return newRole
  }

  // Create role with permissions (atomic operation using backend endpoint)
  const createRoleWithPermissionsAtomic = async (
    roleData: Partial<Role>, 
    permissionIds: number[]
  ): Promise<Role> => {
    if (!token) throw new Error('No authentication token')
    
    const requestData = {
      ...roleData,
      permission_ids: permissionIds
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles/with-permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 409) {
        throw new Error(`Role with name '${roleData.name}' already exists. Please choose a different name.`)
      }
      throw new Error(errorData.detail || 'Failed to create role with permissions')
    }
    
    const newRole = await response.json()
    setRoles(prev => prev ? [...prev, newRole] : [newRole])
    return newRole
  }

  // Create role with permissions (atomic operation)
  const createRoleWithPermissions = async (
    roleData: Partial<Role>, 
    permissionIds: number[]
  ): Promise<Role> => {
    if (!token) throw new Error('No authentication token')
    
    // First create the role
    const newRole = await createRole(roleData)
    
    // Then assign permissions if any were provided
    if (permissionIds.length > 0) {
      try {
        await assignPermissionsToRole(newRole.id, permissionIds)
      } catch (permissionError) {
        // If permission assignment fails, clean up by deleting the role
        try {
          await deleteRole(newRole.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup role after permission assignment failure:', cleanupError)
        }
        throw permissionError
      }
    }
    
    return newRole
  }

  // Update role
  const updateRole = async (roleId: number, roleData: Partial<Role>): Promise<Role> => {
    if (!token) throw new Error('No authentication token')
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles/${roleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    })
    
    if (!response.ok) {
      throw new Error('Failed to update role')
    }
    
    const updatedRole = await response.json()
    setRoles(prev => prev ? prev.map(role => role.id === roleId ? updatedRole : role) : [updatedRole])
    return updatedRole
  }

  // Delete role
  const deleteRole = async (roleId: number): Promise<void> => {
    if (!token) throw new Error('No authentication token')
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles/${roleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete role')
    }
    
    setRoles(prev => prev ? prev.filter(role => role.id !== roleId) : [])
  }

  // Assign permissions to role
  const assignPermissionsToRole = async (roleId: number, permissionIds: number[]): Promise<void> => {
    if (!token) throw new Error('No authentication token')
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles/${roleId}/permissions`, {
      method: 'PUT', // ✅ Use PUT for bulk permission assignment
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ permission_ids: permissionIds }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || 'Failed to assign permissions to role')
    }
    
    // Refresh roles to get updated permissions
    fetchRoles()
  }

  // Assign roles to inspector using existing API
  const assignRolesToInspector = async (inspectorId: number, roleIds: number[]): Promise<void> => {
    if (!token) throw new Error('No authentication token')
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/inspectors/${inspectorId}/roles`, {
      method: 'PUT', // Use PUT for bulk assignment (replaces all roles)
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role_ids: roleIds }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to assign roles to inspector')
    }
    
    // Refresh role assignments
    fetchRoleAssignments()
  }

  // Get role impact analysis
  const getRoleImpactAnalysis = async (roleId: number): Promise<ImpactAnalysis> => {
    if (!token) throw new Error('No authentication token')
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles/${roleId}/impact-analysis`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to get role impact analysis')
    }
    
    return response.json()
  }

  // Get permission usage analytics
  const getPermissionUsageAnalytics = async (): Promise<PermissionUsageAnalytics> => {
    if (!token) throw new Error('No authentication token')
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/permissions/usage-analytics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to get permission usage analytics')
    }
    
    return response.json()
  }

  // Effect to fetch data on mount
  useEffect(() => {
    if (token) {
      fetchRoles()
      fetchPermissions()
      fetchRoleAssignments()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return {
    roles,
    permissions,
    roleAssignments,
    isLoadingRoles,
    isLoadingPermissions,
    isLoadingAssignments,
    createRole,
    createRoleWithPermissions,
    createRoleWithPermissionsAtomic,
    updateRole,
    deleteRole,
    assignPermissionsToRole,
    assignRolesToInspector,
    getRoleImpactAnalysis,
    getPermissionUsageAnalytics,
  }
}
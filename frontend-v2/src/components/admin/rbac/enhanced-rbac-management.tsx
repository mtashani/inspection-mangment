'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield, 
  Users, 
  Key, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  AlertTriangle,
  TrendingUp,
  Filter,
  Eye,
  Settings,
  Download,
  Upload,
  Zap,
  AlertCircle,
  CheckCircle2,
  UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRBAC } from '@/hooks/admin/use-rbac'

import { RBACAnalytics } from './rbac-analytics'
import { useAuth } from '@/contexts/auth-context'
import { authService } from '@/lib/auth'

interface EnhancedRBACManagementProps {
  className?: string
}

interface EnhancedRBACManagementProps {
  className?: string
}

export function EnhancedRBACManagement({ className }: EnhancedRBACManagementProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('analytics')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('')
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [isDeletingRole, setIsDeletingRole] = useState<number | null>(null)
  const [isEditingRole, setIsEditingRole] = useState<number | null>(null)
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [showViewRoleModal, setShowViewRoleModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    display_label: '',
    description: '',
    selectedPermissions: [] as number[]
  })
  const [editingRoleData, setEditingRoleData] = useState({
    name: '',
    display_label: '',
    description: '',
    selectedPermissions: [] as number[]
  })
  const [permissionSearch, setPermissionSearch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedAction, setSelectedAction] = useState('all')
  const [permissionUsageStats, setPermissionUsageStats] = useState<{[key: number]: any}>({})
  const [isLoadingUsageStats, setIsLoadingUsageStats] = useState(false)
  const [showOnlySelected, setShowOnlySelected] = useState(false)
  const [inspectors, setInspectors] = useState<any[]>([])
  const [isLoadingInspectors, setIsLoadingInspectors] = useState(false)
  const [selectedInspector, setSelectedInspector] = useState<number | null>(null)
  const [showAssignRolesModal, setShowAssignRolesModal] = useState(false)
  const [inspectorRoles, setInspectorRoles] = useState<number[]>([])
  const [isAssigningRoles, setIsAssigningRoles] = useState(false)
  const [expandedRolePermissions, setExpandedRolePermissions] = useState<Record<number, boolean>>({})
  
  const {
    roles,
    permissions,
    roleAssignments,
    isLoadingRoles,
    isLoadingPermissions,
    isLoadingAssignments,
    createRole,
    updateRole,
    deleteRole,
    assignPermissionsToRole,
    assignRolesToInspector,
    getRoleImpactAnalysis,
    getPermissionUsageAnalytics
  } = useRBAC()

  // Fetch permission usage statistics
  const fetchPermissionUsageStats = async () => {
    console.log('📋 Starting fetchPermissionUsageStats...')
    
    if (!user || !authService.getToken()) {
      console.warn('⚠️ No user or token available for permission usage stats')
      return
    }
    
    setIsLoadingUsageStats(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = (user as any)?.token || authService.getToken() || localStorage.getItem('access_token') || ''
      
      console.log('🔑 Making API request:', {
        url: `${API_URL}/api/v1/admin/permissions-usage/bulk-stats`,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'no token'
      })
      
      const response = await fetch(`${API_URL}/api/v1/admin/permissions-usage/bulk-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📊 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Permission usage stats loaded:', {
          hasUsageStats: !!(data.usage_stats),
          statsCount: Object.keys(data.usage_stats || {}).length,
          sampleData: Object.values(data.usage_stats || {}).slice(0, 2)
        })
        setPermissionUsageStats(data.usage_stats || {})
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.warn('⚠️ Failed to fetch permission usage stats:', {
          status: response.status,
          error: errorText
        })
        // Fallback to empty stats
        setPermissionUsageStats({})
      }
    } catch (error) {
      console.error('❌ Error fetching permission usage stats:', error)
      setPermissionUsageStats({})
    } finally {
      console.log('🏁 Finished fetchPermissionUsageStats, loading:', false)
      setIsLoadingUsageStats(false)
    }
  }

  // Fetch inspectors for assignments
  const fetchInspectors = async () => {
    if (!user || !authService.getToken()) return
    
    setIsLoadingInspectors(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = (user as any)?.token || authService.getToken() || localStorage.getItem('access_token') || ''
      
      console.log('📝 Fetching inspectors for assignments tab...')
      
      const response = await fetch(`${API_URL}/api/v1/inspectors?page=1&page_size=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📊 Inspectors API response:', {
        status: response.status,
        ok: response.ok
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Inspectors data loaded:', {
          isArray: Array.isArray(data),
          inspectorsCount: Array.isArray(data) ? data.length : (data.inspectors?.length || 0),
          sampleInspector: Array.isArray(data) ? data[0] : data.inspectors?.[0],
          dataKeys: Array.isArray(data) ? 'array' : Object.keys(data)
        })
        // Handle both direct array response and wrapped object response
        const inspectors = Array.isArray(data) ? data : (data.inspectors || [])
        setInspectors(inspectors)
      } else {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Failed to fetch inspectors:', {
          status: response.status,
          error: errorText
        })
        setInspectors([])
      }
    } catch (error) {
      console.error('❌ Error fetching inspectors:', error)
      setInspectors([])
    } finally {
      setIsLoadingInspectors(false)
    }
  }

  // Load permission usage stats when permissions are loaded
  useEffect(() => {
    console.log('🔍 Permission usage stats useEffect triggered:', {
      hasPermissions: !!permissions,
      permissionsLength: permissions?.length || 0,
      hasUsageStats: Object.keys(permissionUsageStats).length > 0,
      hasUser: !!user,
      hasToken: !!authService.getToken()
    })
    
    if (permissions && permissions.length > 0 && Object.keys(permissionUsageStats).length === 0) {
      console.log('📊 Triggering permission usage stats fetch...')
      fetchPermissionUsageStats()
    }
  }, [permissions, user]) // Added user dependency

  // Load inspectors when component mounts
  useEffect(() => {
    if (user && authService.getToken() && inspectors.length === 0) {
      fetchInspectors()
    }
  }, [user, inspectors.length])

  // Handler functions for assignments
  const handleAssignRoles = (inspectorId: number) => {
    const inspector = inspectors.find(i => i.id === inspectorId)
    if (!inspector) return
    
    // Get current roles for this inspector
    const currentRoles = roleAssignments?.filter(ra => ra.inspector_id === inspectorId).map(ra => ra.role_id) || []
    
    setSelectedInspector(inspectorId)
    setInspectorRoles(currentRoles)
    setShowAssignRolesModal(true)
  }

  const handleSaveRoleAssignments = async () => {
    if (!selectedInspector) return
    
    setIsAssigningRoles(true)
    try {
      await assignRolesToInspector(selectedInspector, inspectorRoles)
      toast({
        title: "Success",
        description: "Role assignments updated successfully"
      })
      setShowAssignRolesModal(false)
      setSelectedInspector(null)
      setInspectorRoles([])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update role assignments"
      })
    } finally {
      setIsAssigningRoles(false)
    }
  }

  // Permission checks
  const canViewRoles = (user as any)?.permissions?.includes('system_superadmin') || (user as any)?.permissions?.includes('system_hr_manage')
  const canManageRoles = (user as any)?.permissions?.includes('system_superadmin')
  const canViewAssignments = (user as any)?.permissions?.includes('system_superadmin')
  const canManageAssignments = (user as any)?.permissions?.includes('system_superadmin')

  // Helper function to render professional permissions assignment section
  const renderPermissionsAssignment = (selectedPermissions: number[], onPermissionChange: (permissions: number[]) => void, isEdit = false) => {
    const filteredPermissions = permissions?.filter((perm: any) => {
      const matchesSearch = perm.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                           (perm as any).display_label?.toLowerCase().includes(permissionSearch.toLowerCase())
      const matchesDepartment = selectedDepartment === 'all' || perm.resource === selectedDepartment
      const matchesAction = selectedAction === 'all' || perm.action === selectedAction
      const matchesSelection = !showOnlySelected || selectedPermissions.includes(perm.id)
      
      return matchesSearch && matchesDepartment && matchesAction && matchesSelection
    }) || []

    const departmentOptions = [
      { value: 'all', label: 'All Departments' },
      { value: 'system', label: 'System' },
      { value: 'mechanical', label: 'Mechanical' },
      { value: 'ndt', label: 'NDT' },
      { value: 'corrosion', label: 'Corrosion' },
      { value: 'electrical', label: 'Electrical' },
      { value: 'instrumentation', label: 'Instrumentation' },
      { value: 'quality', label: 'Quality' },
      { value: 'maintenance', label: 'Maintenance' }
    ]

    const actionOptions = [
      { value: 'all', label: 'All Actions' },
      { value: 'view', label: 'View' },
      { value: 'edit', label: 'Edit' },
      { value: 'approve', label: 'Approve' },
      { value: 'manage', label: 'Manage' }
    ]

    const groupedPermissions = filteredPermissions.reduce((groups: any, permission: any) => {
      const department = permission.resource
      if (!groups[department]) {
        groups[department] = []
      }
      groups[department].push(permission)
      return groups
    }, {})

    const handlePermissionToggle = (permissionId: number, checked: boolean) => {
      if (checked) {
        onPermissionChange([...selectedPermissions, permissionId])
      } else {
        onPermissionChange(selectedPermissions.filter(id => id !== permissionId))
      }
    }

    const handleBulkToggle = (departmentPermissions: any[], checked: boolean) => {
      const departmentIds = departmentPermissions.map(p => p.id)
      if (checked) {
        const newPermissions = [...selectedPermissions, ...departmentIds.filter(id => !selectedPermissions.includes(id))]
        onPermissionChange(newPermissions)
      } else {
        onPermissionChange(selectedPermissions.filter(id => !departmentIds.includes(id)))
      }
    }

    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              🔑 Permissions Assignment
              <Badge variant="outline" className="ml-2">
                {selectedPermissions.length} selected
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPermissionSearch('')
                setSelectedDepartment('all')
                setSelectedAction('all')
                setShowOnlySelected(false)
              }}
            >
              Clear Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Row */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search Permissions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions by name or description..."
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>
            
            {/* Filters Row - Stacked for better modal layout */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Action Type</Label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">View Options</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-selected"
                      checked={showOnlySelected}
                      onCheckedChange={(checked) => setShowOnlySelected(!!checked)}
                    />
                    <Label htmlFor="show-selected" className="text-sm cursor-pointer">
                      Selected only
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-3 bg-muted/20 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Quick Actions</span>
              <span className="text-xs text-muted-foreground">
                {selectedPermissions.length} permissions selected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const viewPermissions = permissions?.filter((p: any) => p.action === 'view').map((p: any) => p.id) || []
                  onPermissionChange([...new Set([...selectedPermissions, ...viewPermissions])])
                }}
                className="text-xs h-8"
              >
                <Eye className="h-3 w-3 mr-1" />
                Add All View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const editPermissions = permissions?.filter((p: any) => p.action === 'edit').map((p: any) => p.id) || []
                  onPermissionChange([...new Set([...selectedPermissions, ...editPermissions])])
                }}
                className="text-xs h-8"
              >
                <Edit className="h-3 w-3 mr-1" />
                Add All Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const approvePermissions = permissions?.filter((p: any) => p.action === 'approve').map((p: any) => p.id) || []
                  onPermissionChange([...new Set([...selectedPermissions, ...approvePermissions])])
                }}
                className="text-xs h-8"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Add All Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onPermissionChange([])}
                disabled={selectedPermissions.length === 0}
                className="text-xs h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Permissions List */}
          <div className="space-y-4">
            {Object.keys(groupedPermissions).length > 0 ? (
              Object.entries(groupedPermissions).map(([department, departmentPermissions]) => {
                const allSelected = (departmentPermissions as any[]).every(p => selectedPermissions.includes(p.id))
                const someSelected = (departmentPermissions as any[]).some(p => selectedPermissions.includes(p.id))
                
                return (
                  <div key={department} className="border rounded-lg">
                    {/* Department Header */}
                    <div className="flex items-center justify-between p-3 bg-muted/20 border-b">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          ref={(ref: any) => {
                            if (ref) {
                              ref.indeterminate = someSelected && !allSelected
                            }
                          }}
                          onCheckedChange={(checked) => handleBulkToggle(departmentPermissions as any[], !!checked)}
                        />
                        <Badge 
                          variant={department === 'system' ? 'default' : 'secondary'}
                          className="capitalize font-medium"
                        >
                          {department}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {(departmentPermissions as any[]).length} permissions
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {(departmentPermissions as any[]).filter(p => selectedPermissions.includes(p.id)).length} selected
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Department Permissions */}
                    <div className="p-3 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(departmentPermissions as any[]).map((permission: any) => (
                          <div key={permission.id} className="flex items-center space-x-3 p-2 hover:bg-muted/30 rounded">
                            <Checkbox
                              id={`${isEdit ? 'edit' : 'create'}-perm-${permission.id}`}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={(checked) => handlePermissionToggle(permission.id, !!checked)}
                            />
                            <div className="flex-1 min-w-0">
                              <Label 
                                htmlFor={`${isEdit ? 'edit' : 'create'}-perm-${permission.id}`} 
                                className="text-sm font-medium cursor-pointer block"
                              >
                                {(permission as any).display_label || permission.name}
                              </Label>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {permission.action}
                                </Badge>
                                {permission.description && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {permission.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No permissions found matching your filters</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setPermissionSearch('')
                    setSelectedDepartment('all')
                    setSelectedAction('all')
                    setShowOnlySelected(false)
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Selected Permissions Summary */}
          {selectedPermissions.length > 0 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Selected Permissions ({selectedPermissions.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOnlySelected(!showOnlySelected)}
                >
                  {showOnlySelected ? 'Show All' : 'Show Selected Only'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {selectedPermissions.map(permId => {
                  const perm = permissions?.find((p: any) => p.id === permId)
                  return perm ? (
                    <Badge key={permId} variant="secondary" className="text-xs">
                      {(perm as any).display_label || perm.name}
                      <button
                        onClick={() => handlePermissionToggle(permId, false)}
                        className="ml-1 hover:bg-destructive/20 rounded-full"
                      >
                        ×
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Action handlers
  const handleCreateRole = async () => {
    if (!canManageRoles) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to create roles"
      })
      return
    }
    setShowCreateRoleModal(true)
  }

  const handleCreateRoleSubmit = async () => {
    if (!newRoleData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Role name is required"
      })
      return
    }

    setIsCreatingRole(true)
    try {
      const createdRole = await createRole({
        name: newRoleData.name.trim(),
        display_label: newRoleData.display_label.trim() || undefined,
        description: newRoleData.description.trim() || undefined
      })
      
      // Assign permissions if selected
      if (newRoleData.selectedPermissions.length > 0) {
        await assignPermissionsToRole(createdRole.id, newRoleData.selectedPermissions)
      }
      
      toast({
        title: "Success",
        description: "Role created successfully"
      })
      
      setShowCreateRoleModal(false)
      setNewRoleData({ name: '', display_label: '', description: '', selectedPermissions: [] })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create role"
      })
    } finally {
      setIsCreatingRole(false)
    }
  }

  const handleViewRole = (roleId: number) => {
    const role = roles?.find(r => r.id === roleId)
    if (role) {
      setSelectedRole(roleId)
      setShowViewRoleModal(true)
    }
  }

  const handleEditRole = async (roleId: number) => {
    if (!canManageRoles) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to edit roles"
      })
      return
    }
    
    const role = roles?.find(r => r.id === roleId)
    if (role) {
      setIsCreatingRole(true) // Show loading state
      
      try {
        // Determine the API URL
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        
        // Try to fetch current role permissions from API
        let currentPermissions: number[] = []
        let apiSuccess = false
        
        try {
          const token = (user as any)?.token || authService.getToken() || localStorage.getItem('access_token') || ''
          
          if (!token) {
            throw new Error('No authentication token available')
          }
          
          console.log('🔍 Making API request:', {
            url: `${API_URL}/api/v1/admin/roles/${roleId}/permissions`,
            hasToken: !!token,
            tokenPreview: token.substring(0, 20) + '...',
            roleId
          })
          
          const response = await fetch(`${API_URL}/api/v1/admin/roles/${roleId}/permissions`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const permissionsData = await response.json()
            console.log('✅ Successfully fetched role permissions from API:', permissionsData)
            
            // Handle multiple possible data structures from API
            if (permissionsData.permissions && Array.isArray(permissionsData.permissions)) {
              currentPermissions = permissionsData.permissions
                .map((p: any) => {
                  const id = p.id || p.permission_id || (typeof p === 'number' ? p : null)
                  if (id) {
                    const parsed = typeof id === 'string' ? parseInt(id) : id
                    return isNaN(parsed) ? 0 : parsed
                  }
                  return 0
                })
                .filter((id: number) => id > 0)
            } else if (Array.isArray(permissionsData)) {
              currentPermissions = permissionsData
                .map((p: any) => {
                  if (typeof p === 'object' && (p.id || p.permission_id)) {
                    const id = p.id || p.permission_id
                    const parsed = typeof id === 'string' ? parseInt(id) : id
                    return isNaN(parsed) ? 0 : parsed
                  } else if (typeof p === 'number') {
                    return p
                  } else if (typeof p === 'string') {
                    const parsed = parseInt(p)
                    return isNaN(parsed) ? 0 : parsed
                  }
                  return 0
                })
                .filter((id: number) => id > 0)
            } else if (permissionsData.data && Array.isArray(permissionsData.data)) {
              currentPermissions = permissionsData.data
                .map((p: any) => {
                  const id = p.id || p.permission_id
                  if (id) {
                    const parsed = typeof id === 'string' ? parseInt(id) : id
                    return isNaN(parsed) ? 0 : parsed
                  }
                  return 0
                })
                .filter((id: number) => id > 0)
            } else if (permissionsData.role_permissions && Array.isArray(permissionsData.role_permissions)) {
              currentPermissions = permissionsData.role_permissions
                .map((rp: any) => {
                  const id = rp.permission_id || rp.id
                  if (id) {
                    const parsed = typeof id === 'string' ? parseInt(id) : id
                    return isNaN(parsed) ? 0 : parsed
                  }
                  return 0
                })
                .filter((id: number) => id > 0)
            }
            
            apiSuccess = true
            console.log('✅ Extracted permission IDs from API:', currentPermissions)
            
          } else {
            const errorText = await response.text().catch(() => 'Unknown error')
            console.warn(`⚠️ API Error (${response.status}):`, errorText)
            
            if (response.status === 401) {
              toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "Your session may have expired. Please refresh and try again."
              })
            } else if (response.status === 500) {
              console.warn('🔥 Server error detected, will use cached role data')
            }
          }
        } catch (fetchError) {
          console.error('🔌 Network error fetching permissions:', fetchError)
        }
        
        // Enhanced fallback when API fails
        if (!apiSuccess) {
          console.log('📋 Using fallback data from cached role information')
          
          if (role.permissions) {
            if (Array.isArray(role.permissions)) {
              currentPermissions = role.permissions
                .map((p: any) => {
                  if (typeof p === 'object' && (p.id || p.permission_id)) {
                    const id = p.id || p.permission_id
                    const parsed = typeof id === 'string' ? parseInt(id) : id
                    return isNaN(parsed) ? 0 : parsed
                  } else if (typeof p === 'number') {
                    return p
                  } else if (typeof p === 'string') {
                    const parsed = parseInt(p)
                    return isNaN(parsed) ? 0 : parsed
                  }
                  return 0
                })
                .filter((id: number) => id > 0)
            } else if (typeof role.permissions === 'string') {
              try {
                const parsed = JSON.parse(role.permissions)
                if (Array.isArray(parsed)) {
                  currentPermissions = parsed.map(p => {
                    const id = typeof p === 'string' ? parseInt(p) : p
                    return isNaN(id) ? 0 : id
                  }).filter(id => id > 0)
                }
              } catch {
                console.warn('❌ Failed to parse permissions string:', role.permissions)
              }
            } else if (typeof role.permissions === 'number') {
              currentPermissions = [role.permissions]
            }
          }
          
          // Additional fallback: try to infer permissions from role name
          if (currentPermissions.length === 0 && role.name) {
            console.log('🔍 Attempting to infer permissions from role name:', role.name)
            const roleName = role.name.toLowerCase()
            
            // Map common role patterns to permission IDs (based on your system)
            const permissionInference: { [key: string]: number[] } = {
              'corrosion': [3, 4], // corrosion_view, corrosion_edit
              'mechanical': [5, 6], // mechanical_view, mechanical_edit
              'ndt': [7, 8], // ndt_view, ndt_edit
              'electrical': [9, 10], // electrical_view, electrical_edit
              'maintenance': [11, 12], // maintenance_view, maintenance_edit
              'quality': [13, 14], // quality_view, quality_edit
              'system': [1, 2], // system permissions
            }
            
            for (const [domain, permIds] of Object.entries(permissionInference)) {
              if (roleName.includes(domain)) {
                currentPermissions = permIds
                console.log(`🎯 Inferred permissions for ${domain} role:`, currentPermissions)
                break
              }
            }
          }
          
          console.log('📋 Fallback permission IDs:', currentPermissions)
          
          if (!apiSuccess) {
            toast({
              variant: "default",
              title: "Loading from Cache",
              description: "Unable to fetch latest permissions from server. Using cached data."
            })
          }
        }
        
        console.log('🎉 Final current permissions for edit:', currentPermissions)
        
        setEditingRoleData({
          name: role.name,
          display_label: role.display_label || '',
          description: role.description || '',
          selectedPermissions: currentPermissions
        })
        setIsEditingRole(roleId)
        setShowEditRoleModal(true)
        
      } catch (error) {
        console.error('💥 Critical error in handleEditRole:', error)
        
        // Final emergency fallback
        const role = roles?.find(r => r.id === roleId)
        if (role) {
          setEditingRoleData({
            name: role.name,
            display_label: role.display_label || '',
            description: role.description || '',
            selectedPermissions: [] // Start with empty to let user select
          })
          setIsEditingRole(roleId)
          setShowEditRoleModal(true)
          
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Failed to load role permissions. You can manually select the required permissions."
          })
        }
      } finally {
        setIsCreatingRole(false)
      }
    }
  }

  const handleEditRoleSubmit = async () => {
    if (!editingRoleData.name.trim() || !isEditingRole) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Role name is required"
      })
      return
    }

    setIsCreatingRole(true)
    try {
      // Enhanced error handling for role update
      const token = (user as any)?.token || authService.getToken() || localStorage.getItem('access_token') || ''
      
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "No authentication token found. Please refresh and try again."
        })
        return
      }
      
      console.log('🔄 Updating role with data:', {
        roleId: isEditingRole,
        name: editingRoleData.name.trim(),
        display_label: editingRoleData.display_label.trim() || undefined,
        description: editingRoleData.description.trim() || undefined,
        selectedPermissions: editingRoleData.selectedPermissions
      })
      
      // Try to update role basic information first
      try {
        await updateRole(isEditingRole, {
          name: editingRoleData.name.trim(),
          display_label: editingRoleData.display_label.trim() || undefined,
          description: editingRoleData.description.trim() || undefined
        })
        
        console.log('✅ Role basic information updated successfully')
      } catch (roleUpdateError) {
        console.error('❌ Role update failed:', roleUpdateError)
        
        // Check if it's an authentication error
        if (roleUpdateError instanceof Error && roleUpdateError.message.includes('401')) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Your session has expired. Please refresh the page and try again."
          })
          return
        }
        
        // Check if it's a server error
        if (roleUpdateError instanceof Error && roleUpdateError.message.includes('500')) {
          toast({
            variant: "destructive",
            title: "Server Error",
            description: "The server encountered an error. Please try again later or contact support."
          })
          return
        }
        
        // Re-throw for general error handling
        throw roleUpdateError
      }
      
      // Assign permissions if selected and role update was successful
      if (editingRoleData.selectedPermissions.length > 0) {
        try {
          await assignPermissionsToRole(isEditingRole, editingRoleData.selectedPermissions)
          console.log('✅ Permissions assigned successfully')
        } catch (permissionError) {
          console.error('❌ Permission assignment failed:', permissionError)
          
          // Don't fail the entire operation if only permission assignment fails
          toast({
            variant: "default",
            title: "Partial Success",
            description: "Role information updated, but permission assignment failed. You may need to set permissions manually."
          })
        }
      }
      
      toast({
        title: "Success",
        description: "Role updated successfully"
      })
      
      setShowEditRoleModal(false)
      setEditingRoleData({ name: '', display_label: '', description: '', selectedPermissions: [] })
      setIsEditingRole(null)
      
    } catch (error) {
      console.error('💥 Critical error in handleEditRoleSubmit:', error)
      
      let errorMessage = "Failed to update role"
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = "Authentication failed. Please refresh the page and try again."
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = "You don't have permission to update this role."
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorMessage = "Server error occurred. Please try again later or contact support."
        } else if (error.message.includes('Network')) {
          errorMessage = "Network error. Please check your connection and try again."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage
      })
    } finally {
      setIsCreatingRole(false)
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!canManageRoles) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to delete roles"
      })
      return
    }
    
    if (deleteConfirmText !== 'delete') {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please type 'delete' to confirm"
      })
      return
    }
    
    setIsDeletingRole(roleId)
    try {
      await deleteRole(roleId)
      toast({
        title: "Success",
        description: "Role deleted successfully"
      })
      setShowDeleteConfirm(null)
      setDeleteConfirmText('')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete role"
      })
    } finally {
      setIsDeletingRole(null)
    }
  }

  // Show error if user doesn't have basic view permissions
  if (!canViewRoles) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  Access Denied
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You need 'system_superadmin' or 'system_hr_manage' permission to access RBAC management.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter functions
  const filteredRoles = roles?.filter((role: any) => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.display_label?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const filteredPermissions = permissions?.filter((permission: any) => {
    const matchesSearch = permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permission.display_label?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || selectedCategory === '__all_resources__' || permission.resource === selectedCategory
    const matchesDomain = !selectedDomain || selectedDomain === '__all_actions__' || permission.action === selectedDomain
    
    return matchesSearch && matchesCategory && matchesDomain
  }) || []

  // Get unique categories and domains from real permissions
  const categories = Array.from(new Set(permissions?.map((p: any) => p.resource) || []))
  const domains = Array.from(new Set(permissions?.map((p: any) => p.action) || []))

  // Role hierarchy helper functions
  // Get domains covered by a role based on its permissions
  const getCoveredDomains = (role: any) => {
    if (!role?.permissions || !Array.isArray(role.permissions)) return []
    
    // If role has system_superadmin permission, it covers all domains
    if (role.permissions.includes('system_superadmin')) {
      return ['system', 'mechanical', 'ndt', 'corrosion', 'electrical', 'instrumentation', 'quality', 'maintenance']
    }
    
    const domainPermissions = [
      'mechanical_view', 'mechanical_edit', 'mechanical_approve', 'mechanical_manage',
      'ndt_view', 'ndt_edit', 'ndt_approve', 'ndt_manage',
      'corrosion_view', 'corrosion_edit', 'corrosion_approve', 'corrosion_manage',
      'electrical_view', 'electrical_edit', 'electrical_approve', 'electrical_manage',
      'instrumentation_view', 'instrumentation_edit', 'instrumentation_approve', 'instrumentation_manage',
      'quality_view', 'quality_edit', 'quality_approve', 'quality_manage',
      'maintenance_view', 'maintenance_edit', 'maintenance_approve', 'maintenance_manage'
    ]
    
    const coveredDomains = new Set<string>()
    
    // Check if role has comprehensive permissions (manage or all 3 standard permissions)
    const domainMap: Record<string, number> = {}
    
    role.permissions.forEach((perm: any) => {
      // Handle both permission IDs and permission names
      const permName = typeof perm === 'object' ? (perm.name || perm.display_label) : perm
      
      if (typeof permName === 'string' && domainPermissions.includes(permName)) {
        const [domain] = permName.split('_')
        if (domain) {
          coveredDomains.add(domain)
          domainMap[domain] = (domainMap[domain] || 0) + 1
        }
      }
    })
    
    // A role is comprehensive if it has manage permission or all 3 standard permissions (view, edit, approve)
    const comprehensiveDomains = Object.entries(domainMap)
      .filter(([domain, count]) => {
        // Check if domain has manage permission
        const hasManage = role.permissions.some((perm: any) => {
          const permName = typeof perm === 'object' ? (perm.name || perm.display_label) : perm
          return typeof permName === 'string' && permName === `${domain}_manage`
        })
        
        // Or check if domain has all 3 standard permissions
        const hasView = role.permissions.some((perm: any) => {
          const permName = typeof perm === 'object' ? (perm.name || perm.display_label) : perm
          return typeof permName === 'string' && permName === `${domain}_view`
        })
        const hasEdit = role.permissions.some((perm: any) => {
          const permName = typeof perm === 'object' ? (perm.name || perm.display_label) : perm
          return typeof permName === 'string' && permName === `${domain}_edit`
        })
        const hasApprove = role.permissions.some((perm: any) => {
          const permName = typeof perm === 'object' ? (perm.name || perm.display_label) : perm
          return typeof permName === 'string' && permName === `${domain}_approve`
        })
        
        return hasManage || (hasView && hasEdit && hasApprove)
      })
      .map(([domain]) => domain)
    
    return comprehensiveDomains
  }

  // Check if a role has comprehensive permissions
  const hasComprehensivePermissions = (role: any) => {
    const coveredDomains = getCoveredDomains(role)
    return coveredDomains.length > 0
  }

  // Check if assigning a role would be redundant given existing role assignments
  const isRoleRedundant = (roleId: number, assignedRoleIds: number[]) => {
    // Can't be redundant if no roles are assigned
    if (assignedRoleIds.length === 0) return false
    
    const role = roles?.find(r => r.id === roleId)
    if (!role) return false
    
    // Super admin roles make all other roles redundant
    if (role.permissions?.includes('system_superadmin')) return false // Super admin is never redundant
    
    // Check if any assigned role already covers the same domains
    for (const assignedRoleId of assignedRoleIds) {
      const assignedRole = roles?.find(r => r.id === assignedRoleId)
      if (!assignedRole) continue
      
      // Super admin roles make all other roles redundant
      if (assignedRole.permissions?.includes('system_superadmin')) return true
      
      // Get domains covered by both roles
      const roleDomains = getCoveredDomains(role)
      const assignedRoleDomains = getCoveredDomains(assignedRole)
      
      // If assigned role covers all domains of the current role, it's redundant
      if (roleDomains.every(domain => assignedRoleDomains.includes(domain))) {
        return true
      }
    }
    
    return false
  }

  // Define columns for roles table
  const roleColumns = [
    {
      accessorKey: 'name',
      header: 'Role Name',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.getValue('name')}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.display_label}
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: any) => (
        <div className="max-w-96 truncate">{row.getValue('description')}</div>
      )
    },
    {
      accessorKey: 'inspector_count',
      header: 'Inspectors',
      cell: ({ row }: any) => (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {row.getValue('inspector_count') || 0}
        </Badge>
      )
    },
    {
      accessorKey: 'permission_count',
      header: 'Permissions',
      cell: ({ row }: any) => (
        <Badge variant="outline" className="flex items-center gap-1">
          <Key className="h-3 w-3" />
          {row.original.permissions?.length || 0}
        </Badge>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleViewRole(row.original.id)}
            disabled={!canViewRoles}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEditRole(row.original.id)}
            disabled={!canManageRoles}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog open={showDeleteConfirm === row.original.id} onOpenChange={(open) => {
            if (!open) {
              setShowDeleteConfirm(null)
              setDeleteConfirmText('')
            }
          }}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(row.original.id)}
                disabled={!canManageRoles}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Role</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the role "{row.original.name}"? This action cannot be undone and will remove all assignments.
                  <br /><br />
                  <strong>Type "delete" to confirm:</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Type 'delete' to confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDeleteRole(row.original.id)}
                  className={`${
                    deleteConfirmText !== 'delete' 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  } transition-colors duration-200`}
                  disabled={isDeletingRole === row.original.id || deleteConfirmText !== 'delete'}
                >
                  {isDeletingRole === row.original.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  ) : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )
    }
  ]

  // Define columns for permissions table
  const permissionColumns = [
    {
      accessorKey: 'name',
      header: 'Permission',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.original.display_label || row.getValue('name')}</div>
            <div className="text-sm text-muted-foreground font-mono">
              {row.getValue('name')}
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'resource',
      header: 'Resource',
      cell: ({ row }: any) => (
        <Badge 
          variant={row.getValue('resource') === 'system' ? 'default' : 'secondary'}
          className={cn(
            'capitalize',
            row.getValue('resource') === 'system' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
          )}
        >
          {row.getValue('resource')}
        </Badge>
      )
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }: any) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue('action')}
        </Badge>
      )
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: any) => (
        <div className="max-w-64 truncate">{row.original.description}</div>
      )
    },
    {
      id: 'usage',
      header: 'Usage',
      cell: ({ row }: any) => {
        const permissionId = row.original.id
        const usageStats = permissionUsageStats[permissionId]
        
        // Debug logging for first few permissions
        if (permissionId <= 5) {
          console.log(`🔍 Usage cell for permission ${permissionId}:`, {
            hasUsageStats: !!usageStats,
            isLoading: isLoadingUsageStats,
            usageStatsKeys: Object.keys(permissionUsageStats),
            usageStats: usageStats
          })
        }
        
        if (isLoadingUsageStats) {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <div className="h-3 w-8 bg-muted animate-pulse rounded"></div>
              </Badge>
              <Badge variant="outline" className="text-xs">
                <div className="h-3 w-8 bg-muted animate-pulse rounded"></div>
              </Badge>
            </div>
          )
        }
        
        if (!usageStats) {
          return (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Badge variant="outline" className="text-xs">
                - roles
              </Badge>
              <Badge variant="outline" className="text-xs">
                - users
              </Badge>
            </div>
          )
        }
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs" title={`Used by ${usageStats.roles_count} roles`}>
              {usageStats.roles_count || 0} roles
            </Badge>
            <Badge variant="outline" className="text-xs" title={`${usageStats.usage_percentage || 0}% of ${usageStats.total_inspectors || 0} inspectors`}>
              {usageStats.inspectors_count || 0} users
            </Badge>
          </div>
        )
      }
    }
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Enhanced RBAC Management
          </h1>
          <p className="text-muted-foreground">
            Advanced role-based access control with standardized permissions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={!canViewRoles}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={!canManageRoles}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button 
            size="sm"
            onClick={handleCreateRole}
            disabled={!canManageRoles || isCreatingRole}
          >
            {isCreatingRole ? (
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Role
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>



        <TabsContent value="roles" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Role Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-roles">Search Roles</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-roles"
                      placeholder="Search by role name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-32">
                  <Label>Quick Actions</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCreateRole}
                      disabled={!canManageRoles || isCreatingRole}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={roleColumns}
                data={filteredRoles}
                loading={isLoadingRoles}
                searchable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          {/* Permission Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Standardized Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-permissions">Search Permissions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-permissions"
                      placeholder="Search permissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-40">
                  <Label htmlFor="category-filter">Resource</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Resources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all_resources__">All Resources</SelectItem>
                      {categories.map((category: string) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-40">
                  <Label htmlFor="domain-filter">Action</Label>
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all_actions__">All Actions</SelectItem>
                      {domains.map((domain: string) => (
                        <SelectItem key={domain} value={domain}>
                          {domain.charAt(0).toUpperCase() + domain.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Permission Matrix</CardTitle>
                <Badge variant="secondary">
                  {filteredPermissions.length} permissions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={permissionColumns}
                data={filteredPermissions}
                loading={isLoadingPermissions}
                searchable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          {/* Assignment Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Inspector Role Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-inspectors">Search Inspectors</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-inspectors"
                      placeholder="Search by inspector name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-32">
                  <Label>Quick Stats</Label>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>{inspectors.length} inspectors</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Role Assignments Matrix</CardTitle>
                <Badge variant="secondary">
                  {roleAssignments?.length || 0} assignments
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    accessorKey: 'full_name',
                    header: 'Inspector',
                    cell: ({ row }: any) => {
                      const inspector = inspectors.find(i => i.id === row.original.id)
                      return (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{inspector?.full_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {inspector?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      )
                    }
                  },
                  {
                    accessorKey: 'employee_id',
                    header: 'Employee ID',
                    cell: ({ row }: any) => {
                      const inspector = inspectors.find(i => i.id === row.original.id)
                      return (
                        <Badge variant="outline" className="font-mono">
                          {inspector?.employee_id || 'N/A'}
                        </Badge>
                      )
                    }
                  },
                  {
                    id: 'roles',
                    header: 'Assigned Roles',
                    cell: ({ row }: any) => {
                      const inspectorRoles = roleAssignments?.filter(ra => ra.inspector_id === row.original.id) || []
                      const roleNames = inspectorRoles.map(ra => {
                        const role = roles?.find(r => r.id === ra.role_id)
                        return role?.display_label || role?.name || 'Unknown Role'
                      })
                      
                      return (
                        <div className="flex flex-wrap gap-1">
                          {roleNames.length > 0 ? (
                            roleNames.map((roleName, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {roleName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No roles assigned</span>
                          )}
                        </div>
                      )
                    }
                  },
                  {
                    id: 'permissions_count',
                    header: 'Permissions',
                    cell: ({ row }: any) => {
                      const inspectorRoles = roleAssignments?.filter(ra => ra.inspector_id === row.original.id) || []
                      const allPermissions = new Set()
                      
                      inspectorRoles.forEach(ra => {
                        const role = roles?.find(r => r.id === ra.role_id)
                        if (role?.permissions) {
                          role.permissions.forEach(perm => allPermissions.add(perm))
                        }
                      })
                      
                      return (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          {allPermissions.size}
                        </Badge>
                      )
                    }
                  },
                  {
                    id: 'actions',
                    header: 'Actions',
                    cell: ({ row }: any) => (
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAssignRoles(row.original.id)}
                          disabled={!canManageAssignments}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  }
                ]}
                data={inspectors.filter(inspector => 
                  inspector.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  inspector.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                loading={isLoadingInspectors || isLoadingAssignments}
                searchable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <RBACAnalytics />
        </TabsContent>
      </Tabs>

      {/* Create Role Modal */}
      <Dialog open={showCreateRoleModal} onOpenChange={setShowCreateRoleModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              Create New Role
            </DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions for system access control.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  📝 Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name" className="text-sm font-medium">
                      Role Name *
                    </Label>
                    <Input
                      id="role-name"
                      value={newRoleData.name}
                      onChange={(e) => setNewRoleData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Senior Inspector"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-display-label" className="text-sm font-medium">
                      Display Label
                    </Label>
                    <Input
                      id="role-display-label"
                      value={newRoleData.display_label}
                      onChange={(e) => setNewRoleData(prev => ({ ...prev, display_label: e.target.value }))}
                      placeholder="e.g., Senior Inspector"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="role-description"
                    value={newRoleData.description}
                    onChange={(e) => setNewRoleData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the role responsibilities"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            {renderPermissionsAssignment(
              newRoleData.selectedPermissions,
              (permissions) => setNewRoleData(prev => ({ ...prev, selectedPermissions: permissions })),
              false
            )}
          </div>

          <Separator />

          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateRoleModal(false)
                setNewRoleData({ name: '', display_label: '', description: '', selectedPermissions: [] })
                setPermissionSearch('')
                setSelectedDepartment('all')
                setSelectedAction('all')
                setShowOnlySelected(false)
              }}
              disabled={isCreatingRole}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRoleSubmit}
              disabled={isCreatingRole || !newRoleData.name.trim()}
              className="min-w-[100px] gap-2"
            >
              {isCreatingRole ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={showEditRoleModal} onOpenChange={setShowEditRoleModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 rounded-lg bg-primary/10">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              Edit Role
            </DialogTitle>
            <DialogDescription>
              Update role information and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  📝 Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-role-name" className="text-sm font-medium">
                      Role Name *
                    </Label>
                    <Input
                      id="edit-role-name"
                      value={editingRoleData.name}
                      onChange={(e) => setEditingRoleData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Senior Inspector"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role-display-label" className="text-sm font-medium">
                      Display Label
                    </Label>
                    <Input
                      id="edit-role-display-label"
                      value={editingRoleData.display_label}
                      onChange={(e) => setEditingRoleData(prev => ({ ...prev, display_label: e.target.value }))}
                      placeholder="e.g., Senior Inspector"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role-description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="edit-role-description"
                    value={editingRoleData.description}
                    onChange={(e) => setEditingRoleData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the role responsibilities"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            {renderPermissionsAssignment(
              editingRoleData.selectedPermissions,
              (permissions) => setEditingRoleData(prev => ({ ...prev, selectedPermissions: permissions })),
              true
            )}
          </div>

          <Separator />

          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditRoleModal(false)
                setEditingRoleData({ name: '', display_label: '', description: '', selectedPermissions: [] })
                setIsEditingRole(null)
                setPermissionSearch('')
                setSelectedDepartment('all')
                setSelectedAction('all')
                setShowOnlySelected(false)
              }}
              disabled={isCreatingRole}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditRoleSubmit}
              disabled={isCreatingRole || !editingRoleData.name.trim()}
              className="min-w-[100px] gap-2"
            >
              {isCreatingRole ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Update Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Role Modal */}
      <Dialog open={showViewRoleModal} onOpenChange={setShowViewRoleModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              Role Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRole && roles && (() => {
            const role = roles.find(r => r.id === selectedRole)
            if (!role) return null
            return (
              <div className="space-y-4 py-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Role Name</Label>
                        <p className="text-sm font-medium">{role.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Display Label</Label>
                        <p className="text-sm">{role.display_label || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p className="text-sm">{role.description || 'No description provided'}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Assigned Inspectors</Label>
                        <div className="mt-2 space-y-1">
                          {/* Show all assignments if expanded, otherwise show first 5 */}
                          {(expandedRolePermissions[role.id] 
                            ? roleAssignments?.filter(assignment => assignment.role_id === role.id)
                            : roleAssignments?.filter(assignment => assignment.role_id === role.id)?.slice(0, 5)
                          )?.map((assignment, index) => {
                            // Find inspector name (this is simplified - in real app you'd have inspector details)
                            return (
                              <div key={assignment.id} className="flex items-center gap-2 text-sm">
                                <UserCheck className="h-3 w-3 text-muted-foreground" />
                                <span>Inspector #{assignment.inspector_id}</span>
                              </div>
                            )
                          }) || (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserCheck className="h-3 w-3" />
                              <span>No inspectors assigned</span>
                            </div>
                          )}
                          {/* Show expand/collapse button if there are more than 5 assignments */}
                          {(roleAssignments?.filter(assignment => assignment.role_id === role.id)?.length || 0) > 5 && (
                            <button 
                              onClick={() => setExpandedRolePermissions(prev => ({
                                ...prev,
                                [role.id]: !prev[role.id]
                              }))}
                              className="inline-flex items-center text-xs text-muted-foreground mt-1 hover:text-primary hover:underline focus:outline-none"
                            >
                              <span className="mr-1">
                                {expandedRolePermissions[role.id] ? 'Show less' : 'Show more'}
                              </span>
                              {!expandedRolePermissions[role.id] && (
                                <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                  +{(roleAssignments?.filter(assignment => assignment.role_id === role.id)?.length || 0) - 5}
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Permissions</Label>
                        <div className="mt-2 space-y-1">
                          {role.permissions && (role.permissions as any[]).length > 0 ? (
                            <div className="space-y-1">
                              {/* Show all permissions if expanded, otherwise show first 5 */}
                              {(expandedRolePermissions[role.id] 
                                ? (role.permissions as any[])
                                : (role.permissions as any[]).slice(0, 5)
                              ).map((permission: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <Key className="h-3 w-3 text-muted-foreground" />
                                  <span>{permission.display_label || permission.name || `Permission #${permission}`}</span>
                                  {permission.resource && permission.action && (
                                    <div className="flex gap-1">
                                      <Badge variant="outline" className="text-xs">
                                        {permission.resource}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {permission.action}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {/* Show expand/collapse button if there are more than 5 permissions */}
                              {(role.permissions as any[]).length > 5 && (
                                <button 
                                  onClick={() => setExpandedRolePermissions(prev => ({
                                    ...prev,
                                    [role.id]: !prev[role.id]
                                  }))}
                                  className="inline-flex items-center text-xs text-muted-foreground mt-1 hover:text-primary hover:underline focus:outline-none"
                                >
                                  <span className="mr-1">
                                    {expandedRolePermissions[role.id] ? 'Show less' : 'Show more'}
                                  </span>
                                  {!expandedRolePermissions[role.id] && (
                                    <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                      +{(role.permissions as any[]).length - 5}
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : permissions && permissions.length > 0 && role.permissions ? (
                            // Fallback: look up permissions by ID if role.permissions contains IDs
                            <div className="space-y-1">
                              {/* Show all permissions if expanded, otherwise show first 5 */}
                              {(expandedRolePermissions[role.id] 
                                ? (role.permissions as any[])
                                : (role.permissions as any[]).slice(0, 5)
                              ).map((permissionId: any, index: number) => {
                                const permission = permissions.find((p: any) => p.id === permissionId)
                                return permission ? (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <Key className="h-3 w-3 text-muted-foreground" />
                                    <span>{(permission as any).display_label || permission.name}</span>
                                    <div className="flex gap-1">
                                      <Badge variant="outline" className="text-xs">
                                        {permission.resource}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {permission.action}
                                      </Badge>
                                    </div>
                                  </div>
                                ) : (
                                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Key className="h-3 w-3" />
                                    <span>Permission #{permissionId}</span>
                                  </div>
                                )
                              })}
                              {/* Show expand/collapse button if there are more than 5 permissions */}
                              {(role.permissions as any[]).length > 5 && (
                                <button 
                                  onClick={() => setExpandedRolePermissions(prev => ({
                                    ...prev,
                                    [role.id]: !prev[role.id]
                                  }))}
                                  className="inline-flex items-center text-xs text-muted-foreground mt-1 hover:text-primary hover:underline focus:outline-none"
                                >
                                  <span className="mr-1">
                                    {expandedRolePermissions[role.id] ? 'Show less' : 'Show more'}
                                  </span>
                                  {!expandedRolePermissions[role.id] && (
                                    <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                      +{(role.permissions as any[]).length - 5}
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Key className="h-3 w-3" />
                              <span>No permissions assigned</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })()}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowViewRoleModal(false);
                // Reset expanded state when closing modal
                setExpandedRolePermissions({});
              }}
            >
              Close
            </Button>
            {selectedRole && (
              <Button 
                onClick={() => {
                  setShowViewRoleModal(false);
                  // Reset expanded state when closing modal
                  setExpandedRolePermissions({});
                  handleEditRole(selectedRole)
                }}
                disabled={!canManageRoles}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Role
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Roles Modal */}
      <Dialog open={showAssignRolesModal} onOpenChange={setShowAssignRolesModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="p-2 rounded-lg bg-primary/10">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              Assign Roles
            </DialogTitle>
            <DialogDescription>
              {selectedInspector && (() => {
                const inspector = inspectors.find(i => i.id === selectedInspector)
                return `Manage role assignments for ${inspector?.full_name || 'Inspector'}`
              })()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  🔑 Role Selection
                  <Badge variant="outline" className="ml-2">
                    {inspectorRoles.length} selected
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select roles to assign to this inspector. Comprehensive roles (with manage permissions or all 3 standard permissions) 
                  may make other roles redundant. Roles with system_superadmin permission grant all permissions implicitly.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {roles?.map((role: any) => {
                    const isSelected = inspectorRoles.includes(role.id)
                    
                    // Check if this role has system_superadmin permission
                    const hasSuperAdminPermission = role.permissions?.includes('system_superadmin')
                    
                    // Check if this role has comprehensive permissions (manage or all 3 standard permissions)
                    const isComprehensiveRole = hasComprehensivePermissions(role);
                    const coveredDomains = getCoveredDomains(role);
                    
                    // Check if assigning this role would be redundant
                    const isRedundant = isRoleRedundant(role.id, inspectorRoles) && !isSelected;
                    
                    // If inspector already has a comprehensive role for a domain, disable other roles for that domain
                    const isDisabled = isRedundant;
                    
                    return (
                      <div 
                        key={role.id} 
                        className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : isDisabled 
                              ? 'border-muted bg-muted/50 opacity-70' 
                              : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setInspectorRoles(prev => [...prev, role.id])
                            } else {
                              setInspectorRoles(prev => prev.filter(id => id !== role.id))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Shield className={`h-4 w-4 ${hasSuperAdminPermission ? 'text-destructive' : isComprehensiveRole ? 'text-primary' : 'text-muted-foreground'}`} />
                            <Label 
                              htmlFor={`role-${role.id}`} 
                              className={`font-medium cursor-pointer ${isDisabled ? 'opacity-70' : ''}`}
                            >
                              {role.display_label || role.name}
                              {hasSuperAdminPermission && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Super Admin
                                </Badge>
                              )}
                              {isComprehensiveRole && !hasSuperAdminPermission && (
                                <Badge variant="default" className="ml-2 text-xs">
                                  Comprehensive
                                </Badge>
                              )}
                            </Label>
                          </div>
                          {role.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {role.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {role.permissions?.length || 0} permissions
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {role.inspector_count || 0} inspectors
                            </Badge>
                            {coveredDomains.map((domain: string) => (
                              <Badge key={domain} variant="secondary" className="text-xs">
                                {domain}
                              </Badge>
                            ))}
                            {isDisabled && (
                              <Badge variant="secondary" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Redundant Role
                              </Badge>
                            )}
                          </div>
                        </div>
                        {(hasSuperAdminPermission || isComprehensiveRole) && (
                          <div className={`p-2 rounded-lg ${hasSuperAdminPermission ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                            <Zap className={`h-4 w-4 ${hasSuperAdminPermission ? 'text-destructive' : 'text-primary'}`} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Role Redundancy Warning */}
                {inspectorRoles.some(roleId => {
                  const role = roles?.find((r: any) => r.id === roleId);
                  if (!role) return false;
                  
                  // Check if this role makes others redundant
                  const otherRoles = inspectorRoles.filter(id => id !== roleId);
                  return otherRoles.some(otherRoleId => {
                    return isRoleRedundant(otherRoleId, [roleId]);
                  });
                }) && (
                  <div className="p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Role Redundancy Detected</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Some assigned roles may be redundant because other roles already provide the same permissions. 
                          Consider removing redundant roles to simplify access management.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Super Admin Warning */}
                {inspectorRoles.some(roleId => {
                  const role = roles?.find((r: any) => r.id === roleId)
                  return role?.permissions?.includes('system_superadmin')
                }) && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-destructive">Super Admin Role Assigned</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          This inspector has been assigned a role with system_superadmin permission, 
                          which grants all permissions implicitly. Assigning additional roles is redundant 
                          and may cause confusion.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAssignRolesModal(false)
                setSelectedInspector(null)
                setInspectorRoles([])
              }}
              disabled={isAssigningRoles}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRoleAssignments}
              disabled={isAssigningRoles}
              className="min-w-[120px] gap-2"
            >
              {isAssigningRoles ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Assignments
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Shield, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  Loader2,
  AlertCircle,
  Lock,
  Unlock
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import { Inspector } from '@/types/admin'
import { getInspectorEffectivePermissions } from '@/lib/api/admin/inspector-roles'

interface InspectorPermissionsViewProps {
  inspector: Inspector
}

interface Permission {
  id: number
  name: string
  action: string
  display_label: string
  resource_action: string
}

interface EffectivePermissions {
  inspector_id: number
  inspector_name: string
  total_permissions: number
  permissions_by_resource: Record<string, Permission[]>
  all_permissions: Array<Permission & { resource: string }>
}

export function InspectorPermissionsView({ inspector }: InspectorPermissionsViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())

  // Get effective permissions
  const { 
    data: permissions, 
    isLoading, 
    error 
  } = useQuery<EffectivePermissions>({
    queryKey: ['inspector-effective-permissions', inspector.id],
    queryFn: () => getInspectorEffectivePermissions(inspector.id),
    enabled: isOpen
  })

  const toggleResource = (resource: string) => {
    const newExpanded = new Set(expandedResources)
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource)
    } else {
      newExpanded.add(resource)
    }
    setExpandedResources(newExpanded)
  }

  const getResourceIcon = (resource: string) => {
    switch (resource.toLowerCase()) {
      case 'system':
        return <Lock className="w-4 h-4" />
      case 'mechanical':
      case 'corrosion':
      case 'ndt':
      case 'electrical':
      case 'instrument':
      case 'quality':
      case 'maintenance':
        return <Unlock className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'view':
        return 'bg-blue-100 text-blue-800'
      case 'edit':
        return 'bg-yellow-100 text-yellow-800'
      case 'approve':
        return 'bg-green-100 text-green-800'
      case 'superadmin':
      case 'hr_manage':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          View Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Effective Permissions for {inspector.name}
          </DialogTitle>
          <DialogDescription>
            All permissions granted to this inspector through their assigned roles
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <span>Loading permissions...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="w-6 h-6 mr-2" />
              <span>Failed to load permissions</span>
            </div>
          ) : !permissions ? (
            <div className="text-center py-12 text-muted-foreground">
              No permission data available
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Permission Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {permissions.total_permissions}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Permissions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Object.keys(permissions.permissions_by_resource).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Resource Types
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {permissions.all_permissions.filter(p => p.action === 'view').length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        View Permissions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {permissions.all_permissions.filter(p => 
                          p.action === 'edit' || p.action === 'approve'
                        ).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Edit/Approve
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions by Resource */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Permissions by Resource</CardTitle>
                  <CardDescription>
                    Permissions organized by system resource
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(permissions.permissions_by_resource).map(([resource, resourcePermissions]) => (
                    <Collapsible
                      key={resource}
                      open={expandedResources.has(resource)}
                      onOpenChange={() => toggleResource(resource)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-3 h-auto"
                        >
                          <div className="flex items-center gap-3">
                            {getResourceIcon(resource)}
                            <span className="font-medium capitalize">{resource}</span>
                            <Badge variant="secondary">
                              {resourcePermissions.length} permission{resourcePermissions.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {expandedResources.has(resource) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-2">
                        <div className="grid gap-2 mt-2">
                          {resourcePermissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between p-2 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="secondary" 
                                  className={getActionColor(permission.action)}
                                >
                                  {permission.action}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {permission.display_label}
                                </span>
                              </div>
                              <code className="text-xs bg-background px-2 py-1 rounded">
                                {permission.resource_action}
                              </code>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </CardContent>
              </Card>

              {/* All Permissions List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Permissions</CardTitle>
                  <CardDescription>
                    Complete list of all effective permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {permissions.all_permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-2 text-sm border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {permission.resource}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getActionColor(permission.action)}`}
                          >
                            {permission.action}
                          </Badge>
                          <span>{permission.display_label}</span>
                        </div>
                        <code className="text-xs text-muted-foreground">
                          {permission.resource_action}
                        </code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
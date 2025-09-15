'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Key, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Settings,
  UserCheck,
  Lock,
  Eye,
  FileText,
  Database,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for demonstration
const mockRoles = [
  {
    id: 1,
    name: 'admin',
    displayLabel: 'System Administrator',
    description: 'Full system access with all permissions',
    userCount: 2,
    permissions: ['read_all', 'write_all', 'delete_all', 'manage_users', 'manage_system']
  },
  {
    id: 2,
    name: 'supervisor',
    displayLabel: 'Supervisor',
    description: 'Manage inspectors and view reports',
    userCount: 5,
    permissions: ['read_inspectors', 'write_inspectors', 'read_reports', 'manage_attendance']
  },
  {
    id: 3,
    name: 'inspector',
    displayLabel: 'Inspector',
    description: 'Create and view own inspection reports',
    userCount: 42,
    permissions: ['read_own_data', 'write_reports', 'read_templates']
  },
  {
    id: 4,
    name: 'viewer',
    displayLabel: 'Read-only Viewer',
    description: 'View-only access to reports and data',
    userCount: 8,
    permissions: ['read_reports', 'read_templates']
  }
];

const mockPermissions = [
  { id: 1, name: 'read_all', resource: 'system', action: 'read', displayLabel: 'Read All Data' },
  { id: 2, name: 'write_all', resource: 'system', action: 'write', displayLabel: 'Write All Data' },
  { id: 3, name: 'delete_all', resource: 'system', action: 'delete', displayLabel: 'Delete All Data' },
  { id: 4, name: 'manage_users', resource: 'users', action: 'manage', displayLabel: 'Manage Users' },
  { id: 5, name: 'manage_system', resource: 'system', action: 'manage', displayLabel: 'System Management' },
  { id: 6, name: 'read_inspectors', resource: 'inspectors', action: 'read', displayLabel: 'View Inspectors' },
  { id: 7, name: 'write_inspectors', resource: 'inspectors', action: 'write', displayLabel: 'Manage Inspectors' },
  { id: 8, name: 'read_reports', resource: 'reports', action: 'read', displayLabel: 'View Reports' },
  { id: 9, name: 'write_reports', resource: 'reports', action: 'write', displayLabel: 'Create Reports' },
  { id: 10, name: 'manage_attendance', resource: 'attendance', action: 'manage', displayLabel: 'Manage Attendance' },
  { id: 11, name: 'read_own_data', resource: 'profile', action: 'read', displayLabel: 'View Own Data' },
  { id: 12, name: 'read_templates', resource: 'templates', action: 'read', displayLabel: 'View Templates' }
];

const mockUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@company.com',
    employeeId: 'ADM001',
    roles: ['admin'],
    active: true,
    lastLogin: '2024-01-20T09:30:00Z'
  },
  {
    id: 2,
    name: 'John Smith',
    email: 'john.smith@company.com',
    employeeId: 'EMP001',
    roles: ['inspector', 'supervisor'],
    active: true,
    lastLogin: '2024-01-20T08:15:00Z'
  },
  {
    id: 3,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    employeeId: 'EMP002',
    roles: ['inspector'],
    active: true,
    lastLogin: '2024-01-19T14:22:00Z'
  },
  {
    id: 4,
    name: 'Mike Wilson',
    email: 'mike.wilson@contractor.com',
    employeeId: 'EMP003',
    roles: ['viewer'],
    active: false,
    lastLogin: '2024-01-18T16:45:00Z'
  },
];

const getResourceIcon = (resource: string) => {
  switch (resource) {
    case 'system': return <Settings className="w-4 h-4" />;
    case 'users': return <Users className="w-4 h-4" />;
    case 'inspectors': return <UserCheck className="w-4 h-4" />;
    case 'reports': return <FileText className="w-4 h-4" />;
    case 'attendance': return <Eye className="w-4 h-4" />;
    case 'profile': return <Lock className="w-4 h-4" />;
    case 'templates': return <Database className="w-4 h-4" />;
    default: return <Key className="w-4 h-4" />;
  }
};

export function RBACManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);

  const filteredRoles = mockRoles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.displayLabel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            RBAC Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage roles, permissions, and user access control for the inspection management system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Assignments
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="w-full mt-6">
          <div className="space-y-6">
            {/* Roles Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
              <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>
                      Define a new role with specific permissions for the system
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input id="roleName" placeholder="e.g., manager" />
                      </div>
                      <div>
                        <Label htmlFor="displayLabel">Display Label</Label>
                        <Input id="displayLabel" placeholder="e.g., Department Manager" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Role description..." />
                    </div>
                    <div>
                      <Label>Permissions</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                        {mockPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox id={`perm-${permission.id}`} />
                            <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                              {permission.displayLabel}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsCreateRoleOpen(false)}>
                        Create Role
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map((role) => (
                <Card key={role.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        {role.displayLabel}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{role.name}</Badge>
                      <Badge variant="outline">{role.userCount} users</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {role.description}
                    </p>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">
                        PERMISSIONS ({role.permissions.length})
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission.replace('_', ' ')}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="w-full mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  System Permissions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  All available permissions in the system organized by resource
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(
                    mockPermissions.reduce((acc, permission) => {
                      if (!acc[permission.resource]) {
                        acc[permission.resource] = [];
                      }
                      acc[permission.resource].push(permission);
                      return acc;
                    }, {} as Record<string, typeof mockPermissions>)
                  ).map(([resource, permissions]) => (
                    <Card key={resource} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 capitalize">
                          {getResourceIcon(resource)}
                          {resource}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {permission.action}
                              </Badge>
                              <span className="text-sm">{permission.displayLabel}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Assignments Tab */}
        <TabsContent value="assignments" className="w-full mt-6">
          <div className="space-y-6">
            {/* User Assignments Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
              <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign Roles
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Roles to User</DialogTitle>
                    <DialogDescription>
                      Select a user and assign roles to them
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="selectUser">Select User</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mockUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} ({user.employeeId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Available Roles</Label>
                      <div className="space-y-2 mt-2">
                        {mockRoles.map((role) => (
                          <div key={role.id} className="flex items-center space-x-2">
                            <Checkbox id={`role-${role.id}`} />
                            <Label htmlFor={`role-${role.id}`} className="text-sm">
                              {role.displayLabel}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAssignRoleOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsAssignRoleOpen(false)}>
                        Assign Roles
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Role Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.employeeId}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((roleName) => {
                              const role = mockRoles.find(r => r.name === roleName);
                              return (
                                <Badge key={roleName} variant="secondary" className="text-xs">
                                  {role?.displayLabel || roleName}
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.active ? 'default' : 'secondary'}>
                            {user.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.lastLogin).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
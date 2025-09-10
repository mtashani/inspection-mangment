'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  EllipsisVerticalIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon
} from "@heroicons/react/24/outline"
import { useAuth } from '@/contexts/auth-context'
import { AdminOnly, AccessDenied } from '@/components/auth/permission-guard'

interface Template {
  id: string
  name: string
  description: string
  reportType: string
  isActive: boolean
  sectionsCount: number
  fieldsCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export default function TemplateManagementPage() {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data - replace with actual API calls
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const mockTemplates: Template[] = [
          {
            id: '1',
            name: 'Pressure Vessel Inspection Report',
            description: 'Standard template for pressure vessel inspections',
            reportType: 'Equipment',
            isActive: true,
            sectionsCount: 4,
            fieldsCount: 12,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-02-01T14:20:00Z',
            createdBy: 'Admin User'
          },
          {
            id: '2',
            name: 'Heat Exchanger Inspection',
            description: 'Template for heat exchanger inspections',
            reportType: 'Equipment',
            isActive: true,
            sectionsCount: 3,
            fieldsCount: 8,
            createdAt: '2024-01-10T09:15:00Z',
            updatedAt: '2024-01-25T11:45:00Z',
            createdBy: 'Admin User'
          },
          {
            id: '3',
            name: 'PSV Calibration Report',
            description: 'Template for PSV calibration reports',
            reportType: 'PSV',
            isActive: false,
            sectionsCount: 2,
            fieldsCount: 6,
            createdAt: '2024-01-05T16:00:00Z',
            updatedAt: '2024-01-20T13:30:00Z',
            createdBy: 'Admin User'
          }
        ]
        
        setTemplates(mockTemplates)
      } catch (error) {
        console.error('Failed to load templates:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [])

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.reportType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateTemplate = () => {
    router.push('/admin/templates/new')
  }

  const handleEditTemplate = (templateId: string) => {
    router.push(`/admin/templates/${templateId}/edit`)
  }

  const handleViewTemplate = (templateId: string) => {
    router.push(`/admin/templates/${templateId}`)
  }

  const handleCloneTemplate = async (templateId: string) => {
    try {
      // Simulate API call to clone template
      console.log('Cloning template:', templateId)
      // Refresh templates list after cloning
    } catch (error) {
      console.error('Failed to clone template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    try {
      // Simulate API call to delete template
      console.log('Deleting template:', templateId)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const handleToggleStatus = async (templateId: string) => {
    try {
      // Simulate API call to toggle template status
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, isActive: !t.isActive } : t
      ))
    } catch (error) {
      console.error('Failed to toggle template status:', error)
    }
  }

  if (!isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AccessDenied message="Only administrators can access template management." />
      </div>
    )
  }

  return (
    <AdminOnly fallback={<AccessDenied />}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Template Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage report templates for different inspection types
            </p>
          </div>
          <Button onClick={handleCreateTemplate}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {templates.filter(t => t.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment Templates</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {templates.filter(t => t.reportType === 'Equipment').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PSV Templates</CardTitle>
              <DocumentTextIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {templates.filter(t => t.reportType === 'PSV').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by name, description, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Manage your report templates and their configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading templates...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Report Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {searchTerm ? 'No templates found matching your search.' : 'No templates created yet.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {template.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.reportType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={template.isActive ? "default" : "secondary"}
                            className={template.isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{template.sectionsCount}</TableCell>
                        <TableCell>{template.fieldsCount}</TableCell>
                        <TableCell>
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <EllipsisVerticalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewTemplate(template.id)}>
                                <EyeIcon className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditTemplate(template.id)}>
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCloneTemplate(template.id)}>
                                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                                Clone
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(template.id)}>
                                <DocumentTextIcon className="h-4 w-4 mr-2" />
                                {template.isActive ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-red-600"
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  )
}
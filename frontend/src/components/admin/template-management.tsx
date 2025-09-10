'use client'

import { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Template, ReportType } from '@/types/professional-reports'

export interface TemplateManagementProps {
  className?: string
}

type TemplateStatus = 'active' | 'draft' | 'archived'

interface TemplateWithMetadata extends Template {
  status: TemplateStatus
  version: string
  createdBy: string
  lastModifiedBy: string
  usageCount: number
  reportType: ReportType
}

interface TemplateFormData {
  name: string
  description: string
  reportTypeId: string
  status: TemplateStatus
  isActive: boolean
}

export function TemplateManagement({ className }: TemplateManagementProps) {
  const [templates, setTemplates] = useState<TemplateWithMetadata[]>([])
  const [reportTypes, setReportTypes] = useState<ReportType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('templates')
  
  // Dialog states
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithMetadata | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateWithMetadata | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<TemplateWithMetadata | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    reportTypeId: '',
    status: 'draft',
    isActive: false
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Load data on mount
  useEffect(() => {
    loadTemplates()
    loadReportTypes()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock templates data
      const mockTemplates: TemplateWithMetadata[] = [
        {
          id: '1',
          name: 'Pressure Vessel Inspection Report',
          description: 'Standard template for pressure vessel inspections',
          reportTypeId: 'equipment',
          status: 'active',
          version: '2.1',
          createdBy: 'John Smith',
          lastModifiedBy: 'Jane Doe',
          usageCount: 145,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          sections: [
            {
              id: '1',
              title: 'General Information',
              order: 1,
              fields: [
                {
                  id: '1',
                  name: 'inspection_date',
                  label: 'Inspection Date',
                  type: 'date',
                  required: true,
                  order: 1
                }
              ]
            }
          ],
          reportType: {
            id: 'equipment',
            name: 'Equipment Inspection',
            description: 'Equipment inspection reports',
            category: 'equipment',
            icon: '🔧',
            templates: []
          }
        },
        {
          id: '2',
          name: 'Safety Valve Calibration Report',
          description: 'Template for PSV calibration documentation',
          reportTypeId: 'safety',
          status: 'active',
          version: '1.5',
          createdBy: 'Mike Johnson',
          lastModifiedBy: 'Sarah Wilson',
          usageCount: 89,
          isActive: true,
          createdAt: '2024-01-05T00:00:00Z',
          updatedAt: '2024-01-20T14:20:00Z',
          sections: [],
          reportType: {
            id: 'safety',
            name: 'Safety Assessment',
            description: 'Safety-related reports',
            category: 'safety',
            icon: '🛡️',
            templates: []
          }
        },
        {
          id: '3',
          name: 'Corrosion Assessment Template',
          description: 'Draft template for corrosion monitoring',
          reportTypeId: 'quality',
          status: 'draft',
          version: '0.3',
          createdBy: 'Alex Brown',
          lastModifiedBy: 'Alex Brown',
          usageCount: 0,
          isActive: false,
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-25T09:15:00Z',
          sections: [],
          reportType: {
            id: 'quality',
            name: 'Quality Control',
            description: 'Quality control reports',
            category: 'quality',
            icon: '✅',
            templates: []
          }
        }
      ]
      
      setTemplates(mockTemplates)
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadReportTypes = async () => {
    try {
      // Mock report types data
      const mockReportTypes: ReportType[] = [
        {
          id: 'equipment',
          name: 'Equipment Inspection',
          description: 'Equipment inspection reports',
          category: 'equipment',
          icon: '🔧',
          templates: []
        },
        {
          id: 'safety',
          name: 'Safety Assessment',
          description: 'Safety-related reports',
          category: 'safety',
          icon: '🛡️',
          templates: []
        },
        {
          id: 'quality',
          name: 'Quality Control',
          description: 'Quality control reports',
          category: 'quality',
          icon: '✅',
          templates: []
        }
      ]
      
      setReportTypes(mockReportTypes)
    } catch (err) {
      console.error('Failed to load report types:', err)
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter
    const matchesType = typeFilter === 'all' || template.reportTypeId === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate form
      const errors: Record<string, string> = {}
      if (!formData.name.trim()) errors.name = 'Name is required'
      if (!formData.description.trim()) errors.description = 'Description is required'
      if (!formData.reportTypeId) errors.reportTypeId = 'Report type is required'
      
      setFormErrors(errors)
      if (Object.keys(errors).length > 0) return

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const reportType = reportTypes.find(rt => rt.id === formData.reportTypeId)
      
      if (editingTemplate) {
        // Update existing template
        const updatedTemplate: TemplateWithMetadata = {
          ...editingTemplate,
          name: formData.name,
          description: formData.description,
          reportTypeId: formData.reportTypeId,
          status: formData.status,
          isActive: formData.isActive,
          lastModifiedBy: 'Current User',
          updatedAt: new Date().toISOString(),
          reportType: reportType!
        }
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t))
      } else {
        // Create new template
        const newTemplate: TemplateWithMetadata = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          reportTypeId: formData.reportTypeId,
          status: formData.status,
          version: '1.0',
          createdBy: 'Current User',
          lastModifiedBy: 'Current User',
          usageCount: 0,
          isActive: formData.isActive,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sections: [],
          reportType: reportType!
        }
        setTemplates(prev => [...prev, newTemplate])
      }
      
      handleCloseDialog()
    } catch (err) {
      console.error('Failed to save template:', err)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingTemplate) return
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setTemplates(prev => prev.filter(t => t.id !== deletingTemplate.id))
      setShowDeleteDialog(false)
      setDeletingTemplate(null)
    } catch (err) {
      console.error('Failed to delete template:', err)
    }
  }

  // Handle clone
  const handleClone = (template: TemplateWithMetadata) => {
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description,
      reportTypeId: template.reportTypeId,
      status: 'draft',
      isActive: false
    })
    setEditingTemplate(null)
    setShowTemplateDialog(true)
  }

  // Handle status change
  const handleStatusChange = async (template: TemplateWithMetadata, newStatus: TemplateStatus) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const updatedTemplate = {
        ...template,
        status: newStatus,
        isActive: newStatus === 'active',
        lastModifiedBy: 'Current User',
        updatedAt: new Date().toISOString()
      }
      
      setTemplates(prev => prev.map(t => t.id === template.id ? updatedTemplate : t))
    } catch (err) {
      console.error('Failed to update template status:', err)
    }
  }

  // Handle dialog close
  const handleCloseDialog = () => {
    setShowTemplateDialog(false)
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      reportTypeId: '',
      status: 'draft',
      isActive: false
    })
    setFormErrors({})
  }

  // Handle edit
  const handleEdit = (template: TemplateWithMetadata) => {
    setFormData({
      name: template.name,
      description: template.description,
      reportTypeId: template.reportTypeId,
      status: template.status,
      isActive: template.isActive
    })
    setEditingTemplate(template)
    setShowTemplateDialog(true)
  }

  // Handle preview
  const handlePreview = (template: TemplateWithMetadata) => {
    setPreviewTemplate(template)
    setShowPreviewDialog(true)
  }

  // Get status display
  const getStatusDisplay = (status: TemplateStatus) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircleIcon className="h-3 w-3" /> }
      case 'draft':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <ClockIcon className="h-3 w-3" /> }
      case 'archived':
        return { color: 'bg-gray-100 text-gray-800', icon: <ArchiveBoxIcon className="h-3 w-3" /> }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <InformationCircleIcon className="h-3 w-3" /> }
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Export templates
  const handleExport = async () => {
    try {
      // Mock export functionality
      const exportData = {
        templates: filteredTemplates,
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `templates-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export templates:', err)
    }
  }

  if (isLoading) {
    return <TemplateManagementSkeleton />
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Template Management</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowTemplateDialog(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Admin Warning */}
      <Alert>
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Administrator Access Required:</strong> Template changes affect all users. 
          Please ensure proper testing before activating new templates.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Templates Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => {
                    const statusDisplay = getStatusDisplay(template.status)
                    
                    return (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {template.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{template.reportType.icon}</span>
                            <span>{template.reportType.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', statusDisplay.color)}>
                            <div className="flex items-center space-x-1">
                              {statusDisplay.icon}
                              <span className="capitalize">{template.status}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>v{template.version}</TableCell>
                        <TableCell>{template.usageCount}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{formatDate(template.updatedAt)}</div>
                            <div className="text-xs text-muted-foreground">
                              by {template.lastModifiedBy}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <DocumentTextIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePreview(template)}>
                                <EyeIcon className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(template)}>
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClone(template)}>
                                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                                Clone
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {template.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(template, 'active')}>
                                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              {template.status !== 'archived' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(template, 'archived')}>
                                  <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setDeletingTemplate(template)
                                  setShowDeleteDialog(true)
                                }}
                                className="text-red-600"
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Templates</div>
                <div className="text-2xl font-bold">{templates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Active Templates</div>
                <div className="text-2xl font-bold text-green-600">
                  {templates.filter(t => t.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Draft Templates</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {templates.filter(t => t.status === 'draft').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Usage</div>
                <div className="text-2xl font-bold">
                  {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </DialogTitle>
            <DialogDescription>
              Configure template basic information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter template description"
                rows={3}
              />
              {formErrors.description && (
                <p className="text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select 
                value={formData.reportTypeId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, reportTypeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center space-x-2">
                        <span>{type.icon}</span>
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.reportTypeId && (
                <p className="text-sm text-red-600">{formErrors.reportTypeId}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TemplateStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active Template</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of "{previewTemplate?.name}" template structure.
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{previewTemplate.name}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="flex items-center space-x-2">
                    <span>{previewTemplate.reportType.icon}</span>
                    <span className="font-medium">{previewTemplate.reportType.name}</span>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={cn('text-xs', getStatusDisplay(previewTemplate.status).color)}>
                    <div className="flex items-center space-x-1">
                      {getStatusDisplay(previewTemplate.status).icon}
                      <span className="capitalize">{previewTemplate.status}</span>
                    </div>
                  </Badge>
                </div>
                <div>
                  <Label>Version</Label>
                  <p className="font-medium">v{previewTemplate.version}</p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
              </div>
              <Separator />
              <div>
                <Label>Template Structure</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                  {previewTemplate.sections.length > 0 ? (
                    <div className="space-y-2">
                      {previewTemplate.sections.map((section, index) => (
                        <div key={section.id}>
                          <div className="font-medium">{index + 1}. {section.title}</div>
                          <div className="ml-4 text-muted-foreground">
                            {section.fields.length} fields
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No sections defined yet</div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            {previewTemplate && (
              <Button onClick={() => {
                setShowPreviewDialog(false)
                handleEdit(previewTemplate)
              }}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Templates</DialogTitle>
            <DialogDescription>
              Import templates from a JSON file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag and drop a JSON file here, or click to browse
              </p>
              <Button variant="outline" className="mt-2">
                Browse Files
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Loading Skeleton Component
function TemplateManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Alert Skeleton */}
      <Skeleton className="h-16 w-full" />

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export type { TemplateManagementProps }
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Power, 
  PowerOff, 
  Trash2,
  Download,
  Upload,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { ReportTemplate, TemplateFilters, ReportType } from '@/types/admin'
import { TemplateFilters as TemplateFiltersComponent } from './template-filters'
import { TemplateStatsCards } from './template-stats-cards'
import { TemplateCloneDialog } from './template-clone-dialog'
import { TemplateDeleteDialog } from './template-delete-dialog'
import { TemplateImportDialog } from './template-import-dialog'

interface TemplateListProps {
  templates: ReportTemplate[]
  loading?: boolean
  onEdit: (template: ReportTemplate) => void
  onDelete: (template: ReportTemplate) => void
  onClone: (template: ReportTemplate, newName: string) => void
  onToggleStatus: (template: ReportTemplate) => void
  onExport: (template: ReportTemplate) => void
  onImport: (file: File) => void
  onViewUsageStats: (template: ReportTemplate) => void
}

export function TemplateList({
  templates,
  loading = false,
  onEdit,
  onDelete,
  onClone,
  onToggleStatus,
  onExport,
  onImport,
  onViewUsageStats
}: TemplateListProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<TemplateFilters>({})
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          template.reportType.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Report type filter
      if (filters.reportType && template.reportType !== filters.reportType) {
        return false
      }

      // Active status filter
      if (filters.isActive !== undefined && template.isActive !== filters.isActive) {
        return false
      }

      // Created by filter
      if (filters.createdBy && template.createdBy !== filters.createdBy) {
        return false
      }

      return true
    })
  }, [templates, searchTerm, filters])

  // Calculate template statistics
  const templateStats = useMemo(() => {
    const total = templates.length
    const active = templates.filter(t => t.isActive).length
    const inactive = total - active
    
    const byType = templates.reduce((acc, template) => {
      acc[template.reportType] = (acc[template.reportType] || 0) + 1
      return acc
    }, {} as Record<ReportType, number>)

    return {
      total,
      active,
      inactive,
      byType,
      recentlyCreated: templates.filter(t => {
        const createdAt = new Date(t.createdAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return createdAt > weekAgo
      }).length,
      recentlyUsed: templates.filter(t => {
        if (!t.lastUsedAt) return false
        const lastUsed = new Date(t.lastUsedAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return lastUsed > weekAgo
      }).length
    }
  }, [templates])

  const handleClone = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setShowCloneDialog(true)
  }

  const handleDelete = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setShowDeleteDialog(true)
  }

  const handleToggleStatus = async (template: ReportTemplate) => {
    try {
      await onToggleStatus(template)
      toast({
        title: 'Template Updated',
        description: `Template ${template.isActive ? 'deactivated' : 'activated'} successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive',
      })
    }
  }

  const getReportTypeBadgeColor = (type: ReportType) => {
    const colors = {
      PSV: 'bg-blue-100 text-blue-800',
      CRANE: 'bg-green-100 text-green-800',
      CORROSION: 'bg-orange-100 text-orange-800',
      GENERAL: 'bg-gray-100 text-gray-800',
      MAINTENANCE: 'bg-purple-100 text-purple-800'
    }
    return colors[type] || colors.GENERAL
  }

  if (loading) {
    return <TemplateListSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Template Statistics Cards */}
      <TemplateStatsCards stats={templateStats} />

      {/* Template Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Template Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button asChild>
                <Link href="/admin/templates/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search templates by name, description, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <TemplateFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Templates Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchTerm || Object.keys(filters).length > 0
                        ? 'No templates found matching your criteria'
                        : 'No templates available'}
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
                        <Badge 
                          variant="secondary" 
                          className={getReportTypeBadgeColor(template.reportType)}
                        >
                          {template.reportType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{template.sections.length}</TableCell>
                      <TableCell>{template.fieldsCount}</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>
                        {template.lastUsedAt ? (
                          <span className="text-sm">
                            {new Date(template.lastUsedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/templates/${template.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(template)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(template)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(template)}>
                              {template.isActive ? (
                                <>
                                  <PowerOff className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewUsageStats(template)}>
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Usage Stats
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onExport(template)}>
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(template)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
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
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedTemplate && (
        <>
          <TemplateCloneDialog
            open={showCloneDialog}
            onOpenChange={setShowCloneDialog}
            template={selectedTemplate}
            onClone={(newName) => {
              onClone(selectedTemplate, newName)
              setShowCloneDialog(false)
              setSelectedTemplate(null)
            }}
          />
          <TemplateDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            template={selectedTemplate}
            onDelete={() => {
              onDelete(selectedTemplate)
              setShowDeleteDialog(false)
              setSelectedTemplate(null)
            }}
          />
        </>
      )}

      <TemplateImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={onImport}
      />
    </div>
  )
}

function TemplateListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
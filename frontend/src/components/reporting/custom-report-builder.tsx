'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  TableCellsIcon,
  PhotoIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

export interface ReportSection {
  id: string
  type: 'text' | 'table' | 'chart' | 'image' | 'summary' | 'header'
  title: string
  content: any
  config: Record<string, any>
  order: number
  isVisible: boolean
}

export interface CustomReport {
  id: string
  name: string
  description: string
  category: string
  sections: ReportSection[]
  filters: Record<string, any>
  layout: 'single-column' | 'two-column' | 'grid'
  pageSize: 'a4' | 'letter' | 'legal'
  orientation: 'portrait' | 'landscape'
  createdBy: string
  createdDate: string
  lastModified: string
  isTemplate: boolean
  tags: string[]
}

export interface CustomReportBuilderProps {
  report?: CustomReport
  onSave: (report: CustomReport) => void
  onCancel: () => void
  className?: string
}

const SECTION_TYPES = [
  {
    type: 'header',
    name: 'Header',
    icon: DocumentTextIcon,
    description: 'Title and header information'
  },
  {
    type: 'text',
    name: 'Text Block',
    icon: DocumentTextIcon,
    description: 'Rich text content and descriptions'
  },
  {
    type: 'table',
    name: 'Data Table',
    icon: TableCellsIcon,
    description: 'Tabular data with filtering and sorting'
  },
  {
    type: 'chart',
    name: 'Chart',
    icon: ChartBarIcon,
    description: 'Visual data representation'
  },
  {
    type: 'summary',
    name: 'Summary',
    icon: DocumentTextIcon,
    description: 'Key metrics and summary information'
  },
  {
    type: 'image',
    name: 'Image',
    icon: PhotoIcon,
    description: 'Images, diagrams, and visual content'
  }
]

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'area', label: 'Area Chart' }
]

const DATA_SOURCES = [
  { value: 'equipment', label: 'Equipment Data' },
  { value: 'inspections', label: 'Inspections' },
  { value: 'maintenance', label: 'Maintenance Events' },
  { value: 'rbi', label: 'RBI Analysis' },
  { value: 'reports', label: 'Reports' },
  { value: 'users', label: 'User Activity' }
]

export function CustomReportBuilder({
  report,
  onSave,
  onCancel,
  className
}: CustomReportBuilderProps) {
  const [reportData, setReportData] = useState<CustomReport>(
    report || {
      id: '',
      name: '',
      description: '',
      category: 'custom',
      sections: [],
      filters: {},
      layout: 'single-column',
      pageSize: 'a4',
      orientation: 'portrait',
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isTemplate: false,
      tags: []
    }
  )

  const [selectedSection, setSelectedSection] = useState<ReportSection | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSectionConfigOpen, setIsSectionConfigOpen] = useState(false)

  // Add new section
  const addSection = useCallback((type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: getDefaultContent(type),
      config: getDefaultConfig(type),
      order: reportData.sections.length,
      isVisible: true
    }

    setReportData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      lastModified: new Date().toISOString()
    }))
  }, [reportData.sections.length])

  // Remove section
  const removeSection = useCallback((sectionId: string) => {
    setReportData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
      lastModified: new Date().toISOString()
    }))
  }, [])

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<ReportSection>) => {
    setReportData(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      ),
      lastModified: new Date().toISOString()
    }))
  }, [])

  // Move section
  const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    setReportData(prev => {
      const sections = [...prev.sections]
      const index = sections.findIndex(s => s.id === sectionId)
      
      if (index === -1) return prev
      
      const newIndex = direction === 'up' ? index - 1 : index + 1
      
      if (newIndex < 0 || newIndex >= sections.length) return prev
      
      // Swap sections
      [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]]
      
      // Update order
      sections.forEach((section, idx) => {
        section.order = idx
      })
      
      return {
        ...prev,
        sections,
        lastModified: new Date().toISOString()
      }
    })
  }, [])

  // Get default content for section type
  function getDefaultContent(type: ReportSection['type']) {
    switch (type) {
      case 'header':
        return {
          title: 'Report Title',
          subtitle: 'Report Subtitle',
          date: new Date().toISOString(),
          logo: null
        }
      case 'text':
        return {
          content: 'Enter your text content here...'
        }
      case 'table':
        return {
          dataSource: 'equipment',
          columns: ['name', 'type', 'status', 'location'],
          filters: {},
          sorting: { column: 'name', direction: 'asc' }
        }
      case 'chart':
        return {
          chartType: 'bar',
          dataSource: 'equipment',
          xAxis: 'type',
          yAxis: 'count',
          filters: {}
        }
      case 'summary':
        return {
          metrics: [
            { label: 'Total Equipment', value: '${equipment.count}', format: 'number' },
            { label: 'Active Inspections', value: '${inspections.active}', format: 'number' }
          ]
        }
      case 'image':
        return {
          src: null,
          alt: 'Image description',
          caption: 'Image caption'
        }
      default:
        return {}
    }
  }

  // Get default config for section type
  function getDefaultConfig(type: ReportSection['type']) {
    switch (type) {
      case 'header':
        return {
          alignment: 'center',
          showDate: true,
          showLogo: false
        }
      case 'text':
        return {
          fontSize: 'medium',
          alignment: 'left'
        }
      case 'table':
        return {
          showHeaders: true,
          alternateRows: true,
          pageBreak: false,
          maxRows: 50
        }
      case 'chart':
        return {
          width: '100%',
          height: 300,
          showLegend: true,
          showGrid: true
        }
      case 'summary':
        return {
          layout: 'grid',
          columns: 2
        }
      case 'image':
        return {
          width: 'auto',
          height: 'auto',
          alignment: 'center'
        }
      default:
        return {}
    }
  }

  // Handle save
  const handleSave = () => {
    const updatedReport = {
      ...reportData,
      id: reportData.id || `report-${Date.now()}`,
      lastModified: new Date().toISOString()
    }
    onSave(updatedReport)
  }

  // Render section preview
  const renderSectionPreview = (section: ReportSection) => {
    switch (section.type) {
      case 'header':
        return (
          <div className="text-center p-4 border-b">
            <h1 className="text-2xl font-bold">{section.content.title}</h1>
            {section.content.subtitle && (
              <p className="text-muted-foreground">{section.content.subtitle}</p>
            )}
            {section.config.showDate && (
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(section.content.date).toLocaleDateString()}
              </p>
            )}
          </div>
        )
      
      case 'text':
        return (
          <div className="p-4">
            <p className="whitespace-pre-wrap">{section.content.content}</p>
          </div>
        )
      
      case 'table':
        return (
          <div className="p-4">
            <div className="border rounded">
              <div className="bg-muted p-2 font-medium">
                Data Table: {section.content.dataSource}
              </div>
              <div className="p-2 text-sm text-muted-foreground">
                Columns: {section.content.columns.join(', ')}
              </div>
            </div>
          </div>
        )
      
      case 'chart':
        return (
          <div className="p-4">
            <div className="border rounded h-48 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {section.content.chartType} Chart
                </p>
                <p className="text-xs text-muted-foreground">
                  {section.content.dataSource} data
                </p>
              </div>
            </div>
          </div>
        )
      
      case 'summary':
        return (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {section.content.metrics.map((metric: any, index: number) => (
                <div key={index} className="border rounded p-3 text-center">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'image':
        return (
          <div className="p-4">
            <div className="border rounded h-32 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <PhotoIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Image Placeholder</p>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="p-4 text-center text-muted-foreground">
            Unknown section type: {section.type}
          </div>
        )
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Report Builder</h2>
          <p className="text-muted-foreground">
            Create custom reports with drag-and-drop sections
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Settings */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={reportData.name}
                  onChange={(e) => setReportData(prev => ({ 
                    ...prev, 
                    name: e.target.value,
                    lastModified: new Date().toISOString()
                  }))}
                  placeholder="Enter report name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={reportData.description}
                  onChange={(e) => setReportData(prev => ({ 
                    ...prev, 
                    description: e.target.value,
                    lastModified: new Date().toISOString()
                  }))}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="layout">Layout</Label>
                <Select
                  value={reportData.layout}
                  onValueChange={(value: any) => setReportData(prev => ({ 
                    ...prev, 
                    layout: value,
                    lastModified: new Date().toISOString()
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-column">Single Column</SelectItem>
                    <SelectItem value="two-column">Two Column</SelectItem>
                    <SelectItem value="grid">Grid Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="pageSize">Page Size</Label>
                  <Select
                    value={reportData.pageSize}
                    onValueChange={(value: any) => setReportData(prev => ({ 
                      ...prev, 
                      pageSize: value,
                      lastModified: new Date().toISOString()
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientation">Orientation</Label>
                  <Select
                    value={reportData.orientation}
                    onValueChange={(value: any) => setReportData(prev => ({ 
                      ...prev, 
                      orientation: value,
                      lastModified: new Date().toISOString()
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isTemplate"
                  checked={reportData.isTemplate}
                  onCheckedChange={(checked) => setReportData(prev => ({ 
                    ...prev, 
                    isTemplate: checked,
                    lastModified: new Date().toISOString()
                  }))}
                />
                <Label htmlFor="isTemplate">Save as Template</Label>
              </div>
            </CardContent>
          </Card>

          {/* Section Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {SECTION_TYPES.map(sectionType => {
                  const Icon = sectionType.icon
                  return (
                    <Button
                      key={sectionType.type}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => addSection(sectionType.type as ReportSection['type'])}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {sectionType.name}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Builder */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Sections</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.sections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sections added yet</p>
                  <p className="text-sm">Add sections from the panel on the left</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportData.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => (
                      <Card key={section.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {section.type}
                              </Badge>
                              <span className="font-medium">{section.title}</span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveSection(section.id, 'up')}
                                disabled={index === 0}
                                className="h-8 w-8 p-0"
                              >
                                <ArrowUpIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveSection(section.id, 'down')}
                                disabled={index === reportData.sections.length - 1}
                                className="h-8 w-8 p-0"
                              >
                                <ArrowDownIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSection(section)
                                  setIsSectionConfigOpen(true)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Cog6ToothIcon className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSection(section.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {renderSectionPreview(section)}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Configuration Dialog */}
      <SectionConfigDialog
        isOpen={isSectionConfigOpen}
        onClose={() => {
          setIsSectionConfigOpen(false)
          setSelectedSection(null)
        }}
        section={selectedSection}
        onSave={(updates) => {
          if (selectedSection) {
            updateSection(selectedSection.id, updates)
          }
          setIsSectionConfigOpen(false)
          setSelectedSection(null)
        }}
      />

      {/* Preview Dialog */}
      <ReportPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        report={reportData}
      />
    </div>
  )
}

// Section Configuration Dialog
interface SectionConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  section: ReportSection | null
  onSave: (updates: Partial<ReportSection>) => void
}

function SectionConfigDialog({ isOpen, onClose, section, onSave }: SectionConfigDialogProps) {
  const [formData, setFormData] = useState<Partial<ReportSection>>({})

  // Update form data when section changes
  useState(() => {
    if (section) {
      setFormData(section)
    }
  })

  const handleSave = () => {
    onSave(formData)
  }

  if (!section) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure {section.type} Section</DialogTitle>
          <DialogDescription>
            Customize the settings for this section
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sectionTitle">Section Title</Label>
            <Input
              id="sectionTitle"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {section.type === 'table' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataSource">Data Source</Label>
                <Select
                  value={formData.content?.dataSource}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, dataSource: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map(source => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {section.type === 'chart' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chartType">Chart Type</Label>
                <Select
                  value={formData.content?.chartType}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, chartType: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map(chart => (
                      <SelectItem key={chart.value} value={chart.value}>
                        {chart.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataSource">Data Source</Label>
                <Select
                  value={formData.content?.dataSource}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, dataSource: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map(source => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {section.type === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="textContent">Content</Label>
              <Textarea
                id="textContent"
                value={formData.content?.content || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  content: { ...prev.content, content: e.target.value }
                }))}
                rows={6}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Report Preview Dialog
interface ReportPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  report: CustomReport
}

function ReportPreviewDialog({ isOpen, onClose, report }: ReportPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Preview</DialogTitle>
          <DialogDescription>
            Preview of how your report will look when generated
          </DialogDescription>
        </DialogHeader>

        <div className="bg-white border rounded-lg p-8 space-y-6">
          {report.sections
            .filter(section => section.isVisible)
            .sort((a, b) => a.order - b.order)
            .map(section => (
              <div key={section.id}>
                {section.type === 'header' && (
                  <div className="text-center border-b pb-4 mb-6">
                    <h1 className="text-3xl font-bold">{section.content.title}</h1>
                    {section.content.subtitle && (
                      <p className="text-xl text-muted-foreground mt-2">{section.content.subtitle}</p>
                    )}
                    {section.config.showDate && (
                      <p className="text-sm text-muted-foreground mt-4">
                        Generated on {new Date().toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {section.type === 'text' && (
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                    <p className="whitespace-pre-wrap">{section.content.content}</p>
                  </div>
                )}

                {section.type === 'summary' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {section.content.metrics.map((metric: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{metric.value}</div>
                          <div className="text-sm text-muted-foreground">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(section.type === 'table' || section.type === 'chart') && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                    <div className="border rounded-lg p-8 bg-muted/20 text-center">
                      <div className="text-muted-foreground">
                        {section.type === 'table' ? (
                          <>
                            <TableCellsIcon className="h-12 w-12 mx-auto mb-2" />
                            <p>Data Table Preview</p>
                            <p className="text-sm">Source: {section.content.dataSource}</p>
                          </>
                        ) : (
                          <>
                            <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
                            <p>{section.content.chartType} Chart Preview</p>
                            <p className="text-sm">Source: {section.content.dataSource}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { CustomReport, ReportSection, CustomReportBuilderProps }
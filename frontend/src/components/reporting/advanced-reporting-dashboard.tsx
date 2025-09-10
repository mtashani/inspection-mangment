'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  DocumentTextIcon,
  CalendarDaysIcon,
  ShareIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  FunnelIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReportScheduler } from './report-scheduler'
import { CustomReportBuilder } from './custom-report-builder'
import { ReportSharing } from './report-sharing'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'inspection' | 'maintenance' | 'rbi' | 'safety' | 'compliance' | 'custom'
  category: string
  isPublic: boolean
  createdBy: string
  createdDate: string
  lastModified: string
  usageCount: number
  parameters: ReportParameter[]
  layout: ReportLayout
  dataSource: string[]
  filters: ReportFilter[]
}

export interface ReportParameter {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'
  label: string
  required: boolean
  defaultValue?: any
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface ReportLayout {
  sections: ReportSection[]
  charts: ReportChart[]
  tables: ReportTable[]
  styling: {
    theme: 'light' | 'dark' | 'corporate'
    colors: string[]
    fonts: string[]
  }
}

export interface ReportSection {
  id: string
  title: string
  type: 'header' | 'summary' | 'details' | 'charts' | 'tables'
  order: number
  content: any
}

export interface ReportChart {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area'
  dataSource: string
  xAxis: string
  yAxis: string
  filters: ReportFilter[]
}

export interface ReportTable {
  id: string
  title: string
  dataSource: string
  columns: ReportColumn[]
  filters: ReportFilter[]
  sorting: { column: string; direction: 'asc' | 'desc' }[]
}

export interface ReportColumn {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'link'
  width?: number
  format?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

export interface ReportFilter {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in'
  value: any
  label: string
}

export interface GeneratedReport {
  id: string
  templateId: string
  templateName: string
  name: string
  description?: string
  status: 'generating' | 'completed' | 'failed' | 'scheduled'
  createdBy: string
  createdDate: string
  completedDate?: string
  parameters: Record<string, any>
  fileUrl?: string
  fileSize?: string
  format: 'pdf' | 'excel' | 'csv' | 'json'
  isShared: boolean
  sharedWith: string[]
  downloadCount: number
}

export interface AdvancedReportingDashboardProps {
  className?: string
}

// Mock data
const MOCK_TEMPLATES: ReportTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Monthly Equipment Status Report',
    description: 'Comprehensive monthly report on equipment status and performance',
    type: 'inspection',
    category: 'Operations',
    isPublic: true,
    createdBy: 'System Admin',
    createdDate: '2024-01-15',
    lastModified: '2024-02-01',
    usageCount: 45,
    parameters: [
      {
        id: 'param-001',
        name: 'month',
        type: 'select',
        label: 'Report Month',
        required: true,
        options: ['January', 'February', 'March', 'April', 'May', 'June']
      },
      {
        id: 'param-002',
        name: 'unit',
        type: 'multiselect',
        label: 'Units',
        required: false,
        options: ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4']
      }
    ],
    layout: {
      sections: [],
      charts: [],
      tables: [],
      styling: { theme: 'corporate', colors: [], fonts: [] }
    },
    dataSource: ['equipment', 'inspections'],
    filters: []
  },
  {
    id: 'tpl-002',
    name: 'RBI Analysis Summary',
    description: 'Risk-based inspection analysis with recommendations',
    type: 'rbi',
    category: 'Risk Management',
    isPublic: false,
    createdBy: 'Jane Doe',
    createdDate: '2024-01-20',
    lastModified: '2024-02-05',
    usageCount: 23,
    parameters: [
      {
        id: 'param-003',
        name: 'riskLevel',
        type: 'select',
        label: 'Minimum Risk Level',
        required: true,
        options: ['Low', 'Medium', 'High', 'Critical']
      }
    ],
    layout: {
      sections: [],
      charts: [],
      tables: [],
      styling: { theme: 'light', colors: [], fonts: [] }
    },
    dataSource: ['rbi', 'equipment'],
    filters: []
  }
]

const MOCK_REPORTS: GeneratedReport[] = [
  {
    id: 'rpt-001',
    templateId: 'tpl-001',
    templateName: 'Monthly Equipment Status Report',
    name: 'Equipment Status - February 2024',
    description: 'Monthly equipment status report for February 2024',
    status: 'completed',
    createdBy: 'John Smith',
    createdDate: '2024-02-10T09:00:00Z',
    completedDate: '2024-02-10T09:15:00Z',
    parameters: { month: 'February', unit: ['Unit 1', 'Unit 2'] },
    fileUrl: '/reports/equipment-status-feb-2024.pdf',
    fileSize: '2.4 MB',
    format: 'pdf',
    isShared: true,
    sharedWith: ['team-alpha', 'managers'],
    downloadCount: 12
  },
  {
    id: 'rpt-002',
    templateId: 'tpl-002',
    templateName: 'RBI Analysis Summary',
    name: 'High Risk Equipment Analysis',
    status: 'generating',
    createdBy: 'Jane Doe',
    createdDate: '2024-02-10T14:30:00Z',
    parameters: { riskLevel: 'High' },
    format: 'excel',
    isShared: false,
    sharedWith: [],
    downloadCount: 0
  }
]

export function AdvancedReportingDashboard({ className }: AdvancedReportingDashboardProps) {
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState<ReportTemplate[]>(MOCK_TEMPLATES)
  const [reports, setReports] = useState<GeneratedReport[]>(MOCK_REPORTS)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  const [isSharingOpen, setIsSharingOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || template.type === filterType
      const matchesCategory = filterCategory === 'all' || template.category === filterCategory
      
      return matchesSearch && matchesType && matchesCategory
    })
  }, [templates, searchQuery, filterType, filterCategory])

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           report.templateName.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesSearch
    })
  }, [reports, searchQuery])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = templates.map(t => t.category)
    return ['all', ...Array.from(new Set(cats))]
  }, [templates])

  // Handle template actions
  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setIsBuilderOpen(true)
  }

  const handleEditTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setIsBuilderOpen(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId))
    }
  }

  const handleGenerateReport = (template: ReportTemplate) => {
    // In real app, this would open a parameter input dialog
    const newReport: GeneratedReport = {
      id: `rpt-${Date.now()}`,
      templateId: template.id,
      templateName: template.name,
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      status: 'generating',
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
      parameters: {},
      format: 'pdf',
      isShared: false,
      sharedWith: [],
      downloadCount: 0
    }
    
    setReports(prev => [newReport, ...prev])
    
    // Simulate report generation
    setTimeout(() => {
      setReports(prev => prev.map(r => 
        r.id === newReport.id 
          ? { ...r, status: 'completed', completedDate: new Date().toISOString(), fileUrl: '/reports/generated.pdf', fileSize: '1.8 MB' }
          : r
      ))
    }, 3000)
  }

  const handleScheduleReport = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setIsSchedulerOpen(true)
  }

  const handleShareReport = (report: GeneratedReport) => {
    setSelectedReport(report)
    setIsSharingOpen(true)
  }

  const handleDownloadReport = (report: GeneratedReport) => {
    if (report.fileUrl) {
      // In real app, trigger download
      console.log('Downloading report:', report.fileUrl)
      setReports(prev => prev.map(r => 
        r.id === report.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
      ))
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advanced Reporting</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage custom reports
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateTemplate}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search templates and reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="rbi">RBI</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="reports">Generated Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                    <Badge variant={template.isPublic ? 'default' : 'secondary'} className="text-xs">
                      {template.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{template.category}</span>
                    <span>{template.usageCount} uses</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport(template)}
                      className="flex-1"
                    >
                      <DocumentTextIcon className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleScheduleReport(template)}
                    >
                      <CalendarDaysIcon className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first report template to get started
              </p>
              <Button onClick={handleCreateTemplate}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="space-y-3">
            {filteredReports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{report.name}</h4>
                        <Badge
                          variant={
                            report.status === 'completed' ? 'default' :
                            report.status === 'generating' ? 'secondary' :
                            report.status === 'failed' ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          {report.status}
                        </Badge>
                        {report.isShared && (
                          <Badge variant="outline" className="text-xs">
                            <ShareIcon className="h-3 w-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Template: {report.templateName}</span>
                        <span>Created: {formatDate(report.createdDate)}</span>
                        <span>By: {report.createdBy}</span>
                        {report.fileSize && <span>Size: {report.fileSize}</span>}
                        <span>Downloads: {report.downloadCount}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {report.status === 'generating' && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <ClockIcon className="h-4 w-4 animate-pulse" />
                          <span>Generating...</span>
                        </div>
                      )}
                      
                      {report.status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShareReport(report)}
                          >
                            <ShareIcon className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {}}
                        className="text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No reports generated</h3>
              <p className="text-muted-foreground">
                Generate reports from templates to see them here
              </p>
            </div>
          )}
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No scheduled reports</h3>
            <p className="text-muted-foreground">
              Schedule reports to run automatically at specified intervals
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CustomReportBuilder
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        template={selectedTemplate}
        onSave={(template) => {
          if (selectedTemplate) {
            setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
          } else {
            setTemplates(prev => [template, ...prev])
          }
          setIsBuilderOpen(false)
        }}
      />
      
      <ReportScheduler
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        template={selectedTemplate}
        onSchedule={(schedule) => {
          console.log('Report scheduled:', schedule)
          setIsSchedulerOpen(false)
        }}
      />
      
      <ReportSharing
        isOpen={isSharingOpen}
        onClose={() => setIsSharingOpen(false)}
        report={selectedReport}
        onShare={(shareConfig) => {
          if (selectedReport) {
            setReports(prev => prev.map(r => 
              r.id === selectedReport.id 
                ? { ...r, isShared: true, sharedWith: shareConfig.sharedWith }
                : r
            ))
          }
          setIsSharingOpen(false)
        }}
      />
    </div>
  )
}

export type { 
  AdvancedReportingDashboardProps, 
  ReportTemplate, 
  ReportParameter, 
  GeneratedReport 
}
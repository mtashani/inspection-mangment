'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar as CalendarIcon,
  Settings,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react'
import { Inspector } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface AttendanceExportProps {
  inspectors: Inspector[]
  onExport: (config: ExportConfig) => Promise<void>
  onClose?: () => void
  loading?: boolean
  className?: string
}

interface ExportConfig {
  format: 'PDF' | 'EXCEL' | 'CSV'
  reportType: 'summary' | 'detailed' | 'monthly' | 'yearly'
  dateRange: {
    startDate?: Date
    endDate?: Date
    jalaliYear?: number
    jalaliMonth?: number
  }
  filters: {
    inspectorIds?: number[]
    departments?: string[]
    statuses?: string[]
    includeOverrides?: boolean
    includeNotes?: boolean
  }
  groupBy?: 'inspector' | 'date' | 'department' | 'status'
  includeCharts?: boolean
  includeAnalytics?: boolean
}

const EXPORT_FORMATS = [
  { value: 'PDF', label: 'PDF Report', icon: FileText, description: 'Professional formatted report' },
  { value: 'EXCEL', label: 'Excel Spreadsheet', icon: FileSpreadsheet, description: 'Data for analysis' },
  { value: 'CSV', label: 'CSV Data', icon: FileSpreadsheet, description: 'Raw data export' }
]

const REPORT_TYPES = [
  { value: 'summary', label: 'Summary Report', description: 'High-level overview with key metrics' },
  { value: 'detailed', label: 'Detailed Report', description: 'Complete attendance records with all details' },
  { value: 'monthly', label: 'Monthly Report', description: 'Month-by-month breakdown' },
  { value: 'yearly', label: 'Yearly Report', description: 'Annual summary and trends' }
]

const ATTENDANCE_STATUSES = [
  'WORKING', 'RESTING', 'OVERTIME', 'ABSENT', 'SICK_LEAVE', 'VACATION'
]

export function AttendanceExport({
  inspectors,
  onExport,
  onClose,
  loading = false,
  className
}: AttendanceExportProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'PDF',
    reportType: 'summary',
    dateRange: {},
    filters: {
      includeOverrides: true,
      includeNotes: true
    },
    groupBy: 'inspector',
    includeCharts: true,
    includeAnalytics: true
  })
  
  const [step, setStep] = useState<'format' | 'filters' | 'options' | 'preview'>('format')
  const [selectedInspectors, setSelectedInspectors] = useState<number[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const { toast } = useToast()

  // Get unique departments from inspectors
  const departments = Array.from(new Set(inspectors.map(i => i.department).filter(Boolean)))

  const handleFormatSelect = (format: 'PDF' | 'EXCEL' | 'CSV') => {
    setConfig(prev => ({ ...prev, format }))
    setStep('filters')
  }

  const handleInspectorToggle = (inspectorId: number) => {
    setSelectedInspectors(prev => {
      const newSelection = prev.includes(inspectorId)
        ? prev.filter(id => id !== inspectorId)
        : [...prev, inspectorId]
      
      setConfig(prevConfig => ({
        ...prevConfig,
        filters: { ...prevConfig.filters, inspectorIds: newSelection.length > 0 ? newSelection : undefined }
      }))
      
      return newSelection
    })
  }

  const handleDepartmentToggle = (department: string) => {
    setSelectedDepartments(prev => {
      const newSelection = prev.includes(department)
        ? prev.filter(d => d !== department)
        : [...prev, department]
      
      setConfig(prevConfig => ({
        ...prevConfig,
        filters: { ...prevConfig.filters, departments: newSelection.length > 0 ? newSelection : undefined }
      }))
      
      return newSelection
    })
  }

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => {
      const newSelection = prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
      
      setConfig(prevConfig => ({
        ...prevConfig,
        filters: { ...prevConfig.filters, statuses: newSelection.length > 0 ? newSelection : undefined }
      }))
      
      return newSelection
    })
  }

  const handleDateRangeUpdate = () => {
    setConfig(prev => ({
      ...prev,
      dateRange: {
        startDate,
        endDate
      }
    }))
  }

  const handleExport = async () => {
    try {
      await onExport(config)
      toast({
        title: 'Export Started',
        description: `Your ${config.format} report is being generated and will download shortly.`
      })
      if (onClose) onClose()
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate the report. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const getSelectedCount = () => {
    const inspectorCount = selectedInspectors.length || inspectors.length
    const departmentCount = selectedDepartments.length || departments.length
    const statusCount = selectedStatuses.length || ATTENDANCE_STATUSES.length
    
    return { inspectorCount, departmentCount, statusCount }
  }

  const { inspectorCount, departmentCount, statusCount } = getSelectedCount()

  return (
    <Card className={cn('w-full max-w-4xl', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Attendance Data
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {['Format', 'Filters', 'Options', 'Preview'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                index <= ['format', 'filters', 'options', 'preview'].indexOf(step)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {index + 1}
              </div>
              <span className={cn(
                'ml-2 text-sm',
                index <= ['format', 'filters', 'options', 'preview'].indexOf(step)
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}>
                {stepName}
              </span>
              {index < 3 && (
                <div className={cn(
                  'w-12 h-0.5 mx-4',
                  index < ['format', 'filters', 'options', 'preview'].indexOf(step)
                    ? 'bg-primary'
                    : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'format' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Choose Export Format</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EXPORT_FORMATS.map((format) => (
                <Card 
                  key={format.value}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    config.format === format.value && 'ring-2 ring-primary'
                  )}
                  onClick={() => handleFormatSelect(format.value as 'PDF' | 'EXCEL' | 'CSV')}
                >
                  <CardContent className="p-6 text-center">
                    <format.icon className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4 className="font-medium mb-2">{format.label}</h4>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-3">
              <Label>Report Type</Label>
              <Select
                value={config.reportType}
                onValueChange={(value: 'summary' | 'detailed' | 'monthly' | 'yearly') =>
                  setConfig(prev => ({ ...prev, reportType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 'filters' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Filter Data</h3>

            {/* Date Range */}
            <div className="space-y-3">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date)
                          handleDateRangeUpdate()
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date)
                          handleDateRangeUpdate()
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Inspector Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Inspectors</Label>
                <Badge variant="secondary">{inspectorCount} selected</Badge>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-3">
                {inspectors.map((inspector) => (
                  <div key={inspector.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`inspector-${inspector.id}`}
                      checked={selectedInspectors.includes(inspector.id)}
                      onCheckedChange={() => handleInspectorToggle(inspector.id)}
                    />
                    <Label htmlFor={`inspector-${inspector.id}`} className="text-sm">
                      {inspector.name} ({inspector.employeeId})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Selection */}
            {departments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Departments</Label>
                  <Badge variant="secondary">{departmentCount} selected</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {departments.map((department) => (
                    <Button
                      key={department}
                      variant={selectedDepartments.includes(department) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleDepartmentToggle(department)}
                    >
                      {department}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Attendance Status</Label>
                <Badge variant="secondary">{statusCount} selected</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {ATTENDANCE_STATUSES.map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatuses.includes(status) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusToggle(status)}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep('format')}>
                Back
              </Button>
              <Button onClick={() => setStep('options')}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'options' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Export Options</h3>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Group Data By</Label>
                <Select
                  value={config.groupBy}
                  onValueChange={(value: 'inspector' | 'date' | 'department' | 'status') =>
                    setConfig(prev => ({ ...prev, groupBy: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inspector">Inspector</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Include Additional Data</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeOverrides"
                      checked={config.filters.includeOverrides}
                      onCheckedChange={(checked) =>
                        setConfig(prev => ({
                          ...prev,
                          filters: { ...prev.filters, includeOverrides: checked as boolean }
                        }))
                      }
                    />
                    <Label htmlFor="includeOverrides">Include override records</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeNotes"
                      checked={config.filters.includeNotes}
                      onCheckedChange={(checked) =>
                        setConfig(prev => ({
                          ...prev,
                          filters: { ...prev.filters, includeNotes: checked as boolean }
                        }))
                      }
                    />
                    <Label htmlFor="includeNotes">Include notes and comments</Label>
                  </div>

                  {config.format === 'PDF' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeCharts"
                          checked={config.includeCharts}
                          onCheckedChange={(checked) =>
                            setConfig(prev => ({ ...prev, includeCharts: checked as boolean }))
                          }
                        />
                        <Label htmlFor="includeCharts">Include charts and graphs</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeAnalytics"
                          checked={config.includeAnalytics}
                          onCheckedChange={(checked) =>
                            setConfig(prev => ({ ...prev, includeAnalytics: checked as boolean }))
                          }
                        />
                        <Label htmlFor="includeAnalytics">Include analytics and insights</Label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep('filters')}>
                Back
              </Button>
              <Button onClick={() => setStep('preview')}>
                Preview
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Export Preview</h3>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Review your export configuration before generating the report.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <Badge>{config.format}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Report Type:</span>
                    <span>{config.reportType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Group By:</span>
                    <span>{config.groupBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date Range:</span>
                    <span>
                      {startDate && endDate 
                        ? `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')}`
                        : 'All dates'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Scope</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Inspectors:</span>
                    <span>{inspectorCount} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Departments:</span>
                    <span>{departmentCount} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Statuses:</span>
                    <span>{statusCount} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Include Overrides:</span>
                    <span>{config.filters.includeOverrides ? 'Yes' : 'No'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep('options')}>
                Back
              </Button>
              <Button onClick={handleExport} disabled={loading}>
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {config.format}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
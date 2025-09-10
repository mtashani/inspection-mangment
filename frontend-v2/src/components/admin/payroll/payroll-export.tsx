'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Calendar,
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { usePayroll } from '@/hooks/admin/use-payroll'
import { PayrollRecord } from '@/types/admin'

interface PayrollExportProps {
  records?: PayrollRecord[]
  onExport?: (options: ExportOptions) => Promise<void>
}

interface ExportOptions {
  format: 'PDF' | 'EXCEL' | 'CSV'
  type: 'SUMMARY' | 'DETAILED' | 'PAY_SLIPS'
  dateRange: {
    startDate: string
    endDate: string
  }
  inspectorIds: number[]
  includeHeaders: boolean
  includeCalculations: boolean
  includeDeductions: boolean
  groupByDepartment: boolean
}

export function PayrollExport({ records = [], onExport }: PayrollExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'EXCEL',
    type: 'SUMMARY',
    dateRange: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    inspectorIds: [],
    includeHeaders: true,
    includeCalculations: true,
    includeDeductions: true,
    groupByDepartment: false
  })

  const [selectedInspectors, setSelectedInspectors] = useState<number[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle')

  const { exportData, generateReport } = usePayroll()

  const handleExport = async () => {
    setIsExporting(true)
    setExportStatus('exporting')
    setExportProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const options = {
        ...exportOptions,
        inspectorIds: selectedInspectors
      }

      if (exportOptions.type === 'PAY_SLIPS') {
        // Generate individual pay slips
        const month = new Date(exportOptions.dateRange.startDate).getMonth() + 1
        const year = new Date(exportOptions.dateRange.startDate).getFullYear()
        
        const blob = await generateReport(month, year, selectedInspectors, exportOptions.format)
        downloadFile(blob, `pay-slips-${year}-${month.toString().padStart(2, '0')}.${exportOptions.format.toLowerCase()}`)
      } else {
        // Export payroll data
        const blob = await exportData(
          exportOptions.dateRange.startDate,
          exportOptions.dateRange.endDate,
          exportOptions.format === 'PDF' ? 'EXCEL' : exportOptions.format
        )
        downloadFile(blob, `payroll-export-${exportOptions.type.toLowerCase()}.${exportOptions.format === 'PDF' ? 'xlsx' : exportOptions.format.toLowerCase()}`)
      }

      clearInterval(progressInterval)
      setExportProgress(100)
      setExportStatus('success')
      
      if (onExport) {
        await onExport(options)
      }
    } catch (error) {
      console.error('Export failed:', error)
      setExportStatus('error')
    } finally {
      setIsExporting(false)
      setTimeout(() => {
        setExportStatus('idle')
        setExportProgress(0)
      }, 3000)
    }
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleInspectorSelection = (inspectorId: number) => {
    setSelectedInspectors(prev =>
      prev.includes(inspectorId)
        ? prev.filter(id => id !== inspectorId)
        : [...prev, inspectorId]
    )
  }

  const selectAllInspectors = () => {
    if (selectedInspectors.length === records.length) {
      setSelectedInspectors([])
    } else {
      setSelectedInspectors(records.map(record => record.inspectorId))
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF':
        return <FileText className="h-4 w-4" />
      case 'EXCEL':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'CSV':
        return <File className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Payroll Export Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Type and Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Export Type</Label>
              <Select 
                value={exportOptions.type} 
                onValueChange={(value: 'SUMMARY' | 'DETAILED' | 'PAY_SLIPS') => 
                  setExportOptions({ ...exportOptions, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUMMARY">Summary Report</SelectItem>
                  <SelectItem value="DETAILED">Detailed Report</SelectItem>
                  <SelectItem value="PAY_SLIPS">Individual Pay Slips</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value: 'PDF' | 'EXCEL' | 'CSV') => 
                  setExportOptions({ ...exportOptions, format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF Document
                    </div>
                  </SelectItem>
                  <SelectItem value="EXCEL">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel Spreadsheet
                    </div>
                  </SelectItem>
                  <SelectItem value="CSV">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      CSV File
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={exportOptions.dateRange.startDate}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    dateRange: { ...exportOptions.dateRange, startDate: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-sm">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={exportOptions.dateRange.endDate}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    dateRange: { ...exportOptions.dateRange, endDate: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <Label>Export Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHeaders"
                  checked={exportOptions.includeHeaders}
                  onCheckedChange={(checked) => setExportOptions({
                    ...exportOptions,
                    includeHeaders: checked as boolean
                  })}
                />
                <Label htmlFor="includeHeaders" className="text-sm">Include Headers</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCalculations"
                  checked={exportOptions.includeCalculations}
                  onCheckedChange={(checked) => setExportOptions({
                    ...exportOptions,
                    includeCalculations: checked as boolean
                  })}
                />
                <Label htmlFor="includeCalculations" className="text-sm">Include Calculations</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDeductions"
                  checked={exportOptions.includeDeductions}
                  onCheckedChange={(checked) => setExportOptions({
                    ...exportOptions,
                    includeDeductions: checked as boolean
                  })}
                />
                <Label htmlFor="includeDeductions" className="text-sm">Include Deductions</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="groupByDepartment"
                  checked={exportOptions.groupByDepartment}
                  onCheckedChange={(checked) => setExportOptions({
                    ...exportOptions,
                    groupByDepartment: checked as boolean
                  })}
                />
                <Label htmlFor="groupByDepartment" className="text-sm">Group by Department</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspector Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Inspector Selection
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedInspectors.length} of {records.length} selected
              </Badge>
              <Button variant="outline" size="sm" onClick={selectAllInspectors}>
                {selectedInspectors.length === records.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {records.map((record) => (
              <div key={record.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                <Checkbox
                  checked={selectedInspectors.includes(record.inspectorId)}
                  onCheckedChange={() => toggleInspectorSelection(record.inspectorId)}
                />
                <div className="flex-1">
                  <p className="font-medium">{record.inspector.name}</p>
                  <p className="text-sm text-muted-foreground">{record.inspector.employeeId}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(record.netPay)}
                  </p>
                  <Badge variant={record.isPaid ? 'secondary' : 'destructive'} className="text-xs">
                    {record.isPaid ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}

            {records.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No payroll records available for the selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Export Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {getFormatIcon(exportOptions.format)}
              <div>
                <p className="font-medium">{exportOptions.format} Format</p>
                <p className="text-sm text-muted-foreground">{exportOptions.type} Report</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Date Range</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(exportOptions.dateRange.startDate).toLocaleDateString()} - {' '}
                  {new Date(exportOptions.dateRange.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Inspectors</p>
                <p className="text-sm text-muted-foreground">
                  {selectedInspectors.length} selected
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting...</span>
                <span className="text-sm text-muted-foreground">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Export Status */}
          {exportStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Export completed successfully!</span>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Export failed. Please try again.</span>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleExport} 
              disabled={isExporting || selectedInspectors.length === 0}
              className="min-w-32"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportOptions.format}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickExportCard
              title="Monthly Summary"
              description="Complete monthly payroll summary"
              format="EXCEL"
              type="SUMMARY"
              onClick={() => {
                setExportOptions({
                  ...exportOptions,
                  format: 'EXCEL',
                  type: 'SUMMARY',
                  includeHeaders: true,
                  includeCalculations: true
                })
                setSelectedInspectors(records.map(r => r.inspectorId))
              }}
            />

            <QuickExportCard
              title="Pay Slips"
              description="Individual pay slips for all inspectors"
              format="PDF"
              type="PAY_SLIPS"
              onClick={() => {
                setExportOptions({
                  ...exportOptions,
                  format: 'PDF',
                  type: 'PAY_SLIPS',
                  includeHeaders: true,
                  includeCalculations: true,
                  includeDeductions: true
                })
                setSelectedInspectors(records.map(r => r.inspectorId))
              }}
            />

            <QuickExportCard
              title="Detailed Report"
              description="Comprehensive payroll analysis"
              format="EXCEL"
              type="DETAILED"
              onClick={() => {
                setExportOptions({
                  ...exportOptions,
                  format: 'EXCEL',
                  type: 'DETAILED',
                  includeHeaders: true,
                  includeCalculations: true,
                  includeDeductions: true,
                  groupByDepartment: true
                })
                setSelectedInspectors(records.map(r => r.inspectorId))
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface QuickExportCardProps {
  title: string
  description: string
  format: string
  type: string
  onClick: () => void
}

function QuickExportCard({ title, description, format, type, onClick }: QuickExportCardProps) {
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF':
        return <FileText className="h-6 w-6" />
      case 'EXCEL':
        return <FileSpreadsheet className="h-6 w-6" />
      case 'CSV':
        return <File className="h-6 w-6" />
      default:
        return <FileText className="h-6 w-6" />
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            {getFormatIcon(format)}
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{format}</Badge>
              <Badge variant="secondary">{type}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
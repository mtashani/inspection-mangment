'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Printer
} from 'lucide-react'
import { usePayroll } from '@/hooks/admin/use-payroll'
import { PayrollRecord } from '@/types/admin'

interface PayrollReportsProps {
  month: number
  year: number
}

export function PayrollReports({ month, year }: PayrollReportsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInspectors, setSelectedInspectors] = useState<number[]>([])
  const [reportFormat, setReportFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF')
  const [showFilters, setShowFilters] = useState(false)

  const {
    payrollRecords,
    isLoadingRecords,
    generateReport,
    exportData
  } = usePayroll({ month, year })

  const filteredRecords = payrollRecords?.filter(record =>
    record.inspector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.inspector.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleGenerateReport = async () => {
    try {
      const blob = await generateReport(month, year, selectedInspectors, reportFormat)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll-report-${year}-${month.toString().padStart(2, '0')}.${reportFormat.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }

  const handleExportData = async () => {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`
      const blob = await exportData(startDate, endDate, reportFormat === 'PDF' ? 'EXCEL' : reportFormat)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll-export-${year}-${month.toString().padStart(2, '0')}.${reportFormat === 'PDF' ? 'xlsx' : reportFormat.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }

  const toggleInspectorSelection = (inspectorId: number) => {
    setSelectedInspectors(prev =>
      prev.includes(inspectorId)
        ? prev.filter(id => id !== inspectorId)
        : [...prev, inspectorId]
    )
  }

  const selectAllInspectors = () => {
    if (selectedInspectors.length === filteredRecords.length) {
      setSelectedInspectors([])
    } else {
      setSelectedInspectors(filteredRecords.map(record => record.inspectorId))
    }
  }

  return (
    <div className="space-y-6">
      {/* Report Generation Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payroll Reports
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Select value={reportFormat} onValueChange={(value: 'PDF' | 'EXCEL' | 'CSV') => setReportFormat(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateReport} disabled={selectedInspectors.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Inspectors</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Report Period</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(year, month - 1).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Quick Actions</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllInspectors}>
                    {selectedInspectors.length === filteredRecords.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payroll Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Payroll Records</CardTitle>
            <Badge variant="secondary">
              {selectedInspectors.length} of {filteredRecords.length} selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingRecords ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="space-y-2">
                {filteredRecords.map((record) => (
                  <PayrollRecordCard
                    key={record.id}
                    record={record}
                    isSelected={selectedInspectors.includes(record.inspectorId)}
                    onToggleSelection={() => toggleInspectorSelection(record.inspectorId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No payroll records found for the selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReportTemplateCard
              title="Monthly Summary"
              description="Complete monthly payroll summary with totals and breakdowns"
              icon={<DollarSign className="h-6 w-6" />}
              onGenerate={() => handleGenerateReport()}
            />
            
            <ReportTemplateCard
              title="Individual Pay Slips"
              description="Generate individual pay slips for selected inspectors"
              icon={<Users className="h-6 w-6" />}
              onGenerate={() => handleGenerateReport()}
            />
            
            <ReportTemplateCard
              title="Overtime Report"
              description="Detailed overtime hours and payments report"
              icon={<Calendar className="h-6 w-6" />}
              onGenerate={() => handleGenerateReport()}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface PayrollRecordCardProps {
  record: PayrollRecord
  isSelected: boolean
  onToggleSelection: () => void
}

function PayrollRecordCard({ record, isSelected, onToggleSelection }: PayrollRecordCardProps) {
  return (
    <div className={`p-4 border rounded-lg transition-colors ${
      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
    }`}>
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelection}
        />
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <p className="font-medium">{record.inspector.name}</p>
            <p className="text-sm text-muted-foreground">{record.inspector.employeeId}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Working Days</p>
            <p className="font-medium">{record.workingDays}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className="font-medium">{record.totalHours}h</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Net Pay</p>
            <p className="font-medium text-green-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(record.netPay)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={record.isPaid ? 'secondary' : 'destructive'}>
              {record.isPaid ? 'Paid' : 'Pending'}
            </Badge>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ReportTemplateCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onGenerate: () => void
}

function ReportTemplateCard({ title, description, icon, onGenerate }: ReportTemplateCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <Button size="sm" onClick={onGenerate}>
              <FileText className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
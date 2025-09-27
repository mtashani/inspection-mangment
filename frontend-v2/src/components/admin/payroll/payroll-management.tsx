'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { 
  DollarSign,
  Users,
  Calculator,
  FileText,
  Download,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  Plus
} from 'lucide-react'
import { Inspector, PayrollRecord } from '@/types/admin'
import { usePayroll } from '@/hooks/admin/use-payroll'
import { useInspectors } from '@/hooks/admin/use-inspectors'
import { PayrollDashboard } from './payroll-dashboard'
import { SalaryCalculator } from './salary-calculator'
import { PayrollExport } from './payroll-export'
import { PayrollReports } from './payroll-reports'
import { PayrollAnalytics } from './payroll-analytics'
import { InspectorPayrollDetails } from './inspector-payroll-details'

interface PayrollManagementProps {
  className?: string
}

const PAYROLL_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'calculated', label: 'Calculated', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500' },
  { value: 'paid', label: 'Paid', color: 'bg-purple-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' }
]

export function PayrollManagement({ className }: PayrollManagementProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  })
  const [selectedInspector, setSelectedInspector] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  const {
    payrollRecords,
    payrollStats,
    isLoadingRecords,
    isLoadingStats,
    calculatePayrollBulk,
    approvePayrollBatch,
    exportPayrollData
  } = usePayroll({
    year: selectedPeriod.year,
    month: selectedPeriod.month,
    search: searchQuery,
    status: statusFilter
  })

  const { inspectors, isLoading: isLoadingInspectors } = useInspectors()

  const handleBulkCalculation = async (inspectorIds: number[]) => {
    try {
      await calculatePayrollBulk({
        inspector_ids: inspectorIds,
        jalali_year: selectedPeriod.year,
        jalali_month: selectedPeriod.month,
        options: {
          include_overtime: true,
          include_bonuses: true,
          auto_approve: false
        }
      })
    } catch (error) {
      console.error('Bulk calculation failed:', error)
    }
  }

  const handleBatchApproval = async (payrollIds: number[]) => {
    try {
      await approvePayrollBatch({
        payroll_ids: payrollIds,
        comments: 'Batch approval from admin panel'
      })
    } catch (error) {
      console.error('Batch approval failed:', error)
    }
  }

  const handleExport = async (format: 'PDF' | 'EXCEL' | 'CSV') => {
    try {
      await exportPayrollData({
        format: format.toLowerCase(),
        filters: {
          year: selectedPeriod.year,
          month: selectedPeriod.month,
          status: statusFilter,
          search: searchQuery
        },
        include_summary: true,
        include_charts: format === 'PDF'
      })
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Define columns for payroll records table
  const payrollColumns = [
    {
      accessorKey: 'inspector_name',
      header: 'Inspector',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.getValue('inspector_name')}</span>
          <Badge variant="outline" className="text-xs">
            {row.original.employee_id}
          </Badge>
        </div>
      )
    },
    {
      accessorKey: 'period',
      header: 'Period',
      cell: ({ row }: any) => row.getValue('period')
    },
    {
      accessorKey: 'total_earnings',
      header: 'Total Earnings',
      cell: ({ row }: any) => (
        <span className="font-mono">
          ${Number(row.getValue('total_earnings')).toLocaleString()}
        </span>
      )
    },
    {
      accessorKey: 'total_deductions',
      header: 'Deductions',
      cell: ({ row }: any) => (
        <span className="font-mono text-red-600">
          -${Number(row.getValue('total_deductions')).toLocaleString()}
        </span>
      )
    },
    {
      accessorKey: 'net_pay',
      header: 'Net Pay',
      cell: ({ row }: any) => (
        <span className="font-mono font-semibold">
          ${Number(row.getValue('net_pay')).toLocaleString()}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status') as string
        const statusOption = PAYROLL_STATUS_OPTIONS.find(opt => opt.value === status)
        return (
          <Badge 
            variant="secondary" 
            className={`${statusOption?.color} text-white`}
          >
            {statusOption?.label || status}
          </Badge>
        )
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedInspector(row.original.inspector_id)}
          >
            View Details
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => console.log('Edit payroll:', row.original.id)}
          >
            Edit
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">
            Comprehensive payroll management for all inspectors
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={`${selectedPeriod.year}-${selectedPeriod.month}`}
            onValueChange={(value) => {
              const [year, month] = value.split('-').map(Number)
              setSelectedPeriod({ year, month })
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1
                const year = new Date().getFullYear()
                return (
                  <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                    {new Date(year, i).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => handleExport('EXCEL')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={() => setActiveTab('calculator')}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PayrollDashboard />
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Inspectors</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name or employee ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="w-48">
                  <Label htmlFor="status">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {PAYROLL_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Records Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payroll Records</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const selectedInspectorIds = inspectors?.map(i => i.id) || []
                      handleBulkCalculation(selectedInspectorIds)
                    }}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const draftPayrolls = payrollRecords?.filter(p => p.status === 'calculated').map(p => p.id) || []
                      handleBatchApproval(draftPayrolls)
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={payrollColumns}
                data={payrollRecords || []}
                loading={isLoadingRecords}
                searchable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <SalaryCalculator
            month={selectedPeriod.month}
            year={selectedPeriod.year}
            onCalculationComplete={(calculation) => {
              console.log('Calculation completed:', calculation)
            }}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <PayrollReports
            month={selectedPeriod.month}
            year={selectedPeriod.year}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PayrollAnalytics />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <PayrollExport
            onExport={handleExport}
            inspectors={inspectors || []}
          />
        </TabsContent>
      </Tabs>

      {/* Inspector Details Modal/Sheet */}
      {selectedInspector && (
        <InspectorPayrollDetails
          inspectorId={selectedInspector}
          month={selectedPeriod.month}
          year={selectedPeriod.year}
          onClose={() => setSelectedInspector(null)}
        />
      )}
    </div>
  )
}
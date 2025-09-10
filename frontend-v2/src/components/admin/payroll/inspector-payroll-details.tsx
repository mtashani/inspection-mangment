'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  Download,
  Edit,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useInspectorPayroll } from '@/hooks/admin/use-payroll'
import { PayrollRecord } from '@/types/admin'

interface InspectorPayrollDetailsProps {
  inspectorId: number
}

export function InspectorPayrollDetails({ inspectorId }: InspectorPayrollDetailsProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(new Date().getMonth() + 1)

  const {
    payrollRecords,
    isLoadingRecords,
    generatePayroll,
    markAsPaid,
    isGenerating,
    error
  } = useInspectorPayroll(inspectorId, selectedYear, selectedMonth)

  const currentRecord = payrollRecords?.[0]
  const allRecords = payrollRecords || []

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Failed to load payroll data. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/payroll">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Inspector Payroll Details</h1>
          <p className="text-muted-foreground">
            {currentRecord?.inspector.name} ({currentRecord?.inspector.employeeId})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth?.toString()} onValueChange={(value) => setSelectedMonth(value ? parseInt(value) : undefined)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Months</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 3 }, (_, i) => (
                <SelectItem key={2022 + i} value={(2022 + i).toString()}>
                  {2022 + i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Month Summary */}
      {currentRecord && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {new Date(selectedYear, (selectedMonth || 1) - 1).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })} Payroll
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={currentRecord.isPaid ? 'secondary' : 'destructive'}>
                  {currentRecord.isPaid ? 'Paid' : 'Pending'}
                </Badge>
                {!currentRecord.isPaid && (
                  <Button 
                    size="sm" 
                    onClick={() => markAsPaid(currentRecord.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Working Days</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{currentRecord.workingDays}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{currentRecord.totalHours}h</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Overtime Hours</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-2xl font-bold text-orange-600">{currentRecord.overtimeHours}h</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Net Pay</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(currentRecord.netPay)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown">Pay Breakdown</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="settings">Payroll Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-6">
          {currentRecord ? (
            <PayrollBreakdown record={currentRecord} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    No payroll record found for the selected period
                  </p>
                  <Button 
                    onClick={() => generatePayroll({ 
                      inspectorId, 
                      month: selectedMonth || new Date().getMonth() + 1, 
                      year: selectedYear 
                    })}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Payroll'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <PayrollHistory records={allRecords} loading={isLoadingRecords} />
        </TabsContent>

        <TabsContent value="settings">
          <PayrollSettings inspectorId={inspectorId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface PayrollBreakdownProps {
  record: PayrollRecord
}

function PayrollBreakdown({ record }: PayrollBreakdownProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Base Salary</span>
            <span className="font-medium">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(record.baseSalary)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>Overtime Pay</span>
            <span className="font-medium text-orange-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(record.overtimePay)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>Bonuses</span>
            <span className="font-medium text-green-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(record.bonuses)}
            </span>
          </div>
          
          <div className="border-t pt-2">
            <div className="flex justify-between items-center font-semibold">
              <span>Total Earnings</span>
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(record.totalPay)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deductions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Total Deductions</span>
            <span className="font-medium text-red-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(record.deductions)}
            </span>
          </div>
          
          <div className="border-t pt-2">
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Net Pay</span>
              <span className="text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(record.netPay)}
              </span>
            </div>
          </div>
          
          {record.notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Notes:</p>
              <p className="text-sm">{record.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface PayrollHistoryProps {
  records: PayrollRecord[]
  loading: boolean
}

function PayrollHistory({ records, loading }: PayrollHistoryProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">
                  {new Date(record.year, record.month - 1).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {record.workingDays} working days • {record.totalHours} hours
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(record.netPay)}
                </p>
                <Badge variant={record.isPaid ? 'secondary' : 'destructive'}>
                  {record.isPaid ? 'Paid' : 'Pending'}
                </Badge>
              </div>
            </div>
          ))}
          
          {records.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No payment history available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface PayrollSettingsProps {
  inspectorId: number
}

function PayrollSettings({ inspectorId }: PayrollSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2">Base Hourly Rate</p>
              <p className="text-2xl font-bold">$25.00</p>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Overtime Multiplier</p>
              <p className="text-2xl font-bold">1.5x</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
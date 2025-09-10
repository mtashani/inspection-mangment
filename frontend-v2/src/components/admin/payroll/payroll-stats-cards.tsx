'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils/formatting'

interface PayrollStats {
  totalPayroll: number
  averageSalary: number
  totalOvertimePay: number
  totalBonuses: number
  totalDeductions: number
  pendingPayments: number
  paidPayments: number
  byInspector: Array<{
    inspectorId: number
    inspectorName: string
    totalPay: number
    overtimePay: number
    bonuses: number
    deductions: number
  }>
}

interface PayrollStatsCardsProps {
  stats?: PayrollStats
  loading?: boolean
  month: number
  year: number
}

export function PayrollStatsCards({ stats, loading, month, year }: PayrollStatsCardsProps) {
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' })

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalInspectors = stats?.byInspector?.length || 0
  const paymentCompletionRate = totalInspectors > 0 
    ? ((stats?.paidPayments || 0) / totalInspectors) * 100 
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Payroll */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.totalPayroll || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {monthName} {year} • {totalInspectors} inspectors
          </p>
        </CardContent>
      </Card>

      {/* Average Salary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.averageSalary || 0)}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span>Per inspector this month</span>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Pay */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overtime Pay</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats?.totalOvertimePay || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {((stats?.totalOvertimePay || 0) / (stats?.totalPayroll || 1) * 100).toFixed(1)}% of total payroll
          </p>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {paymentCompletionRate.toFixed(0)}%
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="text-xs">
              {stats?.paidPayments || 0} Paid
            </Badge>
            {(stats?.pendingPayments || 0) > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats?.pendingPayments} Pending
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats Row */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Bonuses & Deductions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Bonuses</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(stats?.totalBonuses || 0)}
                </span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Deductions</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-red-600">
                  {formatCurrency(stats?.totalDeductions || 0)}
                </span>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Earners */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Earners This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.byInspector
              ?.sort((a, b) => b.totalPay - a.totalPay)
              ?.slice(0, 3)
              ?.map((inspector, index) => (
                <div key={inspector.inspectorId} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="font-medium text-sm">{inspector.inspectorName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(inspector.totalPay)}</p>
                    {inspector.overtimePay > 0 && (
                      <p className="text-xs text-muted-foreground">
                        +{formatCurrency(inspector.overtimePay)} OT
                      </p>
                    )}
                  </div>
                </div>
              )) || (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No payroll data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Utility functions for formatting
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}
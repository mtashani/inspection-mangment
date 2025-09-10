'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Award
} from 'lucide-react'

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

interface PayrollAnalyticsProps {
  stats?: PayrollStats
  loading?: boolean
}

export function PayrollAnalytics({ stats, loading }: PayrollAnalyticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Prepare chart data
  const payrollDistributionData = stats?.byInspector?.map(inspector => ({
    name: inspector.inspectorName.split(' ')[0], // First name only for chart
    totalPay: inspector.totalPay,
    overtimePay: inspector.overtimePay,
    basePay: inspector.totalPay - inspector.overtimePay - inspector.bonuses + inspector.deductions,
    bonuses: inspector.bonuses,
    deductions: inspector.deductions
  })) || []

  const payrollBreakdownData = [
    { name: 'Base Salary', value: stats?.totalPayroll ? stats.totalPayroll - (stats.totalOvertimePay || 0) - (stats.totalBonuses || 0) + (stats.totalDeductions || 0) : 0, color: '#3b82f6' },
    { name: 'Overtime Pay', value: stats?.totalOvertimePay || 0, color: '#f59e0b' },
    { name: 'Bonuses', value: stats?.totalBonuses || 0, color: '#10b981' },
    { name: 'Deductions', value: -(stats?.totalDeductions || 0), color: '#ef4444' }
  ]

  // Mock trend data - in real app, this would come from historical data
  const trendData = [
    { month: 'Jan', totalPayroll: 180000, overtimePay: 25000, avgSalary: 7500 },
    { month: 'Feb', totalPayroll: 185000, overtimePay: 28000, avgSalary: 7700 },
    { month: 'Mar', totalPayroll: 192000, overtimePay: 32000, avgSalary: 8000 },
    { month: 'Apr', totalPayroll: 188000, overtimePay: 29000, avgSalary: 7850 },
    { month: 'May', totalPayroll: 195000, overtimePay: 35000, avgSalary: 8125 },
    { month: 'Jun', totalPayroll: stats?.totalPayroll || 200000, overtimePay: stats?.totalOvertimePay || 38000, avgSalary: stats?.averageSalary || 8333 }
  ]

  const totalInspectors = stats?.byInspector?.length || 0
  const paymentCompletionRate = totalInspectors > 0 ? ((stats?.paidPayments || 0) / totalInspectors) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Payroll Growth</span>
            </div>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Overtime Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.totalPayroll ? ((stats.totalOvertimePay || 0) / stats.totalPayroll * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">of total payroll</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Bonus Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.totalPayroll ? ((stats.totalBonuses || 0) / stats.totalPayroll * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">of total payroll</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Payment Status</span>
            </div>
            <div className="text-2xl font-bold">{paymentCompletionRate.toFixed(0)}%</div>
            <Progress value={paymentCompletionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Distribution by Inspector */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Distribution by Inspector</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={payrollDistributionData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(value),
                    ''
                  ]}
                />
                <Bar dataKey="basePay" stackId="a" fill="#3b82f6" name="Base Pay" />
                <Bar dataKey="overtimePay" stackId="a" fill="#f59e0b" name="Overtime" />
                <Bar dataKey="bonuses" stackId="a" fill="#10b981" name="Bonuses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payroll Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={payrollBreakdownData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {payrollBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(Math.abs(value)),
                    ''
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payroll Trends */}
        <Card>
          <CardHeader>
            <CardTitle>6-Month Payroll Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(value),
                    ''
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalPayroll" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Total Payroll"
                />
                <Area 
                  type="monotone" 
                  dataKey="overtimePay" 
                  stackId="2"
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.6}
                  name="Overtime Pay"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Salary Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Average Salary Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [
                    new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(value),
                    'Average Salary'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgSalary" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Earners This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.byInspector
              ?.sort((a, b) => b.totalPay - a.totalPay)
              ?.slice(0, 5)
              ?.map((inspector, index) => (
                <div key={inspector.inspectorId} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="w-8 h-8 p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  
                  <div className="flex-1">
                    <p className="font-medium">{inspector.inspectorName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Base: {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(inspector.totalPay - inspector.overtimePay - inspector.bonuses + inspector.deductions)}</span>
                      {inspector.overtimePay > 0 && (
                        <span>OT: {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(inspector.overtimePay)}</span>
                      )}
                      {inspector.bonuses > 0 && (
                        <span>Bonus: {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(inspector.bonuses)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(inspector.totalPay)}
                    </p>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">+5.2%</span>
                    </div>
                  </div>
                </div>
              )) || (
              <div className="text-center py-8 text-muted-foreground">
                No payroll data available for analysis
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Download,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react'
import { PayrollStatsCards } from './payroll-stats-cards'
import { PayrollCalendar } from './payroll-calendar'
import { PayrollReports } from './payroll-reports'
import { PayrollAnalytics } from './payroll-analytics'
import { usePayroll } from '@/hooks/admin/use-payroll'

interface PayrollDashboardProps {
  className?: string
}

export function PayrollDashboard({ className }: PayrollDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const {
    payrollStats,
    isLoadingStats,
    error
  } = usePayroll({
    month: selectedMonth,
    year: selectedYear
  })

  if (error) {
    return (
      <Card className="w-full">
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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage inspector payroll, generate reports, and track compensation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <PayrollStatsCards 
        stats={payrollStats}
        loading={isLoadingStats}
        month={selectedMonth}
        year={selectedYear}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payroll Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Monthly Payroll Generated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Overtime Calculations</p>
                      <p className="text-sm text-muted-foreground">
                        Updated for {payrollStats?.byInspector?.length || 0} inspectors
                      </p>
                    </div>
                    <Badge variant="outline">In Progress</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Payment Processing</p>
                      <p className="text-sm text-muted-foreground">
                        {payrollStats?.pendingPayments || 0} pending payments
                      </p>
                    </div>
                    <Badge variant="destructive">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Bulk Generate</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">Export Reports</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-sm">Payment Status</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm">View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <PayrollCalendar 
            month={selectedMonth}
            year={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </TabsContent>

        <TabsContent value="reports">
          <PayrollReports 
            month={selectedMonth}
            year={selectedYear}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <PayrollAnalytics 
            stats={payrollStats}
            loading={isLoadingStats}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
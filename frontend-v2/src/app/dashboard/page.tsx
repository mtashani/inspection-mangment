'use client';

import { useAuth } from '@/contexts/auth-context';
import { useDashboardData } from '@/hooks/use-dashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  BarChart3,
  Users,
  Wrench,
  FileText,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, error } = useDashboardData();

  if (error) {
    console.error('Dashboard data error:', error);
  }

  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Inspection Management', href: '/dashboard' },
        { label: 'Dashboard', current: true }
      ]}
    >
          {/* Welcome Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome back, {user?.name}
                </h1>
                <p className="text-muted-foreground">
                  Here&apos;s what&apos;s happening with your inspection
                  management system today.
                </p>
              </div>
              {isLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Equipment
                </CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {dashboardData?.stats.totalEquipment.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.stats.equipmentGrowth}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Inspections
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-28" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {dashboardData?.stats.activeInspections}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.stats.inspectionsGrowth}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Inspectors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-12 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {dashboardData?.stats.inspectors}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.stats.inspectorsChange}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Reports
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-12 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {dashboardData?.stats.pendingReports}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData?.stats.reportsChange}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Inspections</CardTitle>
                <CardDescription>
                  Latest inspection activities and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading
                    ? // Loading skeletons
                      Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                          <div className="text-right space-y-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      ))
                    : dashboardData?.recentInspections.map(inspection => (
                        <div
                          key={inspection.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{inspection.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {inspection.equipment}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                inspection.status === 'Completed'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : inspection.status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                    : inspection.status === 'Scheduled'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              }`}
                            >
                              {inspection.status}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {inspection.date}
                            </p>
                          </div>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Key metrics and system health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    // Loading skeletons
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm">System Performance</span>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {
                            dashboardData?.systemMetrics.find(
                              m => m.name === 'System Performance'
                            )?.value
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">Overdue Inspections</span>
                        </div>
                        <span className="text-sm font-medium text-yellow-600">
                          {
                            dashboardData?.systemMetrics.find(
                              m => m.name === 'Overdue Inspections'
                            )?.value
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">Active Inspectors</span>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {
                            dashboardData?.systemMetrics.find(
                              m => m.name === 'Active Inspectors'
                            )?.value
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">Reports Generated</span>
                        </div>
                        <span className="text-sm font-medium text-purple-600">
                          {
                            dashboardData?.systemMetrics.find(
                              m => m.name === 'Reports Generated'
                            )?.value
                          }
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
      </DashboardLayout>
  );
}

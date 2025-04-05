'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import {
  PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { fetchCraneDashboardData } from '@/api/cranes';
import type { DashboardData, CraneTypeCount, CraneStatusCount, UpcomingInspection, ReducedCapacityCrane } from '@/api/cranes';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS = {
  'Active': '#00C49F',
  'UnderMaintenance': '#FFBB28',
  'Decommissioned': '#FF8042'
};

export default function CraneDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchCraneDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Crane Management Dashboard</h1>
        <div>
          <Button variant="outline" className="mr-2" asChild>
            <Link href="/cranes">View All Cranes</Link>
          </Button>
          <Button asChild>
            <Link href="/cranes/new">Add New Crane</Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Summary Cards */}
            <SummaryCard 
              title="Total Cranes" 
              value={dashboardData.totalCranes || 0} 
              description={`Active: ${dashboardData.activeCount || 0}`}
            />
            <SummaryCard 
              title="Pending Inspections" 
              value={dashboardData.upcomingInspectionsCount || 0}
              description="Due in next 30 days" 
              status={dashboardData.upcomingInspectionsCount > 0 ? 'warning' : 'success'}
            />
            <SummaryCard 
              title="Overdue Inspections" 
              value={dashboardData.overdueInspectionsCount || 0}
              description="Requires immediate attention"
              status={dashboardData.overdueInspectionsCount > 0 ? 'danger' : 'success'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
            {/* Distribution by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Cranes by Type</CardTitle>
                <CardDescription>Distribution of cranes by type</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.cranesByType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="type"
                      label={({ type, count }) => `${type}: ${count}`}
                    >
                      {(dashboardData.cranesByType || []).map((entry: CraneTypeCount, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribution by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Cranes by Status</CardTitle>
                <CardDescription>Distribution of cranes by operational status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.cranesByStatus || []}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="status" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Number of Cranes"
                    >
                      {(dashboardData.cranesByStatus || []).map((entry: CraneStatusCount) => (
                        <Cell 
                          key={`cell-${entry.status}`} 
                          fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#8884d8'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Inspections</CardTitle>
              <CardDescription>Cranes due for inspection in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Tag Number</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Location</th>
                      <th className="text-left py-3 px-4">Due Date</th>
                      <th className="text-left py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.upcomingInspections && dashboardData.upcomingInspections.length > 0 ? (
                      dashboardData.upcomingInspections.map((inspection: UpcomingInspection) => (
                        <tr key={inspection.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{inspection.tagNumber}</td>
                          <td className="py-3 px-4">{inspection.type}</td>
                          <td className="py-3 px-4">{inspection.location}</td>
                          <td className="py-3 px-4">
                            {new Date(inspection.nextInspectionDate).toLocaleDateString()}
                            {isWithinSevenDays(new Date(inspection.nextInspectionDate)) && (
                              <Badge variant="destructive" className="ml-2">Soon</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/cranes/${inspection.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">
                          No upcoming inspections scheduled for the next 30 days
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inspection Timeline</CardTitle>
              <CardDescription>Distribution of inspections over the next 3 months</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dashboardData.inspectionTimeline || []}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Number of Inspections"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SummaryCard 
              title="Reduced Capacity Cranes" 
              value={dashboardData.reducedCapacityCount || 0}
              description="Operating below nominal capacity"
              status={dashboardData.reducedCapacityCount > 0 ? 'warning' : 'success'}
            />
            
            <SummaryCard 
              title="Nominal Capacity Cranes" 
              value={(dashboardData.totalCranes || 0) - (dashboardData.reducedCapacityCount || 0)}
              description="Operating at full capacity"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Capacity Reduction Overview</CardTitle>
              <CardDescription>Cranes operating below nominal capacity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Tag Number</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Nominal Capacity</th>
                      <th className="text-left py-3 px-4">Current Allowed</th>
                      <th className="text-left py-3 px-4">Reduction %</th>
                      <th className="text-left py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.reducedCapacityCranes && dashboardData.reducedCapacityCranes.length > 0 ? (
                      dashboardData.reducedCapacityCranes.map((crane: ReducedCapacityCrane) => {
                        const reductionPercent = ((crane.nominalCapacity - crane.currentAllowedCapacity) / crane.nominalCapacity * 100).toFixed(1);
                        return (
                          <tr key={crane.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{crane.tagNumber}</td>
                            <td className="py-3 px-4">{crane.type}</td>
                            <td className="py-3 px-4">{crane.nominalCapacity} ton</td>
                            <td className="py-3 px-4">{crane.currentAllowedCapacity} ton</td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                Number(reductionPercent) > 20 ? 'destructive' :
                                Number(reductionPercent) > 10 ? 'secondary' :
                                'outline'
                              }>
                                {reductionPercent}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/cranes/${crane.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-500">
                          All cranes are operating at nominal capacity
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ title, value, description, status }: { 
  title: string; 
  value: number | string; 
  description?: string;
  status?: 'success' | 'warning' | 'danger';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {status === 'success' && <CheckCircledIcon className="h-4 w-4 text-green-500" />}
        {status === 'warning' && <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />}
        {status === 'danger' && <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex">
          <Skeleton className="h-10 w-32 mr-2" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </div>
  );
}

function isWithinSevenDays(date: Date) {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);
  return date <= sevenDaysFromNow && date >= now;
}
'use client';

import { useEffect, useState } from "react";
import { fetchSystemStatistics } from "@/api/corrosion-summary";
import { fetchUpcomingRemovals, fetchRecentAnalyses, fetchLocationSummary } from "@/api/corrosion-summary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle, Calendar, LineChart, Beaker } from "lucide-react";
import { CorrosionSummary, CorrosionCoupon } from "@/components/corrosion/types";
import { RecentAnalysis, LocationSummary } from "@/api/corrosion-summary";
import Link from "next/link";

export function CorrosionDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CorrosionSummary | null>(null);
  const [upcomingRemovals, setUpcomingRemovals] = useState<CorrosionCoupon[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [locationSummary, setLocationSummary] = useState<LocationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [statsData, removalsData, analysesData, locationsData] = await Promise.all([
          fetchSystemStatistics(),
          fetchUpcomingRemovals(),
          fetchRecentAnalyses(5),
          fetchLocationSummary()
        ]);
        
        setStats(statsData);
        setUpcomingRemovals(removalsData);
        setRecentAnalyses(analysesData);
        setLocationSummary(locationsData);
        
        setError(null);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  // Function to get color for severity level
  const getSeverityColor = (level: number): string => {
    switch (level) {
      case 1: return "bg-green-100 text-green-800";
      case 2: return "bg-blue-100 text-blue-800";
      case 3: return "bg-yellow-100 text-yellow-800";
      case 4: return "bg-orange-100 text-orange-800";
      case 5: return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading corrosion dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Corrosion Monitoring Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/corrosion/settings">Settings</Link>
          </Button>
          <Button asChild>
            <Link href="/corrosion/coupons/new">Install New Coupon</Link>
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Installed Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.installed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.upcomingRemovals} due for removal in next 30 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Removed Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.removed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting analysis
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Analyzed Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.analyzed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                With corrosion data
              </p>
            </CardContent>
          </Card>
          
          <Card className={stats.overdue > 0 ? "border-red-300" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {stats.overdue > 0 ? (
                  <span className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                    Overdue Removals
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    Overdue Removals
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.overdue > 0 ? "text-red-600" : ""}`}>
                {stats.overdue}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overdue > 0 ? "Require immediate attention" : "No overdue coupons"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Removals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Coupon Removals
          </CardTitle>
          <CardDescription>Coupons scheduled for removal in the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingRemovals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming removals scheduled for the next 30 days</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Coupon ID</th>
                    <th className="text-left py-2 font-medium">Location</th>
                    <th className="text-left py-2 font-medium">Material</th>
                    <th className="text-left py-2 font-medium">Scheduled Removal</th>
                    <th className="text-left py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRemovals.map((coupon) => (
                    <tr key={coupon.coupon_id} className="border-b">
                      <td className="py-2">{coupon.coupon_id}</td>
                      <td className="py-2">{coupon.location_id}</td>
                      <td className="py-2">{coupon.material_type}</td>
                      <td className="py-2">{new Date(coupon.scheduled_removal_date).toLocaleDateString()}</td>
                      <td className="py-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/corrosion/coupons/${coupon.coupon_id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Beaker className="h-5 w-5 mr-2" />
            Recent Analysis Results
          </CardTitle>
          <CardDescription>Most recent corrosion analysis reports</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No analysis reports available</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-left py-2 font-medium">Coupon ID</th>
                    <th className="text-left py-2 font-medium">Material</th>
                    <th className="text-left py-2 font-medium">Rate (mm/yr)</th>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Severity</th>
                    <th className="text-left py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAnalyses.map((analysis) => (
                    <tr key={analysis.report_id} className="border-b">
                      <td className="py-2">{new Date(analysis.analysis_date).toLocaleDateString()}</td>
                      <td className="py-2">{analysis.coupon_id}</td>
                      <td className="py-2">{analysis.material_type}</td>
                      <td className="py-2">{analysis.corrosion_rate.toFixed(3)}</td>
                      <td className="py-2">{analysis.corrosion_type}</td>
                      <td className="py-2">
                        <Badge 
                          variant="outline" 
                          className={getSeverityColor(analysis.calculated_severity)}
                        >
                          Level {analysis.calculated_severity}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/corrosion/analysis/${analysis.report_id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <LineChart className="h-5 w-5 mr-2" />
            Location Summary
          </CardTitle>
          <CardDescription>Corrosion monitoring by location</CardDescription>
        </CardHeader>
        <CardContent>
          {locationSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">No locations configured</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Location</th>
                    <th className="text-left py-2 font-medium">System</th>
                    <th className="text-left py-2 font-medium">Risk</th>
                    <th className="text-left py-2 font-medium">Installed</th>
                    <th className="text-left py-2 font-medium">Analyzed</th>
                    <th className="text-left py-2 font-medium">Avg Rate</th>
                    <th className="text-left py-2 font-medium">Max Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {locationSummary.map((location) => (
                    <tr key={location.location_id} className="border-b">
                      <td className="py-2">{location.name}</td>
                      <td className="py-2">{location.system}</td>
                      <td className="py-2">
                        <Badge 
                          variant="outline" 
                          className={
                            location.risk_category === 'high_risk' ? 'bg-red-100 text-red-800' :
                            location.risk_category === 'medium_risk' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }
                        >
                          {location.risk_category === 'high_risk' ? 'High' :
                           location.risk_category === 'medium_risk' ? 'Medium' : 'Low'}
                        </Badge>
                      </td>
                      <td className="py-2">{location.installed_coupons}</td>
                      <td className="py-2">{location.analyzed_coupons}</td>
                      <td className="py-2">
                        {location.average_corrosion_rate > 0 
                          ? location.average_corrosion_rate.toFixed(3) 
                          : 'N/A'}
                      </td>
                      <td className="py-2">
                        {location.max_severity > 0 ? (
                          <Badge 
                            variant="outline" 
                            className={getSeverityColor(location.max_severity)}
                          >
                            Level {location.max_severity}
                          </Badge>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCouponById } from "@/api/corrosion-coupon";
import { CorrosionCoupon, CorrosionAnalysisReport } from "@/components/corrosion/types";
import { fetchAnalysisReports } from "@/api/corrosion-analysis";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Clock, Calendar, Thermometer, Gauge, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CouponDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [coupon, setCoupon] = useState<CorrosionCoupon | null>(null);
  const [analyses, setAnalyses] = useState<CorrosionAnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCouponDetails() {
      try {
        setLoading(true);
        const couponData = await fetchCouponById(params.id);
        setCoupon(couponData);
        
        // If the coupon has been analyzed, load analysis reports
        if (couponData.status === "Analyzed" || couponData.status === "Removed") {
          const analysisData = await fetchAnalysisReports({ couponId: params.id });
          setAnalyses(analysisData);
        }
        
        setError(null);
      } catch (err) {
        console.error("Failed to load coupon details:", err);
        setError("Failed to load coupon details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    loadCouponDetails();
  }, [params.id]);

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Installed":
        return <Badge className="bg-green-100 text-green-800">Installed</Badge>;
      case "Removed":
        return <Badge className="bg-yellow-100 text-yellow-800">Removed</Badge>;
      case "Analyzed":
        return <Badge className="bg-blue-100 text-blue-800">Analyzed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading coupon details...</p>
        </div>
      </div>
    );
  }

  if (error || !coupon) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error || "Coupon not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          {coupon.status === "Installed" && (
            <Button variant="destructive" asChild>
              <Link href={`/corrosion/coupons/${coupon.coupon_id}/remove`}>Remove Coupon</Link>
            </Button>
          )}
          
          {coupon.status === "Removed" && (
            <Button asChild>
              <Link href={`/corrosion/analysis/new?coupon=${coupon.coupon_id}`}>Analyze Coupon</Link>
            </Button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main coupon information */}
          <Card className="flex-1">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{coupon.coupon_id}</CardTitle>
                  <CardDescription>
                    {coupon.location?.name || coupon.location_id}
                  </CardDescription>
                </div>
                {getStatusBadge(coupon.status)}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="conditions">Conditions</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Type</p>
                      <p>{coupon.coupon_type}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Material</p>
                      <p>{coupon.material_type}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Surface Area</p>
                      <p>{coupon.surface_area} cm²</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Initial Weight</p>
                      <p>{coupon.initial_weight} g</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Dimensions</p>
                      <p>{coupon.dimensions}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Orientation</p>
                      <p>{coupon.orientation}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Monitoring Level</p>
                      <p>Level {coupon.monitoring_level}</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="conditions" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">System Type</p>
                      <p>{coupon.system_type}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Fluid Velocity</p>
                      <p>{coupon.fluid_velocity ? `${coupon.fluid_velocity} m/s` : 'N/A'}</p>
                    </div>
                    <div className="space-y-1 flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Temperature</p>
                        <p>{coupon.temperature} °C</p>
                      </div>
                    </div>
                    <div className="space-y-1 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Pressure</p>
                        <p>{coupon.pressure} Bar</p>
                      </div>
                    </div>
                    {coupon.notes && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-sm font-medium">Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{coupon.notes}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="timeline" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Installation Date</p>
                        <p>{new Date(coupon.installation_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Scheduled Removal Date</p>
                        <p>{new Date(coupon.scheduled_removal_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {coupon.actual_removal_date && (
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Actual Removal Date</p>
                          <p>{new Date(coupon.actual_removal_date).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {
                              new Date(coupon.actual_removal_date) > new Date(coupon.scheduled_removal_date) 
                                ? `${Math.round((new Date(coupon.actual_removal_date).getTime() - new Date(coupon.scheduled_removal_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue` 
                                : 'On schedule'
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {analyses.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Analysis Date</p>
                          <p>{new Date(analyses[0].analysis_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Analysis summary if available */}
          {analyses.length > 0 && (
            <Card className="lg:w-1/3">
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  Analysis performed on {new Date(analyses[0].analysis_date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Corrosion Rate</p>
                    <p className="font-semibold">{analyses[0].corrosion_rate.toFixed(4)} mm/year</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Corrosion Type</p>
                    <p>{analyses[0].corrosion_type}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Weight Loss</p>
                    <p>{analyses[0].weight_loss.toFixed(4)} g</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Exposure Period</p>
                    <p>{analyses[0].exposure_days} days</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Severity</p>
                    <Badge 
                      className={
                        analyses[0].calculated_severity === 1 ? "bg-green-100 text-green-800" :
                        analyses[0].calculated_severity === 2 ? "bg-blue-100 text-blue-800" :
                        analyses[0].calculated_severity === 3 ? "bg-yellow-100 text-yellow-800" :
                        analyses[0].calculated_severity === 4 ? "bg-orange-100 text-orange-800" :
                        "bg-red-100 text-red-800"
                      }
                    >
                      Level {analyses[0].calculated_severity}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/corrosion/analysis/${analyses[0].report_id}`}>
                    View Full Analysis
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analysis history section */}
        {analyses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>
                View all analyses performed on this coupon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Corrosion Rate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Weight Loss</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Analyzed By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis) => (
                    <TableRow key={analysis.report_id}>
                      <TableCell>
                        {new Date(analysis.analysis_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {analysis.corrosion_rate.toFixed(4)} mm/year
                      </TableCell>
                      <TableCell>{analysis.corrosion_type}</TableCell>
                      <TableCell>{analysis.weight_loss.toFixed(4)} g</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            analysis.calculated_severity === 1 ? "bg-green-100 text-green-800" :
                            analysis.calculated_severity === 2 ? "bg-blue-100 text-blue-800" :
                            analysis.calculated_severity === 3 ? "bg-yellow-100 text-yellow-800" :
                            analysis.calculated_severity === 4 ? "bg-orange-100 text-orange-800" :
                            "bg-red-100 text-red-800"
                          }
                        >
                          Level {analysis.calculated_severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{analysis.analyzed_by}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/corrosion/analysis/${analysis.report_id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
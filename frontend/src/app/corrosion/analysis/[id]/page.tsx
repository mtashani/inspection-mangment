'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAnalysisById } from "@/api/corrosion-analysis";
import { fetchCouponById } from "@/api/corrosion-coupon";
import { CorrosionAnalysisReport, CorrosionCoupon } from "@/components/corrosion/types";
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
import { 
  ArrowLeft, 
  Scale, 
  Clock, 
  FileText, 
  User, 
  Microscope,
  ImageIcon,
  ClipboardCheck
} from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function AnalysisDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<CorrosionAnalysisReport | null>(null);
  const [coupon, setCoupon] = useState<CorrosionCoupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalysisDetails() {
      try {
        setLoading(true);
        const analysisData = await fetchAnalysisById(parseInt(params.id));
        setAnalysis(analysisData);
        
        if (analysisData.coupon_id) {
          const couponData = await fetchCouponById(analysisData.coupon_id);
          setCoupon(couponData);
        }
        
        setError(null);
      } catch (err) {
        console.error("Failed to load analysis details:", err);
        setError("Failed to load analysis details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    loadAnalysisDetails();
  }, [params.id]);

  // Function to get severity badge style
  const getSeverityBadge = (level: number) => {
    switch (level) {
      case 1:
        return <Badge className="bg-green-100 text-green-800">Level 1 (Minimal)</Badge>;
      case 2:
        return <Badge className="bg-blue-100 text-blue-800">Level 2 (Low)</Badge>;
      case 3:
        return <Badge className="bg-yellow-100 text-yellow-800">Level 3 (Moderate)</Badge>;
      case 4:
        return <Badge className="bg-orange-100 text-orange-800">Level 4 (High)</Badge>;
      case 5:
        return <Badge className="bg-red-100 text-red-800">Level 5 (Severe)</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading analysis details...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="outline" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error || "Analysis report not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Analysis List
      </Button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main analysis information (takes 2/3 of screen on large displays) */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    Analysis Report #{analysis.report_id}
                  </CardTitle>
                  <CardDescription>
                    Analysis performed on {new Date(analysis.analysis_date).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div>Severity: {getSeverityBadge(analysis.calculated_severity)}</div>
                  {analysis.manual_override_severity && (
                    <div className="text-xs text-muted-foreground">
                      (Manual override: {getSeverityBadge(analysis.manual_override_severity)})
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="measurements">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="measurements">Measurements</TabsTrigger>
                  <TabsTrigger value="inspection">Inspection Notes</TabsTrigger>
                  <TabsTrigger value="personnel">Personnel</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>
                
                {/* Measurements Tab */}
                <TabsContent value="measurements" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <Scale className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Weight Measurements</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1">
                            <p className="text-sm text-muted-foreground">Initial Weight:</p>
                            <p className="text-sm">{coupon?.initial_weight} g</p>
                            <p className="text-sm text-muted-foreground">Final Weight:</p>
                            <p className="text-sm">{analysis.final_weight} g</p>
                            <p className="text-sm text-muted-foreground">Weight Loss:</p>
                            <p className="text-sm font-medium">{analysis.weight_loss} g</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Exposure Period</p>
                          <p className="text-sm">{analysis.exposure_days} days</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Corrosion Rate</p>
                        <p className="text-xl font-bold">{analysis.corrosion_rate.toFixed(4)} mm/year</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Corrosion Type</p>
                        <p>{analysis.corrosion_type}</p>
                      </div>
                      
                      {analysis.corrosion_type === "Pitting" && (
                        <>
                          <div>
                            <p className="text-sm font-medium">Pitting Density</p>
                            <p>{analysis.pitting_density} pits/cm²</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium">Maximum Pit Depth</p>
                            <p>{analysis.max_pit_depth} mm</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium mb-2">Severity Calculation Factors</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Rate Factor</p>
                        <p className="font-medium">{analysis.calculation_factors.rate_factor}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Type Factor</p>
                        <p className="font-medium">{analysis.calculation_factors.type_factor}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Pitting Factor</p>
                        <p className="font-medium">{analysis.calculation_factors.pitting_factor}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Material Factor</p>
                        <p className="font-medium">{analysis.calculation_factors.material_factor}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-muted-foreground">Visual Factor</p>
                        <p className="font-medium">{analysis.calculation_factors.visual_factor}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Inspection Notes Tab */}
                <TabsContent value="inspection" className="mt-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Visual Inspection</h3>
                    </div>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                      {analysis.visual_inspection}
                    </p>
                  </div>
                  
                  {analysis.microscopic_analysis && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Microscope className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium">Microscopic Analysis</h3>
                      </div>
                      <p className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                        {analysis.microscopic_analysis}
                      </p>
                    </div>
                  )}
                  
                  {analysis.images && analysis.images.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium">Images ({analysis.images.length})</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {analysis.images.map((image, index) => (
                          <div key={index} className="border rounded-md overflow-hidden">
                            <img 
                              src={image} 
                              alt={`Corrosion analysis image ${index + 1}`}
                              className="w-full h-auto object-cover aspect-square"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* Personnel Tab */}
                <TabsContent value="personnel" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Cleaned By</h3>
                    </div>
                    <p>{analysis.cleaned_by}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Analyzed By</h3>
                    </div>
                    <p>{analysis.analyzed_by}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Approved By</h3>
                    </div>
                    <p>{analysis.approved_by}</p>
                  </div>
                </TabsContent>
                
                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">Recommendations</h3>
                  </div>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                    {analysis.recommendations}
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Coupon Information (takes 1/3 of screen on large displays) */}
        {coupon && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coupon Details</CardTitle>
                <CardDescription>
                  Information about the analyzed coupon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Coupon ID</p>
                  <p className="font-semibold">{coupon.coupon_id}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p>{coupon.location?.name || coupon.location_id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-sm font-medium">Material</p>
                    <p>{coupon.material_type}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p>{coupon.coupon_type}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Surface Area</p>
                    <p>{coupon.surface_area} cm²</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Orientation</p>
                    <p>{coupon.orientation}</p>
                  </div>
                </div>
                
                <div className="border-t pt-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium">Installation Date</p>
                    <p>{new Date(coupon.installation_date).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Removal Date</p>
                    <p>
                      {coupon.actual_removal_date 
                        ? new Date(coupon.actual_removal_date).toLocaleDateString()
                        : "Not removed"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">System Type</p>
                    <p>{coupon.system_type}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Temperature</p>
                      <p>{coupon.temperature} °C</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Pressure</p>
                      <p>{coupon.pressure} Bar</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/corrosion/coupons/${coupon.coupon_id}`}>
                      View Full Coupon Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
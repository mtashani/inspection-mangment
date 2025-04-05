'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCoupons } from "@/api/corrosion-coupon";
import { createAnalysisReport, calculateSeverity } from "@/api/corrosion-analysis";
import { CorrosionCoupon, CorrosionType, AnalysisFormData } from "@/components/corrosion/types";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Loader2, CalendarIcon } from "lucide-react";
import Link from "next/link";

// Form schema validation
const formSchema = z.object({
  coupon_id: z.string().min(1, "Coupon ID is required"),
  analysis_date: z.date(),
  final_weight: z.number().min(0, "Weight must be positive"),
  corrosion_type: z.enum(["Uniform", "Pitting", "Crevice", "Galvanic", "MIC", "Erosion", "Other"]),
  pitting_density: z.number().optional(),
  max_pit_depth: z.number().optional(),
  visual_inspection: z.string().min(1, "Visual inspection notes are required"),
  microscopic_analysis: z.string().optional(),
  cleaned_by: z.string().min(1, "Name of person who cleaned the coupon is required"),
  analyzed_by: z.string().min(1, "Name of analyst is required"),
  approved_by: z.string().min(1, "Name of approver is required"),
  recommendations: z.string().min(1, "Recommendations are required"),
  exposure_days: z.number().int().min(1, "Exposure days must be at least 1"),
  corrosion_rate: z.number(),
  images: z.array(z.string()).default([]),
  manual_override_severity: z.number().int().min(1).max(5).optional(),
});

export default function NewAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<CorrosionCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CorrosionCoupon | null>(null);
  const [calculatedSeverity, setCalculatedSeverity] = useState<number | null>(null);

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coupon_id: searchParams?.get("coupon") || "",
      analysis_date: new Date(),
      final_weight: 0,
      corrosion_type: "Uniform" as CorrosionType,
      visual_inspection: "",
      cleaned_by: "",
      analyzed_by: "",
      approved_by: "",
      recommendations: "",
      exposure_days: 0,
      corrosion_rate: 0,
      images: [],
    },
  });

  const watchCouponId = form.watch('coupon_id');
  const watchFinalWeight = form.watch('final_weight');
  const watchCorrosionType = form.watch('corrosion_type');
  const watchPittingDensity = form.watch('pitting_density');
  const watchMaxPitDepth = form.watch('max_pit_depth');

  // Load available coupons (in Removed status)
  useEffect(() => {
    async function loadCoupons() {
      try {
        setLoading(true);
        const allCoupons = await fetchCoupons();
        // Filter to only show removed coupons
        const removedCoupons = allCoupons.filter(c => c.status === "Removed");
        setAvailableCoupons(removedCoupons);
        
        // Pre-select coupon if specified in URL
        const couponId = searchParams?.get("coupon");
        if (couponId) {
          const selectedCoupon = removedCoupons.find(c => c.coupon_id === couponId);
          if (selectedCoupon) {
            setSelectedCoupon(selectedCoupon);
            
            // Calculate exposure days
            if (selectedCoupon.actual_removal_date && selectedCoupon.installation_date) {
              const installDate = new Date(selectedCoupon.installation_date);
              const removalDate = new Date(selectedCoupon.actual_removal_date);
              const days = Math.round((removalDate.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24));
              
              form.setValue('exposure_days', days);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load coupons:", err);
        toast({
          title: "Error",
          description: "Failed to load available coupons.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadCoupons();
  }, [searchParams, form, toast]);

  // Update selected coupon when coupon_id changes
  useEffect(() => {
    const coupon = availableCoupons.find(c => c.coupon_id === watchCouponId);
    setSelectedCoupon(coupon || null);
    
    if (coupon && coupon.actual_removal_date && coupon.installation_date) {
      // Update exposure days
      const installDate = new Date(coupon.installation_date);
      const removalDate = new Date(coupon.actual_removal_date);
      const days = Math.round((removalDate.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24));
      
      form.setValue('exposure_days', days);
    }
  }, [watchCouponId, availableCoupons, form]);

  // Calculate corrosion rate when relevant values change
  useEffect(() => {
    if (selectedCoupon && watchFinalWeight > 0 && form.getValues('exposure_days') > 0) {
      // Weight loss calculation
      const weightLoss = selectedCoupon.initial_weight - watchFinalWeight;
      
      if (weightLoss <= 0) {
        form.setError('final_weight', { 
          type: 'manual', 
          message: 'Final weight must be less than initial weight' 
        });
        return;
      } else {
        form.clearErrors('final_weight');
      }
      
      // Corrosion rate calculation (based on NACE standard formula)
      // Rate (mm/y) = (Weight loss in g × 365 × 10) / (Area in cm² × Density in g/cm³ × Days exposed)
      // Using 7.85 g/cm³ as the approximate density for carbon steel
      const density = 7.85; // g/cm³ (approximation)
      const exposureDays = form.getValues('exposure_days');
      const area = selectedCoupon.surface_area;
      
      const corrosionRate = (weightLoss * 365 * 10) / (area * density * exposureDays);
      form.setValue('corrosion_rate', parseFloat(corrosionRate.toFixed(4)));
    }
  }, [selectedCoupon, watchFinalWeight, form]);

  // Calculate severity when corrosion parameters change
  useEffect(() => {
    async function predictSeverity() {
      if (!selectedCoupon || form.getValues('corrosion_rate') <= 0) {
        return;
      }
      
      try {
        const data = {
          coupon_id: selectedCoupon.coupon_id,
          corrosion_rate: form.getValues('corrosion_rate'),
          corrosion_type: watchCorrosionType,
          pitting_density: watchPittingDensity,
          max_pit_depth: watchMaxPitDepth,
          visual_inspection: form.getValues('visual_inspection'),
          microscopic_analysis: form.getValues('microscopic_analysis')
        };
        
        const result = await calculateSeverity(data);
        setCalculatedSeverity(result.calculated_severity);
      } catch (err) {
        console.error("Failed to calculate severity:", err);
      }
    }
    
    // Only run if we have enough data
    if (form.getValues('corrosion_rate') > 0 && watchCorrosionType) {
      predictSeverity();
    }
  }, [selectedCoupon, watchCorrosionType, watchPittingDensity, watchMaxPitDepth, form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!selectedCoupon) {
      toast({
        title: "Error",
        description: "No coupon selected.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const analysisData: AnalysisFormData = {
        ...data
      };
      
      await createAnalysisReport(analysisData);
      
      toast({
        title: "Success",
        description: "Analysis report has been created successfully.",
      });
      
      router.push(`/corrosion/analysis`);
    } catch (err) {
      console.error("Failed to create analysis report:", err);
      toast({
        title: "Error",
        description: "Failed to create analysis report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get severity badge color
  const getSeverityColor = (level: number) => {
    switch (level) {
      case 1: return "text-green-600";
      case 2: return "text-blue-600";
      case 3: return "text-yellow-600";
      case 4: return "text-orange-600";
      case 5: return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Button variant="outline" className="mb-6" asChild>
        <Link href="/corrosion/analysis">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Analysis List
        </Link>
      </Button>
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>New Corrosion Analysis</CardTitle>
            <CardDescription>
              Create a new analysis report for a removed corrosion coupon
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {/* Coupon Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Coupon Selection</h3>
                    {selectedCoupon && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        className="text-xs"
                      >
                        <Link href={`/corrosion/coupons/${selectedCoupon.coupon_id}`}>
                          View Coupon Details
                        </Link>
                      </Button>
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="coupon_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              {loading ? (
                                <div className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  <span>Loading coupons...</span>
                                </div>
                              ) : (
                                <SelectValue placeholder="Select a coupon" />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCoupons.map((coupon) => (
                              <SelectItem key={coupon.coupon_id} value={coupon.coupon_id}>
                                {coupon.coupon_id} - {coupon.material_type} ({coupon.location_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedCoupon && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Material</p>
                        <p className="text-sm">{selectedCoupon.material_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Initial Weight</p>
                        <p className="text-sm">{selectedCoupon.initial_weight} g</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Installation Date</p>
                        <p className="text-sm">{new Date(selectedCoupon.installation_date).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Removal Date</p>
                        <p className="text-sm">
                          {selectedCoupon.actual_removal_date 
                            ? new Date(selectedCoupon.actual_removal_date).toLocaleDateString()
                            : "Not removed"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Surface Area</p>
                        <p className="text-sm">{selectedCoupon.surface_area} cm²</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Exposure Period</p>
                        <p className="text-sm">{form.getValues('exposure_days')} days</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Analysis Details */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium">Analysis Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="analysis_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Analysis Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="final_weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Final Weight (g)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0001"
                              placeholder="Enter final weight"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              disabled={!selectedCoupon}
                            />
                          </FormControl>
                          <FormDescription>
                            {selectedCoupon && (
                              <>
                                Weight loss: {(selectedCoupon.initial_weight - (field.value || 0)).toFixed(4)} g
                              </>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="corrosion_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Corrosion Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select corrosion type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Uniform">Uniform</SelectItem>
                              <SelectItem value="Pitting">Pitting</SelectItem>
                              <SelectItem value="Crevice">Crevice</SelectItem>
                              <SelectItem value="Galvanic">Galvanic</SelectItem>
                              <SelectItem value="MIC">Microbiologically Influenced (MIC)</SelectItem>
                              <SelectItem value="Erosion">Erosion</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="corrosion_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Corrosion Rate (mm/year)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.0001" 
                              placeholder="Calculated rate" 
                              {...field} 
                              disabled 
                            />
                          </FormControl>
                          <FormDescription>
                            Automatically calculated from weight loss
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pitting Information (only if corrosion type is pitting) */}
                  {watchCorrosionType === "Pitting" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pitting_density"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pitting Density (pits/cm²)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter pitting density"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max_pit_depth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Pit Depth (mm)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter maximum pit depth"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="visual_inspection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visual Inspection</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the visual appearance of the coupon"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="microscopic_analysis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Microscopic Analysis (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any microscopic analysis findings"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Personnel Information */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium">Personnel Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cleaned_by"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cleaned By</FormLabel>
                          <FormControl>
                            <Input placeholder="Name of technician" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="analyzed_by"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Analyzed By</FormLabel>
                          <FormControl>
                            <Input placeholder="Name of analyst" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="approved_by"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approved By</FormLabel>
                          <FormControl>
                            <Input placeholder="Name of approver" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Recommendations and Severity */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Recommendations & Severity</h3>
                    
                    {calculatedSeverity !== null && (
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">Calculated Severity:</span>
                        <span className={`font-bold text-lg ${getSeverityColor(calculatedSeverity)}`}>
                          Level {calculatedSeverity}
                        </span>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="recommendations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recommendations</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter recommendations based on findings"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manual_override_severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Override Severity (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Use calculated severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Use calculated severity</SelectItem>
                            <SelectItem value="1">Level 1 (Minimal)</SelectItem>
                            <SelectItem value="2">Level 2 (Low)</SelectItem>
                            <SelectItem value="3">Level 3 (Moderate)</SelectItem>
                            <SelectItem value="4">Level 4 (High)</SelectItem>
                            <SelectItem value="5">Level 5 (Severe)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Only override if the calculated severity doesn&apos;t accurately reflect the findings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Image Upload (placeholder - actual implementation would require additional work) */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-medium">Images (Optional)</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <p className="text-sm text-gray-500">
                      Image upload functionality would be implemented here
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" asChild>
                  <Link href="/corrosion/analysis">Cancel</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !selectedCoupon || form.getValues('corrosion_rate') <= 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Create Analysis Report"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
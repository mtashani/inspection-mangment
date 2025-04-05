'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCoupon } from "@/api/corrosion-coupon";
import { fetchLocations } from "@/api/corrosion-location";
import { fetchSettings } from "@/api/corrosion-settings";
import { CouponFormData, CouponType, CouponOrientation, MonitoringLevel } from "@/components/corrosion/types";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { useEffect } from "react";

export default function NewCouponPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<{ location_id: string, name: string }[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  
  const [formData, setFormData] = useState<CouponFormData>({
    coupon_id: "",
    location_id: "",
    coupon_type: "Strip",
    material_type: "",
    surface_area: 0,
    initial_weight: 0,
    dimensions: "",
    installation_date: new Date(),
    scheduled_removal_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    orientation: "Parallel",
    system_type: "",
    fluid_velocity: undefined,
    temperature: 0,
    pressure: 0,
    notes: "",
    monitoring_level: 1
  });

  // Load locations when component mounts
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingLocations(true);
        // Load locations
        const locationsData = await fetchLocations();
        setLocations(locationsData.map(loc => ({ 
          location_id: loc.location_id, 
          name: loc.name 
        })));

        // Load settings to get default removal period
        const settings = await fetchSettings();
        if (settings && settings.inspection_frequency) {
          // Set default scheduled removal based on medium risk (can be adjusted by user)
          const mediumRiskDays = settings.inspection_frequency.medium_risk || 90;
          setFormData(prev => ({
            ...prev,
            scheduled_removal_date: new Date(Date.now() + mediumRiskDays * 24 * 60 * 60 * 1000)
          }));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load locations. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingLocations(false);
      }
    }

    loadData();
  }, [toast]);

  // Handle form field changes
  const handleChange = (
    field: keyof CouponFormData,
    value: string | number | Date | undefined
  ) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await createCoupon(formData);
      toast({
        title: "Success",
        description: "Coupon installed successfully",
      });
      router.push("/corrosion/coupons");
    } catch (error) {
      console.error("Failed to create coupon:", error);
      toast({
        title: "Error",
        description: "Failed to install coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Install New Corrosion Coupon</h1>
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the identification and basic details of the coupon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon_id">Coupon ID</Label>
                <Input
                  id="coupon_id"
                  placeholder="Enter a unique coupon ID"
                  value={formData.coupon_id}
                  onChange={(e) => handleChange("coupon_id", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => handleChange("location_id", value)}
                  disabled={loadingLocations}
                >
                  <SelectTrigger id="location">
                    {loadingLocations ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Loading...
                      </span>
                    ) : (
                      <SelectValue placeholder="Select a location" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.location_id} value={location.location_id}>
                        {location.name} ({location.location_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon_type">Coupon Type</Label>
                <Select
                  value={formData.coupon_type}
                  onValueChange={(value) => handleChange("coupon_type", value as CouponType)}
                >
                  <SelectTrigger id="coupon_type">
                    <SelectValue placeholder="Select coupon type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strip">Strip</SelectItem>
                    <SelectItem value="Rod">Rod</SelectItem>
                    <SelectItem value="Disc">Disc</SelectItem>
                    <SelectItem value="Cylinder">Cylinder</SelectItem>
                    <SelectItem value="Spiral">Spiral</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value) => handleChange("orientation", value as CouponOrientation)}
                >
                  <SelectTrigger id="orientation">
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flush">Flush</SelectItem>
                    <SelectItem value="Parallel">Parallel</SelectItem>
                    <SelectItem value="Perpendicular">Perpendicular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Material Properties</CardTitle>
            <CardDescription>Enter properties of the coupon material</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material_type">Material Type</Label>
                <Input
                  id="material_type"
                  placeholder="e.g. Carbon Steel, SS316"
                  value={formData.material_type}
                  onChange={(e) => handleChange("material_type", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surface_area">Surface Area (cm²)</Label>
                <Input
                  id="surface_area"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.surface_area}
                  onChange={(e) => handleChange("surface_area", parseFloat(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial_weight">Initial Weight (g)</Label>
                <Input
                  id="initial_weight"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.initial_weight}
                  onChange={(e) => handleChange("initial_weight", parseFloat(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  placeholder="e.g. 76mm x 13mm x 1.6mm"
                  value={formData.dimensions}
                  onChange={(e) => handleChange("dimensions", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Conditions</CardTitle>
            <CardDescription>Enter operating conditions of the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="system_type">System Type</Label>
                <Input
                  id="system_type"
                  placeholder="e.g. Cooling Water, Crude Oil"
                  value={formData.system_type}
                  onChange={(e) => handleChange("system_type", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fluid_velocity">Fluid Velocity (m/s)</Label>
                <Input
                  id="fluid_velocity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fluid_velocity || ""}
                  onChange={(e) => 
                    handleChange(
                      "fluid_velocity", 
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pressure">Pressure (Bar)</Label>
                <Input
                  id="pressure"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pressure}
                  onChange={(e) => handleChange("pressure", parseFloat(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monitoring_level">Monitoring Level</Label>
                <Select
                  value={formData.monitoring_level.toString()}
                  onValueChange={(value) => handleChange("monitoring_level", parseInt(value) as MonitoringLevel)}
                >
                  <SelectTrigger id="monitoring_level">
                    <SelectValue placeholder="Select monitoring level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Basic Monitoring</SelectItem>
                    <SelectItem value="2">Level 2 - Advanced Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Installation Information</CardTitle>
            <CardDescription>Enter installation date and scheduled removal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Installation Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.installation_date ? (
                        format(formData.installation_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.installation_date}
                      onSelect={(date) => handleChange("installation_date", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Scheduled Removal Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduled_removal_date ? (
                        format(formData.scheduled_removal_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduled_removal_date}
                      onSelect={(date) => handleChange("scheduled_removal_date", date || new Date())}
                      initialFocus
                      disabled={(date) => date < formData.installation_date}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Enter any additional notes or observations</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter any additional notes about the coupon installation..."
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Installing...
                </>
              ) : (
                "Install Coupon"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
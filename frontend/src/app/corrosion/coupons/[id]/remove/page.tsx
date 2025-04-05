'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCouponById, recordCouponRemoval } from "@/api/corrosion-coupon";
import { CorrosionCoupon } from "@/components/corrosion/types";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function CouponRemovalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [coupon, setCoupon] = useState<CorrosionCoupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removalDate, setRemovalDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    async function loadCouponDetails() {
      try {
        setLoading(true);
        const couponData = await fetchCouponById(params.id);
        
        if (couponData.status !== "Installed") {
          setError(`Cannot remove coupon with status: ${couponData.status}. Only installed coupons can be removed.`);
        } else {
          setCoupon(couponData);
        }
      } catch (err) {
        console.error("Failed to load coupon details:", err);
        setError("Failed to load coupon details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    loadCouponDetails();
  }, [params.id]);

  const handleRemovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coupon) {
      return;
    }
    
    try {
      setSubmitting(true);
      await recordCouponRemoval(coupon.coupon_id, removalDate, notes);
      
      toast({
        title: "Success",
        description: "Coupon has been marked as removed",
      });
      
      router.push(`/corrosion/coupons/${coupon.coupon_id}`);
    } catch (err) {
      console.error("Failed to record coupon removal:", err);
      toast({
        title: "Error",
        description: "Failed to record coupon removal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
        <Button variant="outline" className="mb-6" asChild>
          <Link href={`/corrosion/coupons/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Coupon
          </Link>
        </Button>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error || "Coupon not found"}</p>
        </div>
      </div>
    );
  }

  const exposureDays = Math.round((removalDate.getTime() - new Date(coupon.installation_date).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" className="mb-6" asChild>
          <Link href={`/corrosion/coupons/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Coupon
          </Link>
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Remove Corrosion Coupon</CardTitle>
            <CardDescription>
              Record the removal of coupon {coupon.coupon_id}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRemovalSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-col space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coupon ID</span>
                    <span className="font-medium">{coupon.coupon_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{coupon.location_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Material Type</span>
                    <span className="font-medium">{coupon.material_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Installation Date</span>
                    <span className="font-medium">
                      {new Date(coupon.installation_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Scheduled Removal Date</span>
                    <span className="font-medium">
                      {new Date(coupon.scheduled_removal_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Label htmlFor="removalDate">Removal Date</Label>
                  <div className="mt-1.5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                          id="removalDate"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(removalDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={removalDate}
                          onSelect={(date) => setRemovalDate(date || new Date())}
                          initialFocus
                          disabled={(date) => date < new Date(coupon.installation_date) || date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Show exposure period calculation */}
                  <p className="text-sm text-muted-foreground mt-2">
                    Exposure period: <span className="font-medium">{exposureDays} days</span>
                    {new Date() < new Date(coupon.scheduled_removal_date) && (
                      <span className="text-green-600 ml-2">
                        (Early removal)
                      </span>
                    )}
                    {new Date() > new Date(coupon.scheduled_removal_date) && (
                      <span className="text-red-600 ml-2">
                        ({Math.round((new Date().getTime() - new Date(coupon.scheduled_removal_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue)
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter any observations about the coupon condition, removal process, etc."
                    className="mt-1.5"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" asChild>
                <Link href={`/corrosion/coupons/${coupon.coupon_id}`}>
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={submitting} className="ml-auto">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording Removal...
                  </>
                ) : (
                  "Record Removal"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { CustomCalibrationForm, CustomCalibrationFormData } from "./custom-calibration-form";
import { Calibration, RBILevel, PSV } from "./types";
import { getAppropriateRBILevel } from "@/api/rbi";
import { Loader2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PSVCalibrationDrawerProps {
  psv: PSV;
  onCalibrationComplete: (calibration: Calibration) => void;
}

export function PSVCalibrationDrawer({
  psv,
  onCalibrationComplete,
}: PSVCalibrationDrawerProps) {
  const [open, setOpen] = useState(false);
  const [rbiLevel, setRbiLevel] = useState<RBILevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch appropriate RBI level when drawer opens
  useEffect(() => {
    async function loadRBILevel() {
      if (!open || rbiLevel !== null) return;
      
      try {
        setIsLoading(true);
        // Use the function that leverages existing RBI calculation
        const level = await getAppropriateRBILevel(psv.tag_number);
        setRbiLevel(level);
      } catch (err) {
        console.error("Failed to fetch RBI level:", err);
        setError("Failed to determine appropriate RBI level. Using default level.");
        setRbiLevel(1); // Default to level 1 on error
      } finally {
        setIsLoading(false);
      }
    }

    loadRBILevel();
  }, [open, psv.tag_number, rbiLevel]);

  // Reset state when drawer closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setRbiLevel(null); // Reset when closing
      setError(null);
    }
  };

  const handleSubmit = async (formData: CustomCalibrationFormData) => {
    try {
      setIsSubmitting(true);
      
      // Process work_maintenance to ensure it's one of the allowed string values
      let workMaintenance: "Adjust" | "Cleaning" | "Lapping";
      
      if (typeof formData.work_maintenance === 'string') {
        // If it's already a string, ensure it's one of the allowed values
        if (formData.work_maintenance === "Adjust" ||
            formData.work_maintenance === "Cleaning" ||
            formData.work_maintenance === "Lapping") {
          workMaintenance = formData.work_maintenance;
        } else {
          // Default if the string is not one of the allowed values
          workMaintenance = "Adjust";
        }
      } else if (formData.work_maintenance && typeof formData.work_maintenance === 'object') {
        // Find the first selected maintenance type
        const types: ("Adjust" | "Cleaning" | "Lapping")[] = [];
        if (formData.work_maintenance.adjust) types.push("Adjust");
        if (formData.work_maintenance.cleaning) types.push("Cleaning");
        if (formData.work_maintenance.lapping) types.push("Lapping");
        
        // Use the first selected type or default to "Adjust"
        workMaintenance = types.length > 0 ? types[0] : "Adjust";
      } else {
        // Default value for any other unexpected cases
        workMaintenance = "Adjust";
      }

      // Prepare the data for submission
      const calibrationData = {
        calibration_date: formData.calibration_date.toISOString(),
        tag_number: psv.tag_number,
        created_at: new Date().toISOString(),
        test_medium: formData.test_medium,
        inspector: formData.inspector,
        test_operator: formData.test_operator,
        approved_by: formData.approved_by,
        work_no: formData.work_no,
        work_maintenance: workMaintenance,
        post_repair_pop_test: formData.post_repair_pop_test,
        post_repair_leak_test: formData.post_repair_leak_test,
        pre_repair_pop_test: formData.pre_repair_pop_test,
        pre_repair_leak_test: formData.pre_repair_leak_test,
        body_condition: formData.body_condition,
        spring_condition: formData.spring_condition,
        seat_tightness: formData.seat_tightness,
        notes: formData.notes
      };
      
      console.log("Submitting calibration data:", calibrationData);
      // Use the API function from the shared module
      const { saveCalibration } = await import('@/api/psv-calibration');
      
      try {
        const savedCalibration = await saveCalibration(calibrationData);
        onCalibrationComplete(savedCalibration);
        setOpen(false);
        return; // Exit early since we're using the API function
      } catch (error) {
        console.error("Error saving calibration:", error);
        throw error;
      }
      
      
      // Note: This code is no longer needed as we're using the saveCalibration function above
    } catch (error) {
      console.error("Error saving calibration:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <span>Add New Calibration</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>New Calibration</SheetTitle>
          <SheetDescription>
            Record a new calibration for PSV {psv.tag_number}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-12">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading RBI level...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-600">
              {error}
            </div>
          ) : null}

          {rbiLevel !== null && (
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="flex-1">
                  <h3 className="text-sm font-medium">Calibration Requirements</h3>
                  <p className="text-sm text-muted-foreground">Based on PSV risk assessment</p>
                </div>
                <Badge variant="outline" className="text-sm bg-muted">
                  RBI Level {rbiLevel}
                </Badge>
              </div>

              <CustomCalibrationForm
                rbiLevel={rbiLevel}
                onSubmit={handleSubmit}
                defaultValues={{
                  calibration_date: new Date(),
                  test_medium: "Air",
                  work_maintenance: {
                    adjust: true,
                    cleaning: false,
                    lapping: false
                  },
                  inspector: "",
                  test_operator: "",
                  approved_by: "",
                  work_no: "",
                  post_repair_pop_test: 0,
                  post_repair_leak_test: 0,
                  pre_repair_pop_test: undefined,
                  pre_repair_leak_test: undefined
                }}
              />
            </div>
          )}
        </div>

        <SheetFooter className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          {rbiLevel !== null && !isLoading && (
            <Button
              type="submit"
              form="calibration-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Calibration"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
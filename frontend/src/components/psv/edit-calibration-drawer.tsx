'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { CustomCalibrationForm, CustomCalibrationFormData } from "./custom-calibration-form";
import { Calibration, RBILevel, PSV } from "./types";
// Importing inline in the handleSubmit function instead
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Use the CustomCalibrationFormData type from our new component

interface EditCalibrationDrawerProps {
  psv: PSV;
  calibration: Calibration;
  rbiLevel: RBILevel;
  onCalibrationUpdated: (calibration: Calibration) => void;
}

export function EditCalibrationDrawer({
  psv,
  calibration,
  rbiLevel,
  onCalibrationUpdated,
}: EditCalibrationDrawerProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format calibration data for the form
  const formatWorkMaintenance = (value: string) => {
    const result = {
      adjust: false,
      cleaning: false,
      lapping: false
    };
    
    switch(value) {
      case "Adjust":
        result.adjust = true;
        break;
      case "Cleaning":
        result.cleaning = true;
        break;
      case "Lapping":
        result.lapping = true;
        break;
      default:
        // Default to adjust if unknown value
        result.adjust = true;
    }
    
    return result;
  };

  const getDefaultValues = () => {
    return {
      calibration_date: new Date(calibration.calibration_date),
      test_medium: calibration.test_medium as "Nitrogen" | "Air" | "Steam" | "Water",
      work_maintenance: formatWorkMaintenance(calibration.work_maintenance),
      inspector: calibration.inspector || "",
      test_operator: calibration.test_operator || "",
      approved_by: calibration.approved_by || "",
      work_no: calibration.work_no || "",
      post_repair_pop_test: calibration.post_repair_pop_test || 0,
      post_repair_leak_test: calibration.post_repair_leak_test || 0,
      pre_repair_pop_test: calibration.pre_repair_pop_test,
      pre_repair_leak_test: calibration.pre_repair_leak_test,
      body_condition: calibration.body_condition || "",
      spring_condition: calibration.spring_condition || "",
      seat_tightness: calibration.seat_tightness || "",
      notes: calibration.notes || "",
      // Make sure we always have these required values
      pop_pressure: calibration.pop_pressure || 0
    };
  };

  const handleSubmit = async (formData: CustomCalibrationFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
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
        // Using the fields that match our calibration data model
        body_condition: formData.body_condition,
        spring_condition: formData.spring_condition,
        seat_tightness: formData.seat_tightness,
        notes: formData.notes
      };
      
      console.log("Updating calibration data:", calibrationData);
      
      try {
        const { updateCalibration } = await import('@/api/psv');
        const updatedCalibration = await updateCalibration(calibration.id, calibrationData);
        onCalibrationUpdated(updatedCalibration);
        setOpen(false);
      } catch (error) {
        console.error("Error updating calibration:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error updating calibration:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        title="Edit Calibration"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit Calibration</SheetTitle>
            <SheetDescription>
              Modify calibration record for PSV {psv.tag_number}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pb-12">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-600">
                {error}
              </div>
            )}

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
                defaultValues={getDefaultValues()}
              />
            </div>
          </div>

          <SheetFooter className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="calibration-form" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update Calibration"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
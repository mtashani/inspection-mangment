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
import { PSVCalibrationFormCompact } from "./psv-calibration-form-compact";
import { Calibration, RBILevel, PSV } from "./types";
import { getAppropriateRBILevel } from "@/api/rbi";
import { Loader2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define the form data type without created_at and id fields
interface CalibrationFormData {
  calibration_date: Date;
  work_maintenance: "Adjust" | "Cleaning" | "Lapping";
  test_medium: "Nitrogen" | "Air" | "Steam" | "Water";
  inspector: string;
  test_operator: string;
  work_no: string;
  post_repair_pop_test: number;
  post_repair_leak_test: number;
  general_condition?: string;
}

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

  const handleSubmit = async (formData: CalibrationFormData) => {
    try {
      setIsSubmitting(true);

      // Convert Date to ISO string for API
      const calibrationData = {
        ...formData,
        calibration_date: formData.calibration_date.toISOString(),
        tag_number: psv.tag_number,
        created_at: new Date().toISOString(),
      };

      // Make API call to save calibration
      const response = await fetch("/api/psv/calibrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calibrationData),
      });

      if (!response.ok) {
        throw new Error("Failed to save calibration");
      }

      const savedCalibration = await response.json();
      onCalibrationComplete(savedCalibration);
      setOpen(false);
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

              <PSVCalibrationFormCompact
                onSubmit={handleSubmit}
                defaultValues={{
                  calibration_date: new Date(),
                  test_medium: "Air",
                  work_maintenance: "Adjust",
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
            <Button type="submit" form="calibration-form" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Calibration"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
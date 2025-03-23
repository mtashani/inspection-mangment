'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PSVCalibrationForm } from "./psv-calibration-form";
import { Calibration, RBILevel, PSV } from "./types";
import { getAppropriateRBILevel } from "@/api/rbi";
import { Loader2 } from "lucide-react";

// Define the form data type without created_at and id fields
interface CalibrationFormData {
  calibration_date: Date;
  work_maintenance: "Adjust" | "Cleaning" | "Lapping";
  test_medium: "Nitrogen" | "Air" | "Steam" | "Water";
  inspector: string;
  test_operator: string;
  general_condition?: string;
  approved_by: string;
  work_no: string;
  pre_repair_pop_test?: number;
  pre_repair_leak_test?: number;
  post_repair_pop_test: number;
  post_repair_leak_test: number;
  body_condition_score?: number;
  body_condition_notes?: string;
  internal_parts_score?: number;
  internal_parts_notes?: string;
  seat_plug_condition_score?: number;
  seat_plug_notes?: string;
}

interface PSVCalibrationDialogProps {
  psv: PSV;
  onCalibrationComplete: (calibration: Calibration) => void;
}

export function PSVCalibrationDialog({
  psv,
  onCalibrationComplete,
}: PSVCalibrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [rbiLevel, setRbiLevel] = useState<RBILevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch appropriate RBI level when dialog opens
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

  // Reset state when dialog closes
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">Add New Calibration</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New PSV Calibration</DialogTitle>
          <DialogDescription>
            Record a new calibration for PSV {psv.tag_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          ) : null}

          {rbiLevel !== null && (
            <div className="space-y-6">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">Using RBI Level: {rbiLevel}</p>
              </div>

              <PSVCalibrationForm
                rbiLevel={rbiLevel}
                onSubmit={handleSubmit}
                defaultValues={{
                  calibration_date: new Date(),
                  test_medium: "Air",
                  work_maintenance: "Adjust",
                }}
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            {rbiLevel !== null && !isLoading && (
              <Button disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Calibration"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
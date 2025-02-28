'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PSVCalibrationForm } from "./psv-calibration-form";
import { Calibration, RBILevel, PSV } from "./types";
import { FormLabel } from "@/components/ui/form";

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
  defaultRbiLevel?: RBILevel;
}

export function PSVCalibrationDialog({
  psv,
  onCalibrationComplete,
  defaultRbiLevel = 1,
}: PSVCalibrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [rbiLevel, setRbiLevel] = useState<RBILevel>(defaultRbiLevel);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // You might want to show an error toast/notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">New Calibration</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New PSV Calibration</DialogTitle>
          <DialogDescription>
            Record a new calibration for PSV {psv.tag_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <FormLabel>RBI Level</FormLabel>
            <Select
              value={rbiLevel.toString()}
              onValueChange={(value) => setRbiLevel(parseInt(value) as RBILevel)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select RBI level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Level 1 - Fixed Interval</SelectItem>
                <SelectItem value="2">Level 2 - Test Results Based</SelectItem>
                <SelectItem value="3">Level 3 - Condition Based</SelectItem>
                <SelectItem value="4">Level 4 - Risk Based (API 581)</SelectItem>
              </SelectContent>
            </Select>
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
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Calibration"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
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
import { Calibration, RBILevel, PSV, RBICalculationResult } from "./types";
import { getAppropriateRBILevel, calculateRBI, calculateNextCalibrationDate } from "@/api/rbi";
import { Loader2, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

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
  onCalibrationComplete: (calibration: Calibration, nextDueDate?: Date) => void;
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
  
  // New state variables for the preview workflow
  const [formData, setFormData] = useState<CalibrationFormData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rbiCalculation, setRbiCalculation] = useState<RBICalculationResult | null>(null);
  const [isCalculatingRBI, setIsCalculatingRBI] = useState(false);

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
      setFormData(null);
      setShowPreview(false);
      setRbiCalculation(null);
    }
  };

  // First step: handle form submission and show preview
  const handleFormSubmit = async (data: CalibrationFormData) => {
    try {
      setIsCalculatingRBI(true);
      setFormData(data);
      
      if (rbiLevel) {
        // Calculate RBI to preview
        const result = await calculateRBI(psv.tag_number, rbiLevel);
        setRbiCalculation(result);
      }
      
      setShowPreview(true);
    } catch (err) {
      console.error("Error calculating RBI preview:", err);
      setError(err instanceof Error ? err.message : "Failed to calculate RBI preview");
    } finally {
      setIsCalculatingRBI(false);
    }
  };

  // Final step: save the calibration after preview
  const handleSaveCalibration = async () => {
    if (!formData) return;
    
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
      
      // Calculate next due date using the RBI system
      let nextDueDate: Date | null = null;
      if (rbiCalculation?.next_calibration_date) {
        nextDueDate = new Date(rbiCalculation.next_calibration_date);
      } else {
        // Fallback: Calculate next due date if not already calculated
        try {
          nextDueDate = await calculateNextCalibrationDate(psv.tag_number, savedCalibration);
        } catch (err) {
          console.error("Error calculating next calibration date:", err);
          // Continue without setting next date
        }
      }
      
      onCalibrationComplete(savedCalibration, nextDueDate || undefined);
      setOpen(false);
    } catch (error) {
      console.error("Error saving calibration:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel preview and go back to form
  const handleCancelPreview = () => {
    setShowPreview(false);
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
            <div className="text-red-500 mb-4 flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          ) : null}

          {!showPreview && rbiLevel !== null && (
            <div className="space-y-6">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">Using RBI Level: {rbiLevel}</p>
              </div>

              <PSVCalibrationForm
                rbiLevel={rbiLevel}
                onSubmit={handleFormSubmit}
                defaultValues={{
                  calibration_date: new Date(),
                  test_medium: "Air",
                  work_maintenance: "Adjust",
                }}
              />
            </div>
          )}
          
          {/* RBI Preview */}
          {showPreview && formData && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <h3 className="font-medium text-green-800 flex items-center gap-2">
                  <Calendar size={18} />
                  RBI Calculation Preview
                </h3>
                
                {isCalculatingRBI ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  </div>
                ) : (
                  <div className="mt-3">
                    {rbiCalculation ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-green-700">Recommended Interval</p>
                            <p className="font-medium">
                              {rbiCalculation.recommended_interval} months
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-green-700">Next Due Date</p>
                            <p className="font-medium">
                              {rbiCalculation.next_calibration_date ? 
                                format(new Date(rbiCalculation.next_calibration_date), "PP") : 
                                "Not calculated"}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-green-700">Risk Score</p>
                            <p className="font-medium">
                              {rbiCalculation.risk_score?.toFixed(2)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-green-700">Risk Category</p>
                            <p className="font-medium">
                              {rbiCalculation.risk_category || "N/A"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Based on RBI Level {rbiLevel} calculation
                        </div>
                      </div>
                    ) : (
                      <p className="text-amber-600">
                        Could not calculate RBI preview. Data will still be saved with default settings.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Calibration Summary</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd>{format(formData.calibration_date, "PP")}</dd>
                  
                  <dt className="text-muted-foreground">Work Type</dt>
                  <dd>{formData.work_maintenance}</dd>
                  
                  <dt className="text-muted-foreground">Test Medium</dt>
                  <dd>{formData.test_medium}</dd>
                  
                  {formData.post_repair_pop_test && (
                    <>
                      <dt className="text-muted-foreground">Pop Test</dt>
                      <dd>{formData.post_repair_pop_test} Barg</dd>
                    </>
                  )}
                  
                  {formData.post_repair_leak_test && (
                    <>
                      <dt className="text-muted-foreground">Leak Test</dt>
                      <dd>{formData.post_repair_leak_test} Barg</dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 mt-4">
            {showPreview ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelPreview}
                  disabled={isSubmitting}
                >
                  Back to Form
                </Button>
                <Button 
                  onClick={handleSaveCalibration}
                  disabled={isSubmitting || isCalculatingRBI}
                >
                  {isSubmitting ? "Saving..." : "Save Calibration"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
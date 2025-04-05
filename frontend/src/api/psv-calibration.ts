import { Calibration } from "@/components/psv/types";

// Define the structure expected by the API
export interface CalibrationSubmitData {
  tag_number: string;
  calibration_date: string; // ISO date string
  created_at: string; // ISO date string
  work_maintenance: "Adjust" | "Cleaning" | "Lapping";
  test_medium: "Nitrogen" | "Air" | "Steam" | "Water";
  inspector: string;
  test_operator: string;
  approved_by: string;
  work_no: string;
  post_repair_pop_test: number;
  post_repair_leak_test: number;
  pre_repair_pop_test?: number;
  pre_repair_leak_test?: number;
  body_condition_score?: number;
  body_condition_notes?: string;
  internal_parts_score?: number;
  internal_parts_notes?: string;
  seat_plug_condition_score?: number;
  seat_plug_notes?: string;
  general_condition?: string;
  change_parts?: string;
}

/**
 * Function to save a new calibration record
 */
export async function saveCalibration(calibrationData: CalibrationSubmitData): Promise<Calibration> {
  try {
    console.log("Saving calibration data:", calibrationData);
    
    // Use the proper URL structure that the backend expects - tag_number is part of the URL
    const response = await fetch(`/api/calibration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(calibrationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Failed to save calibration: ${response.statusText}`;
      console.error(`API error (${response.status}):`, errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error saving calibration:", error);
    throw error;
  }
}
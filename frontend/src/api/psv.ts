import { PSV, PSVSummary, Calibration } from "@/components/psv/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchPSVs(): Promise<PSV[]> {
  const response = await fetch(`${API_URL}/api/psv`);
  if (!response.ok) {
    throw new Error('Failed to fetch PSVs');
  }
  return response.json();
}

export async function fetchPSVSummary(): Promise<PSVSummary> {
  const response = await fetch(`${API_URL}/api/psv/summary`);
  if (!response.ok) {
    throw new Error('Failed to fetch PSV summary');
  }
  return response.json();
}

export async function fetchPSVById(id: string): Promise<PSV> {
  try {
    // Encode tag number to handle special characters
    const encodedId = encodeURIComponent(id.trim());
    const response = await fetch(`${API_URL}/api/psv/${encodedId}`);
    
    if (!response.ok) {
      // Get error details from response if available
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch PSV: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data) {
      throw new Error('No PSV data received');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching PSV:', error);
    throw error;
  }
}

export async function fetchCalibrations(tagNumber: string): Promise<Calibration[]> {
  try {
    const encodedTag = encodeURIComponent(tagNumber.trim());
    const response = await fetch(`${API_URL}/api/psv/calibration/${encodedTag}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch calibrations: ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid calibration data received');
    }

    // Sort calibrations by date (newest first)
    return data.sort((a, b) =>
      new Date(b.calibration_date).getTime() - new Date(a.calibration_date).getTime()
    );
  } catch (error) {
    console.error('Error fetching calibrations:', error);
    throw error;
  }
}
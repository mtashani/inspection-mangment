import { PSV, PSVSummary, Calibration } from "@/components/psv/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PSVFilters {
  skip?: number;
  limit?: number;
  tag_number?: string;
  status?: string;
  service?: string;
  unit?: string[];
  type?: string[];
  train?: string[];
}

export async function fetchPSVs(filters?: PSVFilters): Promise<PSV[]> {
  let url = `${API_URL}/api/psv`;
  
  // Add query parameters if filters are provided
  if (filters) {
    const params = new URLSearchParams();
    
    // Add simple filters
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters.tag_number) params.append('tag_number', filters.tag_number);
    if (filters.status) params.append('status', filters.status);
    if (filters.service) params.append('service', filters.service);
    
    // Add array filters (multiple values)
    if (filters.unit && filters.unit.length > 0) {
      filters.unit.forEach(u => params.append('unit', u));
    }
    
    if (filters.type && filters.type.length > 0) {
      filters.type.forEach(t => params.append('type', t));
    }
    
    if (filters.train && filters.train.length > 0) {
      filters.train.forEach(t => params.append('train', t));
    }
    
    url = `${url}?${params.toString()}`;
  }
  
  console.log('Fetching PSVs with URL:', url);
  const response = await fetch(url);
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

export async function fetchPSVTypes(): Promise<string[]> {
  try {
    console.log('Fetching PSV types from:', `${API_URL}/api/psv/types`);
    const response = await fetch(`${API_URL}/api/psv/types`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text');
      console.warn(`PSV types endpoint returned ${response.status}: ${errorText}`);
      // Return default types if API fails
      return ["Gate", "Globe", "Safety Relief", "Pilot Operated"];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('PSV types response is not an array, using defaults');
      return ["Gate", "Globe", "Safety Relief", "Pilot Operated"];
    }
    
    // Deduplicate the data to avoid React key conflicts
    const uniqueTypes = [...new Set(data.filter(Boolean))];
    console.log(`Received ${data.length} types, ${uniqueTypes.length} unique types`);
    return uniqueTypes;
  } catch (error) {
    console.warn('Error fetching PSV types, using defaults:', error);
    // Return default types on error
    return ["Gate", "Globe", "Safety Relief", "Pilot Operated"];
  }
}

export async function fetchPSVUnits(): Promise<string[]> {
  try {
    console.log('Fetching PSV units from:', `${API_URL}/api/psv/units`);
    const response = await fetch(`${API_URL}/api/psv/units`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text');
      console.warn(`PSV units endpoint returned ${response.status}: ${errorText}`);
      // Return default units if API fails
      return ["U-100", "U-200", "U-300", "U-400"];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('PSV units response is not an array, using defaults');
      return ["U-100", "U-200", "U-300", "U-400"];
    }
    
    // Deduplicate the data to avoid React key conflicts
    const uniqueUnits = [...new Set(data.filter(Boolean))];
    console.log(`Received ${data.length} units, ${uniqueUnits.length} unique units`);
    return uniqueUnits;
  } catch (error) {
    console.warn('Error fetching PSV units, using defaults:', error);
    // Return default units on error
    return ["U-100", "U-200", "U-300", "U-400"];
  }
}

export async function fetchPSVTrains(): Promise<string[]> {
  try {
    console.log('Fetching PSV trains from:', `${API_URL}/api/psv/trains`);
    const response = await fetch(`${API_URL}/api/psv/trains`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text');
      console.warn(`PSV trains endpoint returned ${response.status}: ${errorText}`);
      // Return default trains if API fails
      return ["Train A", "Train B", "Train C", "Train D"];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('PSV trains response is not an array, using defaults');
      return ["Train A", "Train B", "Train C", "Train D"];
    }
    
    // Deduplicate the data to avoid React key conflicts
    const uniqueTrains = [...new Set(data.filter(Boolean))];
    console.log(`Received ${data.length} trains, ${uniqueTrains.length} unique trains`);
    return uniqueTrains;
  } catch (error) {
    console.warn('Error fetching PSV trains, using defaults:', error);
    // Return default trains on error
    return ["Train A", "Train B", "Train C", "Train D"];
  }
}
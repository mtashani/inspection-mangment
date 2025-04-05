import { CorrosionLocation, LocationFormData, SystemRiskCategory } from "@/components/corrosion/types";

/**
 * Fetch all monitoring locations with optional filtering
 */
export async function fetchLocations(
  options: {
    system?: string;
    unit?: string;
    riskCategory?: SystemRiskCategory;
  } = {}
): Promise<CorrosionLocation[]> {
  const params = new URLSearchParams();
  
  if (options.system) {
    params.append('system', options.system);
  }
  if (options.unit) {
    params.append('unit', options.unit);
  }
  if (options.riskCategory) {
    params.append('risk_category', options.riskCategory);
  }
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/corrosion/locations${queryString}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch locations: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Fetch a single location by ID
 */
export async function fetchLocationById(locationId: string): Promise<CorrosionLocation> {
  const response = await fetch(`/api/corrosion/locations/${locationId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch location: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Create a new monitoring location
 */
export async function createLocation(locationData: LocationFormData): Promise<CorrosionLocation> {
  const response = await fetch('/api/corrosion/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to create location: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Update an existing location
 */
export async function updateLocation(
  locationId: string, 
  locationData: Partial<LocationFormData>
): Promise<CorrosionLocation> {
  const response = await fetch(`/api/corrosion/locations/${locationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to update location: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete a location
 */
export async function deleteLocation(locationId: string): Promise<void> {
  const response = await fetch(`/api/corrosion/locations/${locationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to delete location: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Get coupons for a specific location
 */
export async function fetchLocationCoupons(locationId: string): Promise<unknown[]> {
  const response = await fetch(`/api/corrosion/locations/${locationId}/coupons`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch location coupons: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}
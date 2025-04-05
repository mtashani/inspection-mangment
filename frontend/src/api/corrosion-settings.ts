import { CorrosionMonitoringSettings } from "@/components/corrosion/types";

/**
 * Fetch the current corrosion monitoring settings
 */
export async function fetchSettings(): Promise<CorrosionMonitoringSettings> {
  const response = await fetch('/api/corrosion/settings');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch settings: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Update the RBI level
 */
export async function updateRbiLevel(level: number): Promise<CorrosionMonitoringSettings> {
  const response = await fetch('/api/corrosion/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rbi_level: level }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to update RBI level: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Update inspection frequency settings
 */
export async function updateInspectionFrequency(
  frequencies: { high_risk: number; medium_risk: number; low_risk: number }
): Promise<CorrosionMonitoringSettings> {
  const response = await fetch('/api/corrosion/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inspection_frequency: frequencies }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to update inspection frequencies: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get all material factors
 */
export async function fetchMaterialFactors(): Promise<Array<{
  material_name: string;
  base_corrosion_rate: number;
  severity_multiplier: number;
}>> {
  const response = await fetch('/api/corrosion/settings/materials');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch material factors: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Update material factors
 */
export async function updateMaterialFactors(materials: Array<{
  material_name: string;
  base_corrosion_rate: number;
  severity_multiplier: number;
}>): Promise<unknown> {
  const response = await fetch('/api/corrosion/settings/materials', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ materials }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to update material factors: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete a material factor
 */
export async function deleteMaterialFactor(materialName: string): Promise<void> {
  const response = await fetch(`/api/corrosion/settings/materials/${encodeURIComponent(materialName)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to delete material factor: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Get severity thresholds
 */
export async function fetchSeverityThresholds(): Promise<{
  corrosion_rate: Record<string, number>;
  pitting_density: Record<string, number>;
  pit_depth: Record<string, number>;
}> {
  const response = await fetch('/api/corrosion/settings/thresholds');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch severity thresholds: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Update severity thresholds
 */
export async function updateSeverityThresholds(thresholds: {
  corrosion_rate: Record<string, number>;
  pitting_density: Record<string, number>;
  pit_depth: Record<string, number>;
}): Promise<unknown> {
  const response = await fetch('/api/corrosion/settings/thresholds', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(thresholds),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to update severity thresholds: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Reset settings to defaults
 */
export async function resetToDefaults(): Promise<CorrosionMonitoringSettings> {
  const response = await fetch('/api/corrosion/settings/reset', {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to reset settings: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}
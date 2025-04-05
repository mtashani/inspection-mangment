import { CorrosionAnalysisReport, AnalysisFormData, CorrosionType } from "@/components/corrosion/types";

/**
 * Fetch all analysis reports with optional filtering
 */
export async function fetchAnalysisReports(
  options: {
    couponId?: string;
    minSeverity?: number;
    maxSeverity?: number;
  } = {}
): Promise<CorrosionAnalysisReport[]> {
  const params = new URLSearchParams();
  
  if (options.couponId) {
    params.append('coupon_id', options.couponId);
  }
  if (options.minSeverity !== undefined) {
    params.append('min_severity', options.minSeverity.toString());
  }
  if (options.maxSeverity !== undefined) {
    params.append('max_severity', options.maxSeverity.toString());
  }
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/corrosion/analysis${queryString}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch analysis reports: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Fetch a single analysis report by ID
 */
export async function fetchAnalysisById(reportId: number): Promise<CorrosionAnalysisReport> {
  const response = await fetch(`/api/corrosion/analysis/${reportId}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch analysis report: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Create a new analysis report
 */
export async function createAnalysisReport(analysisData: AnalysisFormData): Promise<CorrosionAnalysisReport> {
  // Create a new object with ISO date strings
  const apiData: Record<string, unknown> = {};
  
  // Copy all properties
  Object.keys(analysisData).forEach(key => {
    const value = analysisData[key as keyof AnalysisFormData];
    
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      apiData[key] = value.toISOString();
    } else {
      apiData[key] = value;
    }
  });

  const response = await fetch('/api/corrosion/analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to create analysis report: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Update an existing analysis report
 */
export async function updateAnalysisReport(
  reportId: number, 
  analysisData: Partial<AnalysisFormData>
): Promise<CorrosionAnalysisReport> {
  // Create a new object with ISO date strings
  const apiData: Record<string, unknown> = {};
  
  // Copy all properties
  Object.keys(analysisData).forEach(key => {
    const value = analysisData[key as keyof Partial<AnalysisFormData>];
    
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      apiData[key] = value.toISOString();
    } else {
      apiData[key] = value;
    }
  });

  const response = await fetch(`/api/corrosion/analysis/${reportId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to update analysis report: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Delete an analysis report
 */
export async function deleteAnalysisReport(reportId: number): Promise<void> {
  const response = await fetch(`/api/corrosion/analysis/${reportId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to delete analysis report: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Calculate severity without saving the report
 */
export async function calculateSeverity(
  data: {
    coupon_id: string;
    corrosion_rate: number;
    corrosion_type: CorrosionType;
    pitting_density?: number;
    max_pit_depth?: number;
    visual_inspection: string;
    microscopic_analysis?: string;
  }
): Promise<{ calculated_severity: number; calculation_factors: Record<string, number> }> {
  const response = await fetch('/api/corrosion/analysis/calculate-severity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to calculate severity: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }

  return response.json();
}
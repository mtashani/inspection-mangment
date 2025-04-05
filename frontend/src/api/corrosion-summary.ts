import { CorrosionCoupon, CorrosionSummary } from "@/components/corrosion/types";

/**
 * Fetch summary statistics for the corrosion monitoring system
 */
export async function fetchSystemStatistics(): Promise<CorrosionSummary> {
  const response = await fetch('/api/corrosion/summary/stats');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch system statistics: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Get upcoming coupon removals
 */
export async function fetchUpcomingRemovals(days: number = 30): Promise<CorrosionCoupon[]> {
  const response = await fetch(`/api/corrosion/summary/upcoming-removals?days=${days}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch upcoming removals: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Get overdue coupon removals
 */
export async function fetchOverdueRemovals(): Promise<CorrosionCoupon[]> {
  const response = await fetch('/api/corrosion/summary/overdue-removals');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch overdue removals: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Get recent analysis reports
 */
export interface RecentAnalysis {
  report_id: number;
  coupon_id: string;
  analysis_date: string;
  corrosion_rate: number;
  corrosion_type: string;
  calculated_severity: number;
  material_type: string;
  location_id: string;
}

export async function fetchRecentAnalyses(limit: number = 10): Promise<RecentAnalysis[]> {
  const response = await fetch(`/api/corrosion/summary/recent-analysis?limit=${limit}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch recent analyses: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Get location summary
 */
export interface LocationSummary {
  location_id: string;
  name: string;
  system: string;
  unit: string;
  risk_category: string;
  installed_coupons: number;
  analyzed_coupons: number;
  average_corrosion_rate: number;
  max_severity: number;
}

export async function fetchLocationSummary(): Promise<LocationSummary[]> {
  const response = await fetch('/api/corrosion/summary/location-summary');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch location summary: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Get severity trends over time
 */
export interface SeverityTrend {
  month: string;
  count: number;
  avg_severity: number;
  avg_rate: number;
}

export async function fetchSeverityTrends(months: number = 12): Promise<SeverityTrend[]> {
  const response = await fetch(`/api/corrosion/summary/severity-trends?months=${months}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || `Failed to fetch severity trends: ${response.statusText}`;
    console.error(`API error (${response.status}):`, errorMessage);
    throw new Error(errorMessage);
  }
  
  return response.json();
}
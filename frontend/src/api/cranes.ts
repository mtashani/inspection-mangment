import { API_URL } from '@/config/constants';

export interface Crane {
  id: number;
  tag_number: string;
  crane_type: 'Overhead' | 'Mobile' | 'Gantry' | 'Jib' | 'Bridge';
  manufacturer: string;
  model: string;
  serial_number: string;
  location: string;
  installation_date: string;
  nominal_capacity: number;
  current_allowed_capacity: number;
  status: 'Active' | 'UnderMaintenance' | 'Decommissioned';
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  risk_level: string;
  created_at: string;
  updated_at: string;
}

export interface CraneInspection {
  id: number;
  crane_id: number;
  inspection_date: string;
  next_inspection_date: string;
  performed_by: string;
  status: string;
  findings: string;
  recommendations: string;
  certificate_image_path: string | null;
  allowed_capacity: number;
  report_file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CraneTypeCount {
  type: string;
  count: number;
}

export interface CraneStatusCount {
  status: string;
  count: number;
}

export interface UpcomingInspection {
  id: number;
  tagNumber: string;
  type: string;
  location: string;
  nextInspectionDate: string;
}

export interface ReducedCapacityCrane {
  id: number;
  tagNumber: string;
  type: string;
  nominalCapacity: number;
  currentAllowedCapacity: number;
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface DashboardData {
  totalCranes: number;
  activeCount: number;
  upcomingInspectionsCount: number;
  overdueInspectionsCount: number;
  reducedCapacityCount: number;
  cranesByType: CraneTypeCount[];
  cranesByStatus: CraneStatusCount[];
  upcomingInspections: UpcomingInspection[];
  reducedCapacityCranes: ReducedCapacityCrane[];
  inspectionTimeline: TimelinePoint[];
}

export async function fetchCranes(params = {}): Promise<Crane[]> {
  const queryParams = new URLSearchParams(params as Record<string, string>).toString();
  const response = await fetch(`${API_URL}/cranes?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch cranes');
  }
  
  return response.json();
}

export async function fetchCrane(craneId: number): Promise<Crane> {
  const response = await fetch(`${API_URL}/cranes/${craneId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch crane with ID ${craneId}`);
  }
  
  return response.json();
}

export async function createCrane(craneData: Omit<Crane, 'id' | 'created_at' | 'updated_at'>): Promise<Crane> {
  const response = await fetch(`${API_URL}/cranes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(craneData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to create crane: ${errorData.detail || response.statusText}`);
  }
  
  return response.json();
}

export async function updateCrane(craneId: number, craneData: Partial<Crane>): Promise<Crane> {
  const response = await fetch(`${API_URL}/cranes/${craneId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(craneData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to update crane: ${errorData.detail || response.statusText}`);
  }
  
  return response.json();
}

export async function updateCraneStatus(craneId: number, status: 'Active' | 'UnderMaintenance' | 'Decommissioned'): Promise<Crane> {
  const response = await fetch(`${API_URL}/cranes/${craneId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to update crane status: ${errorData.detail || response.statusText}`);
  }
  
  return response.json();
}

export async function deleteCrane(craneId: number): Promise<void> {
  const response = await fetch(`${API_URL}/cranes/${craneId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to delete crane: ${errorData.detail || response.statusText}`);
  }
}

export async function fetchCraneInspections(craneId?: number): Promise<CraneInspection[]> {
  const url = craneId
    ? `${API_URL}/cranes/inspections?crane_id=${craneId}`
    : `${API_URL}/cranes/inspections`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch crane inspections');
  }
  
  return response.json();
}

export async function createCraneInspection(formData: FormData): Promise<CraneInspection> {
  const response = await fetch(`${API_URL}/cranes/inspections`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to create inspection: ${errorData.detail || response.statusText}`);
  }
  
  return response.json();
}

export async function fetchCraneDashboardData(): Promise<DashboardData> {
  const response = await fetch(`${API_URL}/cranes/dashboard`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  
  return response.json();
}
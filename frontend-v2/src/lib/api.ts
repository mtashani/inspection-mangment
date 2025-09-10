const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API response types
export interface DashboardStats {
  totalEquipment: number;
  activeInspections: number;
  inspectors: number;
  pendingReports: number;
  equipmentGrowth: string;
  inspectionsGrowth: string;
  inspectorsChange: string;
  reportsChange: string;
}

export interface RecentInspection {
  id: string;
  equipment: string;
  status: 'Completed' | 'In Progress' | 'Scheduled' | 'Overdue';
  date: string;
}

export interface SystemMetric {
  name: string;
  value: string;
  color: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentInspections: RecentInspection[];
  systemMetrics: SystemMetric[];
}

// API functions
export async function fetchDashboardData(): Promise<DashboardData> {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Dashboard API failed, using mock data:', error);
    return getMockDashboardData();
  }
}

// Mock data fallback
function getMockDashboardData(): DashboardData {
  return {
    stats: {
      totalEquipment: 1234,
      activeInspections: 89,
      inspectors: 24,
      pendingReports: 12,
      equipmentGrowth: '+20.1% from last month',
      inspectionsGrowth: '+12.5% from last month',
      inspectorsChange: '+2 new this month',
      reportsChange: '-4 from yesterday',
    },
    recentInspections: [
      {
        id: 'INS-001',
        equipment: 'Pressure Vessel PV-101',
        status: 'Completed',
        date: '2024-01-15',
      },
      {
        id: 'INS-002',
        equipment: 'Heat Exchanger HE-201',
        status: 'In Progress',
        date: '2024-01-14',
      },
      {
        id: 'INS-003',
        equipment: 'Storage Tank ST-301',
        status: 'Scheduled',
        date: '2024-01-16',
      },
      {
        id: 'INS-004',
        equipment: 'Pump P-401',
        status: 'Overdue',
        date: '2024-01-10',
      },
    ],
    systemMetrics: [
      { name: 'System Performance', value: '98.5%', color: 'text-green-600' },
      { name: 'Overdue Inspections', value: '3', color: 'text-yellow-600' },
      { name: 'Active Inspectors', value: '18/24', color: 'text-blue-600' },
      { name: 'Reports Generated', value: '156', color: 'text-purple-600' },
    ],
  };
}

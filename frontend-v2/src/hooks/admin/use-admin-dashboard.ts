'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminDashboardStats, Inspector, AttendanceRecord } from '@/types/admin';
import { adminApiGet } from '@/lib/api/admin/base';
import { getJalaliMonthlyAttendance } from '@/lib/api/admin/attendance';
import { getAllInspectors } from '@/lib/api/admin/inspectors';
import { getAdminDashboardStats, getTodayAttendance } from '@/lib/api/admin/dashboard';
import { getCurrentJalaliDate, getJalaliMonthRange, jalaliToGregorian } from '@/lib/utils/jalali';

// Check if we should use mock data
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Mock data for development - replace with actual API calls
const mockDashboardStats: AdminDashboardStats = {
  totalInspectors: 45,
  activeInspectors: 42,
  // specialtyCounts removed - no longer used
  upcomingBirthdays: 3,
  attendanceOverview: {
    presentToday: 38,
    totalScheduled: 42,
    attendanceRate: 90.5
  },
  recentActivity: {
    newInspectors: 2,
    completedInspections: 156,
    pendingReports: 8
  }
};

// Fallback empty stats for error cases
const emptyDashboardStats: AdminDashboardStats = {
  totalInspectors: 0,
  activeInspectors: 0,
  // specialtyCounts removed - no longer used
  upcomingBirthdays: 0,
  attendanceOverview: {
    presentToday: 0,
    totalScheduled: 0,
    attendanceRate: 0
  },
  recentActivity: {
    newInspectors: 0,
    completedInspections: 0,
    pendingReports: 0
  }
};

const mockInspectors: Inspector[] = [
  {
    id: 1,
    name: 'Ahmad Rezaei',
    employeeId: 'EMP001',
    email: 'ahmad.rezaei@company.com',
    // inspectorType and specialties removed - no longer used
    active: true,
    canLogin: true,
    attendanceTrackingEnabled: true,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 2,
    name: 'Maryam Hosseini',
    employeeId: 'EMP002',
    email: 'maryam.hosseini@company.com',
    // inspectorType and specialties removed - no longer used
    active: true,
    canLogin: true,
    attendanceTrackingEnabled: true,
    createdAt: '2024-01-16T08:00:00Z',
    updatedAt: '2024-01-16T08:00:00Z'
  },
  {
    id: 3,
    name: 'Hassan Karimi',
    employeeId: 'EMP003',
    email: 'hassan.karimi@company.com',
    // inspectorType and specialties removed - no longer used
    active: true,
    canLogin: true,
    attendanceTrackingEnabled: true,
    createdAt: '2024-01-17T08:00:00Z',
    updatedAt: '2024-01-17T08:00:00Z'
  }
];

const generateMockAttendanceData = (jalaliMonth: number, jalaliYear: number): AttendanceRecord[] => {
  const { daysInMonth } = getJalaliMonthRange(jalaliYear, jalaliMonth);
  const records: AttendanceRecord[] = [];
  
  mockInspectors.forEach(inspector => {
    for (let day = 1; day <= daysInMonth; day++) {
      // Convert each Jalali day to proper Gregorian date
      const gregorianDate = jalaliToGregorian(jalaliYear, jalaliMonth, day);
      const date = gregorianDate.toISOString().split('T')[0];
      
      // Generate realistic attendance patterns
      let status: AttendanceRecord['status'];
      const random = Math.random();
      
      if (random < 0.7) {
        status = 'WORKING';
      } else if (random < 0.8) {
        status = 'RESTING';
      } else if (random < 0.85) {
        status = 'OVERTIME';
      } else if (random < 0.9) {
        status = 'ABSENT';
      } else if (random < 0.95) {
        status = 'SICK_LEAVE';
      } else {
        status = 'VACATION';
      }
      
      records.push({
        id: parseInt(`${inspector.id}${day}`),
        inspectorId: inspector.id,
        date,
        status,
        workHours: status === 'WORKING' ? 8 : status === 'OVERTIME' ? 10 : 0,
        overtimeHours: status === 'OVERTIME' ? 2 : 0,
        isOverride: false,
        createdAt: date + 'T08:00:00Z',
        updatedAt: date + 'T08:00:00Z'
      });
    }
  });
  
  return records;
};

export interface UseDashboardStatsOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export function useDashboardStats(options: UseDashboardStatsOptions = {}) {
  const { refetchInterval = 30000, enabled = true } = options; // Refetch every 30 seconds

  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async (): Promise<AdminDashboardStats> => {
      if (USE_MOCK_DATA) {
        // Use mock data for development
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockDashboardStats;
      } else {
        // Use real API endpoint
        try {
          return await getAdminDashboardStats();
        } catch (error) {
          console.error('Failed to fetch dashboard stats, falling back to empty data:', error);
          return emptyDashboardStats;
        }
      }
    },
    refetchInterval,
    enabled,
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

export interface UseInspectorsOptions {
  enabled?: boolean;
}

export function useInspectors(options: UseInspectorsOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['admin', 'inspectors'],
    queryFn: async (): Promise<Inspector[]> => {
      if (USE_MOCK_DATA) {
        // Use mock data for development
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockInspectors;
      } else {
        // Use real API endpoint
        try {
          return await getAllInspectors();
        } catch (error) {
          console.error('Failed to fetch inspectors, falling back to mock data:', error);
          return mockInspectors;
        }
      }
    },
    enabled,
    staleTime: 60000, // Consider data stale after 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

export interface UseAttendanceDataOptions {
  jalaliMonth: number;  // Changed: Use Jalali month
  jalaliYear: number;   // Changed: Use Jalali year
  enabled?: boolean;
}

export function useAttendanceData(options: UseAttendanceDataOptions) {
  const { jalaliMonth, jalaliYear, enabled = true } = options;

  return useQuery({
    queryKey: ['admin', 'attendance', 'jalali', jalaliYear, jalaliMonth],
    queryFn: async (): Promise<AttendanceRecord[]> => {
      if (USE_MOCK_DATA) {
        // Use mock data for development
        await new Promise(resolve => setTimeout(resolve, 400));
        return generateMockAttendanceData(jalaliMonth, jalaliYear);
      } else {
        try {
          // Get all inspectors first
          const inspectors = await getAllInspectors();
          
          // Get attendance for all inspectors for this month
          const allAttendanceData = await Promise.all(
            inspectors.map(async (inspector) => {
              const attendanceDays = await getJalaliMonthlyAttendance(inspector.id, jalaliYear, jalaliMonth);
              // Convert AttendanceDay[] to AttendanceRecord[]
              return attendanceDays.map((day, index) => ({
                id: parseInt(`${inspector.id}${jalaliYear}${jalaliMonth}${index}`), // Generate unique ID
                inspectorId: inspector.id,
                date: day.date,
                status: day.status,
                workHours: day.workHours,
                overtimeHours: day.overtimeHours,
                notes: '', // AttendanceDay doesn't have notes
                isOverride: day.isOverride,
                overrideReason: day.overrideReason || '', // Use overrideReason if available
                createdAt: new Date().toISOString(), // Default value
                updatedAt: new Date().toISOString()  // Default value
              } as AttendanceRecord));
            })
          );
          
          return allAttendanceData.flat();
        } catch (error) {
          console.error('Failed to fetch attendance data, falling back to mock data:', error);
          return generateMockAttendanceData(jalaliMonth, jalaliYear);
        }
      }
    },
    enabled,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

export interface UseAdminDashboardOptions {
  jalaliMonth?: number;  // Changed: Use Jalali month
  jalaliYear?: number;   // Changed: Use Jalali year
  refetchInterval?: number;
  enabled?: boolean;
}

export function useAdminDashboard(options: UseAdminDashboardOptions = {}) {
  const currentJalali = getCurrentJalaliDate();
  const { 
    jalaliMonth = currentJalali.jm, 
    jalaliYear = currentJalali.jy,
    refetchInterval = 30000,
    enabled = true 
  } = options;

  const statsQuery = useDashboardStats({ refetchInterval, enabled });
  const inspectorsQuery = useInspectors({ enabled });
  const attendanceQuery = useAttendanceData({ jalaliMonth, jalaliYear, enabled });
  
  // Separate query for today's attendance (always fetch current month for today's count)
  const todayAttendanceQuery = useAttendanceData({ 
    jalaliMonth: currentJalali.jm, 
    jalaliYear: currentJalali.jy, 
    enabled 
  });

  return {
    stats: statsQuery.data || emptyDashboardStats,
    inspectors: inspectorsQuery.data || [],
    attendanceData: attendanceQuery.data || [],
    todayAttendanceData: todayAttendanceQuery.data || [],
    isLoading: statsQuery.isLoading || inspectorsQuery.isLoading || attendanceQuery.isLoading,
    isError: statsQuery.isError || inspectorsQuery.isError || attendanceQuery.isError,
    error: statsQuery.error || inspectorsQuery.error || attendanceQuery.error,
    refetch: () => {
      statsQuery.refetch();
      inspectorsQuery.refetch();
      attendanceQuery.refetch();
      todayAttendanceQuery.refetch();
    }
  };
}

// Real-time updates hook
export function useRealTimeUpdates() {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    // Set up WebSocket connection for real-time updates
    // TODO: Implement WebSocket connection
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refetch data when tab becomes visible
        queryClient.invalidateQueries({ queryKey: ['admin'] });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  const invalidateStats = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats'] });
  };

  const invalidateInspectors = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'inspectors'] });
  };

  const invalidateAttendance = (jalaliMonth?: number, jalaliYear?: number) => {
    if (jalaliMonth && jalaliYear) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'jalali', jalaliYear, jalaliMonth] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });
    }
  };

  return {
    invalidateAll,
    invalidateStats,
    invalidateInspectors,
    invalidateAttendance
  };
}

export default useAdminDashboard;
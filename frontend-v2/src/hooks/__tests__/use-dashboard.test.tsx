import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData } from '@/hooks/use-dashboard';

// Mock the API
jest.mock('@/lib/api', () => ({
  fetchDashboardData: jest.fn(),
}));

import { fetchDashboardData } from '@/lib/api';

const mockFetchDashboardData = fetchDashboardData as jest.MockedFunction<
  typeof fetchDashboardData
>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  TestWrapper.displayName = 'TestWrapper';

  return TestWrapper;
}

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockFetchDashboardData.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('returns data on successful fetch', async () => {
    const mockData = {
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
          equipment: 'Test Equipment',
          status: 'Completed' as const,
          date: '2024-01-15',
        },
      ],
      systemMetrics: [
        { name: 'System Performance', value: '98.5%', color: 'text-green-600' },
      ],
    };

    mockFetchDashboardData.mockResolvedValue(mockData);

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockFetchDashboardData).toHaveBeenCalledTimes(1);
  });

  it('returns error on failed fetch', async () => {
    const mockError = new Error('API Error');
    mockFetchDashboardData.mockRejectedValue(mockError);

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(mockError);
  });

  it('refetches data when query is invalidated', async () => {
    const mockData1 = {
      stats: {
        totalEquipment: 1000,
        activeInspections: 50,
        inspectors: 20,
        pendingReports: 10,
        equipmentGrowth: '+10% from last month',
        inspectionsGrowth: '+5% from last month',
        inspectorsChange: '+1 new this month',
        reportsChange: '-2 from yesterday',
      },
      recentInspections: [],
      systemMetrics: [],
    };

    const mockData2 = {
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
      recentInspections: [],
      systemMetrics: [],
    };

    mockFetchDashboardData
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2);

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    // Wait for first fetch
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Trigger refetch
    result.current.refetch();

    // Wait for second fetch
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(mockFetchDashboardData).toHaveBeenCalledTimes(2);
  });
});

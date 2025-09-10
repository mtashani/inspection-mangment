import { fetchDashboardData } from '@/lib/api'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock fetch
global.fetch = jest.fn()

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('mock-token')
  })

  describe('fetchDashboardData', () => {
    it('fetches dashboard data successfully', async () => {
      const mockResponse = {
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
          { id: 'INS-001', equipment: 'Test Equipment', status: 'Completed', date: '2024-01-15' },
        ],
        systemMetrics: [
          { name: 'System Performance', value: '98.5%', color: 'text-green-600' },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchDashboardData()

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/dashboard', {
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('returns mock data when API fails', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchDashboardData()

      // Should return mock data structure
      expect(result).toHaveProperty('stats')
      expect(result).toHaveProperty('recentInspections')
      expect(result).toHaveProperty('systemMetrics')
      expect(result.stats.totalEquipment).toBe(1234)
      expect(result.recentInspections).toHaveLength(4)
      expect(result.systemMetrics).toHaveLength(4)
    })

    it('returns mock data when API returns error status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const result = await fetchDashboardData()

      // Should return mock data structure
      expect(result).toHaveProperty('stats')
      expect(result).toHaveProperty('recentInspections')
      expect(result).toHaveProperty('systemMetrics')
    })

    it('handles missing token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const mockResponse = {
        stats: {
          totalEquipment: 0,
          activeInspections: 0,
          inspectors: 0,
          pendingReports: 0,
          equipmentGrowth: '',
          inspectionsGrowth: '',
          inspectorsChange: '',
          reportsChange: '',
        },
        recentInspections: [],
        systemMetrics: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchDashboardData()

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/dashboard', {
        headers: {
          Authorization: 'Bearer null',
          'Content-Type': 'application/json',
        },
      })
    })

    it('uses default API URL when environment variable is not set', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await fetchDashboardData()

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/v1/dashboard', {
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      })
    })
  })
})
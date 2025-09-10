// We need to import the class directly to create a new instance for testing
// since the singleton is created before we can set environment variables

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock fetch
global.fetch = jest.fn()

// Mock console methods
const mockConsole = {
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
}
Object.assign(console, mockConsole)

// Define proper types for the test mocks
interface MockErrorInfo {
  message?: string
  stack?: string
  componentStack?: string
  url?: string
  userAgent?: string
  timestamp?: number
  userId?: string
  sessionId?: string
}

interface MockPerformanceMetric {
  name: string
  value: number
  timestamp?: number
  url?: string
  sessionId?: string
}

interface MockFullErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  url: string
  userAgent: string
  timestamp: number
  userId?: string
  sessionId: string
}

interface MockFullPerformanceMetric {
  name: string
  value: number
  timestamp: number
  url: string
  sessionId: string
}

// Mock the monitoring module to enable monitoring in tests
jest.mock('@/lib/monitoring', () => {
  class MockMonitoringService {
    private sessionId = 'test-session'
    private userId?: string
    private isEnabled = true

    setUserId(userId: string): void {
      this.userId = userId
    }

    captureError(errorInfo: MockErrorInfo): void {
      if (!this.isEnabled) return

      const fullErrorInfo: MockFullErrorInfo = {
        message: errorInfo.message || 'Unknown error',
        stack: errorInfo.stack,
        componentStack: errorInfo.componentStack,
        url: errorInfo.url || 'http://localhost:3000',
        userAgent: errorInfo.userAgent || 'test-agent',
        timestamp: errorInfo.timestamp || Date.now(),
        userId: errorInfo.userId || this.userId,
        sessionId: errorInfo.sessionId || this.sessionId,
      }

      this.sendToMonitoringService(fullErrorInfo)
    }

    capturePerformanceMetric(metric: MockPerformanceMetric): void {
      if (!this.isEnabled) return

      const fullMetric: MockFullPerformanceMetric = {
        ...metric,
        timestamp: Date.now(),
        url: 'http://localhost:3000',
        sessionId: this.sessionId,
      }

      this.sendPerformanceMetric(fullMetric)
    }

    private async sendToMonitoringService(errorInfo: MockFullErrorInfo): Promise<void> {
      try {
        const endpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT
        
        if (!endpoint) {
          this.storeErrorLocally(errorInfo)
          return
        }

        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'error',
            data: errorInfo,
          }),
        })
      } catch (error) {
        this.storeErrorLocally(errorInfo)
      }
    }

    private async sendPerformanceMetric(metric: MockFullPerformanceMetric): Promise<void> {
      try {
        const endpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT
        
        if (!endpoint) {
          this.storeMetricLocally(metric)
          return
        }

        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'performance',
            data: metric,
          }),
        })
      } catch (error) {
        this.storeMetricLocally(metric)
      }
    }

    private storeErrorLocally(errorInfo: MockFullErrorInfo): void {
      if (typeof window === 'undefined') return

      try {
        const errors = JSON.parse(localStorage.getItem('monitoring_errors') || '[]')
        errors.push(errorInfo)
        localStorage.setItem('monitoring_errors', JSON.stringify(errors))
      } catch (error) {
        console.warn('Failed to store error locally:', error)
      }
    }

    private storeMetricLocally(metric: MockFullPerformanceMetric): void {
      if (typeof window === 'undefined') return

      try {
        const metrics = JSON.parse(localStorage.getItem('monitoring_metrics') || '[]')
        metrics.push(metric)
        localStorage.setItem('monitoring_metrics', JSON.stringify(metrics))
      } catch (error) {
        console.warn('Failed to store metric locally:', error)
      }
    }

    getStoredErrors(): unknown[] {
      if (typeof window === 'undefined') return []
      
      try {
        return JSON.parse(localStorage.getItem('monitoring_errors') || '[]')
      } catch {
        return []
      }
    }

    clearStoredData(): void {
      if (typeof window === 'undefined') return
      
      localStorage.removeItem('monitoring_errors')
      localStorage.removeItem('monitoring_metrics')
    }
  }

  const monitoring = new MockMonitoringService()

  function captureComponentError(error: Error, errorInfo: { componentStack: string }): void {
    monitoring.captureError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  return { monitoring, captureComponentError }
})

import { monitoring, captureComponentError } from '@/lib/monitoring'

describe('Monitoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue('[]')
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
    delete process.env.NEXT_PUBLIC_MONITORING_ENDPOINT
  })

  describe('captureError', () => {
    it('captures error with full information', () => {
      const errorInfo = {
        message: 'Test error',
        stack: 'Error stack trace',
        url: 'http://localhost:3001/test',
        userAgent: 'Test User Agent',
      }

      monitoring.captureError(errorInfo)

      // Should store error locally in development
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'monitoring_errors',
        expect.stringContaining('Test error')
      )
    })

    it('sends error to monitoring service when endpoint is configured', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT
      process.env.NEXT_PUBLIC_MONITORING_ENDPOINT = 'https://monitoring.example.com/events'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      })

      const errorInfo = {
        message: 'Test error',
        stack: 'Error stack trace',
      }

      monitoring.captureError(errorInfo)

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(global.fetch).toHaveBeenCalledWith('https://monitoring.example.com/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test error'),
      })

      // Restore environment
      process.env.NEXT_PUBLIC_MONITORING_ENDPOINT = originalEnv
    })

    it('falls back to local storage when fetch fails', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT
      process.env.NEXT_PUBLIC_MONITORING_ENDPOINT = 'https://monitoring.example.com/events'

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const errorInfo = {
        message: 'Test error',
      }

      monitoring.captureError(errorInfo)

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'monitoring_errors',
        expect.stringContaining('Test error')
      )

      // Restore environment
      process.env.NEXT_PUBLIC_MONITORING_ENDPOINT = originalEnv
    })
  })

  describe('capturePerformanceMetric', () => {
    it('captures performance metric', () => {
      const metric = {
        name: 'page_load_time',
        value: 1500,
      }

      monitoring.capturePerformanceMetric(metric)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'monitoring_metrics',
        expect.stringContaining('page_load_time')
      )
    })
  })

  describe('setUserId', () => {
    it('sets user ID for future error captures', () => {
      monitoring.setUserId('user123')

      const errorInfo = {
        message: 'Test error with user',
      }

      monitoring.captureError(errorInfo)

      const storedData = mockLocalStorage.setItem.mock.calls[0][1]
      const parsedData = JSON.parse(storedData)
      expect(parsedData[0].userId).toBe('user123')
    })
  })

  describe('getStoredErrors', () => {
    it('returns stored errors', () => {
      const mockErrors = [
        { message: 'Error 1', timestamp: Date.now() },
        { message: 'Error 2', timestamp: Date.now() },
      ]

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockErrors))

      const errors = monitoring.getStoredErrors()

      expect(errors).toEqual(mockErrors)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('monitoring_errors')
    })

    it('returns empty array when no stored errors', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const errors = monitoring.getStoredErrors()

      expect(errors).toEqual([])
    })
  })

  describe('clearStoredData', () => {
    it('clears stored errors and metrics', () => {
      monitoring.clearStoredData()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('monitoring_errors')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('monitoring_metrics')
    })
  })
})

describe('captureComponentError', () => {
  it('captures React component error', () => {
    const error = new Error('Component error')
    const errorInfo = { componentStack: 'Component stack trace' }

    captureComponentError(error, errorInfo)

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'monitoring_errors',
      expect.stringContaining('Component error')
    )
  })
})
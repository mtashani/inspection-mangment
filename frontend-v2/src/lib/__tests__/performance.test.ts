import { debounce, throttle, measurePerformance } from '@/lib/performance'

// Mock console
const mockConsole = {
  log: jest.fn(),
}
Object.assign(console, mockConsole)

// Mock performance API
const mockPerformance = {
  now: jest.fn(),
}
Object.defineProperty(window, 'performance', { value: mockPerformance })

describe('Performance Utilities', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('debounce', () => {

    it('delays function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })

    it('cancels previous calls when called again', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1')
      jest.advanceTimersByTime(50)
      
      debouncedFn('arg2')
      jest.advanceTimersByTime(50)

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(50)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg2')
    })
  })

  describe('throttle', () => {

    it('limits function execution frequency', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('arg1')
      throttledFn('arg2')
      throttledFn('arg3')

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')

      jest.advanceTimersByTime(100)

      throttledFn('arg4')

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('arg4')
    })

    it('ignores calls during throttle period', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('arg1')
      jest.advanceTimersByTime(50)
      throttledFn('arg2')
      jest.advanceTimersByTime(25)
      throttledFn('arg3')

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')

      jest.advanceTimersByTime(25)
      throttledFn('arg4')

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('arg4')
    })
  })

  describe('measurePerformance', () => {
    it('measures function execution time', () => {
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150)

      const mockFn = jest.fn()
      measurePerformance('test operation', mockFn)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockConsole.log).toHaveBeenCalledWith('test operation took 50 milliseconds')
    })

    it('executes function even without performance API', () => {
      // Remove performance API
      delete (window as unknown as { performance?: unknown }).performance

      const mockFn = jest.fn()
      measurePerformance('test operation', mockFn)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockConsole.log).not.toHaveBeenCalled()

      // Restore performance API
      Object.defineProperty(window, 'performance', { value: mockPerformance })
    })
  })
})
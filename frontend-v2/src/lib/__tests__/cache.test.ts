import { clientCache, localStorageCache } from '@/lib/cache'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('Client Cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clientCache.clear()
  })

  it('stores and retrieves data', () => {
    const testData = { message: 'Hello World' }
    
    clientCache.set('test-key', testData, 5)
    const retrieved = clientCache.get('test-key')
    
    expect(retrieved).toEqual(testData)
  })

  it('returns null for non-existent keys', () => {
    const result = clientCache.get('non-existent-key')
    expect(result).toBeNull()
  })

  it('expires data after TTL', () => {
    const testData = { message: 'Hello World' }
    
    // Mock Date.now to control time
    const originalNow = Date.now
    let currentTime = 1000000
    Date.now = jest.fn(() => currentTime)
    
    clientCache.set('test-key', testData, 1) // 1 minute TTL
    
    // Data should be available immediately
    expect(clientCache.get('test-key')).toEqual(testData)
    
    // Move time forward by 2 minutes
    currentTime += 2 * 60 * 1000
    
    // Data should be expired
    expect(clientCache.get('test-key')).toBeNull()
    
    // Restore Date.now
    Date.now = originalNow
  })

  it('deletes specific keys', () => {
    clientCache.set('key1', 'value1')
    clientCache.set('key2', 'value2')
    
    clientCache.delete('key1')
    
    expect(clientCache.get('key1')).toBeNull()
    expect(clientCache.get('key2')).toBe('value2')
  })

  it('clears all data', () => {
    clientCache.set('key1', 'value1')
    clientCache.set('key2', 'value2')
    
    clientCache.clear()
    
    expect(clientCache.get('key1')).toBeNull()
    expect(clientCache.get('key2')).toBeNull()
  })
})

describe('LocalStorage Cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('stores data in localStorage', () => {
    const testData = { message: 'Hello World' }
    
    localStorageCache.set('test-key', testData, 60)
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      expect.stringContaining('Hello World')
    )
  })

  it('retrieves data from localStorage', () => {
    const testData = { message: 'Hello World' }
    const storedItem = {
      data: testData,
      timestamp: Date.now(),
      ttl: 60 * 60 * 1000,
    }
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedItem))
    
    const result = localStorageCache.get('test-key')
    expect(result).toEqual(testData)
  })

  it('returns null for expired data', () => {
    const testData = { message: 'Hello World' }
    const expiredItem = {
      data: testData,
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      ttl: 60 * 60 * 1000, // 1 hour TTL
    }
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredItem))
    
    const result = localStorageCache.get('test-key')
    expect(result).toBeNull()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('handles localStorage errors gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    
    // Should not throw
    expect(() => {
      localStorageCache.set('test-key', 'test-data')
    }).not.toThrow()
  })

  it('deletes items from localStorage', () => {
    localStorageCache.delete('test-key')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('clears all localStorage', () => {
    localStorageCache.clear()
    expect(mockLocalStorage.clear).toHaveBeenCalled()
  })
})
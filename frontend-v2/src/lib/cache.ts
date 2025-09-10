// Client-side caching utilities

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class ClientCache {
  private cache = new Map<string, CacheItem<unknown>>()

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000 // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const clientCache = new ClientCache()

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    clientCache.cleanup()
  }, 5 * 60 * 1000)
}

// Local Storage with expiration
export const localStorageCache = {
  set<T>(key: string, data: T, ttlMinutes: number = 60): void {
    if (typeof window === 'undefined') return
    
    const item = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const parsed = JSON.parse(item)
      
      // Check if expired
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key)
        return null
      }
      
      return parsed.data
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
      return null
    }
  },

  delete(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.clear()
  },
}
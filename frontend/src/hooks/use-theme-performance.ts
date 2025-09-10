/**
 * Theme Performance Hook
 * Provides performance monitoring and optimization utilities for theme operations
 */

import { useCallback, useEffect, useState } from 'react'
import { globalThemeApplier, globalThemePreloader, debugPerformance, themePerformance, BundleSizeOptimizer } from '@/design-system/utils/theme-performance'

/**
 * Performance metrics interface
 */
export interface ThemePerformanceMetrics {
  themeSwitch: {
    avg: number
    min: number
    max: number
    count: number
  }
  variantApply: {
    avg: number
    min: number
    max: number
    count: number
  }
  cssUpdate: {
    avg: number
    min: number
    max: number
    count: number
  }
}

/**
 * Cache information interface
 */
export interface ThemeCacheInfo {
  themeCount: number
  styleCount: number
  totalSize: number
  hitRate: number
}

/**
 * Theme performance hook options
 */
export interface UseThemePerformanceOptions {
  /** Enable automatic performance logging */
  enableLogging?: boolean
  /** Log interval in milliseconds */
  logInterval?: number
  /** Enable cache monitoring */
  enableCacheMonitoring?: boolean
}

/**
 * Theme performance hook result
 */
export interface UseThemePerformanceResult {
  /** Current performance metrics */
  metrics: ThemePerformanceMetrics
  /** Cache information */
  cacheInfo: ThemeCacheInfo
  /** Whether performance monitoring is active */
  isMonitoring: boolean
  /** Start performance monitoring */
  startMonitoring: () => void
  /** Stop performance monitoring */
  stopMonitoring: () => void
  /** Clear all metrics and cache */
  clearAll: () => void
  /** Get detailed performance report */
  getPerformanceReport: () => string
  /** Export metrics as JSON */
  exportMetrics: () => string
}

/**
 * Custom hook for theme performance monitoring and optimization
 */
export function useThemePerformance(options: UseThemePerformanceOptions = {}): UseThemePerformanceResult {
  const {
    enableLogging = false,
    logInterval = 10000, // 10 seconds
    enableCacheMonitoring = true
  } = options
  
  const [metrics, setMetrics] = useState<ThemePerformanceMetrics>({
    themeSwitch: { avg: 0, min: 0, max: 0, count: 0 },
    variantApply: { avg: 0, min: 0, max: 0, count: 0 },
    cssUpdate: { avg: 0, min: 0, max: 0, count: 0 }
  })
  
  const [cacheInfo, setCacheInfo] = useState<ThemeCacheInfo>({
    themeCount: 0,
    styleCount: 0,
    totalSize: 0,
    hitRate: 0
  })
  
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [logInterval_, setLogInterval_] = useState<NodeJS.Timeout | null>(null)
  
  /**
   * Update metrics from global applier
   */
  const updateMetrics = useCallback(() => {
    try {
      const stats = globalThemeApplier.getPerformanceStats()
      // Ensure stats match expected interface
      const typedStats: ThemePerformanceMetrics = {
        themeSwitch: stats.themeSwitch || { avg: 0, min: 0, max: 0, count: 0 },
        variantApply: stats.variantApply || { avg: 0, min: 0, max: 0, count: 0 },
        cssUpdate: stats.cssUpdate || { avg: 0, min: 0, max: 0, count: 0 }
      }
      setMetrics(typedStats)
    } catch (error) {
      console.warn('Failed to update theme performance metrics:', error)
    }
  }, [])
  
  /**
   * Update cache information
   */
  const updateCacheInfo = useCallback(() => {
    if (enableCacheMonitoring) {
      const info = themePerformance.cache.getCacheInfo()
      setCacheInfo(info)
    }
  }, [enableCacheMonitoring])
  
  /**
   * Start performance monitoring
   */
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
    
    if (enableLogging) {
      const interval = setInterval(() => {
        updateMetrics()
        updateCacheInfo()
        debugPerformance.logPerformanceStats()
        debugPerformance.logCacheInfo()
      }, logInterval)
      
      setLogInterval_(interval)
    }
  }, [enableLogging, logInterval, updateMetrics, updateCacheInfo])
  
  /**
   * Stop performance monitoring
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    
    if (logInterval_) {
      clearInterval(logInterval_)
      setLogInterval_(null)
    }
  }, [logInterval_])
  
  /**
   * Clear all metrics and cache
   */
  const clearAll = useCallback(() => {
    debugPerformance.clearAll()
    updateMetrics()
    updateCacheInfo()
  }, [updateMetrics, updateCacheInfo])
  
  /**
   * Get detailed performance report
   */
  const getPerformanceReport = useCallback((): string => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      cacheInfo,
      recommendations: generateRecommendations(metrics, cacheInfo)
    }
    
    return JSON.stringify(report, null, 2)
  }, [metrics, cacheInfo])
  
  /**
   * Export metrics as JSON
   */
  const exportMetrics = useCallback((): string => {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics,
      cacheInfo
    }, null, 2)
  }, [metrics, cacheInfo])\n  \n  // Update metrics periodically when monitoring\n  useEffect(() => {\n    if (isMonitoring) {\n      const interval = setInterval(() => {\n        updateMetrics()\n        updateCacheInfo()\n      }, 1000) // Update every second\n      \n      return () => clearInterval(interval)\n    }\n  }, [isMonitoring, updateMetrics, updateCacheInfo])\n  \n  // Initial metrics load\n  useEffect(() => {\n    updateMetrics()\n    updateCacheInfo()\n  }, [])\n  \n  return {\n    metrics,\n    cacheInfo,\n    isMonitoring,\n    startMonitoring,\n    stopMonitoring,\n    clearAll,\n    getPerformanceReport,\n    exportMetrics\n  }\n}\n\n/**\n * Generate performance recommendations\n */\nfunction generateRecommendations(\n  metrics: ThemePerformanceMetrics,\n  cacheInfo: ThemeCacheInfo\n): string[] {\n  const recommendations: string[] = []\n  \n  // Theme switch performance\n  if (metrics.themeSwitch.avg > 100) {\n    recommendations.push('Theme switching is slow (>100ms). Consider reducing theme complexity or enabling caching.')\n  }\n  \n  if (metrics.themeSwitch.max > 500) {\n    recommendations.push('Maximum theme switch time is very high (>500ms). Check for layout thrashing or heavy CSS operations.')\n  }\n  \n  // Variant application performance\n  if (metrics.variantApply.avg > 50) {\n    recommendations.push('Variant application is slow (>50ms). Consider batching variant updates.')\n  }\n  \n  // CSS update performance\n  if (metrics.cssUpdate.avg > 16) {\n    recommendations.push('CSS updates are causing frame drops (>16ms). Consider using CSS transitions or reducing update frequency.')\n  }\n  \n  // Cache recommendations\n  if (cacheInfo.totalSize > 1024 * 1024) { // 1MB\n    recommendations.push('Theme cache is large (>1MB). Consider clearing unused themes or implementing cache limits.')\n  }\n  \n  if (cacheInfo.themeCount > 20) {\n    recommendations.push('Many themes are cached (>20). Consider implementing LRU cache eviction.')\n  }\n  \n  // Performance recommendations\n  if (metrics.themeSwitch.count > 100 && metrics.themeSwitch.avg > 50) {\n    recommendations.push('Frequent theme switching detected with slow performance. Consider implementing theme preloading.')\n  }\n  \n  if (recommendations.length === 0) {\n    recommendations.push('Theme performance is optimal! No recommendations at this time.')\n  }\n  \n  return recommendations\n}\n\n/**\n * Performance debugging utilities\n */\nexport const themePerformanceDebug = {\n  /**\n   * Log current performance state\n   */\n  logCurrentState(): void {\n    console.group('🎨 Theme Performance Debug')\n    debugPerformance.logPerformanceStats()\n    debugPerformance.logCacheInfo()\n    console.groupEnd()\n  },\n  \n  /**\n   * Benchmark theme switching\n   */\n  async benchmarkThemeSwitch(themeIds: string[], iterations = 10): Promise<number[]> {\n    const results: number[] = []\n    \n    for (let i = 0; i < iterations; i++) {\n      for (const themeId of themeIds) {\n        const start = performance.now()\n        \n        // Simulate theme switch\n        await new Promise(resolve => {\n          document.documentElement.setAttribute('data-theme', themeId)\n          requestAnimationFrame(resolve)\n        })\n        \n        const duration = performance.now() - start\n        results.push(duration)\n      }\n    }\n    \n    return results\n  },\n  \n  /**\n   * Analyze cache efficiency\n   */\n  analyzeCacheEfficiency(): {\n    hitRate: number\n    missRate: number\n    efficiency: 'excellent' | 'good' | 'fair' | 'poor'\n  } {\n    const info = themePerformance.cache.getCacheInfo()\n    \n    // Simple cache efficiency calculation\n    // In a real implementation, we'd track hits/misses\n    const hitRate = Math.min(info.themeCount / 10, 1) // Assume 10 themes is optimal\n    const missRate = 1 - hitRate\n    \n    let efficiency: 'excellent' | 'good' | 'fair' | 'poor'\n    if (hitRate > 0.9) efficiency = 'excellent'\n    else if (hitRate > 0.7) efficiency = 'good'\n    else if (hitRate > 0.5) efficiency = 'fair'\n    else efficiency = 'poor'\n    \n    return { hitRate, missRate, efficiency }\n  }\n}"
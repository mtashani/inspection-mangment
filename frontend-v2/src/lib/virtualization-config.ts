// Configuration for virtualization behavior across the application

export interface VirtualizationConfig {
  // When to enable virtualization (minimum number of items)
  threshold: number
  
  // Estimated item heights for different components
  estimatedHeights: {
    eventCard: number
    inspectionCard: number
    dailyReportCard: number
    dailyReportCardCompact: number
  }
  
  // Container heights for different views
  containerHeights: {
    eventsOverview: number
    inspectionsList: number
    dailyReportsList: number
    modal: number
  }
  
  // Performance settings
  performance: {
    overscanCount: number
    scrollThreshold: number
    debounceDelay: number
    maxCacheSize: number
  }
  
  // Feature flags
  features: {
    enablePerformanceMonitoring: boolean
    enableScrollRestoration: boolean
    enableDynamicHeights: boolean
    enableInfiniteLoading: boolean
  }
}

// Default configuration
export const defaultVirtualizationConfig: VirtualizationConfig = {
  threshold: 50, // Enable virtualization when more than 50 items
  
  estimatedHeights: {
    eventCard: 200,
    inspectionCard: 120, // Collapsed state
    dailyReportCard: 180,
    dailyReportCardCompact: 80
  },
  
  containerHeights: {
    eventsOverview: 600,
    inspectionsList: 500,
    dailyReportsList: 400,
    modal: 300
  },
  
  performance: {
    overscanCount: 5, // Render 5 extra items outside viewport
    scrollThreshold: 15, // Load more when 15 items from end
    debounceDelay: 100, // Debounce scroll events by 100ms
    maxCacheSize: 1000 // Maximum cached item heights
  },
  
  features: {
    enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
    enableScrollRestoration: true,
    enableDynamicHeights: true,
    enableInfiniteLoading: true
  }
}

// Component-specific configurations
export const componentVirtualizationConfig = {
  eventsOverview: {
    threshold: 30,
    estimatedHeight: defaultVirtualizationConfig.estimatedHeights.eventCard,
    containerHeight: defaultVirtualizationConfig.containerHeights.eventsOverview,
    overscan: 3
  },
  
  inspectionsList: {
    threshold: 20,
    estimatedHeight: defaultVirtualizationConfig.estimatedHeights.inspectionCard,
    containerHeight: defaultVirtualizationConfig.containerHeights.inspectionsList,
    overscan: 3
  },
  
  dailyReportsList: {
    threshold: 25,
    estimatedHeight: defaultVirtualizationConfig.estimatedHeights.dailyReportCard,
    estimatedHeightCompact: defaultVirtualizationConfig.estimatedHeights.dailyReportCardCompact,
    containerHeight: defaultVirtualizationConfig.containerHeights.dailyReportsList,
    overscan: 5
  }
}

// Utility functions for virtualization decisions
export function shouldVirtualize(itemCount: number, componentType: keyof typeof componentVirtualizationConfig): boolean {
  const config = componentVirtualizationConfig[componentType]
  return itemCount > config.threshold && defaultVirtualizationConfig.features.enableDynamicHeights
}

export function getVirtualizationConfig(componentType: keyof typeof componentVirtualizationConfig) {
  return {
    ...defaultVirtualizationConfig,
    ...componentVirtualizationConfig[componentType]
  }
}

// Performance thresholds for different device types
export const devicePerformanceConfig = {
  mobile: {
    threshold: 25, // Lower threshold for mobile devices
    overscanCount: 3,
    maxCacheSize: 500
  },
  
  tablet: {
    threshold: 40,
    overscanCount: 4,
    maxCacheSize: 750
  },
  
  desktop: {
    threshold: 50,
    overscanCount: 5,
    maxCacheSize: 1000
  }
}

// Detect device type and adjust configuration
export function getDeviceOptimizedConfig(): Partial<VirtualizationConfig> {
  if (typeof window === 'undefined') {
    return defaultVirtualizationConfig
  }
  
  const width = window.innerWidth
  
  if (width < 768) {
    return {
      ...defaultVirtualizationConfig,
      threshold: devicePerformanceConfig.mobile.threshold,
      performance: {
        ...defaultVirtualizationConfig.performance,
        overscanCount: devicePerformanceConfig.mobile.overscanCount,
        maxCacheSize: devicePerformanceConfig.mobile.maxCacheSize
      }
    }
  } else if (width < 1024) {
    return {
      ...defaultVirtualizationConfig,
      threshold: devicePerformanceConfig.tablet.threshold,
      performance: {
        ...defaultVirtualizationConfig.performance,
        overscanCount: devicePerformanceConfig.tablet.overscanCount,
        maxCacheSize: devicePerformanceConfig.tablet.maxCacheSize
      }
    }
  }
  
  return defaultVirtualizationConfig
}

// Memory usage monitoring
export function getMemoryUsageThreshold(): number {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return 0.8 // Default 80% threshold
  }
  
  const memory = (performance as unknown).memory as {
    jsHeapSizeLimit: number
  }
  
  if (memory && memory.jsHeapSizeLimit) {
    // Use 70% of available memory as threshold
    return 0.7
  }
  
  return 0.8
}

// Adaptive virtualization based on performance
export function getAdaptiveVirtualizationConfig(
  itemCount: number,
  componentType: keyof typeof componentVirtualizationConfig,
  performanceMetrics?: {
    fps: number
    memoryUsage: number
    renderTime: number
  }
): VirtualizationConfig {
  const baseConfig = getVirtualizationConfig(componentType)
  const deviceConfig = getDeviceOptimizedConfig()
  
  // If no performance metrics, use device-optimized config
  if (!performanceMetrics) {
    return { ...baseConfig, ...deviceConfig }
  }
  
  const { fps, memoryUsage, renderTime } = performanceMetrics
  
  // Adjust threshold based on performance
  let adjustedThreshold = baseConfig.threshold
  
  // Lower threshold if performance is poor
  if (fps < 30 || memoryUsage > 80 || renderTime > 16) {
    adjustedThreshold = Math.max(10, Math.floor(adjustedThreshold * 0.6))
  }
  
  // Raise threshold if performance is excellent
  if (fps > 55 && memoryUsage < 50 && renderTime < 8) {
    adjustedThreshold = Math.floor(adjustedThreshold * 1.5)
  }
  
  return {
    ...baseConfig,
    ...deviceConfig,
    threshold: adjustedThreshold
  }
}
'use client'

import { useEffect } from 'react'
import { measureWebVitals } from '@/lib/performance'

export function PerformanceMonitor() {
  useEffect(() => {
    // Only measure in development or when explicitly enabled
    const shouldMeasure = 
      process.env.NODE_ENV === 'development' || 
      process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'

    if (shouldMeasure) {
      measureWebVitals()
    }
  }, [])

  // This component doesn't render anything
  return null
}
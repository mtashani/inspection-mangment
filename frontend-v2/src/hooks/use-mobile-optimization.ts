'use client'

import { useState, useEffect } from 'react'

interface MobileOptimizationHook {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenSize: 'mobile' | 'tablet' | 'desktop'
  orientation: 'portrait' | 'landscape'
}

export function useMobileOptimization(): MobileOptimizationHook {
  const [screenInfo, setScreenInfo] = useState<MobileOptimizationHook>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'desktop',
    orientation: 'landscape'
  })

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024

      const screenSize: 'mobile' | 'tablet' | 'desktop' = 
        isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'

      const orientation: 'portrait' | 'landscape' = 
        height > width ? 'portrait' : 'landscape'

      setScreenInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize,
        orientation
      })
    }

    // Initial check
    updateScreenInfo()

    // Listen for resize events
    window.addEventListener('resize', updateScreenInfo)
    window.addEventListener('orientationchange', updateScreenInfo)

    return () => {
      window.removeEventListener('resize', updateScreenInfo)
      window.removeEventListener('orientationchange', updateScreenInfo)
    }
  }, [])

  return screenInfo
}

// Hook for touch-friendly interactions
export function useTouchOptimization() {
  const { isTouchDevice, isMobile } = useMobileOptimization()

  const getTouchProps = (onClick?: () => void) => {
    if (!isTouchDevice) return { onClick }

    return {
      onClick,
      onTouchStart: (e: React.TouchEvent) => {
        // Add touch feedback
        const target = e.currentTarget as HTMLElement
        target.style.transform = 'scale(0.98)'
        target.style.transition = 'transform 0.1s ease'
      },
      onTouchEnd: (e: React.TouchEvent) => {
        // Remove touch feedback
        const target = e.currentTarget as HTMLElement
        setTimeout(() => {
          target.style.transform = 'scale(1)'
        }, 100)
      }
    }
  }

  const getMinTouchTarget = () => ({
    minHeight: isTouchDevice ? '44px' : 'auto',
    minWidth: isTouchDevice ? '44px' : 'auto'
  })

  return {
    isTouchDevice,
    isMobile,
    getTouchProps,
    getMinTouchTarget
  }
}

// Hook for responsive grid calculations
export function useResponsiveGrid() {
  const { screenSize } = useMobileOptimization()

  const getGridCols = (mobile: number, tablet: number, desktop: number) => {
    switch (screenSize) {
      case 'mobile':
        return mobile
      case 'tablet':
        return tablet
      case 'desktop':
        return desktop
      default:
        return desktop
    }
  }

  const getGridClasses = (
    mobile: string, 
    tablet: string, 
    desktop: string
  ) => {
    return `${mobile} md:${tablet} lg:${desktop}`
  }

  return {
    screenSize,
    getGridCols,
    getGridClasses
  }
}
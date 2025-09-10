import { useState, useEffect } from 'react'

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface UseResponsiveReturn {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  currentBreakpoint: Breakpoint
  width: number
  height: number
}

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export function useResponsive(): UseResponsiveReturn {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getCurrentBreakpoint = (width: number): Breakpoint => {
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    return 'sm'
  }

  const currentBreakpoint = getCurrentBreakpoint(dimensions.width)
  
  return {
    isMobile: dimensions.width < breakpoints.md,
    isTablet: dimensions.width >= breakpoints.md && dimensions.width < breakpoints.lg,
    isDesktop: dimensions.width >= breakpoints.lg,
    isLargeDesktop: dimensions.width >= breakpoints.xl,
    currentBreakpoint,
    width: dimensions.width,
    height: dimensions.height
  }
}

// Hook for checking if a specific breakpoint is active
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const { width } = useResponsive()
  return width >= breakpoints[breakpoint]
}

// Hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Utility function to get responsive classes
export function getResponsiveClasses(
  mobile: string,
  tablet?: string,
  desktop?: string,
  largeDesktop?: string
): string {
  const classes = [mobile]
  
  if (tablet) classes.push(`md:${tablet}`)
  if (desktop) classes.push(`lg:${desktop}`)
  if (largeDesktop) classes.push(`xl:${largeDesktop}`)
  
  return classes.join(' ')
}

// Hook for touch device detection
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }

    checkTouch()
  }, [])

  return isTouch
}

// Hook for orientation detection
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return orientation
}

// Hook for safe area insets (for mobile devices with notches)
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  })

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement)
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0')
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)
    return () => window.removeEventListener('resize', updateSafeArea)
  }, [])

  return safeArea
}

export type { UseResponsiveReturn }
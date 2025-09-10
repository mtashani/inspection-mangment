/**
 * Custom Viewport Configurations for Storybook
 * Responsive design testing viewports
 */

export const customViewports = {
  // Mobile devices
  mobile: {
    name: 'Mobile (375px)',
    styles: {
      width: '375px',
      height: '667px',
    },
    type: 'mobile',
  },
  mobileLarge: {
    name: 'Mobile Large (414px)',
    styles: {
      width: '414px',
      height: '896px',
    },
    type: 'mobile',
  },
  
  // Tablet devices
  tablet: {
    name: 'Tablet (768px)',
    styles: {
      width: '768px',
      height: '1024px',
    },
    type: 'tablet',
  },
  tabletLarge: {
    name: 'Tablet Large (1024px)',
    styles: {
      width: '1024px',
      height: '1366px',
    },
    type: 'tablet',
  },
  
  // Desktop devices
  desktop: {
    name: 'Desktop (1200px)',
    styles: {
      width: '1200px',
      height: '800px',
    },
    type: 'desktop',
  },
  desktopLarge: {
    name: 'Desktop Large (1440px)',
    styles: {
      width: '1440px',
      height: '900px',
    },
    type: 'desktop',
  },
  
  // Wide screens
  wide: {
    name: 'Wide Screen (1920px)',
    styles: {
      width: '1920px',
      height: '1080px',
    },
    type: 'desktop',
  },
  ultraWide: {
    name: 'Ultra Wide (2560px)',
    styles: {
      width: '2560px',
      height: '1440px',
    },
    type: 'desktop',
  },
  
  // Custom breakpoints matching Tailwind CSS
  sm: {
    name: 'SM Breakpoint (640px)',
    styles: {
      width: '640px',
      height: '800px',
    },
    type: 'mobile',
  },
  md: {
    name: 'MD Breakpoint (768px)',
    styles: {
      width: '768px',
      height: '1024px',
    },
    type: 'tablet',
  },
  lg: {
    name: 'LG Breakpoint (1024px)',
    styles: {
      width: '1024px',
      height: '768px',
    },
    type: 'desktop',
  },
  xl: {
    name: 'XL Breakpoint (1280px)',
    styles: {
      width: '1280px',
      height: '800px',
    },
    type: 'desktop',
  },
  '2xl': {
    name: '2XL Breakpoint (1536px)',
    styles: {
      width: '1536px',
      height: '864px',
    },
    type: 'desktop',
  },
}

// Viewport groups for easier navigation
export const viewportGroups = {
  mobile: ['mobile', 'mobileLarge', 'sm'],
  tablet: ['tablet', 'tabletLarge', 'md'],
  desktop: ['desktop', 'desktopLarge', 'lg', 'xl', '2xl'],
  wide: ['wide', 'ultraWide'],
}

// Default viewport for stories
export const defaultViewport = 'desktop'

// Responsive testing helper
export const responsiveViewports = [
  'mobile',
  'tablet', 
  'desktop',
  'wide'
]
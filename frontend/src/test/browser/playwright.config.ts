/**
 * MCP Playwright Configuration for Browser Testing
 * Configuration for automated browser testing with MCP Playwright
 */

export interface PlaywrightConfig {
  // Browser settings
  browser: {
    type: 'chromium' | 'firefox' | 'webkit'
    headless: boolean
    viewport: {
      width: number
      height: number
    }
    deviceScaleFactor: number
  }
  
  // Test settings
  test: {
    timeout: number
    retries: number
    parallel: boolean
    screenshot: 'on' | 'off' | 'only-on-failure'
    video: 'on' | 'off' | 'retain-on-failure'
  }
  
  // Server settings
  server: {
    baseURL: string
    timeout: number
  }
  
  // Reporting
  reporting: {
    outputDir: string
    reporters: string[]
  }
}

export const defaultPlaywrightConfig: PlaywrightConfig = {
  browser: {
    type: 'chromium',
    headless: true,
    viewport: {
      width: 1280,
      height: 720
    },
    deviceScaleFactor: 1
  },
  
  test: {
    timeout: 30000,
    retries: 2,
    parallel: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  server: {
    baseURL: 'http://localhost:3000',
    timeout: 10000
  },
  
  reporting: {
    outputDir: './test-results',
    reporters: ['html', 'json', 'junit']
  }
}

// Device configurations for responsive testing
export const deviceConfigs = {
  desktop: {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
  },
  
  tablet: {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  
  mobile: {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  
  mobileWide: {
    width: 414,
    height: 896,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  }
}

// Test data configurations
export const testDataConfig = {
  // Mock API endpoints
  apiEndpoints: {
    equipment: '/api/equipment',
    inspections: '/api/inspections',
    reports: '/api/reports',
    templates: '/api/templates',
    users: '/api/users',
    rbi: '/api/rbi'
  },
  
  // Test data generators
  generators: {
    equipment: {
      count: 50,
      types: ['Pressure Vessel', 'Heat Exchanger', 'Pump', 'Tank', 'Piping'],
      statuses: ['operational', 'maintenance', 'critical', 'out-of-service'],
      riskLevels: ['low', 'medium', 'high'],
      locations: ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5']
    },
    
    inspections: {
      count: 100,
      types: ['routine', 'emergency', 'scheduled', 'follow-up'],
      statuses: ['pending', 'in-progress', 'completed', 'cancelled'],
      priorities: ['low', 'medium', 'high', 'critical']
    },
    
    reports: {
      count: 75,
      types: ['inspection', 'maintenance', 'incident', 'audit'],
      statuses: ['draft', 'pending', 'approved', 'rejected'],
      formats: ['pdf', 'excel', 'word']
    },
    
    users: {
      count: 20,
      roles: ['inspector', 'admin', 'viewer', 'manager'],
      departments: ['Operations', 'Maintenance', 'Safety', 'Engineering']
    }
  },
  
  // File paths for test assets
  testFiles: {
    images: [
      '/test-assets/equipment-photo-1.jpg',
      '/test-assets/equipment-photo-2.jpg',
      '/test-assets/inspection-image-1.png'
    ],
    documents: [
      '/test-assets/equipment-data.xlsx',
      '/test-assets/inspection-report.pdf',
      '/test-assets/template-sample.json'
    ],
    exports: [
      '/test-assets/equipment-export.csv',
      '/test-assets/inspection-export.xlsx'
    ]
  }
}

// Accessibility testing configuration
export const accessibilityConfig = {
  // WCAG compliance levels
  wcagLevel: 'AA',
  
  // Rules to test
  rules: [
    'color-contrast',
    'keyboard-navigation',
    'focus-management',
    'aria-labels',
    'heading-structure',
    'form-labels',
    'image-alt-text',
    'link-purpose'
  ],
  
  // Elements to exclude from testing
  exclude: [
    '[data-testid="loading-spinner"]',
    '[data-testid="skeleton-loader"]'
  ],
  
  // Custom rules
  customRules: {
    'custom-focus-visible': {
      description: 'Ensure focus indicators are visible',
      selector: 'button, input, select, textarea, a[href]',
      evaluate: 'element => getComputedStyle(element, ":focus").outline !== "none"'
    }
  }
}

// Performance testing configuration
export const performanceConfig = {
  // Metrics to measure
  metrics: [
    'first-contentful-paint',
    'largest-contentful-paint',
    'first-input-delay',
    'cumulative-layout-shift',
    'time-to-interactive'
  ],
  
  // Performance budgets
  budgets: {
    'first-contentful-paint': 2000,
    'largest-contentful-paint': 4000,
    'first-input-delay': 100,
    'cumulative-layout-shift': 0.1,
    'time-to-interactive': 5000
  },
  
  // Network conditions
  networkConditions: {
    'fast-3g': {
      downloadThroughput: 1.6 * 1024 * 1024 / 8,
      uploadThroughput: 750 * 1024 / 8,
      latency: 150
    },
    'slow-3g': {
      downloadThroughput: 500 * 1024 / 8,
      uploadThroughput: 500 * 1024 / 8,
      latency: 400
    }
  }
}

// Error handling configuration
export const errorHandlingConfig = {
  // Expected errors to test
  expectedErrors: [
    'Network request failed',
    'Validation error',
    'Authentication required',
    'Permission denied',
    'Resource not found',
    'Server error'
  ],
  
  // Error recovery scenarios
  recoveryScenarios: [
    'retry-on-network-error',
    'fallback-to-cached-data',
    'graceful-degradation',
    'user-notification'
  ],
  
  // Timeout configurations
  timeouts: {
    pageLoad: 30000,
    apiRequest: 10000,
    userAction: 5000,
    animation: 2000
  }
}

// Test environment configuration
export const environmentConfig = {
  // Environment variables
  env: {
    NODE_ENV: 'test',
    API_BASE_URL: 'http://localhost:3001',
    MOCK_API: 'true',
    LOG_LEVEL: 'error'
  },
  
  // Feature flags for testing
  featureFlags: {
    enableRealTimeUpdates: true,
    enableOfflineMode: true,
    enableAdvancedReporting: true,
    enableBulkOperations: true
  },
  
  // Database seeding
  database: {
    seedData: true,
    resetBetweenTests: true,
    preserveUserData: false
  }
}

// Export all configurations
export const playwrightTestConfig = {
  default: defaultPlaywrightConfig,
  devices: deviceConfigs,
  testData: testDataConfig,
  accessibility: accessibilityConfig,
  performance: performanceConfig,
  errorHandling: errorHandlingConfig,
  environment: environmentConfig
}

// Helper function to get configuration for specific test type
export function getConfigForTestType(testType: 'unit' | 'integration' | 'e2e' | 'accessibility' | 'performance'): Partial<PlaywrightConfig> {
  const baseConfig = { ...defaultPlaywrightConfig }
  
  switch (testType) {
    case 'unit':
      return {
        ...baseConfig,
        test: {
          ...baseConfig.test,
          timeout: 10000,
          parallel: true,
          screenshot: 'off',
          video: 'off'
        }
      }
      
    case 'integration':
      return {
        ...baseConfig,
        test: {
          ...baseConfig.test,
          timeout: 20000,
          parallel: false,
          screenshot: 'only-on-failure',
          video: 'retain-on-failure'
        }
      }
      
    case 'e2e':
      return {
        ...baseConfig,
        test: {
          ...baseConfig.test,
          timeout: 60000,
          parallel: false,
          screenshot: 'on',
          video: 'on'
        }
      }
      
    case 'accessibility':
      return {
        ...baseConfig,
        browser: {
          ...baseConfig.browser,
          headless: false // Better for accessibility testing
        },
        test: {
          ...baseConfig.test,
          timeout: 15000,
          screenshot: 'on'
        }
      }
      
    case 'performance':
      return {
        ...baseConfig,
        browser: {
          ...baseConfig.browser,
          headless: true // Consistent performance measurement
        },
        test: {
          ...baseConfig.test,
          timeout: 30000,
          retries: 1, // Less retries for performance consistency
          parallel: false
        }
      }
      
    default:
      return baseConfig
  }
}

// Export individual configurations for easy import
export {
  defaultPlaywrightConfig as config,
  deviceConfigs as devices,
  testDataConfig as testData,
  accessibilityConfig as accessibility,
  performanceConfig as performance,
  errorHandlingConfig as errorHandling,
  environmentConfig as environment
}
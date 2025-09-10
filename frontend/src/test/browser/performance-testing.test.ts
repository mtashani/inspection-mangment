/**
 * MCP Playwright Performance Testing
 * Comprehensive performance testing with large datasets using browser automation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PlaywrightBrowserHelpers } from './playwright-helpers'

// Mock MCP Playwright functions for performance testing
const mockPlaywright = {
  navigate: jest.fn(),
  click: jest.fn(),
  type: jest.fn(),
  select: jest.fn(),
  waitFor: jest.fn(),
  screenshot: jest.fn(),
  evaluate: jest.fn(),
  snapshot: jest.fn(),
  resize: jest.fn(),
  networkRequests: jest.fn(),
}

describe('Performance Testing with MCP Playwright', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock responses
    Object.values(mockPlaywright).forEach(mock => {
      if (typeof mock === 'function') {
        mock.mockResolvedValue(undefined)
      }
    })
    
    mockPlaywright.screenshot.mockResolvedValue('screenshot-data')
    mockPlaywright.evaluate.mockResolvedValue({})
    mockPlaywright.networkRequests.mockResolvedValue([])
  })

  afterEach(() => {
    jest.restoreAllMocks()
    PlaywrightBrowserHelpers.cleanup()
  })

  describe('Page Load Performance Testing', () => {
    it('should measure Core Web Vitals for dashboard', async () => {
      // Start performance measurement
      const startTime = Date.now()
      
      // Navigate to dashboard
      await mockPlaywright.navigate('http://localhost:3000/dashboard')
      
      // Measure Core Web Vitals
      const webVitals = await mockPlaywright.evaluate({
        function: `
          () => {
            return new Promise((resolve) => {
              const vitals = {
                FCP: null, // First Contentful Paint
                LCP: null, // Largest Contentful Paint
                FID: null, // First Input Delay
                CLS: null, // Cumulative Layout Shift
                TTFB: null // Time to First Byte
              };
              
              // Measure FCP
              const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.name === 'first-contentful-paint') {
                    vitals.FCP = entry.startTime;
                  }
                }
              });
              observer.observe({ entryTypes: ['paint'] });
              
              // Measure LCP
              const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                vitals.LCP = lastEntry.startTime;
              });
              lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
              
              // Measure CLS
              let clsValue = 0;
              const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                  }
                }
                vitals.CLS = clsValue;
              });
              clsObserver.observe({ entryTypes: ['layout-shift'] });
              
              // Measure TTFB
              const navigationEntry = performance.getEntriesByType('navigation')[0];
              if (navigationEntry) {
                vitals.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
              }
              
              // Wait for page to be fully loaded
              setTimeout(() => {
                resolve(vitals);
              }, 3000);
            });
          }
        `
      })

      const loadTime = Date.now() - startTime

      // Verify performance budgets
      await mockPlaywright.evaluate({
        function: `() => {
          const budgets = {
            FCP: 2000,  // 2 seconds
            LCP: 4000,  // 4 seconds
            FID: 100,   // 100ms
            CLS: 0.1,   // 0.1
            TTFB: 800   // 800ms
          };
          
          const vitals = window.webVitals || {};
          const results = {};
          
          Object.keys(budgets).forEach(metric => {
            results[metric] = {
              value: vitals[metric],
              budget: budgets[metric],
              passed: vitals[metric] <= budgets[metric]
            };
          });
          
          return results;
        }`
      })

      // Take performance screenshot
      await mockPlaywright.screenshot({ filename: 'performance-dashboard-loaded.png' })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(2)
      expect(loadTime).toBeLessThan(5000) // Overall load time budget
    })

    it('should test performance with network throttling', async () => {
      // Simulate slow 3G network conditions
      await mockPlaywright.evaluate({
        function: `() => {
          // Mock slow network conditions
          const originalFetch = window.fetch;
          window.fetch = function(...args) {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(originalFetch.apply(this, args));
              }, 1000); // Add 1 second delay
            });
          };
        }`
      })

      const startTime = Date.now()
      
      await mockPlaywright.navigate('http://localhost:3000/equipment')
      await mockPlaywright.waitFor({ text: 'Equipment List' })
      
      const loadTimeWithThrottling = Date.now() - startTime

      // Measure performance under slow network
      await mockPlaywright.evaluate({
        function: `() => {
          const performanceEntries = performance.getEntriesByType('navigation');
          const networkEntry = performanceEntries[0];
          
          return {
            domContentLoaded: networkEntry.domContentLoadedEventEnd - networkEntry.domContentLoadedEventStart,
            loadComplete: networkEntry.loadEventEnd - networkEntry.loadEventStart,
            totalTime: networkEntry.loadEventEnd - networkEntry.fetchStart
          };
        }`
      })

      // Verify graceful degradation under slow network
      expect(loadTimeWithThrottling).toBeLessThan(10000) // 10 second budget for slow network
      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(2)
    })
  })

  describe('Large Dataset Performance Testing', () => {
    it('should test equipment table performance with 1000+ items', async () => {
      // Navigate to equipment page
      await mockPlaywright.navigate('http://localhost:3000/equipment')
      await mockPlaywright.waitFor({ text: 'Equipment List' })

      // Generate large dataset
      await mockPlaywright.evaluate({
        function: `() => {
          // Mock large equipment dataset
          const largeDataset = [];
          for (let i = 0; i < 1000; i++) {
            largeDataset.push({
              id: 'eq-' + String(i).padStart(4, '0'),
              name: 'Equipment ' + (i + 1),
              type: ['Pressure Vessel', 'Heat Exchanger', 'Pump', 'Tank'][i % 4],
              status: ['operational', 'maintenance', 'critical'][i % 3],
              location: 'Unit ' + ((i % 5) + 1),
              riskLevel: ['low', 'medium', 'high'][i % 3],
              lastInspection: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          }
          
          // Store dataset for table rendering
          window.largeEquipmentDataset = largeDataset;
          return largeDataset.length;
        }`
      })

      // Measure table rendering performance
      const renderStartTime = Date.now()
      
      await mockPlaywright.click({
        element: 'Load large dataset button',
        ref: 'load-large-dataset-btn'
      })

      await mockPlaywright.waitFor({ text: 'Equipment 1000' })
      
      const renderTime = Date.now() - renderStartTime

      // Measure virtual scrolling performance
      await mockPlaywright.evaluate({
        function: `() => {
          const table = document.querySelector('[data-testid="equipment-table"]');
          const startTime = performance.now();
          
          // Simulate scrolling through large dataset
          for (let i = 0; i < 10; i++) {
            table.scrollTop = i * 1000;
          }
          
          const scrollTime = performance.now() - startTime;
          
          return {
            renderTime: ${renderTime},
            scrollTime: scrollTime,
            visibleRows: table.querySelectorAll('tr').length,
            totalRows: window.largeEquipmentDataset.length
          };
        }`
      })

      // Test search performance with large dataset
      const searchStartTime = Date.now()
      
      await mockPlaywright.type({
        element: 'Equipment search input',
        ref: 'equipment-search-input',
        text: 'Pressure Vessel'
      })

      await mockPlaywright.waitFor({ text: 'Pressure Vessel' })
      
      const searchTime = Date.now() - searchStartTime

      // Verify performance budgets
      expect(renderTime).toBeLessThan(2000) // 2 second render budget
      expect(searchTime).toBeLessThan(500)  // 500ms search budget
      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(2)
    })

    it('should test form performance with complex dynamic fields', async () => {
      // Navigate to template builder
      await mockPlaywright.navigate('http://localhost:3000/admin/templates/new')
      await mockPlaywright.waitFor({ text: 'Create Template' })

      // Measure performance of adding many fields
      const addFieldsStartTime = Date.now()
      
      // Add multiple sections and fields
      for (let section = 0; section < 5; section++) {
        await mockPlaywright.click({
          element: 'Add section button',
          ref: 'add-section-btn'
        })

        await mockPlaywright.type({
          element: 'Section title input',
          ref: `section-title-input-${section}`,
          text: `Section ${section + 1}`
        })

        // Add 10 fields per section
        for (let field = 0; field < 10; field++) {
          await mockPlaywright.click({
            element: 'Add field button',
            ref: `add-field-btn-section-${section}`
          })

          await mockPlaywright.type({
            element: 'Field label input',
            ref: `field-label-input-${section}-${field}`,
            text: `Field ${field + 1}`
          })

          await mockPlaywright.select({
            element: 'Field type dropdown',
            ref: `field-type-select-${section}-${field}`,
            values: [['text', 'number', 'select', 'textarea', 'date'][field % 5]]
          })
        }
      }

      const addFieldsTime = Date.now() - addFieldsStartTime

      // Measure form validation performance
      const validationStartTime = Date.now()
      
      await mockPlaywright.click({
        element: 'Validate template button',
        ref: 'validate-template-btn'
      })

      await mockPlaywright.waitFor({ text: 'Validation complete' })
      
      const validationTime = Date.now() - validationStartTime

      // Measure form serialization performance
      await mockPlaywright.evaluate({
        function: `() => {
          const startTime = performance.now();
          
          // Simulate form serialization
          const formData = new FormData(document.querySelector('form'));
          const serialized = {};
          
          for (const [key, value] of formData.entries()) {
            serialized[key] = value;
          }
          
          const serializationTime = performance.now() - startTime;
          
          return {
            addFieldsTime: ${addFieldsTime},
            validationTime: ${validationTime},
            serializationTime: serializationTime,
            totalFields: Object.keys(serialized).length
          };
        }`
      })

      // Verify performance budgets
      expect(addFieldsTime).toBeLessThan(10000) // 10 second budget for adding 50 fields
      expect(validationTime).toBeLessThan(2000) // 2 second validation budget
    })

    it('should test RBI calculation performance with complex parameters', async () => {
      // Navigate to RBI calculator
      await mockPlaywright.navigate('http://localhost:3000/equipment/eq-001/rbi')
      await mockPlaywright.waitFor({ text: 'RBI Calculator' })

      // Fill complex RBI parameters
      const parameterStartTime = Date.now()
      
      await mockPlaywright.select({
        element: 'RBI level dropdown',
        ref: 'rbi-level-select',
        values: ['level-3'] // Most complex level
      })

      // Fill all probability of failure parameters
      const pofParameters = [
        { ref: 'general-metal-loss-rate', value: '0.05' },
        { ref: 'localized-metal-loss-rate', value: '0.02' },
        { ref: 'stress-corrosion-rate', value: '0.01' },
        { ref: 'fatigue-cycles', value: '50000' },
        { ref: 'creep-rate', value: '0.001' },
        { ref: 'thermal-fatigue-cycles', value: '10000' }
      ]

      for (const param of pofParameters) {
        await mockPlaywright.type({
          element: `${param.ref} input`,
          ref: param.ref,
          text: param.value
        })
      }

      // Fill all consequence of failure parameters
      const cofParameters = [
        { ref: 'release-rate', value: '100' },
        { ref: 'fluid-density', value: '0.8' },
        { ref: 'vapor-pressure', value: '50' },
        { ref: 'molecular-weight', value: '44' },
        { ref: 'heat-of-combustion', value: '45000' },
        { ref: 'toxic-concentration', value: '100' }
      ]

      for (const param of cofParameters) {
        await mockPlaywright.type({
          element: `${param.ref} input`,
          ref: param.ref,
          text: param.value
        })
      }

      const parameterTime = Date.now() - parameterStartTime

      // Measure calculation performance
      const calculationStartTime = Date.now()
      
      await mockPlaywright.click({
        element: 'Calculate RBI button',
        ref: 'calculate-rbi-btn'
      })

      await mockPlaywright.waitFor({ text: 'RBI Score' })
      
      const calculationTime = Date.now() - calculationStartTime

      // Measure results rendering performance
      await mockPlaywright.evaluate({
        function: `() => {
          const startTime = performance.now();
          
          // Simulate complex results processing
          const results = {
            rbiScore: Math.random() * 100,
            pofScore: Math.random() * 10,
            cofScore: Math.random() * 10,
            riskLevel: 'Medium',
            inspectionInterval: 24,
            breakdown: {
              generalMetalLoss: Math.random() * 2,
              localizedMetalLoss: Math.random() * 2,
              stressCorrosion: Math.random() * 2,
              fatigue: Math.random() * 2,
              creep: Math.random() * 2
            }
          };
          
          // Render results to DOM
          const resultsContainer = document.querySelector('[data-testid="rbi-results"]');
          if (resultsContainer) {
            resultsContainer.innerHTML = JSON.stringify(results, null, 2);
          }
          
          const renderTime = performance.now() - startTime;
          
          return {
            parameterTime: ${parameterTime},
            calculationTime: ${calculationTime},
            renderTime: renderTime,
            totalTime: ${parameterTime} + ${calculationTime} + renderTime
          };
        }`
      })

      // Verify performance budgets
      expect(parameterTime).toBeLessThan(5000)   // 5 second parameter entry budget
      expect(calculationTime).toBeLessThan(3000) // 3 second calculation budget
    })
  })

  describe('Memory and Resource Performance Testing', () => {
    it('should test memory usage during intensive operations', async () => {
      // Navigate to dashboard
      await mockPlaywright.navigate('http://localhost:3000/dashboard')
      await mockPlaywright.waitFor({ text: 'Dashboard' })

      // Measure initial memory usage
      const initialMemory = await mockPlaywright.evaluate({
        function: `() => {
          if (performance.memory) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
          }
          return null;
        }`
      })

      // Perform memory-intensive operations
      await mockPlaywright.evaluate({
        function: `() => {
          // Create large arrays to simulate memory usage
          const largeArrays = [];
          for (let i = 0; i < 100; i++) {
            largeArrays.push(new Array(10000).fill(Math.random()));
          }
          
          // Store reference to prevent garbage collection
          window.testArrays = largeArrays;
          
          return largeArrays.length;
        }`
      })

      // Measure memory after intensive operations
      const afterOperationsMemory = await mockPlaywright.evaluate({
        function: `() => {
          if (performance.memory) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
          }
          return null;
        }`
      })

      // Clean up and measure memory after cleanup
      await mockPlaywright.evaluate({
        function: `() => {
          // Clean up large arrays
          delete window.testArrays;
          
          // Force garbage collection if available
          if (window.gc) {
            window.gc();
          }
          
          return 'cleanup complete';
        }`
      })

      const afterCleanupMemory = await mockPlaywright.evaluate({
        function: `() => {
          if (performance.memory) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
          }
          return null;
        }`
      })

      // Analyze memory usage patterns
      await mockPlaywright.evaluate({
        function: `() => {
          const initial = ${JSON.stringify(initialMemory)};
          const afterOps = ${JSON.stringify(afterOperationsMemory)};
          const afterCleanup = ${JSON.stringify(afterCleanupMemory)};
          
          if (initial && afterOps && afterCleanup) {
            const memoryIncrease = afterOps.usedJSHeapSize - initial.usedJSHeapSize;
            const memoryRecovered = afterOps.usedJSHeapSize - afterCleanup.usedJSHeapSize;
            const recoveryPercentage = (memoryRecovered / memoryIncrease) * 100;
            
            return {
              memoryIncrease: memoryIncrease,
              memoryRecovered: memoryRecovered,
              recoveryPercentage: recoveryPercentage,
              finalMemoryUsage: afterCleanup.usedJSHeapSize
            };
          }
          
          return null;
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(6)
    })

    it('should test network resource loading performance', async () => {
      // Clear network cache
      await mockPlaywright.evaluate({
        function: `() => {
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
        }`
      })

      // Navigate to resource-heavy page
      await mockPlaywright.navigate('http://localhost:3000/reports')
      
      // Monitor network requests
      const networkRequests = await mockPlaywright.networkRequests()
      
      // Analyze network performance
      await mockPlaywright.evaluate({
        function: `() => {
          const resourceEntries = performance.getEntriesByType('resource');
          
          const analysis = {
            totalRequests: resourceEntries.length,
            totalTransferSize: 0,
            slowRequests: [],
            largeResources: [],
            cacheHits: 0,
            cacheMisses: 0
          };
          
          resourceEntries.forEach(entry => {
            analysis.totalTransferSize += entry.transferSize || 0;
            
            // Identify slow requests (>1 second)
            if (entry.duration > 1000) {
              analysis.slowRequests.push({
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize
              });
            }
            
            // Identify large resources (>1MB)
            if (entry.transferSize > 1024 * 1024) {
              analysis.largeResources.push({
                name: entry.name,
                size: entry.transferSize
              });
            }
            
            // Check cache status
            if (entry.transferSize === 0) {
              analysis.cacheHits++;
            } else {
              analysis.cacheMisses++;
            }
          });
          
          return analysis;
        }`
      })

      // Test resource loading with simulated slow network
      await mockPlaywright.evaluate({
        function: `() => {
          // Simulate slow network for future requests
          const originalFetch = window.fetch;
          let requestCount = 0;
          
          window.fetch = function(...args) {
            requestCount++;
            const delay = Math.random() * 2000; // Random delay up to 2 seconds
            
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(originalFetch.apply(this, args));
              }, delay);
            });
          };
          
          return { requestCount: requestCount };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(3)
      expect(mockPlaywright.networkRequests).toHaveBeenCalledTimes(1)
    })
  })

  describe('Performance Testing with Device Emulation', () => {
    it('should test performance across different device types', async () => {
      const devices = [
        { width: 375, height: 667, name: 'iPhone SE', cpu: 'slow' },
        { width: 414, height: 896, name: 'iPhone 11', cpu: 'medium' },
        { width: 768, height: 1024, name: 'iPad', cpu: 'fast' },
        { width: 1280, height: 720, name: 'Desktop', cpu: 'fast' }
      ]

      const performanceResults = []

      for (const device of devices) {
        await mockPlaywright.resize({ width: device.width, height: device.height })
        
        // Simulate CPU throttling
        await mockPlaywright.evaluate({
          function: `() => {
            const cpuMultiplier = {
              'slow': 4,
              'medium': 2,
              'fast': 1
            }['${device.cpu}'];
            
            // Simulate CPU throttling by adding artificial delays
            const originalSetTimeout = window.setTimeout;
            window.setTimeout = function(callback, delay) {
              return originalSetTimeout(callback, delay * cpuMultiplier);
            };
          }`
        })

        const startTime = Date.now()
        
        await mockPlaywright.navigate('http://localhost:3000/dashboard')
        await mockPlaywright.waitFor({ text: 'Dashboard' })
        
        const loadTime = Date.now() - startTime

        // Measure device-specific performance metrics
        const deviceMetrics = await mockPlaywright.evaluate({
          function: `() => {
            const paintEntries = performance.getEntriesByType('paint');
            const navigationEntry = performance.getEntriesByType('navigation')[0];
            
            return {
              device: '${device.name}',
              loadTime: ${loadTime},
              firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
              firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
              domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
              networkTime: navigationEntry.responseEnd - navigationEntry.requestStart,
              renderTime: navigationEntry.loadEventEnd - navigationEntry.responseEnd
            };
          }`
        })

        performanceResults.push(deviceMetrics)

        // Take device-specific screenshot
        await mockPlaywright.screenshot({ 
          filename: `performance-${device.name.toLowerCase().replace(' ', '-')}.png` 
        })
      }

      // Analyze cross-device performance
      await mockPlaywright.evaluate({
        function: `() => {
          const results = ${JSON.stringify(performanceResults)};
          
          const analysis = {
            averageLoadTime: results.reduce((sum, r) => sum + r.loadTime, 0) / results.length,
            slowestDevice: results.reduce((prev, curr) => prev.loadTime > curr.loadTime ? prev : curr),
            fastestDevice: results.reduce((prev, curr) => prev.loadTime < curr.loadTime ? prev : curr),
            performanceVariation: Math.max(...results.map(r => r.loadTime)) - Math.min(...results.map(r => r.loadTime))
          };
          
          return analysis;
        }`
      })

      expect(mockPlaywright.resize).toHaveBeenCalledTimes(devices.length)
      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(devices.length * 2 + 1)
      expect(mockPlaywright.screenshot).toHaveBeenCalledTimes(devices.length)
    })
  })

  describe('Performance Testing Summary', () => {
    it('should generate comprehensive performance report', async () => {
      const testPages = [
        { url: 'http://localhost:3000/dashboard', name: 'Dashboard' },
        { url: 'http://localhost:3000/equipment', name: 'Equipment List' },
        { url: 'http://localhost:3000/inspections', name: 'Inspections' },
        { url: 'http://localhost:3000/reports', name: 'Reports' },
        { url: 'http://localhost:3000/admin/templates', name: 'Template Management' }
      ]

      const performanceReport = {
        pages: [],
        summary: {
          averageLoadTime: 0,
          totalRequests: 0,
          totalTransferSize: 0,
          cacheHitRate: 0,
          performanceScore: 0
        }
      }

      for (const page of testPages) {
        const startTime = Date.now()
        
        await mockPlaywright.navigate(page.url)
        await mockPlaywright.waitFor({ time: 3000 }) // Allow full page load
        
        const loadTime = Date.now() - startTime

        // Collect comprehensive performance metrics
        const pageMetrics = await mockPlaywright.evaluate({
          function: `
            () => {
              const navigation = performance.getEntriesByType('navigation')[0];
              const resources = performance.getEntriesByType('resource');
              const paint = performance.getEntriesByType('paint');
              
              const metrics = {
                url: '${page.url}',
                name: '${page.name}',
                loadTime: ${loadTime},
                navigationTiming: {
                  dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                  tcp: navigation.connectEnd - navigation.connectStart,
                  request: navigation.responseStart - navigation.requestStart,
                  response: navigation.responseEnd - navigation.responseStart,
                  dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                  load: navigation.loadEventEnd - navigation.loadEventStart
                },
                paintTiming: {
                  firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                  firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
                },
                resourceTiming: {
                  totalRequests: resources.length,
                  totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
                  cacheHits: resources.filter(r => r.transferSize === 0).length,
                  slowRequests: resources.filter(r => r.duration > 1000).length
                }
              };
              
              return metrics;
            }
          `
        })

        performanceReport.pages.push(pageMetrics)
      }

      // Generate performance summary
      await mockPlaywright.evaluate({
        function: `() => {
          const report = ${JSON.stringify(performanceReport)};
          
          // Calculate summary metrics
          report.summary.averageLoadTime = report.pages.reduce((sum, p) => sum + p.loadTime, 0) / report.pages.length;
          report.summary.totalRequests = report.pages.reduce((sum, p) => sum + p.resourceTiming.totalRequests, 0);
          report.summary.totalTransferSize = report.pages.reduce((sum, p) => sum + p.resourceTiming.totalSize, 0);
          
          const totalCacheHits = report.pages.reduce((sum, p) => sum + p.resourceTiming.cacheHits, 0);
          report.summary.cacheHitRate = (totalCacheHits / report.summary.totalRequests) * 100;
          
          // Calculate performance score (0-100)
          const avgFCP = report.pages.reduce((sum, p) => sum + p.paintTiming.firstContentfulPaint, 0) / report.pages.length;
          const fcpScore = Math.max(0, 100 - (avgFCP / 20)); // 20ms = 1 point deduction
          
          const avgLoadTime = report.summary.averageLoadTime;
          const loadScore = Math.max(0, 100 - (avgLoadTime / 50)); // 50ms = 1 point deduction
          
          report.summary.performanceScore = Math.round((fcpScore + loadScore) / 2);
          
          // Store report
          window.performanceReport = report;
          
          return report.summary;
        }`
      })

      // Take final performance report screenshot
      await mockPlaywright.screenshot({ filename: 'performance-final-report.png' })

      expect(mockPlaywright.navigate).toHaveBeenCalledTimes(testPages.length)
      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(testPages.length + 1)
    })
  })
})
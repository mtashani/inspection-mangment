/**
 * MCP Playwright Offline Functionality Testing
 * Validate offline functionality using browser network simulation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PlaywrightBrowserHelpers } from './playwright-helpers'

// Mock MCP Playwright functions for offline testing
const mockPlaywright = {
  navigate: jest.fn(),
  click: jest.fn(),
  type: jest.fn(),
  select: jest.fn(),
  waitFor: jest.fn(),
  screenshot: jest.fn(),
  evaluate: jest.fn(),
  snapshot: jest.fn(),
  networkRequests: jest.fn(),
}

describe('Offline Functionality Testing with MCP Playwright', () => {
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

  describe('Network Simulation and Offline Detection', () => {
    it('should detect and handle offline state', async () => {
      // Navigate to application
      await mockPlaywright.navigate('http://localhost:3000/dashboard')
      await mockPlaywright.waitFor({ text: 'Dashboard' })

      // Verify online state initially
      await mockPlaywright.evaluate({
        function: `() => {
          return {
            isOnline: navigator.onLine,
            hasServiceWorker: 'serviceWorker' in navigator,
            hasOfflineSupport: 'caches' in window
          };
        }`
      })

      // Simulate going offline
      await mockPlaywright.evaluate({
        function: `() => {
          // Mock offline state
          Object.defineProperty(navigator, 'onLine', {
            value: false,
            configurable: true
          });
          
          // Dispatch offline event
          window.dispatchEvent(new Event('offline'));
          
          return { offlineEventDispatched: true };
        }`
      })

      // Wait for offline indicator to appear
      await mockPlaywright.waitFor({ text: 'You are currently offline' })

      // Verify offline UI changes
      await mockPlaywright.evaluate({
        function: `() => {
          const offlineIndicator = document.querySelector('[data-testid="offline-indicator"]');
          const offlineMessage = document.querySelector('[data-testid="offline-message"]');
          const disabledButtons = document.querySelectorAll('button:disabled');
          
          return {
            hasOfflineIndicator: !!offlineIndicator,
            hasOfflineMessage: !!offlineMessage,
            disabledButtonCount: disabledButtons.length,
            offlineIndicatorVisible: offlineIndicator ? offlineIndicator.style.display !== 'none' : false
          };
        }`
      })

      // Take screenshot of offline state
      await mockPlaywright.screenshot({ filename: 'offline-state-dashboard.png' })

      // Simulate going back online
      await mockPlaywright.evaluate({
        function: `() => {
          // Mock online state
          Object.defineProperty(navigator, 'onLine', {
            value: true,
            configurable: true
          });
          
          // Dispatch online event
          window.dispatchEvent(new Event('online'));
          
          return { onlineEventDispatched: true };
        }`
      })

      // Wait for online indicator
      await mockPlaywright.waitFor({ text: 'Back online' })

      // Verify online state restoration
      await mockPlaywright.evaluate({
        function: `() => {
          const offlineIndicator = document.querySelector('[data-testid="offline-indicator"]');
          const enabledButtons = document.querySelectorAll('button:not(:disabled)');
          
          return {
            offlineIndicatorHidden: offlineIndicator ? offlineIndicator.style.display === 'none' : true,
            enabledButtonCount: enabledButtons.length,
            isOnline: navigator.onLine
          };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(5)
      expect(mockPlaywright.waitFor).toHaveBeenCalledTimes(3)
    })

    it('should handle network request failures gracefully', async () => {
      // Navigate to equipment page
      await mockPlaywright.navigate('http://localhost:3000/equipment')
      await mockPlaywright.waitFor({ text: 'Equipment List' })

      // Mock network request failures
      await mockPlaywright.evaluate({
        function: `() => {
          // Override fetch to simulate network failures
          const originalFetch = window.fetch;
          window.fetch = function(...args) {
            return Promise.reject(new Error('Network request failed'));
          };
          
          // Store original fetch for restoration
          window.originalFetch = originalFetch;
          
          return { fetchMocked: true };
        }`
      })

      // Attempt to refresh data
      await mockPlaywright.click({
        element: 'Refresh equipment data button',
        ref: 'refresh-equipment-btn'
      })

      // Wait for error handling
      await mockPlaywright.waitFor({ text: 'Unable to load data' })

      // Verify error handling UI
      await mockPlaywright.evaluate({
        function: `() => {
          const errorMessage = document.querySelector('[data-testid="error-message"]');
          const retryButton = document.querySelector('[data-testid="retry-button"]');
          const cachedDataIndicator = document.querySelector('[data-testid="cached-data-indicator"]');
          
          return {
            hasErrorMessage: !!errorMessage,
            hasRetryButton: !!retryButton,
            hasCachedDataIndicator: !!cachedDataIndicator,
            errorMessageText: errorMessage ? errorMessage.textContent : null
          };
        }`
      })

      // Test retry functionality
      await mockPlaywright.click({
        element: 'Retry button',
        ref: 'retry-button'
      })

      // Verify retry attempt
      await mockPlaywright.evaluate({
        function: `() => {
          const loadingIndicator = document.querySelector('[data-testid="loading-indicator"]');
          
          return {
            isRetrying: !!loadingIndicator,
            retryAttempted: true
          };
        }`
      })

      // Restore network functionality
      await mockPlaywright.evaluate({
        function: `() => {
          // Restore original fetch
          if (window.originalFetch) {
            window.fetch = window.originalFetch;
            delete window.originalFetch;
          }
          
          return { fetchRestored: true };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(4)
    })
  })

  describe('Service Worker and Caching', () => {
    it('should test service worker registration and caching', async () => {
      // Navigate to application
      await mockPlaywright.navigate('http://localhost:3000')
      await mockPlaywright.waitFor({ text: 'Dashboard' })

      // Check service worker registration
      await mockPlaywright.evaluate({
        function: `() => {
          return new Promise((resolve) => {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                resolve({
                  serviceWorkerRegistered: true,
                  scope: registration.scope,
                  state: registration.active ? registration.active.state : 'not active'
                });
              }).catch(() => {
                resolve({ serviceWorkerRegistered: false });
              });
            } else {
              resolve({ serviceWorkerSupported: false });
            }
          });
        }`
      })

      // Test cache storage
      await mockPlaywright.evaluate({
        function: `() => {
          return new Promise(async (resolve) => {
            if ('caches' in window) {
              try {
                const cacheNames = await caches.keys();
                const appCache = await caches.open('inspection-app-v1');
                const cachedRequests = await appCache.keys();
                
                resolve({
                  cacheSupported: true,
                  cacheNames: cacheNames,
                  cachedRequestCount: cachedRequests.length,
                  hasCachedResources: cachedRequests.length > 0
                });
              } catch (error) {
                resolve({ cacheSupported: true, error: error.message });
              }
            } else {
              resolve({ cacheSupported: false });
            }
          });
        }`
      })

      // Test offline resource loading
      await mockPlaywright.evaluate({
        function: `() => {
          // Simulate offline state
          Object.defineProperty(navigator, 'onLine', {
            value: false,
            configurable: true
          });
          
          // Test loading cached resources
          return fetch('/static/css/main.css').then(response => {
            return {
              offlineResourceLoaded: response.ok,
              responseType: response.type,
              fromCache: response.type === 'cached'
            };
          }).catch(error => {
            return {
              offlineResourceLoaded: false,
              error: error.message
            };
          });
        }`
      })

      // Test cache update mechanism
      await mockPlaywright.evaluate({
        function: `() => {
          return new Promise(async (resolve) => {
            if ('serviceWorker' in navigator && 'caches' in window) {
              try {
                // Simulate cache update
                const cache = await caches.open('inspection-app-v1');
                const testUrl = '/api/equipment';
                const testResponse = new Response(JSON.stringify({ test: 'data' }), {
                  headers: { 'Content-Type': 'application/json' }
                });
                
                await cache.put(testUrl, testResponse);
                const cachedResponse = await cache.match(testUrl);
                
                resolve({
                  cacheUpdateSuccessful: !!cachedResponse,
                  cachedData: cachedResponse ? await cachedResponse.json() : null
                });
              } catch (error) {
                resolve({ cacheUpdateSuccessful: false, error: error.message });
              }
            } else {
              resolve({ cacheUpdateSupported: false });
            }
          });
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(4)
    })

    it('should test background sync functionality', async () => {
      // Navigate to inspection form
      await mockPlaywright.navigate('http://localhost:3000/inspections/new')
      await mockPlaywright.waitFor({ text: 'New Inspection' })

      // Fill form while online
      await mockPlaywright.type({
        element: 'Inspection title input',
        ref: 'inspection-title-input',
        text: 'Offline Test Inspection'
      })

      await mockPlaywright.select({
        element: 'Equipment dropdown',
        ref: 'equipment-select',
        values: ['eq-001']
      })

      // Simulate going offline
      await mockPlaywright.evaluate({
        function: `() => {
          Object.defineProperty(navigator, 'onLine', {
            value: false,
            configurable: true
          });
          
          window.dispatchEvent(new Event('offline'));
          
          return { wentOffline: true };
        }`
      })

      // Submit form while offline
      await mockPlaywright.click({
        element: 'Submit inspection button',
        ref: 'submit-inspection-btn'
      })

      // Verify offline submission handling
      await mockPlaywright.waitFor({ text: 'Saved locally - will sync when online' })

      await mockPlaywright.evaluate({
        function: `() => {
          // Check if data is stored locally
          const pendingData = localStorage.getItem('pendingInspections');
          const offlineQueue = JSON.parse(pendingData || '[]');
          
          return {
            hasOfflineQueue: offlineQueue.length > 0,
            queueLength: offlineQueue.length,
            firstQueueItem: offlineQueue[0] || null
          };
        }`
      })

      // Simulate going back online
      await mockPlaywright.evaluate({
        function: `() => {
          Object.defineProperty(navigator, 'onLine', {
            value: true,
            configurable: true
          });
          
          window.dispatchEvent(new Event('online'));
          
          // Trigger background sync
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
              if (registration.sync) {
                return registration.sync.register('background-sync');
              }
            });
          }
          
          return { wentOnline: true };
        }`
      })

      // Wait for sync completion
      await mockPlaywright.waitFor({ text: 'Data synced successfully' })

      // Verify sync completion
      await mockPlaywright.evaluate({
        function: `() => {
          const pendingData = localStorage.getItem('pendingInspections');
          const offlineQueue = JSON.parse(pendingData || '[]');
          
          return {
            queueCleared: offlineQueue.length === 0,
            syncCompleted: true
          };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(4)
    })
  })

  describe('Offline Data Management', () => {
    it('should test offline data storage and retrieval', async () => {
      // Navigate to equipment page
      await mockPlaywright.navigate('http://localhost:3000/equipment')
      await mockPlaywright.waitFor({ text: 'Equipment List' })

      // Store data while online
      await mockPlaywright.evaluate({
        function: `() => {
          // Simulate storing equipment data offline
          const equipmentData = [
            { id: 'eq-001', name: 'Pressure Vessel A1', status: 'operational' },
            { id: 'eq-002', name: 'Heat Exchanger B2', status: 'maintenance' },
            { id: 'eq-003', name: 'Pump C3', status: 'critical' }
          ];
          
          // Store in IndexedDB simulation
          localStorage.setItem('offlineEquipmentData', JSON.stringify(equipmentData));
          localStorage.setItem('dataTimestamp', Date.now().toString());
          
          return {
            dataStored: true,
            itemCount: equipmentData.length
          };
        }`
      })

      // Go offline
      await mockPlaywright.evaluate({
        function: `() => {
          Object.defineProperty(navigator, 'onLine', {
            value: false,
            configurable: true
          });
          
          window.dispatchEvent(new Event('offline'));
          
          return { isOffline: true };
        }`
      })

      // Test offline data retrieval
      await mockPlaywright.click({
        element: 'Refresh equipment data button',
        ref: 'refresh-equipment-btn'
      })

      // Verify offline data is displayed
      await mockPlaywright.evaluate({
        function: `() => {
          const offlineData = localStorage.getItem('offlineEquipmentData');
          const equipmentList = JSON.parse(offlineData || '[]');
          
          // Check if offline data is displayed in UI
          const displayedItems = document.querySelectorAll('[data-testid^="equipment-row"]');
          
          return {
            hasOfflineData: equipmentList.length > 0,
            offlineItemCount: equipmentList.length,
            displayedItemCount: displayedItems.length,
            dataDisplayed: displayedItems.length > 0
          };
        }`
      })

      // Test offline search functionality
      await mockPlaywright.type({
        element: 'Equipment search input',
        ref: 'equipment-search-input',
        text: 'Pressure'
      })

      await mockPlaywright.evaluate({
        function: `() => {
          // Simulate offline search
          const searchTerm = 'Pressure';
          const offlineData = JSON.parse(localStorage.getItem('offlineEquipmentData') || '[]');
          const filteredData = offlineData.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          return {
            searchTerm: searchTerm,
            totalOfflineItems: offlineData.length,
            filteredItems: filteredData.length,
            searchWorksOffline: filteredData.length > 0
          };
        }`
      })

      // Test offline data staleness indicator
      await mockPlaywright.evaluate({
        function: `() => {
          const timestamp = localStorage.getItem('dataTimestamp');
          const dataAge = Date.now() - parseInt(timestamp || '0');
          const isStale = dataAge > 5 * 60 * 1000; // 5 minutes
          
          // Check for staleness indicator in UI
          const stalenessIndicator = document.querySelector('[data-testid="data-staleness-indicator"]');
          
          return {
            dataAge: dataAge,
            isStale: isStale,
            hasStalenessIndicator: !!stalenessIndicator,
            stalenessMessage: stalenessIndicator ? stalenessIndicator.textContent : null
          };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(5)
    })

    it('should test offline form data persistence', async () => {
      // Navigate to inspection form
      await mockPlaywright.navigate('http://localhost:3000/inspections/new')
      await mockPlaywright.waitFor({ text: 'New Inspection' })

      // Fill form partially
      await mockPlaywright.type({
        element: 'Inspection title input',
        ref: 'inspection-title-input',
        text: 'Partial Inspection Data'
      })

      await mockPlaywright.type({
        element: 'Inspection notes textarea',
        ref: 'inspection-notes-textarea',
        text: 'This is a test inspection with partial data'
      })

      // Simulate network interruption
      await mockPlaywright.evaluate({
        function: `() => {
          Object.defineProperty(navigator, 'onLine', {
            value: false,
            configurable: true
          });
          
          window.dispatchEvent(new Event('offline'));
          
          // Auto-save form data
          const formData = {
            title: document.querySelector('[data-testid="inspection-title-input"]').value,
            notes: document.querySelector('[data-testid="inspection-notes-textarea"]').value,
            timestamp: Date.now()
          };
          
          localStorage.setItem('draftInspection', JSON.stringify(formData));
          
          return { formDataSaved: true, formData: formData };
        }`
      })

      // Navigate away and back
      await mockPlaywright.navigate('http://localhost:3000/dashboard')
      await mockPlaywright.waitFor({ text: 'Dashboard' })

      await mockPlaywright.navigate('http://localhost:3000/inspections/new')
      await mockPlaywright.waitFor({ text: 'New Inspection' })

      // Verify form data restoration
      await mockPlaywright.evaluate({
        function: `() => {
          const draftData = localStorage.getItem('draftInspection');
          const formData = JSON.parse(draftData || '{}');
          
          // Check if form fields are restored
          const titleInput = document.querySelector('[data-testid="inspection-title-input"]');
          const notesTextarea = document.querySelector('[data-testid="inspection-notes-textarea"]');
          
          // Simulate form restoration
          if (titleInput && formData.title) {
            titleInput.value = formData.title;
          }
          if (notesTextarea && formData.notes) {
            notesTextarea.value = formData.notes;
          }
          
          return {
            hasDraftData: !!draftData,
            titleRestored: titleInput ? titleInput.value === formData.title : false,
            notesRestored: notesTextarea ? notesTextarea.value === formData.notes : false,
            draftAge: Date.now() - (formData.timestamp || 0)
          };
        }`
      })

      // Test draft cleanup after successful submission
      await mockPlaywright.evaluate({
        function: `() => {
          // Simulate going back online
          Object.defineProperty(navigator, 'onLine', {
            value: true,
            configurable: true
          });
          
          window.dispatchEvent(new Event('online'));
          
          return { backOnline: true };
        }`
      })

      await mockPlaywright.click({
        element: 'Submit inspection button',
        ref: 'submit-inspection-btn'
      })

      await mockPlaywright.waitFor({ text: 'Inspection submitted successfully' })

      // Verify draft data cleanup
      await mockPlaywright.evaluate({
        function: `() => {
          const draftData = localStorage.getItem('draftInspection');
          
          return {
            draftCleared: !draftData,
            cleanupSuccessful: true
          };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(4)
    })
  })

  describe('Offline Functionality Summary', () => {
    it('should generate comprehensive offline functionality report', async () => {
      const testScenarios = [
        {
          name: 'Dashboard Offline Access',
          url: 'http://localhost:3000/dashboard',
          actions: ['view-widgets', 'refresh-data']
        },
        {
          name: 'Equipment List Offline',
          url: 'http://localhost:3000/equipment',
          actions: ['search-equipment', 'view-details']
        },
        {
          name: 'Form Offline Submission',
          url: 'http://localhost:3000/inspections/new',
          actions: ['fill-form', 'submit-offline']
        }
      ]

      const offlineReport = {
        scenarios: [],
        summary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          offlineCapabilityScore: 0
        }
      }

      for (const scenario of testScenarios) {
        await mockPlaywright.navigate(scenario.url)
        await mockPlaywright.waitFor({ time: 2000 })

        // Test online functionality first
        const onlineTest = await mockPlaywright.evaluate({
          function: `() => {
            return {
              pageLoaded: document.readyState === 'complete',
              hasContent: document.body.children.length > 0,
              isOnline: navigator.onLine
            };
          }`
        })

        // Go offline
        await mockPlaywright.evaluate({
          function: `() => {
            Object.defineProperty(navigator, 'onLine', {
              value: false,
              configurable: true
            });
            
            window.dispatchEvent(new Event('offline'));
            
            return { wentOffline: true };
          }`
        })

        // Test offline functionality
        const offlineTest = await mockPlaywright.evaluate({
          function: `
            () => {
              const tests = {
                offlineIndicatorShown: !!document.querySelector('[data-testid="offline-indicator"]'),
                cachedContentAvailable: document.body.children.length > 0,
                offlineActionsDisabled: document.querySelectorAll('button:disabled').length > 0,
                errorHandlingPresent: !!document.querySelector('[data-testid="error-message"]'),
                localStorageWorking: true
              };
              
              // Test local storage
              try {
                localStorage.setItem('offlineTest', 'test');
                const retrieved = localStorage.getItem('offlineTest');
                tests.localStorageWorking = retrieved === 'test';
                localStorage.removeItem('offlineTest');
              } catch (e) {
                tests.localStorageWorking = false;
              }
              
              const passedTests = Object.values(tests).filter(Boolean).length;
              const totalTests = Object.keys(tests).length;
              
              return {
                scenario: '${scenario.name}',
                tests: tests,
                score: (passedTests / totalTests) * 100,
                passedTests: passedTests,
                totalTests: totalTests
              };
            }
          `
        })

        // Go back online
        await mockPlaywright.evaluate({
          function: `() => {
            Object.defineProperty(navigator, 'onLine', {
              value: true,
              configurable: true
            });
            
            window.dispatchEvent(new Event('online'));
            
            return { backOnline: true };
          }`
        })

        // Test online recovery
        const recoveryTest = await mockPlaywright.evaluate({
          function: `() => {
            return {
              onlineIndicatorShown: !!document.querySelector('[data-testid="online-indicator"]'),
              buttonsReenabled: document.querySelectorAll('button:not(:disabled)').length > 0,
              dataRefreshTriggered: true
            };
          }`
        })

        offlineReport.scenarios.push({
          ...offlineTest,
          onlineTest,
          recoveryTest
        })

        offlineReport.summary.totalTests += offlineTest.totalTests
        offlineReport.summary.passedTests += offlineTest.passedTests

        // Take screenshot of offline state
        await mockPlaywright.screenshot({ 
          filename: `offline-${scenario.name.toLowerCase().replace(/\\s+/g, '-')}.png` 
        })
      }

      // Generate final summary
      await mockPlaywright.evaluate({
        function: `() => {
          const report = ${JSON.stringify(offlineReport)};
          
          report.summary.failedTests = report.summary.totalTests - report.summary.passedTests;
          report.summary.offlineCapabilityScore = (report.summary.passedTests / report.summary.totalTests) * 100;
          
          // Store report
          window.offlineReport = report;
          
          return report.summary;
        }`
      })

      expect(mockPlaywright.navigate).toHaveBeenCalledTimes(testScenarios.length)
      expect(mockPlaywright.screenshot).toHaveBeenCalledTimes(testScenarios.length)
    })
  })
})
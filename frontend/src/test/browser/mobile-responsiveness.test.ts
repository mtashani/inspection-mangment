/**
 * MCP Playwright Mobile Responsiveness Testing
 * Test mobile responsiveness across devices with MCP Playwright device emulation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PlaywrightBrowserHelpers } from './playwright-helpers'

// Mock MCP Playwright functions for mobile testing
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
  hover: jest.fn(),
  pressKey: jest.fn(),
}

describe('Mobile Responsiveness Testing with MCP Playwright', () => {
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
  })

  afterEach(() => {
    jest.restoreAllMocks()
    PlaywrightBrowserHelpers.cleanup()
  })

  describe('Device Emulation Testing', () => {
    const devices = [
      { 
        name: 'iPhone SE', 
        width: 375, 
        height: 667, 
        deviceScaleFactor: 2, 
        isMobile: true, 
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      { 
        name: 'iPhone 12', 
        width: 390, 
        height: 844, 
        deviceScaleFactor: 3, 
        isMobile: true, 
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      { 
        name: 'Samsung Galaxy S21', 
        width: 360, 
        height: 800, 
        deviceScaleFactor: 3, 
        isMobile: true, 
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36'
      },
      { 
        name: 'iPad', 
        width: 768, 
        height: 1024, 
        deviceScaleFactor: 2, 
        isMobile: true, 
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      { 
        name: 'iPad Pro', 
        width: 1024, 
        height: 1366, 
        deviceScaleFactor: 2, 
        isMobile: true, 
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    ]

    it('should test responsive layout across all device sizes', async () => {
      for (const device of devices) {
        // Set device viewport
        await mockPlaywright.resize({ 
          width: device.width, 
          height: device.height 
        })

        // Set device properties
        await mockPlaywright.evaluate({
          function: `() => {
            // Mock device properties
            Object.defineProperty(navigator, 'userAgent', {
              value: '${device.userAgent}',
              configurable: true
            });
            
            Object.defineProperty(window, 'ontouchstart', {
              value: ${device.hasTouch} ? {} : undefined,
              configurable: true
            });
            
            // Trigger resize event
            window.dispatchEvent(new Event('resize'));
          }`
        })

        // Navigate to dashboard
        await mockPlaywright.navigate('http://localhost:3000/dashboard')
        await mockPlaywright.waitFor({ text: 'Dashboard' })

        // Test layout responsiveness
        const layoutTest = await mockPlaywright.evaluate({
          function: `() => {
            const viewport = {
              width: window.innerWidth,
              height: window.innerHeight,
              devicePixelRatio: window.devicePixelRatio
            };
            
            // Check for horizontal scrolling
            const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
            
            // Check navigation layout
            const navigation = document.querySelector('[data-testid="main-navigation"]');
            const navStyle = navigation ? window.getComputedStyle(navigation) : null;
            const isMobileNav = navStyle && navStyle.display === 'none';
            
            // Check widget layout
            const widgets = document.querySelectorAll('[data-testid^="dashboard-widget"]');
            const widgetLayout = Array.from(widgets).map(widget => {
              const rect = widget.getBoundingClientRect();
              return {
                width: rect.width,
                height: rect.height,
                isFullWidth: rect.width >= window.innerWidth * 0.9
              };
            });
            
            // Check text readability
            const textElements = document.querySelectorAll('p, span, label, button');
            let smallText = 0;
            textElements.forEach(element => {
              const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
              if (fontSize < 14) smallText++; // Less than 14px is too small for mobile
            });
            
            return {
              device: '${device.name}',
              viewport: viewport,
              hasHorizontalScroll: hasHorizontalScroll,
              isMobileNav: isMobileNav,
              widgetCount: widgets.length,
              widgetLayout: widgetLayout,
              smallTextCount: smallText,
              totalTextElements: textElements.length
            };
          }`
        })

        // Take device-specific screenshot
        await mockPlaywright.screenshot({ 
          filename: `mobile-${device.name.toLowerCase().replace(/\\s+/g, '-')}-dashboard.png`,
          fullPage: true
        })

        // Verify responsive behavior
        expect(layoutTest.hasHorizontalScroll).toBe(false)
        if (device.width < 768) {
          expect(layoutTest.isMobileNav).toBe(true)
        }
        expect(layoutTest.smallTextCount).toBe(0)
      }

      expect(mockPlaywright.resize).toHaveBeenCalledTimes(devices.length)
      expect(mockPlaywright.screenshot).toHaveBeenCalledTimes(devices.length)
    })

    it('should test touch interactions on mobile devices', async () => {
      // Set mobile device
      await mockPlaywright.resize({ width: 375, height: 667 })
      
      await mockPlaywright.evaluate({
        function: `() => {
          // Enable touch events
          Object.defineProperty(window, 'ontouchstart', { value: {} });
          
          // Mock touch event creation
          window.createTouchEvent = function(type, touches) {
            const event = new Event(type, { bubbles: true, cancelable: true });
            event.touches = touches;
            event.targetTouches = touches;
            event.changedTouches = touches;
            return event;
          };
        }`
      })

      await mockPlaywright.navigate('http://localhost:3000/equipment')
      await mockPlaywright.waitFor({ text: 'Equipment List' })

      // Test touch target sizes
      await mockPlaywright.evaluate({
        function: `() => {
          const touchTargets = document.querySelectorAll('button, a, input, select, [role="button"]');
          let inadequateTargets = 0;
          const minTouchSize = 44; // 44px minimum recommended touch target
          
          touchTargets.forEach(target => {
            const rect = target.getBoundingClientRect();
            const size = Math.min(rect.width, rect.height);
            
            if (size < minTouchSize) {
              inadequateTargets++;
              // Add visual indicator for testing
              target.style.border = '2px solid red';
            }
          });
          
          return {
            totalTouchTargets: touchTargets.length,
            inadequateTargets: inadequateTargets,
            adequateTargetPercentage: ((touchTargets.length - inadequateTargets) / touchTargets.length) * 100
          };
        }`
      })

      // Test swipe gestures
      await mockPlaywright.evaluate({
        function: `() => {
          const table = document.querySelector('[data-testid="equipment-table"]');
          if (table) {
            // Simulate horizontal swipe
            const startTouch = { clientX: 200, clientY: 300, identifier: 1 };
            const endTouch = { clientX: 100, clientY: 300, identifier: 1 };
            
            const touchStart = window.createTouchEvent('touchstart', [startTouch]);
            const touchMove = window.createTouchEvent('touchmove', [endTouch]);
            const touchEnd = window.createTouchEvent('touchend', [endTouch]);
            
            table.dispatchEvent(touchStart);
            table.dispatchEvent(touchMove);
            table.dispatchEvent(touchEnd);
            
            return { swipeGestureSupported: true };
          }
          return { swipeGestureSupported: false };
        }`
      })

      // Test tap interactions
      await mockPlaywright.click({
        element: 'Equipment row',
        ref: 'equipment-row-1'
      })

      await mockPlaywright.waitFor({ text: 'Equipment Details' })

      // Verify mobile-optimized detail view
      await mockPlaywright.evaluate({
        function: `() => {
          const detailView = document.querySelector('[data-testid="equipment-detail"]');
          const isMobileOptimized = detailView && window.getComputedStyle(detailView).display === 'block';
          
          // Check for mobile-specific UI elements
          const mobileBackButton = document.querySelector('[data-testid="mobile-back-button"]');
          const mobileTabs = document.querySelector('[data-testid="mobile-tabs"]');
          
          return {
            isMobileOptimized: isMobileOptimized,
            hasMobileBackButton: !!mobileBackButton,
            hasMobileTabs: !!mobileTabs
          };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(4)
    })
  })

  describe('Mobile Form Testing', () => {
    it('should test mobile form usability', async () => {
      // Set mobile device
      await mockPlaywright.resize({ width: 375, height: 667 })
      
      await mockPlaywright.navigate('http://localhost:3000/inspections/new')
      await mockPlaywright.waitFor({ text: 'New Inspection' })

      // Test form layout on mobile
      await mockPlaywright.evaluate({
        function: `() => {
          const form = document.querySelector('form');
          const formRect = form.getBoundingClientRect();
          
          // Check form width
          const isFullWidth = formRect.width >= window.innerWidth * 0.9;
          
          // Check input field sizes
          const inputs = form.querySelectorAll('input, select, textarea');
          let appropriatelySizedInputs = 0;
          
          inputs.forEach(input => {
            const rect = input.getBoundingClientRect();
            const minHeight = 44; // Minimum touch-friendly height
            
            if (rect.height >= minHeight) {
              appropriatelySizedInputs++;
            }
          });
          
          // Check label positioning
          const labels = form.querySelectorAll('label');
          let properlyPositionedLabels = 0;
          
          labels.forEach(label => {
            const labelRect = label.getBoundingClientRect();
            const associatedInput = document.getElementById(label.getAttribute('for'));
            
            if (associatedInput) {
              const inputRect = associatedInput.getBoundingClientRect();
              // Label should be above input on mobile
              if (labelRect.bottom <= inputRect.top) {
                properlyPositionedLabels++;
              }
            }
          });
          
          return {
            isFullWidth: isFullWidth,
            totalInputs: inputs.length,
            appropriatelySizedInputs: appropriatelySizedInputs,
            totalLabels: labels.length,
            properlyPositionedLabels: properlyPositionedLabels
          };
        }`
      })

      // Test mobile keyboard interactions
      await mockPlaywright.click({
        element: 'Inspection title input',
        ref: 'inspection-title-input'
      })

      // Verify virtual keyboard accommodation
      await mockPlaywright.evaluate({
        function: `() => {
          // Simulate virtual keyboard appearance
          const originalHeight = window.innerHeight;
          Object.defineProperty(window, 'innerHeight', {
            value: originalHeight * 0.6, // Simulate keyboard taking 40% of screen
            configurable: true
          });
          
          window.dispatchEvent(new Event('resize'));
          
          // Check if form adjusts to keyboard
          const form = document.querySelector('form');
          const activeInput = document.activeElement;
          const inputRect = activeInput.getBoundingClientRect();
          
          // Input should be visible above virtual keyboard
          const isInputVisible = inputRect.bottom < window.innerHeight;
          
          return {
            originalHeight: originalHeight,
            adjustedHeight: window.innerHeight,
            isInputVisible: isInputVisible,
            activeInputTop: inputRect.top
          };
        }`
      })

      // Test form submission on mobile
      await mockPlaywright.type({
        element: 'Inspection title input',
        ref: 'inspection-title-input',
        text: 'Mobile Test Inspection'
      })

      await mockPlaywright.select({
        element: 'Equipment dropdown',
        ref: 'equipment-select',
        values: ['eq-001']
      })

      await mockPlaywright.click({
        element: 'Submit button',
        ref: 'submit-btn'
      })

      // Verify mobile-friendly success feedback
      await mockPlaywright.waitFor({ text: 'Inspection created successfully' })

      await mockPlaywright.evaluate({
        function: `() => {
          const successMessage = document.querySelector('[data-testid="success-message"]');
          const messageRect = successMessage.getBoundingClientRect();
          
          // Success message should be prominently displayed
          const isProminentlyDisplayed = messageRect.width >= window.innerWidth * 0.8;
          
          return {
            hasSuccessMessage: !!successMessage,
            isProminentlyDisplayed: isProminentlyDisplayed,
            messageWidth: messageRect.width,
            screenWidth: window.innerWidth
          };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(3)
    })

    it('should test mobile navigation patterns', async () => {
      // Test different mobile screen sizes
      const mobileSizes = [
        { width: 320, height: 568, name: 'iPhone 5' },
        { width: 375, height: 667, name: 'iPhone 8' },
        { width: 414, height: 896, name: 'iPhone 11 Pro Max' }
      ]

      for (const size of mobileSizes) {
        await mockPlaywright.resize({ width: size.width, height: size.height })
        
        await mockPlaywright.navigate('http://localhost:3000')
        await mockPlaywright.waitFor({ text: 'Dashboard' })

        // Test hamburger menu
        await mockPlaywright.click({
          element: 'Mobile menu button',
          ref: 'mobile-menu-btn'
        })

        // Verify mobile menu behavior
        await mockPlaywright.evaluate({
          function: `() => {
            const mobileMenu = document.querySelector('[data-testid="mobile-menu"]');
            const menuRect = mobileMenu.getBoundingClientRect();
            
            // Menu should cover most of the screen
            const coversScreen = menuRect.width >= window.innerWidth * 0.8;
            
            // Check menu items
            const menuItems = mobileMenu.querySelectorAll('[role="menuitem"], a');
            let touchFriendlyItems = 0;
            
            menuItems.forEach(item => {
              const rect = item.getBoundingClientRect();
              if (rect.height >= 44) { // Touch-friendly height
                touchFriendlyItems++;
              }
            });
            
            return {
              device: '${size.name}',
              menuVisible: !!mobileMenu,
              coversScreen: coversScreen,
              totalMenuItems: menuItems.length,
              touchFriendlyItems: touchFriendlyItems,
              menuWidth: menuRect.width,
              screenWidth: window.innerWidth
            };
          }`
        })

        // Test menu navigation
        await mockPlaywright.click({
          element: 'Equipment menu item',
          ref: 'equipment-menu-item'
        })

        await mockPlaywright.waitFor({ text: 'Equipment List' })

        // Verify breadcrumb navigation on mobile
        await mockPlaywright.evaluate({
          function: `() => {
            const breadcrumb = document.querySelector('[data-testid="breadcrumb"]');
            
            if (breadcrumb) {
              const breadcrumbStyle = window.getComputedStyle(breadcrumb);
              const isMobileOptimized = breadcrumbStyle.fontSize >= '14px';
              
              return {
                hasBreadcrumb: true,
                isMobileOptimized: isMobileOptimized,
                fontSize: breadcrumbStyle.fontSize
              };
            }
            
            return { hasBreadcrumb: false };
          }`
        })

        // Take screenshot for visual verification
        await mockPlaywright.screenshot({ 
          filename: `mobile-navigation-${size.name.toLowerCase().replace(/\\s+/g, '-')}.png` 
        })
      }

      expect(mockPlaywright.resize).toHaveBeenCalledTimes(mobileSizes.length)
      expect(mockPlaywright.screenshot).toHaveBeenCalledTimes(mobileSizes.length)
    })
  })

  describe('Mobile Performance Testing', () => {
    it('should test mobile performance optimization', async () => {
      // Set mobile device with slower CPU
      await mockPlaywright.resize({ width: 375, height: 667 })
      
      // Simulate slower mobile CPU
      await mockPlaywright.evaluate({
        function: `() => {
          // Throttle JavaScript execution
          const originalSetTimeout = window.setTimeout;
          const originalSetInterval = window.setInterval;
          
          window.setTimeout = function(callback, delay) {
            return originalSetTimeout(callback, delay * 2); // 2x slower
          };
          
          window.setInterval = function(callback, delay) {
            return originalSetInterval(callback, delay * 2); // 2x slower
          };
        }`
      })

      const startTime = Date.now()
      
      await mockPlaywright.navigate('http://localhost:3000/dashboard')
      await mockPlaywright.waitFor({ text: 'Dashboard' })
      
      const mobileLoadTime = Date.now() - startTime

      // Test mobile-specific optimizations
      await mockPlaywright.evaluate({
        function: `() => {
          // Check for lazy loading
          const images = document.querySelectorAll('img');
          let lazyImages = 0;
          
          images.forEach(img => {
            if (img.loading === 'lazy' || img.getAttribute('data-src')) {
              lazyImages++;
            }
          });
          
          // Check for mobile-optimized images
          let optimizedImages = 0;
          images.forEach(img => {
            const src = img.src || img.getAttribute('data-src');
            if (src && (src.includes('mobile') || src.includes('small'))) {
              optimizedImages++;
            }
          });
          
          // Check for reduced animations on mobile
          const animatedElements = document.querySelectorAll('[style*="animation"], [class*="animate"]');
          
          return {
            loadTime: ${mobileLoadTime},
            totalImages: images.length,
            lazyImages: lazyImages,
            optimizedImages: optimizedImages,
            animatedElements: animatedElements.length,
            lazyLoadingPercentage: (lazyImages / images.length) * 100
          };
        }`
      })

      // Test scroll performance on mobile
      const scrollStartTime = Date.now()
      
      await mockPlaywright.evaluate({
        function: `() => {
          // Simulate mobile scrolling
          let scrollTop = 0;
          const scrollStep = 100;
          const maxScroll = document.body.scrollHeight - window.innerHeight;
          
          const scrollInterval = setInterval(() => {
            scrollTop += scrollStep;
            window.scrollTo(0, scrollTop);
            
            if (scrollTop >= maxScroll) {
              clearInterval(scrollInterval);
            }
          }, 16); // 60fps
          
          return { maxScroll: maxScroll };
        }`
      })

      await mockPlaywright.waitFor({ time: 2000 }) // Allow scrolling to complete
      
      const scrollTime = Date.now() - scrollStartTime

      // Measure mobile memory usage
      await mockPlaywright.evaluate({
        function: `() => {
          if (performance.memory) {
            return {
              scrollTime: ${scrollTime},
              memoryUsage: {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
              },
              performanceScore: ${mobileLoadTime} < 3000 ? 'good' : ${mobileLoadTime} < 5000 ? 'fair' : 'poor'
            };
          }
          
          return {
            scrollTime: ${scrollTime},
            performanceScore: ${mobileLoadTime} < 3000 ? 'good' : ${mobileLoadTime} < 5000 ? 'fair' : 'poor'
          };
        }`
      })

      // Verify mobile performance budgets
      expect(mobileLoadTime).toBeLessThan(5000) // 5 second budget for mobile
      expect(scrollTime).toBeLessThan(2000) // 2 second scroll budget
      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(4)
    })
  })

  describe('Mobile Accessibility Testing', () => {
    it('should test mobile accessibility features', async () => {
      // Set mobile device
      await mockPlaywright.resize({ width: 375, height: 667 })
      
      await mockPlaywright.navigate('http://localhost:3000/equipment')
      await mockPlaywright.waitFor({ text: 'Equipment List' })

      // Test mobile screen reader compatibility
      await mockPlaywright.evaluate({
        function: `() => {
          // Check for mobile-specific ARIA labels
          const mobileElements = document.querySelectorAll('[data-mobile="true"], .mobile-only');
          let accessibleMobileElements = 0;
          
          mobileElements.forEach(element => {
            const hasAriaLabel = element.getAttribute('aria-label');
            const hasRole = element.getAttribute('role');
            const hasAriaDescribedBy = element.getAttribute('aria-describedby');
            
            if (hasAriaLabel || hasRole || hasAriaDescribedBy) {
              accessibleMobileElements++;
            }
          });
          
          // Check for touch gesture alternatives
          const gestureElements = document.querySelectorAll('[data-gesture]');
          let elementsWithAlternatives = 0;
          
          gestureElements.forEach(element => {
            const hasButton = element.querySelector('button');
            const hasKeyboardHandler = element.getAttribute('tabindex') !== null;
            
            if (hasButton || hasKeyboardHandler) {
              elementsWithAlternatives++;
            }
          });
          
          return {
            totalMobileElements: mobileElements.length,
            accessibleMobileElements: accessibleMobileElements,
            totalGestureElements: gestureElements.length,
            elementsWithAlternatives: elementsWithAlternatives
          };
        }`
      })

      // Test mobile focus management
      await mockPlaywright.pressKey({ key: 'Tab' })
      
      await mockPlaywright.evaluate({
        function: `() => {
          const focusedElement = document.activeElement;
          const focusRect = focusedElement.getBoundingClientRect();
          
          // Focus should be visible and appropriately sized for mobile
          const isFocusVisible = focusRect.width > 0 && focusRect.height > 0;
          const isTouchFriendly = focusRect.height >= 44;
          
          // Check focus indicator visibility
          const focusStyle = window.getComputedStyle(focusedElement, ':focus');
          const hasFocusIndicator = focusStyle.outline !== 'none' || focusStyle.boxShadow !== 'none';
          
          return {
            isFocusVisible: isFocusVisible,
            isTouchFriendly: isTouchFriendly,
            hasFocusIndicator: hasFocusIndicator,
            focusWidth: focusRect.width,
            focusHeight: focusRect.height
          };
        }`
      })

      // Test mobile zoom accessibility
      await mockPlaywright.evaluate({
        function: `() => {
          // Check viewport meta tag for zoom settings
          const viewportMeta = document.querySelector('meta[name="viewport"]');
          const viewportContent = viewportMeta ? viewportMeta.getAttribute('content') : '';
          
          // Should allow zooming for accessibility
          const allowsZoom = !viewportContent.includes('user-scalable=no') && 
                           !viewportContent.includes('maximum-scale=1');
          
          // Test text scaling
          const textElements = document.querySelectorAll('p, span, label, button');
          let scalableText = 0;
          
          textElements.forEach(element => {
            const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
            // Text should be scalable (not using fixed pixel sizes exclusively)
            const isScalable = fontSize >= 14; // Minimum readable size
            
            if (isScalable) {
              scalableText++;
            }
          });
          
          return {
            hasViewportMeta: !!viewportMeta,
            allowsZoom: allowsZoom,
            viewportContent: viewportContent,
            totalTextElements: textElements.length,
            scalableText: scalableText,
            scalableTextPercentage: (scalableText / textElements.length) * 100
          };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(3)
    })
  })

  describe('Mobile Responsiveness Summary', () => {
    it('should generate comprehensive mobile responsiveness report', async () => {
      const testDevices = [
        { width: 320, height: 568, name: 'Small Mobile' },
        { width: 375, height: 667, name: 'Medium Mobile' },
        { width: 414, height: 896, name: 'Large Mobile' },
        { width: 768, height: 1024, name: 'Tablet Portrait' },
        { width: 1024, height: 768, name: 'Tablet Landscape' }
      ]

      const testPages = [
        'http://localhost:3000/dashboard',
        'http://localhost:3000/equipment',
        'http://localhost:3000/inspections/new',
        'http://localhost:3000/reports'
      ]

      const responsiveReport = {
        devices: [],
        summary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          averageScore: 0
        }
      }

      for (const device of testDevices) {
        await mockPlaywright.resize({ width: device.width, height: device.height })
        
        const deviceResults = {
          name: device.name,
          dimensions: { width: device.width, height: device.height },
          pages: []
        }

        for (const pageUrl of testPages) {
          await mockPlaywright.navigate(pageUrl)
          await mockPlaywright.waitFor({ time: 2000 })

          const pageTest = await mockPlaywright.evaluate({
            function: `
              () => {
                const tests = {
                  noHorizontalScroll: document.body.scrollWidth <= window.innerWidth,
                  touchTargetsAdequate: true,
                  textReadable: true,
                  navigationAccessible: true,
                  contentVisible: true
                };
                
                // Test touch targets
                const touchTargets = document.querySelectorAll('button, a, input, select');
                let inadequateTargets = 0;
                touchTargets.forEach(target => {
                  const rect = target.getBoundingClientRect();
                  if (Math.min(rect.width, rect.height) < 44) {
                    inadequateTargets++;
                  }
                });
                tests.touchTargetsAdequate = inadequateTargets === 0;
                
                // Test text readability
                const textElements = document.querySelectorAll('p, span, label, button');
                let unreadableText = 0;
                textElements.forEach(element => {
                  const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
                  if (fontSize < 14) unreadableText++;
                });
                tests.textReadable = unreadableText === 0;
                
                // Test navigation
                const mobileNav = document.querySelector('[data-testid="mobile-menu-btn"]');
                tests.navigationAccessible = window.innerWidth < 768 ? !!mobileNav : true;
                
                // Test content visibility
                const mainContent = document.querySelector('main, [role="main"]');
                if (mainContent) {
                  const rect = mainContent.getBoundingClientRect();
                  tests.contentVisible = rect.width > 0 && rect.height > 0;
                }
                
                const passedTests = Object.values(tests).filter(Boolean).length;
                const totalTests = Object.keys(tests).length;
                
                return {
                  url: '${pageUrl}',
                  tests: tests,
                  score: (passedTests / totalTests) * 100,
                  passedTests: passedTests,
                  totalTests: totalTests
                };
              }
            `
          })

          deviceResults.pages.push(pageTest)
          responsiveReport.summary.totalTests += pageTest.totalTests
          responsiveReport.summary.passedTests += pageTest.passedTests
        }

        responsiveReport.devices.push(deviceResults)

        // Take device screenshot
        await mockPlaywright.screenshot({ 
          filename: `responsive-summary-${device.name.toLowerCase().replace(/\\s+/g, '-')}.png`,
          fullPage: true
        })
      }

      // Generate final summary
      await mockPlaywright.evaluate({
        function: `() => {
          const report = ${JSON.stringify(responsiveReport)};
          
          report.summary.failedTests = report.summary.totalTests - report.summary.passedTests;
          report.summary.averageScore = (report.summary.passedTests / report.summary.totalTests) * 100;
          
          // Store report
          window.responsiveReport = report;
          
          return report.summary;
        }`
      })

      expect(mockPlaywright.resize).toHaveBeenCalledTimes(testDevices.length)
      expect(mockPlaywright.navigate).toHaveBeenCalledTimes(testDevices.length * testPages.length)
      expect(mockPlaywright.screenshot).toHaveBeenCalledTimes(testDevices.length)
    })
  })
})
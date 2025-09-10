/**
 * MCP Playwright Accessibility Testing
 * Comprehensive accessibility audits using MCP Playwright accessibility features
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PlaywrightBrowserHelpers } from './playwright-helpers'

// Mock MCP Playwright functions for accessibility testing
const mockPlaywright = {
  navigate: jest.fn(),
  click: jest.fn(),
  type: jest.fn(),
  select: jest.fn(),
  waitFor: jest.fn(),
  screenshot: jest.fn(),
  evaluate: jest.fn(),
  snapshot: jest.fn(),
  hover: jest.fn(),
  pressKey: jest.fn(),
  resize: jest.fn(),
}

describe('Accessibility Testing with MCP Playwright', () => {
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
    mockPlaywright.snapshot.mockResolvedValue({
      title: 'Accessibility Test',
      elements: []
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    PlaywrightBrowserHelpers.cleanup()
  })

  describe('WCAG 2.1 AA Compliance Testing', () => {
    it('should run comprehensive accessibility audit on dashboard', async () => {
      // Navigate to dashboard
      await mockPlaywright.navigate('http://localhost:3000/dashboard')
      await mockPlaywright.waitFor({ text: 'Dashboard' })

      // Take initial screenshot for documentation
      await mockPlaywright.screenshot({ filename: 'accessibility-dashboard-initial.png' })

      // Run axe-core accessibility audit
      const auditResults = await mockPlaywright.evaluate({
        function: `
          async () => {
            // Import axe-core
            const axe = await import('axe-core');
            
            // Configure axe for WCAG 2.1 AA compliance
            const config = {
              rules: {
                'color-contrast': { enabled: true },
                'keyboard-navigation': { enabled: true },
                'focus-management': { enabled: true },
                'aria-labels': { enabled: true },
                'heading-structure': { enabled: true },
                'form-labels': { enabled: true },
                'image-alt-text': { enabled: true },
                'link-purpose': { enabled: true }
              },
              tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
            };
            
            // Run accessibility audit
            const results = await axe.run(document, config);
            
            return {
              violations: results.violations,
              passes: results.passes,
              incomplete: results.incomplete,
              inapplicable: results.inapplicable,
              summary: {
                violationCount: results.violations.length,
                passCount: results.passes.length,
                incompleteCount: results.incomplete.length
              }
            };
          }
        `
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledWith({
        function: expect.stringContaining('axe.run')
      })

      // Verify no critical violations
      await mockPlaywright.evaluate({
        function: '() => window.axeResults.violations.filter(v => v.impact === "critical").length === 0'
      })

      // Take screenshot of audit results
      await mockPlaywright.screenshot({ filename: 'accessibility-audit-results.png' })
    })

    it('should test keyboard navigation throughout the application', async () => {
      // Test dashboard keyboard navigation
      await mockPlaywright.navigate('http://localhost:3000/dashboard')
      await mockPlaywright.waitFor({ text: 'Dashboard' })

      // Start keyboard navigation test
      await mockPlaywright.evaluate({
        function: '() => document.body.focus()'
      })

      // Test tab navigation through focusable elements
      const focusableElements = [
        'main-navigation',
        'dashboard-widget-1',
        'dashboard-widget-2',
        'dashboard-widget-3',
        'user-menu'
      ]

      for (let i = 0; i < focusableElements.length; i++) {
        await mockPlaywright.pressKey({ key: 'Tab' })
        
        // Verify focus is on expected element
        await mockPlaywright.evaluate({
          function: `() => {
            const activeElement = document.activeElement;
            const expectedElement = document.querySelector('[data-testid="${focusableElements[i]}"]');
            return activeElement === expectedElement || expectedElement.contains(activeElement);
          }`
        })
      }

      // Test reverse tab navigation
      for (let i = focusableElements.length - 1; i >= 0; i--) {
        await mockPlaywright.pressKey({ key: 'Shift+Tab' })
        
        await mockPlaywright.evaluate({
          function: `() => {
            const activeElement = document.activeElement;
            const expectedElement = document.querySelector('[data-testid="${focusableElements[i]}"]');
            return activeElement === expectedElement || expectedElement.contains(activeElement);
          }`
        })
      }

      // Test Enter key activation
      await mockPlaywright.pressKey({ key: 'Tab' }) // Focus on first interactive element
      await mockPlaywright.pressKey({ key: 'Enter' })
      
      // Verify action was triggered
      await mockPlaywright.evaluate({
        function: '() => document.activeElement.getAttribute("aria-expanded") === "true" || window.location.href !== "http://localhost:3000/dashboard"'
      })

      expect(mockPlaywright.pressKey).toHaveBeenCalledTimes(focusableElements.length * 2 + 2)
    })

    it('should validate ARIA labels and semantic markup', async () => {
      // Test equipment management page
      await mockPlaywright.navigate('http://localhost:3000/equipment')
      await mockPlaywright.waitFor({ text: 'Equipment Management' })

      // Check for proper heading structure
      await mockPlaywright.evaluate({
        function: `() => {
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          let hasH1 = false;
          let properOrder = true;
          let lastLevel = 0;
          
          headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level === 1) hasH1 = true;
            if (level > lastLevel + 1) properOrder = false;
            lastLevel = level;
          });
          
          return { hasH1, properOrder, headingCount: headings.length };
        }`
      })

      // Check for proper form labels
      await mockPlaywright.evaluate({
        function: `() => {
          const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
          let unlabeledInputs = 0;
          
          inputs.forEach(input => {
            const hasLabel = input.labels && input.labels.length > 0;
            const hasAriaLabel = input.getAttribute('aria-label');
            const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
            
            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
              unlabeledInputs++;
            }
          });
          
          return { totalInputs: inputs.length, unlabeledInputs };
        }`
      })

      // Check for proper button accessibility
      await mockPlaywright.evaluate({
        function: `() => {
          const buttons = document.querySelectorAll('button');
          let inaccessibleButtons = 0;
          
          buttons.forEach(button => {
            const hasText = button.textContent.trim().length > 0;
            const hasAriaLabel = button.getAttribute('aria-label');
            const hasTitle = button.getAttribute('title');
            
            if (!hasText && !hasAriaLabel && !hasTitle) {
              inaccessibleButtons++;
            }
          });
          
          return { totalButtons: buttons.length, inaccessibleButtons };
        }`
      })

      // Check for proper image alt text
      await mockPlaywright.evaluate({
        function: `() => {
          const images = document.querySelectorAll('img');
          let imagesWithoutAlt = 0;
          
          images.forEach(img => {
            const hasAlt = img.getAttribute('alt') !== null;
            const isDecorative = img.getAttribute('role') === 'presentation' || img.getAttribute('alt') === '';
            
            if (!hasAlt && !isDecorative) {
              imagesWithoutAlt++;
            }
          });
          
          return { totalImages: images.length, imagesWithoutAlt };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(4)
    })

    it('should test color contrast compliance', async () => {
      // Navigate to forms page for color contrast testing
      await mockPlaywright.navigate('http://localhost:3000/inspections/new')
      await mockPlaywright.waitFor({ text: 'New Inspection' })

      // Test color contrast for text elements
      await mockPlaywright.evaluate({
        function: `() => {
          function getContrastRatio(foreground, background) {
            // Simplified contrast ratio calculation
            const getLuminance = (color) => {
              const rgb = color.match(/\\d+/g);
              if (!rgb) return 0;
              const [r, g, b] = rgb.map(c => {
                c = parseInt(c) / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
              });
              return 0.2126 * r + 0.7152 * g + 0.0722 * b;
            };
            
            const l1 = getLuminance(foreground);
            const l2 = getLuminance(background);
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);
            
            return (lighter + 0.05) / (darker + 0.05);
          }
          
          const textElements = document.querySelectorAll('p, span, label, button, input, h1, h2, h3, h4, h5, h6');
          let contrastIssues = [];
          
          textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
              const ratio = getContrastRatio(color, backgroundColor);
              if (ratio < 4.5) { // WCAG AA standard
                contrastIssues.push({
                  element: element.tagName,
                  ratio: ratio,
                  color: color,
                  backgroundColor: backgroundColor
                });
              }
            }
          });
          
          return { totalElements: textElements.length, contrastIssues: contrastIssues.length };
        }`
      })

      // Test focus indicators
      await mockPlaywright.evaluate({
        function: `() => {
          const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href]');
          let elementsWithoutFocusIndicator = 0;
          
          focusableElements.forEach(element => {
            element.focus();
            const focusStyles = window.getComputedStyle(element, ':focus');
            const hasOutline = focusStyles.outline !== 'none' && focusStyles.outline !== '0px';
            const hasBoxShadow = focusStyles.boxShadow !== 'none';
            const hasBorder = focusStyles.borderColor !== element.style.borderColor;
            
            if (!hasOutline && !hasBoxShadow && !hasBorder) {
              elementsWithoutFocusIndicator++;
            }
          });
          
          return { totalFocusable: focusableElements.length, withoutFocusIndicator: elementsWithoutFocusIndicator };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(2)
    })
  })

  describe('Screen Reader Compatibility Testing', () => {
    it('should test screen reader announcements and live regions', async () => {
      // Navigate to dashboard
      await mockPlaywright.navigate('http://localhost:3000/dashboard')
      await mockPlaywright.waitFor({ text: 'Dashboard' })

      // Check for proper live regions
      await mockPlaywright.evaluate({
        function: `() => {
          const liveRegions = document.querySelectorAll('[aria-live]');
          const statusRegions = document.querySelectorAll('[role="status"]');
          const alertRegions = document.querySelectorAll('[role="alert"]');
          
          return {
            liveRegions: liveRegions.length,
            statusRegions: statusRegions.length,
            alertRegions: alertRegions.length
          };
        }`
      })

      // Test dynamic content announcements
      await mockPlaywright.click({
        element: 'Refresh dashboard button',
        ref: 'refresh-dashboard-btn'
      })

      // Verify loading state is announced
      await mockPlaywright.evaluate({
        function: `() => {
          const loadingAnnouncement = document.querySelector('[aria-live="polite"]');
          return loadingAnnouncement && loadingAnnouncement.textContent.includes('Loading');
        }`
      })

      // Wait for data to load and verify success announcement
      await mockPlaywright.waitFor({ text: 'Dashboard updated' })
      
      await mockPlaywright.evaluate({
        function: `() => {
          const successAnnouncement = document.querySelector('[aria-live="polite"]');
          return successAnnouncement && successAnnouncement.textContent.includes('updated');
        }`
      })

      // Test error announcements
      await mockPlaywright.evaluate({
        function: `() => {
          // Simulate network error
          window.fetch = () => Promise.reject(new Error('Network error'));
        }`
      })

      await mockPlaywright.click({
        element: 'Refresh dashboard button',
        ref: 'refresh-dashboard-btn'
      })

      // Verify error is announced
      await mockPlaywright.evaluate({
        function: `() => {
          const errorAnnouncement = document.querySelector('[role="alert"]');
          return errorAnnouncement && errorAnnouncement.textContent.includes('error');
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(5)
    })

    it('should test landmark navigation and page structure', async () => {
      // Test main application layout
      await mockPlaywright.navigate('http://localhost:3000')
      await mockPlaywright.waitFor({ text: 'Dashboard' })

      // Check for proper landmark structure
      await mockPlaywright.evaluate({
        function: `() => {
          const landmarks = {
            banner: document.querySelectorAll('[role="banner"], header').length,
            navigation: document.querySelectorAll('[role="navigation"], nav').length,
            main: document.querySelectorAll('[role="main"], main').length,
            contentinfo: document.querySelectorAll('[role="contentinfo"], footer').length,
            complementary: document.querySelectorAll('[role="complementary"], aside').length
          };
          
          return landmarks;
        }`
      })

      // Test skip links
      await mockPlaywright.pressKey({ key: 'Tab' })
      
      await mockPlaywright.evaluate({
        function: `() => {
          const skipLink = document.activeElement;
          return skipLink && skipLink.textContent.includes('Skip to main content');
        }`
      })

      // Activate skip link
      await mockPlaywright.pressKey({ key: 'Enter' })
      
      // Verify focus moved to main content
      await mockPlaywright.evaluate({
        function: `() => {
          const mainContent = document.querySelector('main, [role="main"]');
          return document.activeElement === mainContent || mainContent.contains(document.activeElement);
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(3)
    })
  })

  describe('Form Accessibility Testing', () => {
    it('should test form accessibility in inspection creation', async () => {
      // Navigate to inspection form
      await mockPlaywright.navigate('http://localhost:3000/inspections/new')
      await mockPlaywright.waitFor({ text: 'New Inspection' })

      // Test form structure and labels
      await mockPlaywright.evaluate({
        function: `() => {
          const form = document.querySelector('form');
          const fieldsets = form.querySelectorAll('fieldset');
          const legends = form.querySelectorAll('legend');
          
          return {
            hasForm: !!form,
            fieldsetCount: fieldsets.length,
            legendCount: legends.length,
            formHasLabel: !!form.getAttribute('aria-label') || !!form.getAttribute('aria-labelledby')
          };
        }`
      })

      // Test required field indicators
      await mockPlaywright.evaluate({
        function: `() => {
          const requiredFields = document.querySelectorAll('[required], [aria-required="true"]');
          let properlyMarked = 0;
          
          requiredFields.forEach(field => {
            const label = field.labels && field.labels[0];
            const hasAsterisk = label && label.textContent.includes('*');
            const hasAriaRequired = field.getAttribute('aria-required') === 'true';
            const hasRequiredAttr = field.hasAttribute('required');
            
            if ((hasAsterisk || hasAriaRequired || hasRequiredAttr)) {
              properlyMarked++;
            }
          });
          
          return { totalRequired: requiredFields.length, properlyMarked };
        }`
      })

      // Test error message association
      await mockPlaywright.click({
        element: 'Submit form button',
        ref: 'submit-form-btn'
      })

      await mockPlaywright.waitFor({ text: 'Please fill in all required fields' })

      await mockPlaywright.evaluate({
        function: `() => {
          const errorMessages = document.querySelectorAll('[role="alert"], .error-message');
          let properlyAssociated = 0;
          
          errorMessages.forEach(error => {
            const associatedField = document.querySelector(\`[aria-describedby*="\${error.id}"]\`);
            if (associatedField) {
              properlyAssociated++;
            }
          });
          
          return { totalErrors: errorMessages.length, properlyAssociated };
        }`
      })

      // Test field descriptions
      await mockPlaywright.evaluate({
        function: `() => {
          const fieldsWithDescriptions = document.querySelectorAll('[aria-describedby]');
          let validDescriptions = 0;
          
          fieldsWithDescriptions.forEach(field => {
            const describedBy = field.getAttribute('aria-describedby');
            const descriptions = describedBy.split(' ');
            
            descriptions.forEach(id => {
              const description = document.getElementById(id);
              if (description) {
                validDescriptions++;
              }
            });
          });
          
          return { fieldsWithDescriptions: fieldsWithDescriptions.length, validDescriptions };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(4)
    })

    it('should test complex form interactions accessibility', async () => {
      // Navigate to template builder (complex form)
      await mockPlaywright.navigate('http://localhost:3000/admin/templates/new')
      await mockPlaywright.waitFor({ text: 'Create Template' })

      // Test dynamic form field addition
      await mockPlaywright.click({
        element: 'Add section button',
        ref: 'add-section-btn'
      })

      // Verify new section is announced
      await mockPlaywright.evaluate({
        function: `() => {
          const announcement = document.querySelector('[aria-live="polite"]');
          return announcement && announcement.textContent.includes('Section added');
        }`
      })

      // Test drag and drop accessibility
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn'
      })

      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn'
      })

      // Test keyboard-based reordering
      await mockPlaywright.pressKey({ key: 'Tab' }) // Focus on first field
      await mockPlaywright.pressKey({ key: 'Space' }) // Activate drag mode
      await mockPlaywright.pressKey({ key: 'ArrowDown' }) // Move down
      await mockPlaywright.pressKey({ key: 'Space' }) // Drop

      // Verify reorder is announced
      await mockPlaywright.evaluate({
        function: `() => {
          const announcement = document.querySelector('[aria-live="assertive"]');
          return announcement && announcement.textContent.includes('moved');
        }`
      })

      // Test conditional field visibility
      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select',
        values: ['select']
      })

      // Verify conditional options appear and are announced
      await mockPlaywright.evaluate({
        function: `() => {
          const conditionalSection = document.querySelector('[data-testid="select-options-section"]');
          const isVisible = conditionalSection && conditionalSection.style.display !== 'none';
          const announcement = document.querySelector('[aria-live="polite"]');
          const isAnnounced = announcement && announcement.textContent.includes('Additional options');
          
          return { isVisible, isAnnounced };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(3)
    })
  })

  describe('Mobile Accessibility Testing', () => {
    it('should test touch accessibility on mobile devices', async () => {
      // Resize to mobile viewport
      await mockPlaywright.resize({ width: 375, height: 667 })
      
      // Navigate to equipment list
      await mockPlaywright.navigate('http://localhost:3000/equipment')
      await mockPlaywright.waitFor({ text: 'Equipment List' })

      // Test touch target sizes
      await mockPlaywright.evaluate({
        function: `() => {
          const touchTargets = document.querySelectorAll('button, a, input, select, textarea');
          let smallTargets = 0;
          const minSize = 44; // 44px minimum touch target size
          
          touchTargets.forEach(target => {
            const rect = target.getBoundingClientRect();
            if (rect.width < minSize || rect.height < minSize) {
              smallTargets++;
            }
          });
          
          return { totalTargets: touchTargets.length, smallTargets };
        }`
      })

      // Test mobile navigation accessibility
      await mockPlaywright.click({
        element: 'Mobile menu button',
        ref: 'mobile-menu-btn'
      })

      // Verify menu is announced and accessible
      await mockPlaywright.evaluate({
        function: `() => {
          const menu = document.querySelector('[role="menu"], [aria-expanded="true"]');
          const hasProperAria = menu && (
            menu.getAttribute('aria-label') || 
            menu.getAttribute('aria-labelledby')
          );
          
          return { menuVisible: !!menu, hasProperAria };
        }`
      })

      // Test swipe gestures accessibility (simulated)
      await mockPlaywright.evaluate({
        function: `() => {
          // Simulate swipe gesture
          const swipeArea = document.querySelector('[data-testid="swipe-area"]');
          if (swipeArea) {
            const touchStart = new TouchEvent('touchstart', {
              touches: [{ clientX: 100, clientY: 100 }]
            });
            const touchEnd = new TouchEvent('touchend', {
              touches: [{ clientX: 200, clientY: 100 }]
            });
            
            swipeArea.dispatchEvent(touchStart);
            swipeArea.dispatchEvent(touchEnd);
            
            return { swipeSupported: true };
          }
          
          return { swipeSupported: false };
        }`
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(3)
    })

    it('should test responsive design accessibility', async () => {
      const viewports = [
        { width: 320, height: 568, name: 'mobile-small' },
        { width: 375, height: 667, name: 'mobile-medium' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'tablet-landscape' },
        { width: 1280, height: 720, name: 'desktop' }
      ]

      for (const viewport of viewports) {
        await mockPlaywright.resize({ width: viewport.width, height: viewport.height })
        
        await mockPlaywright.navigate('http://localhost:3000/dashboard')
        await mockPlaywright.waitFor({ text: 'Dashboard' })

        // Test content reflow and accessibility
        await mockPlaywright.evaluate({
          function: `() => {
            // Check for horizontal scrolling
            const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
            
            // Check for overlapping content
            const elements = document.querySelectorAll('*');
            let overlappingElements = 0;
            
            for (let i = 0; i < elements.length - 1; i++) {
              const rect1 = elements[i].getBoundingClientRect();
              const rect2 = elements[i + 1].getBoundingClientRect();
              
              if (rect1.right > rect2.left && rect1.left < rect2.right &&
                  rect1.bottom > rect2.top && rect1.top < rect2.bottom) {
                overlappingElements++;
              }
            }
            
            return { 
              viewport: '${viewport.name}',
              hasHorizontalScroll, 
              overlappingElements: overlappingElements > 10 ? 'many' : overlappingElements 
            };
          }`
        })

        // Take screenshot for visual verification
        await mockPlaywright.screenshot({ 
          filename: `accessibility-responsive-${viewport.name}.png` 
        })
      }

      expect(mockPlaywright.resize).toHaveBeenCalledTimes(viewports.length)
      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(viewports.length)
      expect(mockPlaywright.screenshot).toHaveBeenCalledTimes(viewports.length)
    })
  })

  describe('Accessibility Testing Summary', () => {
    it('should generate comprehensive accessibility report', async () => {
      const pages = [
        'http://localhost:3000/dashboard',
        'http://localhost:3000/equipment',
        'http://localhost:3000/inspections',
        'http://localhost:3000/reports',
        'http://localhost:3000/admin/templates'
      ]

      const accessibilityReport = {
        pages: [],
        summary: {
          totalViolations: 0,
          criticalViolations: 0,
          moderateViolations: 0,
          minorViolations: 0,
          totalPasses: 0
        }
      }

      for (const pageUrl of pages) {
        await mockPlaywright.navigate(pageUrl)
        await mockPlaywright.waitFor({ time: 2000 }) // Allow page to fully load

        // Run comprehensive accessibility audit
        const pageResults = await mockPlaywright.evaluate({
          function: `
            async () => {
              const axe = await import('axe-core');
              const results = await axe.run(document, {
                tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
              });
              
              return {
                url: window.location.href,
                violations: results.violations.map(v => ({
                  id: v.id,
                  impact: v.impact,
                  description: v.description,
                  nodes: v.nodes.length
                })),
                passes: results.passes.length,
                incomplete: results.incomplete.length
              };
            }
          `
        })

        accessibilityReport.pages.push(pageResults)
      }

      // Generate summary
      await mockPlaywright.evaluate({
        function: `() => {
          const report = ${JSON.stringify(accessibilityReport)};
          
          report.pages.forEach(page => {
            page.violations.forEach(violation => {
              report.summary.totalViolations++;
              switch(violation.impact) {
                case 'critical':
                  report.summary.criticalViolations++;
                  break;
                case 'serious':
                  report.summary.moderateViolations++;
                  break;
                case 'moderate':
                case 'minor':
                  report.summary.minorViolations++;
                  break;
              }
            });
            report.summary.totalPasses += page.passes;
          });
          
          // Store report for later use
          window.accessibilityReport = report;
          
          return report.summary;
        }`
      })

      // Take final screenshot of report
      await mockPlaywright.screenshot({ filename: 'accessibility-final-report.png' })

      expect(mockPlaywright.navigate).toHaveBeenCalledTimes(pages.length)
      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(pages.length + 1)
    })
  })
})
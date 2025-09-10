// Accessibility testing utilities for development and testing

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info'
  rule: string
  message: string
  element: HTMLElement
  suggestion?: string
  severity: number
  wcagLevel: 'A' | 'AA' | 'AAA'
}

export interface AccessibilityTestResult {
  passed: boolean
  issues: AccessibilityIssue[]
  score: number
  summary: {
    errors: number
    warnings: number
    info: number
  }
  testedElements: number
  timestamp: string
}

export interface AccessibilityTestOptions {
  includeWarnings?: boolean
  includeInfo?: boolean
  wcagLevel?: 'A' | 'AA' | 'AAA'
  excludeRules?: string[]
  includeRules?: string[]
}

// WCAG 2.1 Guidelines Implementation
export class AccessibilityTester {
  private options: AccessibilityTestOptions
  private issues: AccessibilityIssue[] = []

  constructor(options: AccessibilityTestOptions = {}) {
    this.options = {
      includeWarnings: true,
      includeInfo: false,
      wcagLevel: 'AA',
      excludeRules: [],
      includeRules: [],
      ...options
    }
  }

  // Main testing function
  public async testElement(element: HTMLElement): Promise<AccessibilityTestResult> {
    this.issues = []
    const startTime = Date.now()

    // Run all accessibility tests
    await this.runAllTests(element)

    // Filter issues based on options
    const filteredIssues = this.filterIssues()

    // Calculate score
    const score = this.calculateScore(filteredIssues)

    // Generate summary
    const summary = this.generateSummary(filteredIssues)

    return {
      passed: filteredIssues.filter(issue => issue.type === 'error').length === 0,
      issues: filteredIssues,
      score,
      summary,
      testedElements: this.countElements(element),
      timestamp: new Date().toISOString()
    }
  }

  // Test entire page
  public async testPage(): Promise<AccessibilityTestResult> {
    return this.testElement(document.body)
  }

  // Run all accessibility tests
  private async runAllTests(element: HTMLElement): Promise<void> {
    // Test keyboard navigation
    this.testKeyboardNavigation(element)
    
    // Test ARIA attributes
    this.testAriaAttributes(element)
    
    // Test semantic HTML
    this.testSemanticHTML(element)
    
    // Test color contrast
    await this.testColorContrast(element)
    
    // Test images and media
    this.testImagesAndMedia(element)
    
    // Test forms
    this.testForms(element)
    
    // Test headings structure
    this.testHeadingStructure(element)
    
    // Test focus management
    this.testFocusManagement(element)
    
    // Test interactive elements
    this.testInteractiveElements(element)
    
    // Test landmarks
    this.testLandmarks(element)
  }

  // Test keyboard navigation
  private testKeyboardNavigation(element: HTMLElement): void {
    const focusableElements = this.getFocusableElements(element)
    
    focusableElements.forEach((el, index) => {
      // Check if element is keyboard accessible
      if (!this.isKeyboardAccessible(el)) {
        this.addIssue({
          type: 'error',
          rule: 'keyboard-navigation',
          message: 'Element is not keyboard accessible',
          element: el,
          suggestion: 'Add tabindex="0" or make element naturally focusable',
          severity: 3,
          wcagLevel: 'A'
        })
      }

      // Check tab order
      const tabIndex = el.getAttribute('tabindex')
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addIssue({
          type: 'warning',
          rule: 'tab-order',
          message: 'Positive tabindex values can create confusing tab order',
          element: el,
          suggestion: 'Use tabindex="0" or rely on natural tab order',
          severity: 2,
          wcagLevel: 'A'
        })
      }
    })
  }

  // Test ARIA attributes
  private testAriaAttributes(element: HTMLElement): void {
    const elementsWithAria = element.querySelectorAll('[aria-*], [role]')
    
    elementsWithAria.forEach(el => {
      const htmlElement = el as HTMLElement
      
      // Check for invalid ARIA attributes
      const ariaAttributes = this.getAriaAttributes(htmlElement)
      ariaAttributes.forEach(attr => {
        if (!this.isValidAriaAttribute(attr.name)) {
          this.addIssue({
            type: 'error',
            rule: 'invalid-aria',
            message: `Invalid ARIA attribute: ${attr.name}`,
            element: htmlElement,
            suggestion: 'Remove invalid ARIA attribute or use correct attribute name',
            severity: 3,
            wcagLevel: 'A'
          })
        }
      })

      // Check ARIA label requirements
      const role = htmlElement.getAttribute('role')
      if (role && this.requiresAriaLabel(role)) {
        const hasLabel = htmlElement.getAttribute('aria-label') || 
                         htmlElement.getAttribute('aria-labelledby')
        if (!hasLabel) {
          this.addIssue({
            type: 'error',
            rule: 'missing-aria-label',
            message: `Element with role="${role}" requires aria-label or aria-labelledby`,
            element: htmlElement,
            suggestion: 'Add aria-label or aria-labelledby attribute',
            severity: 3,
            wcagLevel: 'A'
          })
        }
      }
    })
  }

  // Test semantic HTML
  private testSemanticHTML(element: HTMLElement): void {
    // Check for proper heading structure
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
    if (headings.length === 0 && element.textContent && element.textContent.length > 100) {
      this.addIssue({
        type: 'warning',
        rule: 'missing-headings',
        message: 'Content appears to lack proper heading structure',
        element: element,
        suggestion: 'Add appropriate heading elements (h1-h6) to structure content',
        severity: 2,
        wcagLevel: 'AA'
      })
    }

    // Check for generic div/span usage where semantic elements would be better
    const genericElements = element.querySelectorAll('div[onclick], span[onclick]')
    genericElements.forEach(el => {
      this.addIssue({
        type: 'warning',
        rule: 'semantic-elements',
        message: 'Consider using semantic elements instead of generic div/span with click handlers',
        element: el as HTMLElement,
        suggestion: 'Use button, a, or other semantic elements for interactive content',
        severity: 2,
        wcagLevel: 'A'
      })
    })
  }

  // Test color contrast
  private async testColorContrast(element: HTMLElement): Promise<void> {
    const textElements = element.querySelectorAll('*')
    
    for (const el of textElements) {
      const htmlElement = el as HTMLElement
      const computedStyle = window.getComputedStyle(htmlElement)
      const hasText = htmlElement.textContent && htmlElement.textContent.trim().length > 0
      
      if (hasText) {
        const contrast = await this.calculateContrast(htmlElement)
        const fontSize = parseFloat(computedStyle.fontSize)
        const fontWeight = computedStyle.fontWeight
        
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700))
        const minContrast = isLargeText ? 3 : 4.5
        const aaContrast = isLargeText ? 4.5 : 7
        
        if (contrast < minContrast) {
          this.addIssue({
            type: 'error',
            rule: 'color-contrast',
            message: `Insufficient color contrast ratio: ${contrast.toFixed(2)} (minimum: ${minContrast})`,
            element: htmlElement,
            suggestion: 'Increase contrast between text and background colors',
            severity: 3,
            wcagLevel: 'AA'
          })
        } else if (contrast < aaContrast && this.options.wcagLevel === 'AAA') {
          this.addIssue({
            type: 'warning',
            rule: 'color-contrast-aaa',
            message: `Color contrast could be improved for AAA compliance: ${contrast.toFixed(2)} (recommended: ${aaContrast})`,
            element: htmlElement,
            suggestion: 'Increase contrast for AAA compliance',
            severity: 1,
            wcagLevel: 'AAA'
          })
        }
      }
    }
  }

  // Test images and media
  private testImagesAndMedia(element: HTMLElement): void {
    // Test images
    const images = element.querySelectorAll('img')
    images.forEach(img => {
      if (!img.getAttribute('alt')) {
        this.addIssue({
          type: 'error',
          rule: 'missing-alt-text',
          message: 'Image missing alt attribute',
          element: img,
          suggestion: 'Add descriptive alt text or alt="" for decorative images',
          severity: 3,
          wcagLevel: 'A'
        })
      }
    })

    // Test videos
    const videos = element.querySelectorAll('video')
    videos.forEach(video => {
      const hasCaption = video.querySelector('track[kind="captions"]')
      if (!hasCaption) {
        this.addIssue({
          type: 'error',
          rule: 'missing-captions',
          message: 'Video missing captions',
          element: video,
          suggestion: 'Add caption track for video content',
          severity: 3,
          wcagLevel: 'A'
        })
      }
    })
  }

  // Test forms
  private testForms(element: HTMLElement): void {
    const formControls = element.querySelectorAll('input, select, textarea')
    
    formControls.forEach(control => {
      const htmlControl = control as HTMLElement
      const id = htmlControl.getAttribute('id')
      const ariaLabel = htmlControl.getAttribute('aria-label')
      const ariaLabelledby = htmlControl.getAttribute('aria-labelledby')
      
      // Check for labels
      let hasLabel = false
      if (id) {
        const label = element.querySelector(`label[for="${id}"]`)
        hasLabel = !!label
      }
      
      if (!hasLabel && !ariaLabel && !ariaLabelledby) {
        this.addIssue({
          type: 'error',
          rule: 'missing-form-label',
          message: 'Form control missing accessible label',
          element: htmlControl,
          suggestion: 'Add label element, aria-label, or aria-labelledby attribute',
          severity: 3,
          wcagLevel: 'A'
        })
      }

      // Check for required field indicators
      if (htmlControl.hasAttribute('required')) {
        const hasRequiredIndicator = htmlControl.getAttribute('aria-required') === 'true' ||
                                    element.querySelector(`label[for="${id}"] .required`) ||
                                    ariaLabel?.includes('required')
        
        if (!hasRequiredIndicator) {
          this.addIssue({
            type: 'warning',
            rule: 'missing-required-indicator',
            message: 'Required field should be clearly indicated',
            element: htmlControl,
            suggestion: 'Add aria-required="true" or visual required indicator',
            severity: 2,
            wcagLevel: 'A'
          })
        }
      }
    })
  }

  // Test heading structure
  private testHeadingStructure(element: HTMLElement): void {
    const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    
    if (headings.length === 0) return

    let previousLevel = 0
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      
      if (index === 0 && level !== 1) {
        this.addIssue({
          type: 'warning',
          rule: 'heading-structure',
          message: 'Page should start with h1 heading',
          element: heading as HTMLElement,
          suggestion: 'Use h1 for the main page heading',
          severity: 2,
          wcagLevel: 'AA'
        })
      }
      
      if (level > previousLevel + 1) {
        this.addIssue({
          type: 'warning',
          rule: 'heading-structure',
          message: `Heading level skipped from h${previousLevel} to h${level}`,
          element: heading as HTMLElement,
          suggestion: 'Use sequential heading levels without skipping',
          severity: 2,
          wcagLevel: 'AA'
        })
      }
      
      previousLevel = level
    })
  }

  // Test focus management
  private testFocusManagement(element: HTMLElement): void {
    const focusableElements = this.getFocusableElements(element)
    
    focusableElements.forEach(el => {
      // Check for focus indicators
      const computedStyle = window.getComputedStyle(el)
      const hasFocusStyle = computedStyle.outline !== 'none' || 
                           computedStyle.boxShadow !== 'none' ||
                           el.matches(':focus-visible')
      
      if (!hasFocusStyle) {
        this.addIssue({
          type: 'warning',
          rule: 'focus-indicator',
          message: 'Focusable element may lack visible focus indicator',
          element: el,
          suggestion: 'Ensure focusable elements have visible focus indicators',
          severity: 2,
          wcagLevel: 'AA'
        })
      }
    })
  }

  // Test interactive elements
  private testInteractiveElements(element: HTMLElement): void {
    const interactiveElements = element.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"]')
    
    interactiveElements.forEach(el => {
      const htmlElement = el as HTMLElement
      
      // Check minimum touch target size
      const rect = htmlElement.getBoundingClientRect()
      const minSize = 44 // 44px minimum touch target
      
      if (rect.width < minSize || rect.height < minSize) {
        this.addIssue({
          type: 'warning',
          rule: 'touch-target-size',
          message: `Interactive element smaller than recommended ${minSize}px minimum`,
          element: htmlElement,
          suggestion: `Increase element size to at least ${minSize}x${minSize}px`,
          severity: 2,
          wcagLevel: 'AAA'
        })
      }
    })
  }

  // Test landmarks
  private testLandmarks(element: HTMLElement): void {
    const landmarks = element.querySelectorAll('main, nav, header, footer, aside, section, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]')
    
    if (landmarks.length === 0) {
      this.addIssue({
        type: 'warning',
        rule: 'missing-landmarks',
        message: 'Page lacks landmark elements for navigation',
        element: element,
        suggestion: 'Add semantic landmarks (main, nav, header, footer) or ARIA roles',
        severity: 2,
        wcagLevel: 'AA'
      })
    }

    // Check for multiple main landmarks
    const mainLandmarks = element.querySelectorAll('main, [role="main"]')
    if (mainLandmarks.length > 1) {
      mainLandmarks.forEach((main, index) => {
        if (index > 0) {
          this.addIssue({
            type: 'error',
            rule: 'multiple-main',
            message: 'Page should have only one main landmark',
            element: main as HTMLElement,
            suggestion: 'Use only one main element or role="main" per page',
            severity: 3,
            wcagLevel: 'A'
          })
        }
      })
    }
  }

  // Helper methods
  private getFocusableElements(element: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ]
    
    return Array.from(element.querySelectorAll(focusableSelectors.join(', '))) as HTMLElement[]
  }

  private isKeyboardAccessible(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute('tabindex')
    if (tabIndex === '-1') return false
    
    const focusableElements = ['a', 'button', 'input', 'select', 'textarea']
    return focusableElements.includes(element.tagName.toLowerCase()) || 
           tabIndex !== null ||
           element.hasAttribute('contenteditable')
  }

  private getAriaAttributes(element: HTMLElement): Array<{name: string, value: string}> {
    const attributes: Array<{name: string, value: string}> = []
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      if (attr.name.startsWith('aria-') || attr.name === 'role') {
        attributes.push({ name: attr.name, value: attr.value })
      }
    }
    return attributes
  }

  private isValidAriaAttribute(attributeName: string): boolean {
    const validAriaAttributes = [
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
      'aria-expanded', 'aria-selected', 'aria-checked', 'aria-disabled',
      'aria-required', 'aria-invalid', 'aria-live', 'aria-atomic',
      'aria-busy', 'aria-controls', 'aria-owns', 'aria-flowto',
      'aria-haspopup', 'aria-level', 'aria-multiline', 'aria-multiselectable',
      'aria-orientation', 'aria-readonly', 'aria-sort', 'aria-valuemax',
      'aria-valuemin', 'aria-valuenow', 'aria-valuetext', 'role'
    ]
    return validAriaAttributes.includes(attributeName)
  }

  private requiresAriaLabel(role: string): boolean {
    const rolesRequiringLabel = [
      'button', 'link', 'menuitem', 'tab', 'option', 'checkbox', 'radio'
    ]
    return rolesRequiringLabel.includes(role)
  }

  private async calculateContrast(element: HTMLElement): Promise<number> {
    const style = window.getComputedStyle(element)
    const textColor = this.parseColor(style.color)
    const backgroundColor = this.getBackgroundColor(element)
    
    return this.getContrastRatio(textColor, backgroundColor)
  }

  private parseColor(colorString: string): [number, number, number] {
    const rgb = colorString.match(/\d+/g)
    return rgb ? [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])] : [0, 0, 0]
  }

  private getBackgroundColor(element: HTMLElement): [number, number, number] {
    let current: HTMLElement | null = element
    
    while (current) {
      const style = window.getComputedStyle(current)
      const bgColor = style.backgroundColor
      
      if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        return this.parseColor(bgColor)
      }
      
      current = current.parentElement
    }
    
    return [255, 255, 255] // Default to white
  }

  private getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const l1 = this.getLuminance(color1)
    const l2 = this.getLuminance(color2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  private getLuminance([r, g, b]: [number, number, number]): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  private addIssue(issue: AccessibilityIssue): void {
    this.issues.push(issue)
  }

  private filterIssues(): AccessibilityIssue[] {
    return this.issues.filter(issue => {
      // Filter by type
      if (issue.type === 'warning' && !this.options.includeWarnings) return false
      if (issue.type === 'info' && !this.options.includeInfo) return false
      
      // Filter by WCAG level
      if (this.options.wcagLevel === 'A' && ['AA', 'AAA'].includes(issue.wcagLevel)) return false
      if (this.options.wcagLevel === 'AA' && issue.wcagLevel === 'AAA') return false
      
      // Filter by rules
      if (this.options.excludeRules?.includes(issue.rule)) return false
      if (this.options.includeRules?.length && !this.options.includeRules.includes(issue.rule)) return false
      
      return true
    })
  }

  private calculateScore(issues: AccessibilityIssue[]): number {
    const maxScore = 100
    let deductions = 0
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'error':
          deductions += issue.severity * 5
          break
        case 'warning':
          deductions += issue.severity * 2
          break
        case 'info':
          deductions += issue.severity * 1
          break
      }
    })
    
    return Math.max(0, maxScore - deductions)
  }

  private generateSummary(issues: AccessibilityIssue[]) {
    return {
      errors: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      info: issues.filter(i => i.type === 'info').length
    }
  }

  private countElements(element: HTMLElement): number {
    return element.querySelectorAll('*').length
  }
}

// Utility functions for quick testing
export const accessibilityTester = new AccessibilityTester()

export async function quickAccessibilityTest(element?: HTMLElement): Promise<AccessibilityTestResult> {
  return accessibilityTester.testElement(element || document.body)
}

export async function testPageAccessibility(options?: AccessibilityTestOptions): Promise<AccessibilityTestResult> {
  const tester = new AccessibilityTester(options)
  return tester.testPage()
}

export function logAccessibilityIssues(result: AccessibilityTestResult): void {
  console.group(`🔍 Accessibility Test Results (Score: ${result.score}/100)`)
  
  if (result.summary.errors > 0) {
    console.group(`❌ Errors (${result.summary.errors})`)
    result.issues.filter(i => i.type === 'error').forEach(issue => {
      console.error(`${issue.rule}: ${issue.message}`, issue.element)
      if (issue.suggestion) {
        console.info(`💡 Suggestion: ${issue.suggestion}`)
      }
    })
    console.groupEnd()
  }
  
  if (result.summary.warnings > 0) {
    console.group(`⚠️ Warnings (${result.summary.warnings})`)
    result.issues.filter(i => i.type === 'warning').forEach(issue => {
      console.warn(`${issue.rule}: ${issue.message}`, issue.element)
      if (issue.suggestion) {
        console.info(`💡 Suggestion: ${issue.suggestion}`)
      }
    })
    console.groupEnd()
  }
  
  if (result.summary.info > 0) {
    console.group(`ℹ️ Info (${result.summary.info})`)
    result.issues.filter(i => i.type === 'info').forEach(issue => {
      console.info(`${issue.rule}: ${issue.message}`, issue.element)
      if (issue.suggestion) {
        console.info(`💡 Suggestion: ${issue.suggestion}`)
      }
    })
    console.groupEnd()
  }
  
  console.groupEnd()
}

// Development helper - automatically test page in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Auto-test page after load
  window.addEventListener('load', async () => {
    setTimeout(async () => {
      const result = await testPageAccessibility({ includeWarnings: true })
      if (result.issues.length > 0) {
        logAccessibilityIssues(result)
      }
    }, 1000)
  })
}
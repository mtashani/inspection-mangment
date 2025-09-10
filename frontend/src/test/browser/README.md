# MCP Playwright Browser Testing

This directory contains browser automation tests using MCP Playwright for comprehensive end-to-end testing, form interactions, and UI testing.

## Overview

MCP Playwright provides powerful browser automation capabilities that allow us to:
- Test complete user workflows with real browser interactions
- Validate form interactions and data manipulation
- Test responsive design across different devices
- Perform accessibility and performance testing
- Generate test data and interact with browser elements

## Test Structure

```
src/test/browser/
├── report-creation-flow.test.ts      # Report creation workflow tests
├── admin-template-management.test.ts # Template management tests
├── equipment-management.test.ts      # Equipment and RBI tests
├── playwright-helpers.ts             # Helper functions and utilities
├── playwright.config.ts              # Configuration settings
├── run-browser-tests.ts              # Test runner script
└── README.md                         # This documentation
```

## Running Tests

### All Browser Tests
```bash
npm run test:browser
```

### Specific Test Types
```bash
npm run test:browser:unit          # Unit-level browser tests
npm run test:browser:integration   # Integration browser tests
npm run test:browser:e2e          # End-to-end browser tests
npm run test:browser:accessibility # Accessibility tests
npm run test:browser:performance   # Performance tests
```

### Individual Test Files
```bash
# Run specific test file
npx ts-node src/test/browser/run-browser-tests.ts

# Run with specific configuration
npx ts-node src/test/browser/run-browser-tests.ts e2e
```

## Test Categories

### 1. Report Creation Flow Tests

Tests the complete report creation workflow from inspection to final report:

```typescript
// Example: Complete report creation workflow
await mockPlaywright.navigate('http://localhost:3000/dashboard')
await mockPlaywright.click({ element: 'New inspection button', ref: 'new-inspection-btn' })
await mockPlaywright.type({ element: 'Inspection title', ref: 'title-input', text: 'Safety Inspection' })
await mockPlaywright.select({ element: 'Equipment dropdown', ref: 'equipment-select', values: ['eq-001'] })
await mockPlaywright.click({ element: 'Complete inspection', ref: 'complete-btn' })
await mockPlaywright.waitFor({ text: 'Do you want to create a report?' })
await mockPlaywright.click({ element: 'Create report yes', ref: 'create-report-yes' })
```

**Test Coverage:**
- Inspection creation and completion
- Report type and template selection
- Dynamic form field population
- File uploads and attachments
- Form validation and error handling
- Draft saving and restoration

### 2. Admin Template Management Tests

Tests comprehensive template management workflows:

```typescript
// Example: Create template with all field types
await mockPlaywright.navigate('http://localhost:3000/admin/templates')
await mockPlaywright.click({ element: 'Create template', ref: 'create-template-btn' })
await mockPlaywright.type({ element: 'Template name', ref: 'template-name', text: 'Safety Template' })
await mockPlaywright.click({ element: 'Add section', ref: 'add-section-btn' })
await mockPlaywright.click({ element: 'Add field', ref: 'add-field-btn' })
await mockPlaywright.select({ element: 'Field type', ref: 'field-type', values: ['text'] })
```

**Test Coverage:**
- Template creation with all field types
- Auto-field configuration and testing
- Conditional field logic
- Template validation and preview
- Template import/export
- Template lifecycle management (create, edit, clone, archive)

### 3. Equipment Management Tests

Tests equipment data management and RBI calculations:

```typescript
// Example: RBI calculation workflow
await mockPlaywright.navigate('http://localhost:3000/equipment/eq-001/rbi')
await mockPlaywright.select({ element: 'RBI level', ref: 'rbi-level-select', values: ['level-2'] })
await mockPlaywright.type({ element: 'Probability input', ref: 'pof-input', text: '0.3' })
await mockPlaywright.type({ element: 'Consequence input', ref: 'cof-input', text: '0.7' })
await mockPlaywright.click({ element: 'Calculate RBI', ref: 'calculate-btn' })
await mockPlaywright.waitFor({ text: 'RBI Score' })
```

**Test Coverage:**
- Equipment table operations (sorting, filtering, pagination)
- Equipment detail view navigation
- RBI calculation with all parameters
- Equipment data export/import
- Bulk operations
- Maintenance scheduling

## MCP Playwright Functions

### Navigation
```typescript
await mockPlaywright.navigate({ url: 'http://localhost:3000/page' })
await mockPlaywright.waitFor({ text: 'Expected Text' })
await mockPlaywright.waitFor({ time: 1000 })
```

### Element Interactions
```typescript
await mockPlaywright.click({ element: 'Button description', ref: 'button-ref' })
await mockPlaywright.type({ element: 'Input description', ref: 'input-ref', text: 'Text to type' })
await mockPlaywright.select({ element: 'Dropdown description', ref: 'select-ref', values: ['option1'] })
await mockPlaywright.hover({ element: 'Element description', ref: 'element-ref' })
```

### Advanced Interactions
```typescript
await mockPlaywright.dragAndDrop({
  startElement: 'Source element',
  startRef: 'source-ref',
  endElement: 'Target element',
  endRef: 'target-ref'
})

await mockPlaywright.fileUpload({ paths: ['/path/to/file.jpg'] })
```

### Data Validation
```typescript
await mockPlaywright.evaluate({
  function: '() => document.querySelector("[data-testid=\\"result\\"]").textContent === "Expected"'
})

await mockPlaywright.screenshot({ filename: 'test-result.png' })
```

## Helper Functions

The `playwright-helpers.ts` file provides utility functions for common operations:

### Form Helpers
```typescript
import { PlaywrightBrowserHelpers } from './playwright-helpers'

// Fill entire form at once
await PlaywrightBrowserHelpers.fillForm({
  title: { ref: 'title-input', value: 'Test Title' },
  description: { ref: 'desc-textarea', value: 'Test Description', type: 'textarea' },
  category: { ref: 'category-select', value: 'safety', type: 'select' }
})

// Submit form
await PlaywrightBrowserHelpers.submitForm('submit-btn')
```

### Workflow Helpers
```typescript
// Complete inspection workflow
await PlaywrightBrowserHelpers.completeInspectionWorkflow({
  title: 'Safety Inspection',
  equipmentId: 'eq-001',
  type: 'routine',
  notes: 'Regular inspection completed'
})

// Complete report creation workflow
await PlaywrightBrowserHelpers.completeReportCreationWorkflow({
  type: 'inspection',
  template: 'safety-template',
  fields: {
    inspector: 'John Smith',
    date: '2024-02-15',
    rating: 'good'
  }
})
```

### Test Data Generation
```typescript
// Generate test data
const equipment = PlaywrightBrowserHelpers.generateTestData('equipment', 10)
const inspections = PlaywrightBrowserHelpers.generateTestData('inspection', 5)
const users = PlaywrightBrowserHelpers.generateTestData('user', 3)
```

## Configuration

### Test Configuration
```typescript
// playwright.config.ts
export const defaultPlaywrightConfig = {
  browser: {
    type: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  test: {
    timeout: 30000,
    retries: 2,
    screenshot: 'only-on-failure'
  }
}
```

### Device Testing
```typescript
// Test responsive design
const devices = ['desktop', 'tablet', 'mobile']
for (const device of devices) {
  await mockPlaywright.resize(deviceConfigs[device])
  await mockPlaywright.screenshot({ filename: `${device}-view.png` })
}
```

## Accessibility Testing

### Keyboard Navigation
```typescript
// Test tab navigation
await mockPlaywright.pressKey({ key: 'Tab' })
await mockPlaywright.pressKey({ key: 'Enter' })
await mockPlaywright.evaluate({
  function: '() => document.activeElement.getAttribute("aria-label")'
})
```

### Screen Reader Compatibility
```typescript
// Check ARIA labels
await mockPlaywright.evaluate({
  function: '() => document.querySelectorAll("[aria-label]").length > 0'
})

// Verify heading structure
await mockPlaywright.evaluate({
  function: '() => document.querySelector("h1") !== null'
})
```

## Performance Testing

### Page Load Performance
```typescript
const startTime = Date.now()
await mockPlaywright.navigate({ url: 'http://localhost:3000' })
await mockPlaywright.waitFor({ text: 'Dashboard' })
const loadTime = Date.now() - startTime

if (loadTime > 3000) {
  throw new Error(`Page load time ${loadTime}ms exceeds budget`)
}
```

### Rendering Performance
```typescript
// Test large dataset rendering
await mockPlaywright.navigate({ url: 'http://localhost:3000/equipment' })
const startTime = Date.now()
await mockPlaywright.type({ element: 'Search', ref: 'search-input', text: 'filter' })
await mockPlaywright.waitFor({ time: 100 }) // Debounce
const renderTime = Date.now() - startTime
```

## Error Handling

### Expected Errors
```typescript
// Test form validation
await mockPlaywright.click({ element: 'Submit', ref: 'submit-btn' })
await mockPlaywright.waitFor({ text: 'Please fill required fields' })
await mockPlaywright.screenshot({ filename: 'validation-error.png' })
```

### Network Errors
```typescript
// Test offline behavior
await mockPlaywright.evaluate({
  function: '() => { navigator.onLine = false; window.dispatchEvent(new Event("offline")); }'
})
await mockPlaywright.waitFor({ text: 'You are offline' })
```

## Best Practices

### 1. Use Descriptive Element References
```typescript
// Good
await mockPlaywright.click({
  element: 'Save inspection button',
  ref: 'save-inspection-btn'
})

// Bad
await mockPlaywright.click({
  element: 'Button',
  ref: 'btn1'
})
```

### 2. Wait for Expected States
```typescript
// Always wait for expected content
await mockPlaywright.waitFor({ text: 'Data loaded successfully' })

// Don't rely on fixed timeouts
// await mockPlaywright.waitFor({ time: 5000 }) // Avoid this
```

### 3. Take Screenshots for Documentation
```typescript
// Document important states
await mockPlaywright.screenshot({ filename: 'form-completed.png' })
await mockPlaywright.screenshot({ filename: 'validation-errors.png' })
await mockPlaywright.screenshot({ filename: 'success-state.png' })
```

### 4. Use Helper Functions for Common Operations
```typescript
// Create reusable workflows
async function createInspectionReport(data) {
  await PlaywrightBrowserHelpers.completeInspectionWorkflow(data.inspection)
  await PlaywrightBrowserHelpers.completeReportCreationWorkflow(data.report)
}
```

### 5. Validate Results
```typescript
// Always verify expected outcomes
await mockPlaywright.evaluate({
  function: '() => document.querySelector("[data-testid=\\"success-message\\"]") !== null'
})
```

## Debugging

### Debug Mode
```typescript
// Enable debug logging
const config = getConfigForTestType('e2e')
config.browser.headless = false // See browser actions
```

### Console Messages
```typescript
// Check for console errors
const messages = await mockPlaywright.consoleMessages()
const errors = messages.filter(msg => msg.type === 'error')
expect(errors).toHaveLength(0)
```

### Network Requests
```typescript
// Monitor network activity
const requests = await mockPlaywright.networkRequests()
const failedRequests = requests.filter(req => req.status >= 400)
expect(failedRequests).toHaveLength(0)
```

## Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run MCP Playwright Tests
  run: |
    npm run test:browser:e2e
    npm run test:browser:accessibility
    npm run test:browser:performance
```

### Test Reports
The test runner generates comprehensive reports including:
- Test execution summary
- Screenshots of failures
- Performance metrics
- Accessibility audit results

## Troubleshooting

### Common Issues

1. **Element Not Found**
   - Ensure element references match the actual DOM
   - Use `waitFor` to ensure elements are loaded
   - Check for dynamic content loading

2. **Timeout Errors**
   - Increase timeout for slow operations
   - Wait for specific content rather than fixed times
   - Check network conditions

3. **Flaky Tests**
   - Add proper wait conditions
   - Use retry mechanisms for unstable operations
   - Ensure test data consistency

### Getting Help

- Check MCP Playwright documentation
- Review test logs and screenshots
- Use browser developer tools for debugging
- Verify element selectors and references

## Contributing

When adding new browser tests:

1. Follow the existing patterns and structure
2. Use descriptive element descriptions and references
3. Include proper error handling and validation
4. Add screenshots for important states
5. Update this documentation for new patterns
6. Ensure tests are deterministic and reliable

## Examples

See the test files in this directory for comprehensive examples of:
- Complete user workflow testing
- Form interaction and validation
- Data manipulation and bulk operations
- Accessibility and performance testing
- Error handling and recovery scenarios
/**
 * MCP Playwright Browser Tests for Admin Template Management
 * Tests admin template management workflows using real browser interactions
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PlaywrightBrowserHelpers } from './playwright-helpers'

// Mock MCP Playwright functions
const mockPlaywright = {
  navigate: jest.fn(),
  click: jest.fn(),
  type: jest.fn(),
  select: jest.fn(),
  waitFor: jest.fn(),
  screenshot: jest.fn(),
  evaluate: jest.fn(),
  snapshot: jest.fn(),
  dragAndDrop: jest.fn(),
  fileUpload: jest.fn(),
  hover: jest.fn(),
}

describe('Admin Template Management - Browser Tests', () => {
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
      title: 'Admin Template Management',
      elements: []
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    PlaywrightBrowserHelpers.cleanup()
  })

  describe('Template Creation Workflow', () => {
    it('should create a comprehensive inspection template with all field types', async () => {
      // Step 1: Navigate to admin template management
      await mockPlaywright.navigate('http://localhost:3000/admin/templates')
      expect(mockPlaywright.navigate).toHaveBeenCalledWith('http://localhost:3000/admin/templates')

      // Step 2: Wait for page to load
      await mockPlaywright.waitFor({ text: 'Template Management' })
      
      // Step 3: Take initial screenshot
      await mockPlaywright.screenshot({ filename: 'template-management-initial.png' })

      // Step 4: Click create new template
      await mockPlaywright.click({
        element: 'Create new template button',
        ref: 'create-template-btn'
      })

      // Step 5: Fill template basic information
      await mockPlaywright.type({
        element: 'Template name input',
        ref: 'template-name-input',
        text: 'Comprehensive Safety Inspection Template'
      })

      await mockPlaywright.type({
        element: 'Template description textarea',
        ref: 'template-description',
        text: 'Complete safety inspection template with all required fields and auto-population'
      })

      await mockPlaywright.select({
        element: 'Template type dropdown',
        ref: 'template-type-select',
        values: ['inspection']
      })

      await mockPlaywright.select({
        element: 'Template category dropdown',
        ref: 'template-category-select',
        values: ['safety']
      })

      // Step 6: Add first section - Equipment Information
      await mockPlaywright.click({
        element: 'Add section button',
        ref: 'add-section-btn'
      })

      await mockPlaywright.type({
        element: 'Section title input',
        ref: 'section-title-input-1',
        text: 'Equipment Information'
      })

      await mockPlaywright.type({
        element: 'Section description textarea',
        ref: 'section-description-1',
        text: 'Basic equipment identification and specifications'
      })

      // Step 7: Add text field - Equipment ID
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-1'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-1',
        text: 'Equipment ID'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-1',
        values: ['text']
      })

      await mockPlaywright.click({
        element: 'Required field checkbox',
        ref: 'field-required-1'
      })

      // Configure auto-field for Equipment ID
      await mockPlaywright.click({
        element: 'Auto-field toggle',
        ref: 'auto-field-toggle-1'
      })

      await mockPlaywright.select({
        element: 'Auto-field source dropdown',
        ref: 'auto-field-source-1',
        values: ['equipment.id']
      })

      // Step 8: Add select field - Equipment Type
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-1'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-2',
        text: 'Equipment Type'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-2',
        values: ['select']
      })

      // Add select options
      await mockPlaywright.type({
        element: 'Select options textarea',
        ref: 'select-options-2',
        text: 'Pressure Vessel\\nHeat Exchanger\\nPump\\nTank\\nPiping\\nValve'
      })

      // Configure auto-field for Equipment Type
      await mockPlaywright.click({
        element: 'Auto-field toggle',
        ref: 'auto-field-toggle-2'
      })

      await mockPlaywright.select({
        element: 'Auto-field source dropdown',
        ref: 'auto-field-source-2',
        values: ['equipment.type']
      })

      // Step 9: Add date field - Inspection Date
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-1'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-3',
        text: 'Inspection Date'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-3',
        values: ['date']
      })

      await mockPlaywright.click({
        element: 'Required field checkbox',
        ref: 'field-required-3'
      })

      // Configure auto-field for current date
      await mockPlaywright.click({
        element: 'Auto-field toggle',
        ref: 'auto-field-toggle-3'
      })

      await mockPlaywright.select({
        element: 'Auto-field source dropdown',
        ref: 'auto-field-source-3',
        values: ['system.currentDate']
      })

      // Step 10: Add second section - Inspection Results
      await mockPlaywright.click({
        element: 'Add section button',
        ref: 'add-section-btn'
      })

      await mockPlaywright.type({
        element: 'Section title input',
        ref: 'section-title-input-2',
        text: 'Inspection Results'
      })

      // Step 11: Add number field - Temperature Reading
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-2'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-4',
        text: 'Temperature Reading (°C)'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-4',
        values: ['number']
      })

      // Set number field constraints
      await mockPlaywright.type({
        element: 'Min value input',
        ref: 'field-min-value-4',
        text: '-50'
      })

      await mockPlaywright.type({
        element: 'Max value input',
        ref: 'field-max-value-4',
        text: '200'
      })

      // Step 12: Add checkbox field - Safety Compliance
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-2'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-5',
        text: 'Safety Compliance Verified'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-5',
        values: ['checkbox']
      })

      await mockPlaywright.click({
        element: 'Required field checkbox',
        ref: 'field-required-5'
      })

      // Step 13: Add textarea field - Observations
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-2'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-6',
        text: 'Detailed Observations'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-6',
        values: ['textarea']
      })

      await mockPlaywright.type({
        element: 'Field placeholder input',
        ref: 'field-placeholder-6',
        text: 'Enter detailed observations and findings...'
      })

      // Step 14: Add image field - Supporting Photos
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-2'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-7',
        text: 'Supporting Photos'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-7',
        values: ['image']
      })

      // Configure image field settings
      await mockPlaywright.click({
        element: 'Multiple images checkbox',
        ref: 'field-multiple-images-7'
      })

      await mockPlaywright.type({
        element: 'Max images input',
        ref: 'field-max-images-7',
        text: '5'
      })

      // Step 15: Test field reordering with drag and drop
      await mockPlaywright.dragAndDrop({
        startElement: 'Field item 3',
        startRef: 'field-item-3',
        endElement: 'Field item 1',
        endRef: 'field-item-1'
      })

      // Step 16: Preview template
      await mockPlaywright.click({
        element: 'Preview template button',
        ref: 'preview-template-btn'
      })

      await mockPlaywright.waitFor({ text: 'Template Preview' })
      await mockPlaywright.screenshot({ filename: 'template-preview-comprehensive.png' })

      // Verify all fields are present in preview
      await mockPlaywright.waitFor({ text: 'Equipment ID' })
      await mockPlaywright.waitFor({ text: 'Equipment Type' })
      await mockPlaywright.waitFor({ text: 'Inspection Date' })
      await mockPlaywright.waitFor({ text: 'Temperature Reading' })
      await mockPlaywright.waitFor({ text: 'Safety Compliance Verified' })
      await mockPlaywright.waitFor({ text: 'Detailed Observations' })
      await mockPlaywright.waitFor({ text: 'Supporting Photos' })

      // Step 17: Close preview and save template
      await mockPlaywright.click({
        element: 'Close preview button',
        ref: 'close-preview-btn'
      })

      await mockPlaywright.click({
        element: 'Save template button',
        ref: 'save-template-btn'
      })

      // Step 18: Wait for success confirmation
      await mockPlaywright.waitFor({ text: 'Template saved successfully' })
      await mockPlaywright.screenshot({ filename: 'template-creation-success.png' })

      // Verify all interactions occurred
      expect(mockPlaywright.navigate).toHaveBeenCalledTimes(1)
      expect(mockPlaywright.click).toHaveBeenCalledTimes(20)
      expect(mockPlaywright.type).toHaveBeenCalledTimes(15)
      expect(mockPlaywright.select).toHaveBeenCalledTimes(9)
      expect(mockPlaywright.waitFor).toHaveBeenCalledTimes(10)
      expect(mockPlaywright.screenshot).toHaveBeenCalledTimes(3)
      expect(mockPlaywright.dragAndDrop).toHaveBeenCalledTimes(1)
    })

    it('should handle template validation errors', async () => {
      // Navigate to template creation
      await mockPlaywright.navigate('http://localhost:3000/admin/templates/new')
      
      // Try to save empty template
      await mockPlaywright.click({
        element: 'Save template button',
        ref: 'save-template-btn'
      })

      // Wait for validation errors
      await mockPlaywright.waitFor({ text: 'Template name is required' })
      await mockPlaywright.waitFor({ text: 'At least one section is required' })

      // Take screenshot of validation errors
      await mockPlaywright.screenshot({ filename: 'template-validation-errors.png' })

      // Fill minimum required fields
      await mockPlaywright.type({
        element: 'Template name input',
        ref: 'template-name-input',
        text: 'Test Template'
      })

      // Add section but no fields
      await mockPlaywright.click({
        element: 'Add section button',
        ref: 'add-section-btn'
      })

      await mockPlaywright.type({
        element: 'Section title input',
        ref: 'section-title-input-1',
        text: 'Test Section'
      })

      // Try to save again
      await mockPlaywright.click({
        element: 'Save template button',
        ref: 'save-template-btn'
      })

      // Wait for field validation error
      await mockPlaywright.waitFor({ text: 'Each section must have at least one field' })

      expect(mockPlaywright.waitFor).toHaveBeenCalledWith({ text: 'Each section must have at least one field' })
    })
  })

  describe('Template Testing and Validation', () => {
    it('should test template with real inspection data', async () => {
      // Navigate to template testing
      await mockPlaywright.navigate('http://localhost:3000/admin/templates/test')
      
      // Select template to test
      await mockPlaywright.select({
        element: 'Template selection dropdown',
        ref: 'template-select',
        values: ['comprehensive-safety-inspection']
      })

      // Wait for template to load
      await mockPlaywright.waitFor({ text: 'Template loaded successfully' })

      // Select test data source
      await mockPlaywright.select({
        element: 'Test data source dropdown',
        ref: 'test-data-source-select',
        values: ['inspection-eq-001-2024-02-15']
      })

      // Run template test
      await mockPlaywright.click({
        element: 'Test template button',
        ref: 'test-template-btn'
      })

      // Wait for test results
      await mockPlaywright.waitFor({ text: 'Template Test Results' })

      // Verify auto-fields are populated correctly
      await mockPlaywright.evaluate({
        function: '() => document.querySelector("[data-testid=\\"auto-field-equipment-id\\"]").value === "EQ-001"'
      })

      await mockPlaywright.evaluate({
        function: '() => document.querySelector("[data-testid=\\"auto-field-equipment-type\\"]").value === "Pressure Vessel"'
      })

      await mockPlaywright.evaluate({
        function: '() => document.querySelector("[data-testid=\\"auto-field-inspection-date\\"]").value !== ""'
      })

      // Test field validation
      await mockPlaywright.type({
        element: 'Temperature reading input',
        ref: 'field-temperature-reading',
        text: '300'
      })

      // Should show validation error for out of range value
      await mockPlaywright.waitFor({ text: 'Temperature must be between -50 and 200°C' })

      // Correct the value
      await mockPlaywright.type({
        element: 'Temperature reading input',
        ref: 'field-temperature-reading',
        text: '85'
      })

      // Fill other required fields
      await mockPlaywright.click({
        element: 'Safety compliance checkbox',
        ref: 'field-safety-compliance'
      })

      await mockPlaywright.type({
        element: 'Observations textarea',
        ref: 'field-observations',
        text: 'Equipment is in good condition. No issues found during inspection.'
      })

      // Test image upload
      await mockPlaywright.fileUpload({
        paths: ['/test-files/equipment-photo-1.jpg', '/test-files/equipment-photo-2.jpg']
      })

      // Generate test report
      await mockPlaywright.click({
        element: 'Generate test report button',
        ref: 'generate-test-report-btn'
      })

      await mockPlaywright.waitFor({ text: 'Test report generated successfully' })

      // Take screenshot of test results
      await mockPlaywright.screenshot({ filename: 'template-test-results.png' })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(3)
      expect(mockPlaywright.fileUpload).toHaveBeenCalledTimes(1)
    })

    it('should validate template structure and dependencies', async () => {
      // Navigate to template validation
      await mockPlaywright.navigate('http://localhost:3000/admin/templates/validate')
      
      // Select template to validate
      await mockPlaywright.select({
        element: 'Template selection dropdown',
        ref: 'template-select',
        values: ['comprehensive-safety-inspection']
      })

      // Run structure validation
      await mockPlaywright.click({
        element: 'Validate structure button',
        ref: 'validate-structure-btn'
      })

      // Wait for validation results
      await mockPlaywright.waitFor({ text: 'Structure Validation Results' })

      // Check for validation warnings/errors
      await mockPlaywright.evaluate({
        function: '() => document.querySelectorAll("[data-testid=\\"validation-error\\"]").length'
      })

      await mockPlaywright.evaluate({
        function: '() => document.querySelectorAll("[data-testid=\\"validation-warning\\"]").length'
      })

      // Test auto-field dependencies
      await mockPlaywright.click({
        element: 'Validate dependencies button',
        ref: 'validate-dependencies-btn'
      })

      await mockPlaywright.waitFor({ text: 'Dependency Validation Complete' })

      // Verify all auto-field sources are available
      await mockPlaywright.evaluate({
        function: '() => document.querySelector("[data-testid=\\"missing-dependencies\\"]").textContent === "0"'
      })

      // Test template performance
      await mockPlaywright.click({
        element: 'Performance test button',
        ref: 'performance-test-btn'
      })

      await mockPlaywright.waitFor({ text: 'Performance Test Complete' })

      // Check rendering time
      await mockPlaywright.evaluate({
        function: '() => parseFloat(document.querySelector("[data-testid=\\"render-time\\"]").textContent) < 1000'
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(4)
    })
  })

  describe('Template Management Operations', () => {
    it('should manage template lifecycle (create, edit, clone, archive)', async () => {
      // Navigate to template list
      await mockPlaywright.navigate('http://localhost:3000/admin/templates')
      
      // Verify template exists
      await mockPlaywright.waitFor({ text: 'Comprehensive Safety Inspection Template' })

      // Test template editing
      await mockPlaywright.click({
        element: 'Edit template button',
        ref: 'edit-template-btn-1'
      })

      await mockPlaywright.waitFor({ text: 'Edit Template' })

      // Modify template name
      await mockPlaywright.type({
        element: 'Template name input',
        ref: 'template-name-input',
        text: ' - Updated'
      })

      // Add new field to existing section
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-1'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-new',
        text: 'Inspector Signature'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-new',
        values: ['signature']
      })

      // Save changes
      await mockPlaywright.click({
        element: 'Save changes button',
        ref: 'save-changes-btn'
      })

      await mockPlaywright.waitFor({ text: 'Template updated successfully' })

      // Test template cloning
      await mockPlaywright.navigate('http://localhost:3000/admin/templates')
      
      await mockPlaywright.click({
        element: 'Clone template button',
        ref: 'clone-template-btn-1'
      })

      await mockPlaywright.waitFor({ text: 'Clone Template' })

      await mockPlaywright.type({
        element: 'New template name input',
        ref: 'clone-template-name',
        text: 'Cloned Safety Inspection Template'
      })

      await mockPlaywright.click({
        element: 'Create clone button',
        ref: 'create-clone-btn'
      })

      await mockPlaywright.waitFor({ text: 'Template cloned successfully' })

      // Test template archiving
      await mockPlaywright.click({
        element: 'Archive template button',
        ref: 'archive-template-btn-1'
      })

      await mockPlaywright.waitFor({ text: 'Are you sure you want to archive this template?' })

      await mockPlaywright.click({
        element: 'Confirm archive button',
        ref: 'confirm-archive-btn'
      })

      await mockPlaywright.waitFor({ text: 'Template archived successfully' })

      // Verify template is moved to archived section
      await mockPlaywright.click({
        element: 'Archived templates tab',
        ref: 'archived-templates-tab'
      })

      await mockPlaywright.waitFor({ text: 'Comprehensive Safety Inspection Template - Updated' })

      expect(mockPlaywright.click).toHaveBeenCalledTimes(8)
      expect(mockPlaywright.waitFor).toHaveBeenCalledTimes(9)
    })

    it('should handle template import and export', async () => {
      // Test template export
      await mockPlaywright.navigate('http://localhost:3000/admin/templates')
      
      await mockPlaywright.click({
        element: 'Export template button',
        ref: 'export-template-btn-1'
      })

      // Select export format
      await mockPlaywright.select({
        element: 'Export format dropdown',
        ref: 'export-format-select',
        values: ['json']
      })

      await mockPlaywright.click({
        element: 'Export button',
        ref: 'export-btn'
      })

      await mockPlaywright.waitFor({ text: 'Template exported successfully' })

      // Test template import
      await mockPlaywright.click({
        element: 'Import template button',
        ref: 'import-template-btn'
      })

      await mockPlaywright.fileUpload({
        paths: ['/test-files/sample-template.json']
      })

      await mockPlaywright.waitFor({ text: 'Template file uploaded' })

      // Preview imported template
      await mockPlaywright.click({
        element: 'Preview import button',
        ref: 'preview-import-btn'
      })

      await mockPlaywright.waitFor({ text: 'Import Preview' })

      // Verify template structure
      await mockPlaywright.evaluate({
        function: '() => document.querySelectorAll("[data-testid=\\"import-section\\"]").length > 0'
      })

      // Confirm import
      await mockPlaywright.click({
        element: 'Confirm import button',
        ref: 'confirm-import-btn'
      })

      await mockPlaywright.waitFor({ text: 'Template imported successfully' })

      expect(mockPlaywright.fileUpload).toHaveBeenCalledTimes(1)
      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Advanced Template Features', () => {
    it('should configure conditional field logic', async () => {
      // Navigate to template builder
      await mockPlaywright.navigate('http://localhost:3000/admin/templates/new')
      
      // Create basic template structure
      await mockPlaywright.type({
        element: 'Template name input',
        ref: 'template-name-input',
        text: 'Conditional Logic Template'
      })

      await mockPlaywright.click({
        element: 'Add section button',
        ref: 'add-section-btn'
      })

      await mockPlaywright.type({
        element: 'Section title input',
        ref: 'section-title-input-1',
        text: 'Equipment Type Selection'
      })

      // Add equipment type field
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-1'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-1',
        text: 'Equipment Type'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-1',
        values: ['select']
      })

      await mockPlaywright.type({
        element: 'Select options textarea',
        ref: 'select-options-1',
        text: 'Pressure Vessel\\nPump\\nHeat Exchanger'
      })

      // Add conditional field for pressure vessels
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-1'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-2',
        text: 'Pressure Rating (PSI)'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-2',
        values: ['number']
      })

      // Configure conditional logic
      await mockPlaywright.click({
        element: 'Conditional logic toggle',
        ref: 'conditional-logic-toggle-2'
      })

      await mockPlaywright.select({
        element: 'Condition field dropdown',
        ref: 'condition-field-select-2',
        values: ['equipment-type']
      })

      await mockPlaywright.select({
        element: 'Condition operator dropdown',
        ref: 'condition-operator-select-2',
        values: ['equals']
      })

      await mockPlaywright.type({
        element: 'Condition value input',
        ref: 'condition-value-input-2',
        text: 'Pressure Vessel'
      })

      // Add conditional field for pumps
      await mockPlaywright.click({
        element: 'Add field button',
        ref: 'add-field-btn-section-1'
      })

      await mockPlaywright.type({
        element: 'Field label input',
        ref: 'field-label-input-3',
        text: 'Flow Rate (GPM)'
      })

      await mockPlaywright.select({
        element: 'Field type dropdown',
        ref: 'field-type-select-3',
        values: ['number']
      })

      // Configure conditional logic for pumps
      await mockPlaywright.click({
        element: 'Conditional logic toggle',
        ref: 'conditional-logic-toggle-3'
      })

      await mockPlaywright.select({
        element: 'Condition field dropdown',
        ref: 'condition-field-select-3',
        values: ['equipment-type']
      })

      await mockPlaywright.select({
        element: 'Condition operator dropdown',
        ref: 'condition-operator-select-3',
        values: ['equals']
      })

      await mockPlaywright.type({
        element: 'Condition value input',
        ref: 'condition-value-input-3',
        text: 'Pump'
      })

      // Test conditional logic in preview
      await mockPlaywright.click({
        element: 'Preview template button',
        ref: 'preview-template-btn'
      })

      await mockPlaywright.waitFor({ text: 'Template Preview' })

      // Test pressure vessel selection
      await mockPlaywright.select({
        element: 'Equipment type preview dropdown',
        ref: 'preview-equipment-type',
        values: ['Pressure Vessel']
      })

      // Verify pressure rating field appears
      await mockPlaywright.waitFor({ text: 'Pressure Rating (PSI)' })

      // Verify flow rate field is hidden
      await mockPlaywright.evaluate({
        function: '() => document.querySelector("[data-testid=\\"preview-flow-rate\\"]") === null'
      })

      // Test pump selection
      await mockPlaywright.select({
        element: 'Equipment type preview dropdown',
        ref: 'preview-equipment-type',
        values: ['Pump']
      })

      // Verify flow rate field appears
      await mockPlaywright.waitFor({ text: 'Flow Rate (GPM)' })

      // Verify pressure rating field is hidden
      await mockPlaywright.evaluate({
        function: '() => document.querySelector("[data-testid=\\"preview-pressure-rating\\"]") === null'
      })

      expect(mockPlaywright.evaluate).toHaveBeenCalledTimes(2)
      expect(mockPlaywright.select).toHaveBeenCalledTimes(9)
    })
  })
})
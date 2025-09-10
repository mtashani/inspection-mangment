# Testing Framework Documentation

## Overview

This document describes the comprehensive testing framework implemented for the frontend application. The framework includes unit tests, integration tests, end-to-end tests, and various quality assurance measures.

## Test Structure

```
src/test/
├── __mocks__/           # Mock files for static assets
├── integration/         # Integration tests
├── e2e/                # End-to-end tests
├── test-utils.tsx      # Testing utilities and helpers
├── setup.ts            # Jest setup configuration
├── polyfills.ts        # Browser API polyfills
└── README.md           # This documentation
```

## Testing Stack

- **Test Runner**: Jest with jsdom environment
- **Testing Library**: React Testing Library
- **User Interactions**: @testing-library/user-event
- **Accessibility**: jest-axe and @axe-core/react
- **Mocking**: Jest mocks with custom utilities
- **Coverage**: Istanbul via Jest

## Test Types

### Unit Tests

Located in `__tests__` directories alongside components.

```typescript
// Example: component/__tests__/component.test.tsx
import { render, screen } from '@/test/test-utils'
import { MyComponent } from '../my-component'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

### Integration Tests

Located in `src/test/integration/` directory.

```typescript
// Example: integration/dashboard-workflow.test.tsx
import { render, screen, userEvent } from '@/test/test-utils'
import { MainDashboard } from '@/components/dashboard/main-dashboard'

describe('Dashboard Workflow Integration', () => {
  it('completes full dashboard workflow', async () => {
    const user = userEvent.setup()
    render(<MainDashboard />)
    
    // Test complete user workflow
    await user.click(screen.getByText('Equipment Overview'))
    // ... more interactions
  })
})
```

### End-to-End Tests

Located in `src/test/e2e/` directory.

```typescript
// Example: e2e/user-journey.test.tsx
import { render, screen, userEvent } from '@/test/test-utils'
import { App } from '@/app/page'

describe('Complete User Journey E2E Tests', () => {
  it('completes inspector workflow from login to report', async () => {
    render(<App />)
    // Test complete user journey
  })
})
```

## Test Utilities

### Custom Render Function

```typescript
import { render } from '@/test/test-utils'

// Automatically wraps components with providers
render(<MyComponent />)
```

### Mock Data Factories

```typescript
import { TestDataFactory } from '@/test/test-utils'

const mockEquipment = TestDataFactory.equipment({
  name: 'Custom Equipment',
  status: 'operational'
})

const equipmentList = TestDataFactory.equipmentList(10)
```

### API Mocking

```typescript
import { mockApiResponse, mockApiError } from '@/test/test-utils'

// Mock successful API response
mockFetch.mockResolvedValue(mockApiResponse(data))

// Mock API error
mockFetch.mockRejectedValue(mockApiError('Network Error'))
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test Types
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e        # End-to-end tests only
```

### CI Mode
```bash
npm run test:ci
```

### Debug Mode
```bash
npm run test:debug
```

## Writing Tests

### Best Practices

1. **Test Behavior, Not Implementation**
   ```typescript
   // Good: Test what the user sees
   expect(screen.getByText('Save')).toBeInTheDocument()
   
   // Bad: Test implementation details
   expect(component.state.isSaving).toBe(false)
   ```

2. **Use Semantic Queries**
   ```typescript
   // Good: Use semantic queries
   screen.getByRole('button', { name: 'Submit' })
   screen.getByLabelText('Email Address')
   
   // Bad: Use implementation details
   screen.getByTestId('submit-button')
   ```

3. **Test User Interactions**
   ```typescript
   const user = userEvent.setup()
   await user.click(screen.getByText('Submit'))
   await user.type(screen.getByLabelText('Name'), 'John Doe')
   ```

4. **Mock External Dependencies**
   ```typescript
   jest.mock('@/services/api', () => ({
     fetchEquipment: jest.fn(() => Promise.resolve(mockData))
   }))
   ```

### Accessibility Testing

```typescript
import { checkAccessibility } from '@/test/test-utils'

it('is accessible', async () => {
  const { container } = render(<MyComponent />)
  await checkAccessibility(container)
})
```

### Performance Testing

```typescript
import { measureRenderTime, expectRenderTimeUnder } from '@/test/test-utils'

it('renders within performance budget', async () => {
  await expectRenderTimeUnder(() => {
    render(<MyComponent />)
  }, 100) // 100ms
})
```

### Error Boundary Testing

```typescript
import { TestErrorBoundary } from '@/test/test-utils'

it('handles errors gracefully', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }
  
  render(
    <TestErrorBoundary>
      <ThrowError />
    </TestErrorBoundary>
  )
  
  expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
})
```

## Mocking Strategies

### Component Mocking

```typescript
jest.mock('../complex-component', () => ({
  ComplexComponent: ({ title }: any) => <div data-testid="complex-component">{title}</div>
}))
```

### Hook Mocking

```typescript
const mockUseQuery = jest.fn()
jest.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery
}))

beforeEach(() => {
  mockUseQuery.mockReturnValue({
    data: mockData,
    isLoading: false,
    error: null
  })
})
```

### API Mocking

```typescript
const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockImplementation((url) => {
    if (url.includes('/equipment')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEquipmentData)
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
})
```

## Coverage Requirements

- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI
- `coverage/coverage-final.json` - JSON format

## Continuous Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Scheduled nightly runs

### CI Pipeline

1. **Linting** - ESLint checks
2. **Type Checking** - TypeScript compilation
3. **Unit Tests** - Component and utility tests
4. **Integration Tests** - Workflow tests
5. **E2E Tests** - Complete user journeys
6. **Accessibility Tests** - axe-core validation
7. **Performance Tests** - Lighthouse audits
8. **Security Tests** - Dependency audits
9. **Visual Regression** - Chromatic screenshots

## Debugging Tests

### Common Issues

1. **Async Operations**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument()
   })
   ```

2. **User Events**
   ```typescript
   // Setup userEvent properly
   const user = userEvent.setup()
   await user.click(button)
   ```

3. **Mock Cleanup**
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks()
   })
   
   afterEach(() => {
     jest.restoreAllMocks()
   })
   ```

### Debug Tools

```typescript
// Debug rendered output
screen.debug()

// Debug specific element
screen.debug(screen.getByText('Submit'))

// Log queries
screen.logTestingPlaygroundURL()
```

## Performance Considerations

### Test Performance

- Use `beforeEach` for setup instead of repeating in each test
- Mock heavy dependencies
- Use `screen.getBy*` instead of `container.querySelector`
- Avoid unnecessary re-renders in tests

### Bundle Size Testing

```bash
npm run build
npx bundlesize
```

## Accessibility Testing

### Automated Testing

```typescript
import { axe } from 'jest-axe'

it('has no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Manual Testing Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader announcements are appropriate
- [ ] Color contrast meets WCAG standards
- [ ] Focus management is correct
- [ ] ARIA labels are present and accurate

## Troubleshooting

### Common Test Failures

1. **Element not found**: Use `waitFor` for async operations
2. **Mock not working**: Check mock setup and imports
3. **Timeout errors**: Increase timeout or fix async handling
4. **Memory leaks**: Ensure proper cleanup in tests

### Getting Help

- Check Jest documentation: https://jestjs.io/docs/
- React Testing Library docs: https://testing-library.com/docs/react-testing-library/intro/
- User Event docs: https://testing-library.com/docs/user-event/intro/

## Contributing

When adding new tests:

1. Follow the existing patterns
2. Add appropriate documentation
3. Ensure tests are deterministic
4. Include accessibility checks
5. Update this documentation if needed

## Examples

See the `__tests__` directories throughout the codebase for comprehensive examples of:
- Component testing
- Hook testing
- Integration testing
- E2E testing
- Accessibility testing
- Performance testing
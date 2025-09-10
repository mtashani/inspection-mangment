# Development Workflow Guide

## Overview

This guide outlines the development workflow, coding standards, and best practices for the Inspection Management System frontend development team.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Git Workflow](#git-workflow)
3. [Coding Standards](#coding-standards)
4. [Code Review Process](#code-review-process)
5. [Testing Strategy](#testing-strategy)
6. [Documentation Standards](#documentation-standards)
7. [Performance Guidelines](#performance-guidelines)
8. [Accessibility Requirements](#accessibility-requirements)

---

## Development Environment Setup

### Prerequisites

```bash
# Required software versions
Node.js: 18.17.0 or higher
npm: 9.0.0 or higher (or pnpm 8.0+)
Git: Latest version
VS Code: Latest version (recommended)
```

### VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-playwright.playwright",
    "orta.vscode-jest"
  ]
}
```

### Environment Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd inspection-management

# 2. Setup frontend
cd frontend-v2
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Start development server
npm run dev

# 5. Run tests (in separate terminal)
npm run test:watch
```

### Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

---

## Git Workflow

### Branch Strategy

We use **Git Flow** with the following branch structure:

```
main                    # Production-ready code
├── develop            # Integration branch for features
├── feature/           # Feature development branches
│   ├── feature/user-auth
│   ├── feature/dashboard-redesign
│   └── feature/equipment-management
├── release/           # Release preparation branches
│   └── release/v1.2.0
├── hotfix/           # Critical production fixes
│   └── hotfix/login-bug
└── bugfix/           # Non-critical bug fixes
    └── bugfix/form-validation
```

### Branch Naming Convention

```bash
# Feature branches
feature/short-description
feature/user-authentication
feature/dashboard-widgets

# Bug fix branches
bugfix/issue-number-description
bugfix/123-form-validation-error

# Hotfix branches
hotfix/critical-issue-description
hotfix/security-vulnerability

# Release branches
release/version-number
release/v1.2.0
```

### Commit Message Format

We follow **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples

```bash
feat(auth): add JWT token refresh mechanism

fix(dashboard): resolve chart rendering issue on mobile devices

docs(api): update authentication endpoint documentation

style(components): format button component with prettier

refactor(utils): extract date formatting logic to separate module

perf(images): implement lazy loading for equipment photos

test(auth): add unit tests for login component

chore(deps): update React to version 18.2.0
```

### Pull Request Process

#### 1. Create Feature Branch

```bash
# Start from develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/user-profile-page

# Work on your feature
# ... make changes ...

# Commit changes
git add .
git commit -m "feat(profile): add user profile editing functionality"

# Push branch
git push origin feature/user-profile-page
```

#### 2. Create Pull Request

**PR Title Format:**
```
[Type] Brief description of changes
```

**PR Description Template:**
```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

#### 3. Code Review Requirements

- **Minimum 2 approvals** required for merge
- **All CI checks** must pass
- **No merge conflicts** with target branch
- **Documentation** updated if needed

---

## Coding Standards

### TypeScript Guidelines

#### Type Safety

```typescript
// ✅ Good: Use specific types
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'inspector' | 'viewer'
}

// ❌ Bad: Avoid any types
const user: any = getUserData()

// ✅ Good: Use unknown for truly unknown data
const apiResponse: unknown = await fetch('/api/data').then(r => r.json())

// ✅ Good: Use type guards
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'email' in obj
  )
}
```

#### Interface vs Type

```typescript
// ✅ Use interfaces for object shapes that might be extended
interface BaseComponent {
  id: string
  className?: string
}

interface ButtonProps extends BaseComponent {
  variant: 'primary' | 'secondary'
  onClick: () => void
}

// ✅ Use types for unions, primitives, and computed types
type Status = 'loading' | 'success' | 'error'
type EventHandler<T> = (event: T) => void
```

### React Guidelines

#### Component Structure

```typescript
// ✅ Good component structure
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UserProfileProps {
  userId: string
  className?: string
  onUpdate?: (user: User) => void
}

export function UserProfile({ userId, className, onUpdate }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch user data
  }, [userId])

  const handleSave = () => {
    // Save logic
    onUpdate?.(user)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className={cn('user-profile', className)}>
      {/* Component content */}
    </div>
  )
}
```

#### Hooks Guidelines

```typescript
// ✅ Custom hooks for reusable logic
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchUser() {
      try {
        setIsLoading(true)
        const userData = await api.getUser(userId)
        if (!cancelled) {
          setUser(userData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchUser()

    return () => {
      cancelled = true
    }
  }, [userId])

  return { user, isLoading, error }
}
```

### Styling Guidelines

#### Tailwind CSS Best Practices

```typescript
// ✅ Use cn utility for conditional classes
import { cn } from '@/lib/utils'

function Button({ variant, size, className, ...props }) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        // Variant styles
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
        },
        // Size styles
        {
          'h-10 px-4 py-2': size === 'default',
          'h-9 px-3': size === 'sm',
          'h-11 px-8': size === 'lg',
        },
        className
      )}
      {...props}
    />
  )
}

// ✅ Extract complex styles to CSS classes
// globals.css
@layer components {
  .card-gradient {
    @apply bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800;
  }
}
```

#### Component Styling

```typescript
// ✅ Use CSS variables for theming
:root {
  --primary: 222.2 84% 4.9%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
}

.dark {
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
}
```

### File Organization

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Route groups
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── [feature]/        # Feature-specific components
├── lib/                  # Utility functions
│   ├── utils.ts          # General utilities
│   ├── api.ts            # API client
│   └── validations.ts    # Zod schemas
├── hooks/                # Custom React hooks
├── contexts/             # React contexts
├── types/                # TypeScript type definitions
└── constants/            # Application constants
```

---

## Code Review Process

### Review Checklist

#### Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

#### Code Quality
- [ ] Code is readable and well-structured
- [ ] Functions are small and focused
- [ ] No code duplication
- [ ] Proper error handling

#### TypeScript
- [ ] No `any` types used
- [ ] Proper type definitions
- [ ] Type safety maintained
- [ ] Generic types used appropriately

#### React Best Practices
- [ ] Components are properly structured
- [ ] Hooks used correctly
- [ ] No unnecessary re-renders
- [ ] Proper dependency arrays in useEffect

#### Styling
- [ ] Consistent with design system
- [ ] Responsive design implemented
- [ ] Accessibility considerations
- [ ] Dark mode support

#### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests if needed
- [ ] E2E tests for critical flows
- [ ] Test coverage maintained

### Review Comments

#### Constructive Feedback

```markdown
# ✅ Good feedback
**Suggestion:** Consider extracting this logic into a custom hook for reusability.

**Question:** What happens if the API returns null? Should we handle this case?

**Nitpick:** Consider using a more descriptive variable name here.

**Praise:** Great use of TypeScript generics here! This makes the component very flexible.
```

#### Code Suggestions

```typescript
// Instead of inline comments, provide code suggestions
// ❌ Don't just say "this could be better"
// ✅ Provide specific improvement

// Current code:
const users = data.filter(item => item.type === 'user').map(item => item.data)

// Suggested improvement:
const users = data
  .filter((item): item is UserItem => item.type === 'user')
  .map(item => item.data)
```

---

## Testing Strategy

### Testing Pyramid

```
    E2E Tests (Few)
   ├─ Critical user journeys
   ├─ Cross-browser compatibility
   └─ Performance testing

  Integration Tests (Some)
 ├─ Component interactions
 ├─ API integration
 └─ Context providers

Unit Tests (Many)
├─ Individual components
├─ Utility functions
├─ Custom hooks
└─ Business logic
```

### Unit Testing

```typescript
// Component testing example
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies correct variant styles', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })
})
```

### Integration Testing

```typescript
// API integration testing
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEquipment } from './use-equipment'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useEquipment', () => {
  it('fetches equipment data successfully', async () => {
    const { result } = renderHook(() => useEquipment('123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockEquipmentData)
  })
})
```

### E2E Testing

```typescript
// Playwright E2E test
import { test, expect } from '@playwright/test'

test.describe('Equipment Management', () => {
  test('should create new equipment', async ({ page }) => {
    await page.goto('/equipment')
    
    // Click new equipment button
    await page.getByRole('button', { name: 'New Equipment' }).click()
    
    // Fill form
    await page.getByLabel('Equipment Name').fill('Test Pump')
    await page.getByLabel('Location').fill('Building A')
    
    // Submit form
    await page.getByRole('button', { name: 'Save' }).click()
    
    // Verify success
    await expect(page.getByText('Equipment created successfully')).toBeVisible()
    await expect(page.getByText('Test Pump')).toBeVisible()
  })
})
```

---

## Documentation Standards

### Component Documentation

```typescript
/**
 * A versatile button component with multiple variants and sizes.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * ```
 */
interface ButtonProps {
  /** The visual style variant of the button */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  /** The size of the button */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Additional CSS classes */
  className?: string
  /** Click event handler */
  onClick?: () => void
  /** Button content */
  children: React.ReactNode
}

export function Button({ 
  variant = 'default', 
  size = 'default', 
  className, 
  onClick, 
  children,
  ...props 
}: ButtonProps) {
  // Implementation
}
```

### API Documentation

```typescript
/**
 * Fetches equipment data from the API
 * 
 * @param equipmentId - The unique identifier for the equipment
 * @param options - Additional fetch options
 * @returns Promise resolving to equipment data
 * 
 * @throws {ApiError} When the equipment is not found
 * @throws {NetworkError} When the request fails
 * 
 * @example
 * ```typescript
 * const equipment = await fetchEquipment('pump-001')
 * console.log(equipment.name) // "Centrifugal Pump"
 * ```
 */
export async function fetchEquipment(
  equipmentId: string,
  options?: RequestInit
): Promise<Equipment> {
  // Implementation
}
```

### README Documentation

Each feature should have a README with:

```markdown
# Feature Name

## Overview
Brief description of what this feature does.

## Usage
How to use this feature with code examples.

## API Reference
List of components, hooks, and utilities provided.

## Testing
How to test this feature.

## Contributing
Guidelines for contributing to this feature.
```

---

## Performance Guidelines

### Bundle Size Optimization

```typescript
// ✅ Use dynamic imports for large components
const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

// ✅ Optimize imports
import { debounce } from 'lodash/debounce' // Specific import
// ❌ import _ from 'lodash' // Imports entire library
```

### React Performance

```typescript
// ✅ Use React.memo for expensive components
const ExpensiveList = React.memo(({ items, onItemClick }) => {
  return (
    <ul>
      {items.map(item => (
        <ExpensiveListItem 
          key={item.id} 
          item={item} 
          onClick={onItemClick} 
        />
      ))}
    </ul>
  )
})

// ✅ Use useMemo for expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name))
}, [items])

// ✅ Use useCallback for event handlers
const handleItemClick = useCallback((itemId: string) => {
  onItemSelect(itemId)
}, [onItemSelect])
```

### Image Optimization

```typescript
// ✅ Use Next.js Image component
import Image from 'next/image'

<Image
  src="/equipment/pump.jpg"
  alt="Centrifugal Pump"
  width={400}
  height={300}
  priority={false} // Set to true for above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

#### Keyboard Navigation

```typescript
// ✅ Ensure all interactive elements are keyboard accessible
function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (isOpen) {
      // Trap focus within modal
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      
      firstElement?.focus()
      
      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
      
      document.addEventListener('keydown', handleTabKey)
      return () => document.removeEventListener('keydown', handleTabKey)
    }
  }, [isOpen])
}
```

#### ARIA Attributes

```typescript
// ✅ Use proper ARIA attributes
function SearchInput({ onSearch, isLoading }) {
  const [query, setQuery] = useState('')
  
  return (
    <div role="search">
      <label htmlFor="search-input" className="sr-only">
        Search equipment
      </label>
      <input
        id="search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-describedby="search-help"
        aria-busy={isLoading}
        placeholder="Search equipment..."
      />
      <div id="search-help" className="sr-only">
        Enter keywords to search for equipment
      </div>
    </div>
  )
}
```

#### Color Contrast

```css
/* ✅ Ensure sufficient color contrast */
.button-primary {
  background-color: #1f2937; /* 4.5:1 contrast ratio */
  color: #ffffff;
}

.text-muted {
  color: #6b7280; /* 4.5:1 contrast ratio on white background */
}
```

### Testing Accessibility

```typescript
// Use jest-axe for automated accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

This development workflow guide should be regularly updated as our processes and standards evolve.
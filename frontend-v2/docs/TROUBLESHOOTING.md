# Troubleshooting Guide

## Common Issues and Solutions

This guide covers the most common issues encountered during development and migration, along with their solutions.

## Table of Contents

1. [Development Environment Issues](#development-environment-issues)
2. [Build and Compilation Errors](#build-and-compilation-errors)
3. [Runtime Errors](#runtime-errors)
4. [Styling and UI Issues](#styling-and-ui-issues)
5. [API Integration Problems](#api-integration-problems)
6. [Performance Issues](#performance-issues)
7. [Testing Problems](#testing-problems)
8. [Deployment Issues](#deployment-issues)

---

## Development Environment Issues

### Issue: Node.js Version Compatibility

**Error Message:**
```
Error: The engine "node" is incompatible with this module
```

**Solution:**
```bash
# Check current Node.js version
node --version

# Install correct version (18.17 or higher)
# Using nvm (recommended)
nvm install 18.17.0
nvm use 18.17.0

# Or download from nodejs.org
```

### Issue: Package Installation Failures

**Error Message:**
```
npm ERR! peer dep missing: react@^18.0.0
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If using pnpm
pnpm install --force
```

### Issue: TypeScript Configuration Problems

**Error Message:**
```
Cannot find module '@/components/ui/button' or its corresponding type declarations
```

**Solution:**
```json
// Check tsconfig.json paths configuration
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Build and Compilation Errors

### Issue: Next.js Build Failures

**Error Message:**
```
Error: Failed to compile
Module not found: Can't resolve 'some-module'
```

**Solution:**
```bash
# Check if module is installed
npm list some-module

# Install missing dependency
npm install some-module

# Check import paths
# Wrong: import { Button } from 'components/ui/button'
# Correct: import { Button } from '@/components/ui/button'
```

### Issue: TypeScript Type Errors

**Error Message:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**Solution:**
```typescript
// Use optional chaining and nullish coalescing
// Wrong:
const name = user.name.toUpperCase()

// Correct:
const name = user.name?.toUpperCase() ?? 'Unknown'

// Or use type guards
if (user.name) {
  const name = user.name.toUpperCase()
}
```

### Issue: Tailwind CSS Not Working

**Error Message:**
```
Class 'bg-blue-500' is not being applied
```

**Solution:**
```javascript
// Check tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ... rest of config
}

// Restart development server
npm run dev
```

---

## Runtime Errors

### Issue: Hydration Mismatch

**Error Message:**
```
Warning: Text content did not match. Server: "Loading..." Client: "Welcome back, John"
```

**Solution:**
```typescript
// Use useEffect for client-only content
import { useEffect, useState } from 'react'

function UserGreeting() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <div>Loading...</div>
  }
  
  return <div>Welcome back, {user.name}</div>
}

// Or use dynamic imports with ssr: false
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
)
```

### Issue: Authentication Context Errors

**Error Message:**
```
Cannot read properties of undefined (reading 'user')
```

**Solution:**
```typescript
// Ensure AuthProvider wraps the component
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

// Use optional chaining in components
function UserProfile() {
  const { user } = useAuth()
  
  if (!user) {
    return <div>Please log in</div>
  }
  
  return <div>Hello, {user.name}</div>
}
```

### Issue: React Query Errors

**Error Message:**
```
No QueryClient set, use QueryClientProvider to set one
```

**Solution:**
```typescript
// Ensure QueryClientProvider wraps your app
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

## Styling and UI Issues

### Issue: Components Not Styled Correctly

**Problem:** Components appear unstyled or with incorrect styling

**Solution:**
```typescript
// Check if shadcn/ui is properly configured
// components.json should exist in project root
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}

// Ensure globals.css imports Tailwind
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Issue: Dark Mode Not Working

**Problem:** Theme toggle doesn't switch between light and dark modes

**Solution:**
```typescript
// Check ThemeProvider configuration
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

// Ensure Tailwind is configured for dark mode
// tailwind.config.js
module.exports = {
  darkMode: ['class'],
  // ... rest of config
}
```

### Issue: Responsive Design Problems

**Problem:** Layout breaks on mobile devices

**Solution:**
```typescript
// Use Tailwind responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Test with different screen sizes
// Chrome DevTools > Toggle device toolbar
// Or use responsive design mode in Firefox

// Add viewport meta tag (should be automatic in Next.js)
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

---

## API Integration Problems

### Issue: CORS Errors

**Error Message:**
```
Access to fetch at 'http://localhost:8000/api/users' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
```javascript
// Configure Next.js API routes or backend CORS
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
}

// Or configure backend CORS (FastAPI example)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Authentication Token Issues

**Error Message:**
```
401 Unauthorized: Token has expired
```

**Solution:**
```typescript
// Implement token refresh logic
import { useAuth } from '@/contexts/auth-context'

function useApiClient() {
  const { token, refreshToken, logout } = useAuth()
  
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await refreshToken()
      if (refreshed) {
        // Retry with new token
        return fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${refreshed}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })
      } else {
        // Refresh failed, logout user
        logout()
        throw new Error('Authentication failed')
      }
    }
    
    return response
  }
  
  return { apiCall }
}
```

### Issue: React Query Cache Issues

**Problem:** Stale data being displayed

**Solution:**
```typescript
// Configure appropriate stale time and cache time
const { data } = useQuery({
  queryKey: ['equipment', id],
  queryFn: () => fetchEquipment(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
})

// Invalidate cache when data changes
const mutation = useMutation({
  mutationFn: updateEquipment,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['equipment'] })
  },
})

// Force refetch
const { refetch } = useQuery(...)
await refetch()
```

---

## Performance Issues

### Issue: Slow Page Load Times

**Problem:** Pages take too long to load

**Solution:**
```typescript
// Implement code splitting
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // If component doesn't need SSR
})

// Optimize images
import { OptimizedImage } from '@/components/ui/optimized-image'

<OptimizedImage
  src="/large-image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false} // Set to true for above-the-fold images
  placeholder="blur"
/>

// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering logic
  return <div>{/* Complex UI */}</div>
})
```

### Issue: Memory Leaks

**Problem:** Application becomes slow over time

**Solution:**
```typescript
// Clean up event listeners and subscriptions
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  }
  
  window.addEventListener('resize', handleResize)
  
  return () => {
    window.removeEventListener('resize', handleResize)
  }
}, [])

// Cancel ongoing requests when component unmounts
useEffect(() => {
  const controller = new AbortController()
  
  fetch('/api/data', { signal: controller.signal })
    .then(response => response.json())
    .then(data => setData(data))
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error)
      }
    })
  
  return () => {
    controller.abort()
  }
}, [])
```

### Issue: Large Bundle Size

**Problem:** JavaScript bundle is too large

**Solution:**
```bash
# Analyze bundle size
npm run analyze

# Check what's included in the bundle
npx @next/bundle-analyzer

# Optimize imports
// Wrong: import * as Icons from 'lucide-react'
// Correct: import { Settings, User } from 'lucide-react'

# Use dynamic imports for large libraries
const Chart = dynamic(() => import('react-chartjs-2'), {
  ssr: false,
})
```

---

## Testing Problems

### Issue: Jest Tests Failing

**Error Message:**
```
Cannot find module '@/components/ui/button' from 'src/components/Button.test.tsx'
```

**Solution:**
```javascript
// Configure Jest module mapping
// jest.config.js
module.exports = {
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}

// jest.setup.js
import '@testing-library/jest-dom'
```

### Issue: Playwright Tests Failing

**Error Message:**
```
Error: page.locator('button').click(): Target closed
```

**Solution:**
```typescript
// Wait for elements properly
await page.waitForSelector('button')
await page.click('button')

// Or use more specific locators
await page.getByRole('button', { name: 'Submit' }).click()

// Handle navigation
await Promise.all([
  page.waitForNavigation(),
  page.click('a[href="/dashboard"]')
])

// Set proper timeouts
await page.waitForSelector('button', { timeout: 10000 })
```

### Issue: Component Testing Issues

**Problem:** Components don't render correctly in tests

**Solution:**
```typescript
// Provide necessary context in tests
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/auth-context'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Use in tests
test('renders dashboard', () => {
  renderWithProviders(<Dashboard />)
  expect(screen.getByText('Welcome')).toBeInTheDocument()
})
```

---

## Deployment Issues

### Issue: Build Fails in Production

**Error Message:**
```
Error: Minified React error #31
```

**Solution:**
```bash
# Check for development-only code in production build
# Remove console.log statements or use proper logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info')
}

# Check environment variables
# Ensure all required env vars are set in production
NEXT_PUBLIC_API_URL=https://api.production.com
DATABASE_URL=postgresql://...

# Test production build locally
npm run build
npm run start
```

### Issue: Static Assets Not Loading

**Problem:** Images and other assets return 404 errors

**Solution:**
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/images/logo.png" // Must be in public directory
  alt="Logo"
  width={200}
  height={100}
/>

// For dynamic images
<Image
  src={`${process.env.NEXT_PUBLIC_CDN_URL}/images/${imageName}`}
  alt="Dynamic image"
  width={200}
  height={100}
/>

// Check public directory structure
public/
├── images/
│   ├── logo.png
│   └── hero.jpg
├── icons/
└── manifest.json
```

### Issue: Environment Variables Not Working

**Problem:** Environment variables are undefined in production

**Solution:**
```bash
# Client-side variables must be prefixed with NEXT_PUBLIC_
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME=Inspection Management

# Server-side variables (API routes, middleware)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key

# Check .env.local, .env.production files
# Ensure deployment platform has env vars configured
```

---

## Debug Tools and Techniques

### React Developer Tools
```bash
# Install browser extension
# Chrome: React Developer Tools
# Firefox: React Developer Tools

# Use in development
# Inspect component props and state
# Profile component performance
# Track re-renders
```

### Network Debugging
```javascript
// Monitor API calls in browser DevTools
// Network tab > Filter by XHR/Fetch
// Check request/response headers
// Verify authentication tokens

// Add request/response logging
const originalFetch = window.fetch
window.fetch = function(...args) {
  console.log('Fetch request:', args)
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Fetch response:', response)
      return response
    })
}
```

### Performance Debugging
```typescript
// Use React Profiler
import { Profiler } from 'react'

function onRenderCallback(id, phase, actualDuration) {
  console.log('Component render:', { id, phase, actualDuration })
}

<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>

// Monitor Core Web Vitals
import { PerformanceMonitor } from '@/components/performance-monitor'

// Include in development builds
{process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
```

---

## Getting Help

### Internal Resources
1. **Code Review**: Submit PR for team review
2. **Documentation**: Check project documentation
3. **Team Chat**: Ask in development channel

### External Resources
1. **Stack Overflow**: Search for similar issues
2. **GitHub Issues**: Check library issue trackers
3. **Documentation**: Official library docs
4. **Community Forums**: Discord, Reddit communities

### Debugging Checklist
- [ ] Check browser console for errors
- [ ] Verify network requests in DevTools
- [ ] Test in different browsers
- [ ] Check mobile responsiveness
- [ ] Validate HTML and accessibility
- [ ] Review recent code changes
- [ ] Check environment variables
- [ ] Verify dependencies are up to date

---

Remember to update this troubleshooting guide as new issues are discovered and resolved.
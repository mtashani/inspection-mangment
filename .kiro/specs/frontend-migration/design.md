# Design Document

## Overview

This design outlines the creation of a new modern frontend application (`frontend-v2`) that will be built page by page with systematic approach. Each page will be developed independently with its own domain logic, using latest stable technologies and professional minimal design patterns. The application will use MCP Context7 for shadcn/ui best practices to ensure consistent and high-quality implementation.

## Architecture

### Directory Structure
```
project-root/
├── frontend/           # Existing frontend (legacy)
├── frontend-v2/        # New modern frontend
├── backend/           # Shared backend API
└── .kiro/specs/       # Migration specifications
```

### Technology Stack

#### Frontend-v2 Stack
- **Framework**: Latest stable Next.js with App Router
- **React**: Latest stable React
- **TypeScript**: Latest stable TypeScript with strict mode
- **UI Library**: Latest stable shadcn/ui with Tailwind CSS
- **Theming**: next-themes for consistent light/dark mode
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React (consistent with shadcn/ui)
- **Development**: ESLint, Prettier, TypeScript strict mode
- **Best Practices**: MCP Context7 for shadcn/ui implementation guidance

#### Design Principles
- **Professional & Minimal**: Clean, focused, and purposeful design
- **Consistent**: Unified design system across all pages
- **Domain-Driven**: Each page has clear domain boundaries
- **Step-by-Step**: Systematic development approach
- **Independent**: Each page works independently with its own logic

## Components and Interfaces

### Core Components Architecture

#### 1. Theme System
```typescript
// Simple theme provider using next-themes
interface ThemeConfig {
  attribute: 'class'
  defaultTheme: 'system' | 'light' | 'dark'
  enableSystem: boolean
}

// Clean CSS variables (shadcn/ui standard)
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  // ... standard shadcn/ui variables
}
```

#### 2. Component Library Structure
```
src/components/
├── ui/                 # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── layout/            # Layout components
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── navigation.tsx
├── auth/              # Authentication components
│   ├── login-form.tsx
│   └── auth-guard.tsx
└── shared/            # Shared business components
    ├── data-table.tsx
    └── form-builder.tsx
```

#### 3. Page Structure (App Router)
```
src/app/
├── layout.tsx         # Root layout
├── page.tsx          # Home page
├── login/
│   └── page.tsx      # Login page
├── dashboard/
│   ├── layout.tsx    # Dashboard layout
│   └── page.tsx      # Dashboard page
└── equipment/
    └── page.tsx      # Equipment management
```

## Data Models

### Theme Configuration
```typescript
interface ThemeState {
  mode: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'
}
```

### User Interface Models
```typescript
interface User {
  id: string
  username: string
  role: 'admin' | 'inspector'
  permissions: string[]
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}
```

### Component Props Patterns
```typescript
// Standard component interface pattern
interface ComponentProps {
  className?: string
  children?: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}
```

## Error Handling

### Error Boundary Strategy
```typescript
// Global error boundary for unhandled errors
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

// API error handling with TanStack Query
interface ApiError {
  message: string
  status: number
  code: string
}
```

### Form Validation
```typescript
// Zod schemas for form validation
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
})
```

## Testing Strategy

### Testing Pyramid
1. **Unit Tests**: Component logic, utilities, hooks
2. **Integration Tests**: Component interactions, API calls
3. **E2E Tests**: Critical user flows (login, navigation)

### Testing Tools
- **Unit/Integration**: Jest + React Testing Library
- **E2E**: Playwright (shared with existing frontend)
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint with React/TypeScript rules

### Test Structure
```
src/
├── components/
│   └── __tests__/
├── hooks/
│   └── __tests__/
└── utils/
    └── __tests__/
```

## Migration Strategy

### Phase 1: Foundation Setup
1. Create frontend-v2 directory
2. Setup Next.js 15 + TypeScript + Tailwind
3. Configure shadcn/ui and theme system
4. Setup development environment

### Phase 2: Core Components
1. Implement theme provider and mode toggle
2. Create basic layout components
3. Setup authentication flow
4. Implement shared UI components

### Phase 3: Core Pages Development
1. **Priority 1**: Login page with complete authentication system
2. **Priority 2**: Dashboard page with card-based design (built from scratch)
3. **Future Phases**: Other pages will be added systematically

### Phase 4: Integration
1. Setup routing between old/new frontends
2. Implement shared state management
3. Configure build and deployment
4. Performance optimization

## Routing Strategy

### Development Phase
- **Old Frontend**: `http://localhost:3000`
- **New Frontend**: `http://localhost:3001`
- **Backend API**: `http://localhost:8000`

### Production Routing
```nginx
# Nginx configuration example
location /v2/ {
    proxy_pass http://frontend-v2:3000/;
}

location / {
    proxy_pass http://frontend:3000/;
}
```

### Gradual Migration Approach
1. New pages start with `/v2/` prefix
2. Gradually move routes from old to new
3. Implement redirects for migrated pages
4. Final cutover when all pages migrated

## Performance Considerations

### Bundle Optimization
- **Code Splitting**: Automatic with App Router
- **Tree Shaking**: Enabled by default
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Next.js Font optimization

### Loading Strategies
- **Streaming**: React 18 Suspense boundaries
- **Progressive Enhancement**: Core functionality first
- **Lazy Loading**: Non-critical components
- **Prefetching**: Critical routes and data

## Security Considerations

### Authentication & Authorization
- **JWT Tokens**: Integration with existing backend authentication
- **Route Protection**: All pages require authentication, redirect to login if not authenticated
- **Permission System**: Integration with backend permission system
- **Performance**: Optimized login flow with fast redirect and improved UX
- **Local Server**: No password reset feature (admin contact required)
- **CSRF Protection**: Built-in Next.js protection

### Data Validation
- **Client-side**: Zod schemas
- **Server-side**: Backend validation (unchanged)
- **Type Safety**: End-to-end TypeScript

## Deployment Strategy

### Development Environment
```yaml
# docker-compose.dev.yml
services:
  frontend-v2:
    build: ./frontend-v2
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production Deployment
- **Build Process**: `npm run build`
- **Static Export**: For CDN deployment if needed
- **Docker**: Containerized deployment
- **Environment Variables**: Proper configuration management

## Monitoring and Analytics

### Performance Monitoring
- **Core Web Vitals**: Built-in Next.js analytics
- **Bundle Analysis**: @next/bundle-analyzer
- **Runtime Performance**: React DevTools Profiler

### Error Tracking
- **Error Boundaries**: Graceful error handling
- **Logging**: Structured logging for debugging
- **User Feedback**: Error reporting mechanisms
##
 Specific Design Requirements

### Login Page Design
- **Clean and Minimal**: Professional login form with shadcn/ui components
- **Performance Optimized**: Fast authentication with smooth UX
- **No Password Reset**: Contact admin message instead (local server environment)
- **Responsive**: Works on all device sizes
- **Theme Support**: Light and dark mode support

### Dashboard Page Design
- **Card-Based Layout**: Modern card-based design for all dashboard elements
- **Built from Scratch**: New dashboard design based on backend data structure
- **Sidebar Navigation**: Using shadcn sidebar-07 component
- **Navigation Bar**: Reference existing frontend navigation patterns
- **Responsive Grid**: Adaptive card layout for different screen sizes
- **Data Visualization**: Professional charts and metrics display

### Navigation System
- **Sidebar**: shadcn sidebar-07 component implementation
- **Navigation Bar**: Inspired by existing frontend patterns
- **Route Protection**: All routes protected, redirect to login if unauthenticated
- **Breadcrumbs**: Clear navigation hierarchy
- **User Menu**: Profile and logout functionality

### Layout Architecture
```
App Layout
├── Authentication Check
├── Login Page (if not authenticated)
└── Authenticated Layout
    ├── Sidebar (sidebar-07)
    ├── Navigation Bar
    └── Page Content (card-based)
```
# Design Document

## Overview

This design document outlines the architecture and implementation approach for the frontend redesign of the Inspection Management System. The new frontend will be built using Next.js 15 with React 19, integrating DaisyUI as the primary component library and shadcn/ui for specific advanced components. The design emphasizes theme consistency, responsive behavior, and seamless integration between the two component libraries.

## Architecture

### Technology Stack

- **Framework**: Next.js 15.x with App Router
- **React Version**: React 19
- **Styling**: Tailwind CSS 4 + DaisyUI 5.x + shadcn/ui
- **TypeScript**: Full TypeScript support
- **Date Handling**: jalaali-js for Persian calendar support
- **State Management**: React Context for theme management
- **Build Tool**: Next.js built-in bundler with Turbopack

### Project Structure

```
frontend/
├── app/                          # Next.js 15 App Router
│   ├── globals.css              # Global styles and theme variables
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Dashboard page
│   ├── (dashboard)/             # Dashboard group routes
│   │   ├── equipment/           # Equipment management
│   │   │   ├── page.tsx         # Equipment list
│   │   │   ├── [id]/            # Equipment details
│   │   │   └── psv/             # PSV specific pages
│   │   │       ├── page.tsx     # PSV list
│   │   │       ├── [id]/        # PSV details
│   │   │       ├── calibration/ # PSV calibration
│   │   │       └── risk-assessment/ # PSV risk assessment
│   │   ├── inspections/         # Inspection management
│   │   │   ├── page.tsx         # Inspection list
│   │   │   ├── [id]/            # Inspection details
│   │   │   ├── daily-reports/   # Daily reports
│   │   │   └── corrosion/       # Corrosion monitoring
│   │   ├── cranes/              # Crane management
│   │   │   ├── page.tsx         # Crane list
│   │   │   └── [id]/            # Crane details
│   │   ├── analytics/           # Analytics and reports
│   │   │   ├── page.tsx         # Analytics dashboard
│   │   │   ├── rbi/             # Risk-based inspection
│   │   │   └── reports/         # Generated reports
│   │   └── settings/            # System settings
│   │       ├── page.tsx         # General settings
│   │       ├── users/           # User management
│   │       └── permissions/     # Permission management
│   └── api/                     # API routes (if needed)
├── components/                   # Reusable components
│   ├── ui/                      # shadcn/ui components
│   │   ├── sidebar.tsx          # Collapsible sidebar
│   │   ├── button.tsx           # Enhanced button
│   │   ├── data-table.tsx       # Advanced data table
│   │   ├── date-picker.tsx      # Date picker with Jalali support
│   │   └── ...                  # Other shadcn components
│   ├── daisy/                   # DaisyUI component wrappers
│   │   ├── navbar.tsx           # Navigation bar
│   │   ├── theme-controller.tsx # Theme switcher
│   │   ├── card.tsx             # Card component
│   │   ├── modal.tsx            # Modal component
│   │   ├── form/                # Form components
│   │   │   ├── input.tsx        # Input wrapper
│   │   │   ├── select.tsx       # Select wrapper
│   │   │   └── textarea.tsx     # Textarea wrapper
│   │   └── ...                  # Other DaisyUI wrappers
│   ├── layout/                  # Layout components
│   │   ├── app-sidebar.tsx      # Main sidebar component
│   │   ├── navigation-bar.tsx   # Top navigation
│   │   ├── dashboard-layout.tsx # Dashboard layout wrapper
│   │   └── page-header.tsx      # Page header component
│   ├── features/                # Feature-specific components
│   │   ├── equipment/           # Equipment components
│   │   │   ├── equipment-list.tsx
│   │   │   ├── equipment-form.tsx
│   │   │   ├── psv/             # PSV specific components
│   │   │   │   ├── psv-calibration-form.tsx
│   │   │   │   ├── psv-risk-calculator.tsx
│   │   │   │   └── psv-status-badge.tsx
│   │   │   └── equipment-status-badge.tsx
│   │   ├── inspections/         # Inspection components
│   │   │   ├── inspection-list.tsx
│   │   │   ├── inspection-form.tsx
│   │   │   ├── daily-report-form.tsx
│   │   │   └── corrosion-chart.tsx
│   │   ├── cranes/              # Crane components
│   │   │   ├── crane-list.tsx
│   │   │   └── crane-form.tsx
│   │   ├── analytics/           # Analytics components
│   │   │   ├── rbi-dashboard.tsx
│   │   │   ├── charts/          # Chart components
│   │   │   │   ├── corrosion-trend-chart.tsx
│   │   │   │   └── risk-matrix-chart.tsx
│   │   │   └── reports/         # Report components
│   │   └── auth/                # Authentication components
│   │       ├── login-form.tsx
│   │       └── user-profile.tsx
│   └── common/                  # Common reusable components
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       ├── confirmation-dialog.tsx
│       └── breadcrumb.tsx
├── lib/                         # Utility functions
│   ├── theme-manager.ts         # Theme management utilities
│   ├── date-utils.ts           # Jalali date utilities
│   ├── api-client.ts           # API client configuration
│   ├── validation-schemas.ts    # Zod validation schemas
│   ├── constants.ts            # Application constants
│   └── utils.ts                # General utilities
├── hooks/                       # Custom React hooks
│   ├── use-theme.ts            # Theme management hook
│   ├── use-sidebar.ts          # Sidebar state management
│   ├── use-api.ts              # API data fetching hooks
│   ├── use-equipment.ts        # Equipment-specific hooks
│   ├── use-inspections.ts      # Inspection-specific hooks
│   └── use-permissions.ts      # Permission management hooks
├── types/                       # TypeScript definitions
│   ├── theme.ts                # Theme-related types
│   ├── components.ts           # Component prop types
│   ├── api.ts                  # API response types
│   ├── equipment.ts            # Equipment-related types
│   ├── inspection.ts           # Inspection-related types
│   ├── user.ts                 # User and auth types
│   └── index.ts                # Type exports
├── services/                    # API service functions
│   ├── equipment-service.ts     # Equipment API calls
│   ├── inspection-service.ts    # Inspection API calls
│   ├── psv-service.ts          # PSV-specific API calls
│   ├── crane-service.ts        # Crane API calls
│   ├── auth-service.ts         # Authentication API calls
│   └── analytics-service.ts    # Analytics API calls
├── contexts/                    # React contexts
│   ├── theme-context.tsx       # Theme context
│   ├── auth-context.tsx        # Authentication context
│   └── sidebar-context.tsx     # Sidebar context
└── styles/                      # Additional styles
    ├── themes/                 # Custom theme definitions
    │   ├── bouncyagain.css     # Dark theme
    │   └── somuchflame.css     # Light theme
    ├── components.css          # Component-specific styles
    └── globals.css             # Global styles
```

## Components and Interfaces

### Theme Management System

#### ThemeProvider Component

```typescript
interface ThemeContextType {
  theme: "bouncyagain" | "somuchflame";
  setTheme: (theme: "bouncyagain" | "somuchflame") => void;
  toggleTheme: () => void;
}

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Implementation with localStorage persistence
  // Theme switching logic
  // CSS variable updates
};
```

#### Theme Controller Component

```typescript
interface ThemeControllerProps {
  variant?: "dropdown" | "toggle" | "radio";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ThemeController: React.FC<ThemeControllerProps> = ({
  variant,
  size,
  className,
}) => {
  // DaisyUI-styled theme switcher
  // Integration with ThemeProvider
};
```

### Sidebar System

#### AppSidebar Component (shadcn/ui based)

```typescript
interface AppSidebarProps {
  collapsible?: "offcanvas" | "icon" | "none";
  variant?: "sidebar" | "floating" | "inset";
  className?: string;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsible,
  variant,
  className,
}) => {
  // shadcn/ui Sidebar integration
  // DaisyUI theme compatibility
  // Navigation items with icons
};
```

#### Navigation Items Structure

```typescript
interface NavigationItem {
  id: string;
  label: string;
  labelFa: string; // Persian label
  icon: React.ComponentType;
  href: string;
  badge?: string | number;
  permission?: string; // Required permission to access
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    labelFa: "داشبورد",
    icon: HomeIcon,
    href: "/",
  },
  {
    id: "equipment",
    label: "Equipment",
    labelFa: "تجهیزات",
    icon: CogIcon,
    href: "/equipment",
    children: [
      {
        id: "equipment-list",
        label: "All Equipment",
        labelFa: "همه تجهیزات",
        icon: ListIcon,
        href: "/equipment",
      },
      {
        id: "psv",
        label: "PSV Management",
        labelFa: "مدیریت PSV",
        icon: ShieldIcon,
        href: "/equipment/psv",
        children: [
          {
            id: "psv-list",
            label: "PSV List",
            labelFa: "لیست PSV",
            icon: ListIcon,
            href: "/equipment/psv",
          },
          {
            id: "psv-calibration",
            label: "Calibration",
            labelFa: "کالیبراسیون",
            icon: AdjustmentsIcon,
            href: "/equipment/psv/calibration",
          },
          {
            id: "psv-risk",
            label: "Risk Assessment",
            labelFa: "ارزیابی ریسک",
            icon: ExclamationTriangleIcon,
            href: "/equipment/psv/risk-assessment",
          },
        ],
      },
    ],
  },
  {
    id: "inspections",
    label: "Inspections",
    labelFa: "بازرسی‌ها",
    icon: ClipboardDocumentCheckIcon,
    href: "/inspections",
    children: [
      {
        id: "inspection-list",
        label: "All Inspections",
        labelFa: "همه بازرسی‌ها",
        icon: ListIcon,
        href: "/inspections",
      },
      {
        id: "daily-reports",
        label: "Daily Reports",
        labelFa: "گزارش‌های روزانه",
        icon: DocumentTextIcon,
        href: "/inspections/daily-reports",
      },
      {
        id: "corrosion",
        label: "Corrosion Monitoring",
        labelFa: "نظارت بر خوردگی",
        icon: BeakerIcon,
        href: "/inspections/corrosion",
      },
    ],
  },
  {
    id: "cranes",
    label: "Crane Management",
    labelFa: "مدیریت جرثقیل",
    icon: TruckIcon,
    href: "/cranes",
    permission: "CRANE_VIEW",
  },
  {
    id: "analytics",
    label: "Analytics & Reports",
    labelFa: "تحلیل و گزارش",
    icon: ChartBarIcon,
    href: "/analytics",
    children: [
      {
        id: "analytics-dashboard",
        label: "Analytics Dashboard",
        labelFa: "داشبورد تحلیل",
        icon: ChartBarIcon,
        href: "/analytics",
      },
      {
        id: "rbi",
        label: "Risk-Based Inspection",
        labelFa: "بازرسی مبتنی بر ریسک",
        icon: ShieldExclamationIcon,
        href: "/analytics/rbi",
      },
      {
        id: "reports",
        label: "Generated Reports",
        labelFa: "گزارش‌های تولید شده",
        icon: DocumentArrowDownIcon,
        href: "/analytics/reports",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    labelFa: "تنظیمات",
    icon: CogIcon,
    href: "/settings",
    permission: "ADMIN",
    children: [
      {
        id: "general-settings",
        label: "General Settings",
        labelFa: "تنظیمات عمومی",
        icon: CogIcon,
        href: "/settings",
      },
      {
        id: "user-management",
        label: "User Management",
        labelFa: "مدیریت کاربران",
        icon: UsersIcon,
        href: "/settings/users",
        permission: "USER_MANAGE",
      },
      {
        id: "permissions",
        label: "Permissions",
        labelFa: "مجوزها",
        icon: KeyIcon,
        href: "/settings/permissions",
        permission: "PERMISSION_MANAGE",
      },
    ],
  },
];
```

### Navigation Bar System

#### NavigationBar Component

```typescript
interface NavigationBarProps {
  showBreadcrumb?: boolean;
  className?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  showBreadcrumb,
  className,
}) => {
  // URL path display (right side)
  // User profile menu (left side)
  // Theme switcher
  // Notifications indicator
  // AI chat access
};
```

### Dashboard Components

#### DashboardLayout Component

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  navbar?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  navbar,
}) => {
  // Layout wrapper with sidebar and navbar
  // Responsive behavior
  // Theme-aware styling
};
```

#### ComponentShowcase Component

```typescript
interface ComponentShowcaseProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const ComponentShowcase: React.FC<ComponentShowcaseProps> = ({
  title,
  description,
  children,
}) => {
  // Wrapper for displaying component examples
  // Theme-responsive styling
  // Code preview capabilities
};
```

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  name: string;
  displayName: string;
  type: "light" | "dark";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    base100: string;
    base200: string;
    base300: string;
    baseContent: string;
    info: string;
    success: string;
    warning: string;
    error: string;
  };
  radius: {
    selector: string;
    field: string;
    box: string;
  };
  effects: {
    depth: number;
    noise: number;
  };
}
```

### Sidebar State

```typescript
interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  variant: "sidebar" | "floating" | "inset";
  collapsible: "offcanvas" | "icon" | "none";
}
```

### User Interface State

```typescript
interface UIState {
  theme: ThemeConfig;
  sidebar: SidebarState;
  notifications: {
    count: number;
    items: NotificationItem[];
  };
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
}
```

## Error Handling

### Theme Loading Errors

- Fallback to default theme if custom theme fails to load
- Error boundaries around theme-dependent components
- Graceful degradation for unsupported theme features

### Component Integration Errors

- Validation for shadcn/ui and DaisyUI component compatibility
- Error handling for missing theme variables
- Fallback styling for component rendering failures

### Responsive Design Errors

- Breakpoint-specific error handling
- Mobile-first approach with progressive enhancement
- Graceful degradation for unsupported screen sizes

## Testing Strategy

### Unit Testing

- Component rendering tests with different themes
- Theme switching functionality tests
- Sidebar state management tests
- Navigation component tests

### Integration Testing

- DaisyUI and shadcn/ui component integration tests
- Theme consistency across component libraries
- Responsive behavior testing
- Accessibility compliance testing

### Visual Regression Testing

- Theme switching visual consistency
- Component appearance across different themes
- Responsive layout testing
- Cross-browser compatibility testing

### Performance Testing

- Theme switching performance
- Component rendering performance
- Bundle size optimization
- Lazy loading effectiveness

## Migration Strategy

### Migrating Existing Pages

#### Current Frontend Structure Analysis

The existing frontend (old-frontend/) contains:

- Equipment management pages
- PSV calibration and tracking
- Corrosion monitoring
- Crane management
- Daily reports
- Analytics and RBI calculations

#### Migration Approach

1. **Component-by-Component Migration**: Migrate existing components to new structure while maintaining functionality
2. **API Integration Preservation**: Keep existing API calls and data structures intact
3. **Feature Parity**: Ensure all existing features are available in the new design
4. **Gradual Rollout**: Implement new pages alongside old ones for testing

#### Page Migration Mapping

```typescript
// Old structure -> New structure mapping
const migrationMap = {
  // Equipment pages
  'old-frontend/src/app/equipment/page.tsx' -> 'frontend/app/(dashboard)/equipment/page.tsx',
  'old-frontend/src/app/equipment/psv/' -> 'frontend/app/(dashboard)/equipment/psv/',

  // Inspection pages
  'old-frontend/src/app/inspections/' -> 'frontend/app/(dashboard)/inspections/',
  'old-frontend/src/app/daily-reports/' -> 'frontend/app/(dashboard)/inspections/daily-reports/',

  // Analytics pages
  'old-frontend/src/app/analytics/' -> 'frontend/app/(dashboard)/analytics/',
  'old-frontend/src/app/rbi/' -> 'frontend/app/(dashboard)/analytics/rbi/',

  // Settings pages
  'old-frontend/src/app/settings/' -> 'frontend/app/(dashboard)/settings/',
};
```

#### Component Reusability Strategy

1. **Extract Business Logic**: Separate business logic from UI components
2. **Create Adapters**: Build adapter components to bridge old and new component APIs
3. **Maintain Data Structures**: Keep existing TypeScript interfaces and API contracts
4. **Progressive Enhancement**: Enhance existing components with new theming capabilities

## Implementation Approach

### Phase 1: Foundation Setup

1. Initialize Next.js 15 project with TypeScript
2. Configure Tailwind CSS 4 and DaisyUI 5
3. Set up custom theme definitions
4. Implement basic theme management system

### Phase 2: Component Integration

1. Install and configure shadcn/ui
2. Create theme-aware component wrappers
3. Implement sidebar with shadcn/ui
4. Develop navigation bar with DaisyUI

### Phase 3: Dashboard Development

1. Create dashboard layout structure
2. Implement component showcase sections
3. Add theme testing capabilities
4. Integrate responsive design patterns

### Phase 4: Advanced Features

1. Add Persian/Jalali calendar support
2. Implement user profile management
3. Add notifications system
4. Integrate AI chat functionality

### Phase 5: Optimization and Testing

1. Performance optimization
2. Accessibility improvements
3. Cross-browser testing
4. Mobile responsiveness validation

## Design Decisions and Rationales

### DaisyUI as Primary Component Library

- **Rationale**: Provides comprehensive component set with excellent theming support
- **Benefits**: Consistent design language, built-in accessibility, extensive customization options
- **Trade-offs**: Learning curve for team, potential bundle size considerations

### shadcn/ui for Advanced Components

- **Rationale**: Offers sophisticated components like collapsible sidebar that complement DaisyUI
- **Benefits**: High-quality components, excellent TypeScript support, customizable
- **Trade-offs**: Additional complexity in theme integration, potential style conflicts

### Custom Theme Implementation

- **Rationale**: Specific design requirements for "bouncyagain" and "somuchflame" themes
- **Benefits**: Brand consistency, unique visual identity, complete control over appearance
- **Trade-offs**: Maintenance overhead, potential compatibility issues with updates

### Next.js 15 App Router

- **Rationale**: Latest Next.js features, improved performance, better developer experience
- **Benefits**: Server components, improved routing, better SEO, enhanced performance
- **Trade-offs**: Learning curve, potential migration challenges from older versions

This design provides a solid foundation for building a modern, theme-aware frontend that seamlessly integrates DaisyUI and shadcn/ui while maintaining excellent user experience and developer productivity.

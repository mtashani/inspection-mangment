# Design Document

## Overview

This design outlines the implementation of a comprehensive navigation system that combines shadcn/ui components with daisyUI theming. The system will feature a top navigation bar, collapsible sidebar, and various interactive elements that seamlessly adapt to theme changes. The architecture will ensure that all components follow daisyUI's design tokens while leveraging shadcn/ui's component patterns.

## Architecture

### Component Hierarchy

```
App Layout
├── Navigation Bar (Top)
│   ├── Logo/Brand
│   └── Right Section
│       ├── Theme Switcher
│       ├── Notifications
│       ├── AI Chat
│       └── User Profile
├── Sidebar (Left)
│   ├── Collapse Toggle
│   ├── Navigation Items
│   └── User Info (Bottom)
└── Main Content Area
    └── Page Content
```

### Technology Integration

- **shadcn/ui**: Component structure and behavior patterns
- **daisyUI**: Theming system and design tokens
- **Next.js 15**: App router for navigation
- **Tailwind CSS**: Utility classes and responsive design
- **React 19**: Component state management

## Components and Interfaces

### 1. Navigation Bar Component

**File**: `src/components/navigation/navbar.tsx`

```typescript
interface NavbarProps {
  onSidebarToggle: () => void;
  isSidebarCollapsed: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
}
```

**Design Specifications**:
- Height: 64px (4rem)
- Background: `bg-base-200`
- Border: `border-b border-base-300`
- Padding: `px-4 lg:px-6`
- Shadow: `shadow-sm`

### 2. Sidebar Component

**File**: `src/components/navigation/sidebar.tsx`

```typescript
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: number;
  children?: NavigationItem[];
}
```

**Design Specifications**:
- Width: 280px (expanded), 64px (collapsed)
- Background: `bg-base-100`
- Border: `border-r border-base-300`
- Transition: `transition-all duration-300 ease-in-out`

### 3. Theme Switcher Component

**File**: `src/components/navigation/theme-switcher.tsx`

```typescript
interface Theme {
  id: string;
  name: string;
  displayName: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface ThemeSwitcherProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}
```

### 4. Notification Panel Component

**File**: `src/components/navigation/notifications.tsx`

```typescript
interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}
```

### 5. AI Chat Component

**File**: `src/components/navigation/ai-chat.tsx`

```typescript
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}
```

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  id: string;
  name: string;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    base100: string;
    base200: string;
    base300: string;
    baseContent: string;
  };
  radius: {
    selector: string;
    field: string;
    box: string;
  };
  border: string;
}
```

### Navigation State

```typescript
interface NavigationState {
  sidebarCollapsed: boolean;
  currentTheme: string;
  notifications: Notification[];
  chatOpen: boolean;
  chatMessages: ChatMessage[];
}
```

## Error Handling

### Theme Loading Errors
- Fallback to default theme if custom theme fails to load
- Display error toast notification
- Log error details for debugging

### Navigation Errors
- Handle invalid routes gracefully
- Redirect to appropriate fallback pages
- Maintain navigation state consistency

### Component Errors
- Use React Error Boundaries for component failures
- Provide fallback UI for broken components
- Log errors for monitoring

## Testing Strategy

### Unit Tests
- Component rendering with different props
- Theme switching functionality
- Navigation state management
- Event handlers and callbacks

### Integration Tests
- Theme persistence across page reloads
- Navigation routing integration
- Component interaction flows
- Responsive behavior testing

### Visual Tests
- Theme consistency across components
- Animation and transition smoothness
- Responsive layout verification
- Accessibility compliance

## Implementation Details

### shadcn/ui Integration with daisyUI

**Strategy**: Override shadcn/ui CSS variables with daisyUI theme variables

```css
/* shadcn/ui to daisyUI mapping */
:root {
  --background: oklch(var(--b1));
  --foreground: oklch(var(--bc));
  --primary: oklch(var(--p));
  --primary-foreground: oklch(var(--pc));
  --secondary: oklch(var(--s));
  --secondary-foreground: oklch(var(--sc));
  --accent: oklch(var(--a));
  --accent-foreground: oklch(var(--ac));
  --destructive: oklch(var(--er));
  --destructive-foreground: oklch(var(--erc));
  --muted: oklch(var(--b2));
  --muted-foreground: oklch(var(--bc) / 0.6);
  --card: oklch(var(--b1));
  --card-foreground: oklch(var(--bc));
  --popover: oklch(var(--b1));
  --popover-foreground: oklch(var(--bc));
  --border: oklch(var(--b3));
  --input: oklch(var(--b3));
  --ring: oklch(var(--p));
  --radius: var(--radius-field);
}
```

### Responsive Design Breakpoints

- **Mobile**: < 768px (sidebar overlay)
- **Tablet**: 768px - 1024px (sidebar auto-collapse)
- **Desktop**: > 1024px (sidebar expanded by default)

### Animation Specifications

```css
/* Sidebar transitions */
.sidebar-transition {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dropdown animations */
.dropdown-enter {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms, transform 200ms;
}
```

### Theme Persistence

```typescript
// Theme management utility
class ThemeManager {
  private static STORAGE_KEY = 'app-theme';
  
  static saveTheme(themeId: string): void {
    localStorage.setItem(this.STORAGE_KEY, themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  }
  
  static loadTheme(): string {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved || 'deepape';
  }
  
  static applyTheme(themeId: string): void {
    document.documentElement.setAttribute('data-theme', themeId);
  }
}
```

### Accessibility Considerations

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus order and visible focus indicators
- **Color Contrast**: Ensure WCAG AA compliance across all themes
- **Motion Preferences**: Respect `prefers-reduced-motion` setting

### Performance Optimizations

- **Lazy Loading**: Load chat and notification components on demand
- **Memoization**: Use React.memo for expensive components
- **Virtual Scrolling**: For large notification lists
- **Theme Caching**: Cache theme configurations in memory
- **Bundle Splitting**: Separate navigation components into their own chunk
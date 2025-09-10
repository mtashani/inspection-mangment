# Enhanced Sidebar Components

This directory contains the modern sidebar component built with shadcn/ui and adapted to the Enhanced Theme System.

## Components

### InspectionSidebar07 (Main Component)
The primary sidebar component designed for the Inspection Management System, based on the shadcn/ui sidebar-07 pattern. This is now the **only sidebar component** used throughout the application.

**Features:**
- ✅ Enhanced Theme System integration with CSS variables
- ✅ Collapsible navigation with smooth animations
- ✅ Integrated search functionality with keyboard shortcuts
- ✅ User profile dropdown with authentication
- ✅ Theme switcher integration
- ✅ Badge support for notifications and counts
- ✅ Responsive design with mobile support
- ✅ Keyboard shortcuts (⌘K for search, ⌘B for toggle)
- ✅ Breadcrumb navigation in header
- ✅ Quick access section for common tasks
- ✅ Built-in SidebarProvider and SidebarInset

**Usage:**
```tsx
import { InspectionSidebar07 } from "@/components/layout/sidebar/inspection-sidebar-07"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <InspectionSidebar07>
      {children}
    </InspectionSidebar07>
  )
}
```

## Migration Complete ✅

All legacy sidebar components have been removed:
- ❌ `design-sidebar.tsx` - Removed
- ❌ `enhanced-sidebar.tsx` - Removed  
- ❌ `modern-sidebar.tsx` - Removed
- ❌ `mobile-sidebar.tsx` - Removed
- ❌ `sidebar.tsx` - Removed
- ❌ `enhanced-sidebar-07.tsx` - Removed
- ❌ Navigation components - Removed
- ❌ `sidebar-context.tsx` - Removed (uses shadcn/ui context now)
- ❌ `navbar.tsx` - Removed (integrated into sidebar)

The application now uses a single, modern sidebar component that handles all layout needs.

## Theme System Integration

All sidebar components follow the Enhanced Theme System guidelines:

### CSS Variables Used
- `--color-base-100` - Primary background
- `--color-base-200` - Secondary background (hover states)
- `--color-base-300` - Tertiary background (borders)
- `--color-base-content` - Primary text color
- `--color-primary` - Primary accent color
- `--color-primary-content` - Primary accent text
- `--color-success` - Success state color
- `--color-warning` - Warning state color
- `--color-error` - Error state color
- `--color-info` - Info state color
- `--radius-box` - Large component radius (cards, modals)
- `--radius-field` - Form element radius (buttons, inputs)
- `--radius-selector` - Small element radius (badges, avatars)
- `--border` - Standard border style

### Component Patterns
- **Cards**: Use `rounded-[var(--radius-box)]`
- **Buttons**: Use `rounded-[var(--radius-field)]`
- **Badges/Avatars**: Use `rounded-[var(--radius-selector)]`
- **Hover States**: Use `hover:bg-[var(--color-base-200)]`
- **Active States**: Use `bg-[var(--color-primary)] text-[var(--color-primary-content)]`

## Navigation Structure

### Main Navigation
Organized by functional areas:
- **Dashboard** - Overview and analytics
- **Inspections** - Inspection management and templates
- **Equipment** - Asset management and tracking
- **Risk Assessment** - RBI calculations and analysis
- **Personnel** - Inspector and staff management

### Quick Access
Common tasks and shortcuts:
- Safety Protocols
- Daily Reports
- Analytics
- System Settings

## Responsive Behavior

- **Desktop**: Full sidebar with collapsible functionality
- **Tablet**: Collapsible sidebar with icon-only mode
- **Mobile**: Overlay sidebar with sheet component

## Keyboard Shortcuts

- `⌘K` / `Ctrl+K` - Open search
- `⌘B` / `Ctrl+B` - Toggle sidebar
- `⇧⌘P` - User profile
- `⌘S` - Settings
- `⇧⌘Q` - Sign out

## Accessibility

- Full keyboard navigation support
- ARIA labels and descriptions
- Screen reader friendly
- High contrast support
- Focus indicators

## Demo Pages

- `/demo/inspection-sidebar` - Inspection Management System sidebar
- `/demo/sidebar-07` - General purpose sidebar

## Dependencies

- `@radix-ui/react-*` - Primitive components
- `lucide-react` - Icons
- `class-variance-authority` - Variant management
- Custom hooks: `use-mobile`, `use-navigation-search`
- Context providers: `auth-context`, `theme-context`

## Migration from Legacy Sidebar

To migrate from the existing sidebar components:

1. Replace imports:
```tsx
// Old
import { DesignSidebar } from "@/components/layout/sidebar/design-sidebar"

// New
import { InspectionSidebar07 } from "@/components/layout/sidebar/inspection-sidebar-07"
```

2. Update layout structure:
```tsx
// Old
<SidebarProvider>
  <DesignSidebar />
  <main>{children}</main>
</SidebarProvider>

// New
<InspectionSidebar07>
  {children}
</InspectionSidebar07>
```

3. The new sidebar includes the SidebarProvider and SidebarInset internally, so no additional wrapper is needed.

## Customization

### Adding New Navigation Items
Edit the `inspectionData.navMain` array in the component:

```tsx
{
  title: "New Section",
  url: "/new-section",
  icon: NewIcon,
  badge: "2", // Optional
  items: [
    {
      title: "Sub Item",
      url: "/new-section/sub",
      description: "Description text"
    }
  ]
}
```

### Adding Quick Access Items
Edit the `inspectionData.quickAccess` array:

```tsx
{
  name: "New Quick Action",
  url: "/quick-action",
  icon: ActionIcon,
  color: "primary", // success, warning, error, info, secondary
  description: "Action description"
}
```

### Theme Customization
All colors and styling use CSS variables, so themes can be changed globally through the Enhanced Theme System without modifying component code.
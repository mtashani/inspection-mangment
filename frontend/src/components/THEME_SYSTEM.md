# Simple shadcn/ui Theme System

This project uses a simplified theme system based on `next-themes` and standard shadcn/ui components.

## Components

### ThemeProvider (`theme-provider.tsx`)
- Wraps the application to provide theme context
- Handles theme persistence and system preference detection
- Should be added to the root layout

### ModeToggle (`mode-toggle.tsx`)
- Dropdown button for switching between light/dark/system themes
- Uses animated sun/moon icons
- Can be placed in navigation or anywhere in the UI

## Setup

1. **Install Dependencies**
   ```bash
   npm install next-themes
   ```

2. **Add ThemeProvider to Layout**
   ```tsx
   import { ThemeProvider } from "@/components/theme-provider"
   
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
   ```

3. **Add ModeToggle to Navigation**
   ```tsx
   import { ModeToggle } from "@/components/mode-toggle"
   
   export function Navigation() {
     return (
       <nav>
         {/* Other navigation items */}
         <ModeToggle />
       </nav>
     )
   }
   ```

## CSS Variables

The theme system uses standard shadcn/ui CSS variables defined in `globals.css`:

### Light Theme
- `--background`: Main background color
- `--foreground`: Main text color
- `--primary`: Primary brand color
- `--secondary`: Secondary color
- And more...

### Dark Theme
- Same variables with dark-appropriate values
- Applied via `.dark` class selector

## Usage

### Using the Theme Hook
```tsx
import { useTheme } from "next-themes"

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>
        Switch to Dark
      </button>
    </div>
  )
}
```

### Theme-Aware Styling
Components automatically adapt to theme changes through CSS variables:

```tsx
// This button will automatically use the correct colors
<Button className="bg-primary text-primary-foreground">
  Themed Button
</Button>
```

## Migration from Complex Theme System

This simplified system replaces the previous complex theme system that included:
- Multiple color schemes (blue, green, purple, etc.)
- RTL support
- Complex theme context
- Enhanced theme switcher

The new system focuses on:
- Simple light/dark/system modes
- Standard shadcn/ui patterns
- Better performance
- Easier maintenance

## Files Removed

The following files were removed during the migration:
- `contexts/theme-context.tsx`
- `components/theme-switcher.tsx`
- `components/ui/theme-switcher.tsx`
- `components/ui/rtl-wrapper.tsx`
- `hooks/use-optimized-theme.ts`
- `/design-system/` directory and contents

## Demo Pages

- `/theme-demo-simple` - Simple demo page showing theme switching with shadcn/ui components
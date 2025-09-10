# UI Style Guide

## Design System Implementation

This document outlines the enhanced design system with multiple color schemes and theming capabilities.

### Color Schemes Available

1. **Blue** - Professional and trustworthy (Default)
2. **Green** - Natural and growth-oriented
3. **Purple** - Creative and innovative
4. **Orange** - Energetic and friendly
5. **Red** - Bold and attention-grabbing
6. **Teal** - Modern and sophisticated
7. **Indigo** - Deep and professional

### Theme Modes

- **Light Mode** - Clean and bright interface
- **Dark Mode** - Reduced eye strain for low-light environments

### Usage

#### Theme Context
```tsx
import { useTheme } from '@/contexts/theme-context'

function MyComponent() {
  const { theme, setColorScheme, setMode, toggleMode } = useTheme()
  
  return (
    <div>
      <button onClick={() => setColorScheme('green')}>
        Switch to Green
      </button>
      <button onClick={toggleMode}>
        Toggle Dark/Light
      </button>
    </div>
  )
}
```

#### Theme Switcher Component
```tsx
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

// Compact version (just mode toggle)
<ThemeSwitcher compact={true} />

// Full version (mode + color schemes)
<ThemeSwitcher showColorSchemes={true} />
```

#### CSS Custom Properties
The system generates CSS custom properties that can be used in components:

```css
.my-component {
  background-color: var(--color-primary-500);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}
```

#### RTL Support
```tsx
import { rtlUtils } from '@/config/design-system'

const textAlign = rtlUtils.getTextAlign(theme.direction)
const borderSide = rtlUtils.getBorderSide(theme.direction)
```

### Implementation Status

✅ **Completed:**
- Multiple color scheme definitions
- Theme context and provider
- Theme switcher component
- CSS custom properties generation
- RTL utility functions
- Theme persistence in localStorage
- Smooth theme transitions

🔄 **In Progress:**
- Component library updates to use new tokens
- Enhanced form components
- Advanced data table theming

📋 **Planned:**
- Storybook integration
- Visual regression testing
- Accessibility testing
- Performance optimization

### Best Practices

1. **Always use CSS custom properties** for colors instead of hardcoded values
2. **Test all themes** when creating new components
3. **Consider RTL layout** when positioning elements
4. **Use semantic color names** (primary, secondary, success, etc.) instead of specific colors
5. **Maintain contrast ratios** for accessibility in all themes

### Migration Guide

When updating existing components:

1. Replace hardcoded colors with CSS custom properties
2. Use the `customClasses` object for common patterns
3. Test component in all color schemes and modes
4. Ensure RTL compatibility where applicable

Example migration:
```tsx
// Before
<div className="bg-blue-600 text-white">

// After  
<div className="bg-[var(--color-primary-600)] text-white">
```
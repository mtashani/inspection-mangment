/**
 * Theme Showcase Stories
 * Demonstrates the Enhanced Theme System across all components
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card'
import { Input } from '../input'
import { Alert, AlertDescription, AlertTitle } from '../alert'
import { Badge } from '../badge'

const meta: Meta = {
  title: 'Theme System/Showcase',
  parameters: {
    docs: {
      description: {
        component: 'Comprehensive showcase of the Enhanced Theme System across all components.',
      },
    },
  },
}

export default meta
type Story = StoryObj

/**
 * Complete Component Showcase
 * Shows all components with current theme and variant applied
 */
export const CompleteShowcase: Story = {
  render: () => (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-[var(--color-base-content)]">
          Enhanced Theme System Showcase
        </h2>
        <p className="text-[var(--color-base-content)] opacity-70 mb-6">
          All components automatically adapt to the selected theme and variant.
          Use the toolbar controls to switch themes and variants.
        </p>
      </div>
      
      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>
            Buttons use --color-primary, --radius-field, and --size-field variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="destructive">Destructive Button</Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Card Example</CardTitle>
            <CardDescription>
              Cards use --radius-box and --depth variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-base-content)] opacity-70">
              This card demonstrates how the theme system affects layout components.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-[var(--color-primary)]">Themed Card</CardTitle>
            <CardDescription>
              With primary color title
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="default">Default Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
              <Badge variant="outline">Outline Badge</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
            <CardDescription>
              With form elements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input placeholder="Input field example" />
              <Button className="w-full">Submit</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Alerts Section */}
      <div className="space-y-4">
        <Alert>
          <AlertTitle>Default Alert</AlertTitle>
          <AlertDescription>
            Alerts use --radius-box and semantic color variables.
          </AlertDescription>
        </Alert>
        
        <Alert variant="destructive">
          <AlertTitle>Error Alert</AlertTitle>
          <AlertDescription>
            This alert uses --color-error and --color-error-content variables.
          </AlertDescription>
        </Alert>
      </div>
      
      {/* Form Elements Section */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>
            Form elements use --radius-field and --size-field variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Input placeholder="Regular input" />
              <Input placeholder="Another input" />
              <Input type="email" placeholder="Email input" />
            </div>
            <div className="space-y-3">
              <Input type="password" placeholder="Password input" />
              <Input type="number" placeholder="Number input" />
              <Input disabled placeholder="Disabled input" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Color Palette Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Theme Colors</CardTitle>
          <CardDescription>
            Visual representation of the current theme's color palette
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div 
                className="w-full h-12 rounded-[var(--radius-field)]"
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
              <p className="text-xs font-medium">Primary</p>
            </div>
            <div className="space-y-2">
              <div 
                className="w-full h-12 rounded-[var(--radius-field)]"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              />
              <p className="text-xs font-medium">Secondary</p>
            </div>
            <div className="space-y-2">
              <div 
                className="w-full h-12 rounded-[var(--radius-field)]"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
              <p className="text-xs font-medium">Accent</p>
            </div>
            <div className="space-y-2">
              <div 
                className="w-full h-12 rounded-[var(--radius-field)]"
                style={{ backgroundColor: 'var(--color-success)' }}
              />
              <p className="text-xs font-medium">Success</p>
            </div>
            <div className="space-y-2">
              <div 
                className="w-full h-12 rounded-[var(--radius-field)]"
                style={{ backgroundColor: 'var(--color-warning)' }}
              />
              <p className="text-xs font-medium">Warning</p>
            </div>
            <div className="space-y-2">
              <div 
                className="w-full h-12 rounded-[var(--radius-field)]"
                style={{ backgroundColor: 'var(--color-error)' }}
              />
              <p className="text-xs font-medium">Error</p>
            </div>
            <div className="space-y-2">
              <div 
                className="w-full h-12 rounded-[var(--radius-field)]"
                style={{ backgroundColor: 'var(--color-info)' }}
              />
              <p className="text-xs font-medium">Info</p>
            </div>
            <div className="space-y-2">
              <div 
                className="w-full h-12 rounded-[var(--radius-field)]"
                style={{ backgroundColor: 'var(--color-neutral)' }}
              />
              <p className="text-xs font-medium">Neutral</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* CSS Variables Display */}
      <Card>
        <CardHeader>
          <CardTitle>CSS Variables</CardTitle>
          <CardDescription>
            Current values of key CSS variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <h4 className="font-semibold mb-2">Radius Variables</h4>
              <div className="space-y-1">
                <div>--radius-box: <span className="text-[var(--color-primary)]">var(--radius-box)</span></div>
                <div>--radius-field: <span className="text-[var(--color-primary)]">var(--radius-field)</span></div>
                <div>--radius-selector: <span className="text-[var(--color-primary)]">var(--radius-selector)</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Size Variables</h4>
              <div className="space-y-1">
                <div>--size-field: <span className="text-[var(--color-primary)]">var(--size-field)</span></div>
                <div>--size-selector: <span className="text-[var(--color-primary)]">var(--size-selector)</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Effect Variables</h4>
              <div className="space-y-1">
                <div>--border: <span className="text-[var(--color-primary)]">var(--border)</span></div>
                <div>--depth: <span className="text-[var(--color-primary)]">var(--depth)</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete showcase of all components with the current theme and variant applied. Use the toolbar controls to see how different themes and variants affect the appearance.',
      },
    },
  },
}

/**
 * Theme Comparison
 * Shows the same components with different themes side by side
 */
export const ThemeComparison: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Theme Comparison</h2>
        <p className="text-sm opacity-70 mb-6">
          This story shows how the same components look across different themes.
          Switch themes using the toolbar to see the differences.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Component Set A</CardTitle>
            <CardDescription>Primary theme styling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
            </div>
            <Input placeholder="Input field" />
            <Alert>
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>This is an informational alert.</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Component Set B</CardTitle>
            <CardDescription>Same components, same theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <Input placeholder="Another input" />
            <Alert variant="destructive">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>This is a warning alert.</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Error</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compare how the same components look with different themes. Switch between themes using the toolbar to see the visual differences.',
      },
    },
  },
}

/**
 * Variant Showcase
 * Demonstrates how variants modify the base theme
 */
export const VariantShowcase: Story = {
  render: () => (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Variant Effects</h2>
        <p className="text-sm opacity-70 mb-6">
          This story shows how variants modify the appearance of components.
          Try different variants using the toolbar controls.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Radius Variants</CardTitle>
            <CardDescription>
              Rounded vs Sharp variants affect border radius
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Buttons</p>
              <div className="flex gap-2">
                <Button>Default</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Input</p>
              <Input placeholder="Input field" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Badges</p>
              <div className="flex gap-2">
                <Badge>Badge 1</Badge>
                <Badge variant="secondary">Badge 2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Size Variants</CardTitle>
            <CardDescription>
              Compact vs Spacious variants affect sizing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Different Sizes</p>
              <div className="flex gap-2 items-center">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Form Elements</p>
              <Input placeholder="Input sizing" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Effect Variants</CardTitle>
            <CardDescription>
              Minimal vs Rich variants affect shadows and borders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Card Depth</p>
              <div className="p-4 bg-[var(--color-base-200)] rounded-[var(--radius-box)]" style={{ boxShadow: 'var(--depth)' }}>
                This box shows the current depth effect
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Border Effects</p>
              <div className="p-4 rounded-[var(--radius-box)]" style={{ border: 'var(--border)' }}>
                This box shows the current border style
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Combined Effects</CardTitle>
            <CardDescription>
              How multiple variants work together
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>Combined Styling</AlertTitle>
              <AlertDescription>
                This alert shows the combined effect of the current theme and variant.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="default">Primary</Button>
              <Button variant="outline">Outline</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how different variants modify the base theme. Try switching between variants like Rounded/Sharp, Compact/Spacious, and Minimal/Rich to see the effects.',
      },
    },
  },
}
import type { Meta, StoryObj } from '@storybook/react'
import { ModernLoginPage } from '@/components/auth/modern-login-page'
import { EnhancedLoginForm } from '@/components/auth/enhanced-login-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const meta: Meta = {
  title: 'Authentication/Components',
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof meta>

export const LoginPage: Story = {
  render: () => <ModernLoginPage />,
  name: 'Complete Login Page',
}

export const LoginFormOnly: Story = {
  render: () => (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedLoginForm onSuccess={() => alert('Login successful!')} />
        </CardContent>
      </Card>
    </div>
  ),
  name: 'Login Form Component',
}

export const LoginFormStates: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Login Form States</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default State</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedLoginForm onSuccess={() => alert('Login successful!')} />
            </CardContent>
          </Card>

          {/* With Error State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">With Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  This shows how the form looks with validation errors
                </div>
                <EnhancedLoginForm onSuccess={() => alert('Login successful!')} />
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loading State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  This shows the form during authentication
                </div>
                <EnhancedLoginForm onSuccess={() => alert('Login successful!')} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Design System Integration */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Design System Integration</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Components Used</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <code>Button</code> - Primary action button</li>
                    <li>• <code>Input</code> - Form input fields</li>
                    <li>• <code>Label</code> - Field labels</li>
                    <li>• <code>Alert</code> - Error messages</li>
                    <li>• <code>Card</code> - Container components</li>
                    <li>• <code>VStack/HStack</code> - Layout components</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Design Tokens</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• <code>--primary</code> - Brand color</li>
                    <li>• <code>--destructive</code> - Error states</li>
                    <li>• <code>--muted-foreground</code> - Secondary text</li>
                    <li>• <code>--border</code> - Border colors</li>
                    <li>• <code>--card</code> - Background colors</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
  name: 'Form States & Integration',
}
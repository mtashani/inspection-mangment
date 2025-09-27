/**
 * Auth Debug Test Page
 * Debug authentication and session issues
 */

import AuthDebugComponent from '@/components/debug/auth-debug-component'

export default function AuthDebugPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Authentication Debug Tool</h1>
          <p className="text-muted-foreground">
            ابزار تشخیص مشکلات احراز هویت و session - Diagnose authentication and session issues
          </p>
        </div>
        
        <AuthDebugComponent />
      </div>
    </div>
  )
}
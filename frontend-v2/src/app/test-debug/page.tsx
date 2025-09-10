import { Metadata } from 'next'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ApiDebugComponent } from '@/components/debug/api-debug'
import { NotificationsDebug } from '@/components/debug/notifications-debug'

export const metadata: Metadata = {
  title: 'Debug Tools | Test Page',
  description: 'Debug tools for API connectivity and cache management',
}

export default function TestDebugPage() {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Debug Tools', current: true }
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🛠️ Debug Tools</h1>
          <p className="text-muted-foreground">
            Test API connectivity and manage cache for troubleshooting
          </p>
        </div>
        
        <ApiDebugComponent />
        
        <NotificationsDebug />
      </div>
    </DashboardLayout>
  )
}
import { Metadata } from 'next'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { URLStateTest } from '@/components/maintenance-events/url-state-test'

export const metadata: Metadata = {
  title: 'URL State Test | Maintenance Events',
  description: 'Test URL state management functionality',
}

export default function URLStateTestPage() {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Inspection Management', href: '/dashboard' },
        { label: 'Maintenance Events', href: '/maintenance-events' },
        { label: 'URL State Test', current: true }
      ]}
    >
      <URLStateTest />
    </DashboardLayout>
  )
}
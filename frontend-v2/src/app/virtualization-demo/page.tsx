import { VirtualizationDemo } from '@/components/maintenance-events/virtualization-demo'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function VirtualizationDemoPage() {
  return (
    <DashboardLayout
      breadcrumbs={[
        { label: 'Development', href: '/dev' },
        { label: 'Virtualization Demo', current: true }
      ]}
    >
      <VirtualizationDemo />
    </DashboardLayout>
  )
}

export const metadata = {
  title: 'Virtualization Demo - Inspection Management',
  description: 'Test and compare performance with and without virtualization for large datasets'
}
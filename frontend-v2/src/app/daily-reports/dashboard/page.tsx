import { Metadata } from 'next'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DailyReportsDashboardContainer } from '@/components/maintenance-events/daily-reports-dashboard-container'

export const metadata: Metadata = {
  title: 'Daily Reports Dashboard | Inspection Management System',
  description: 'Overview and analytics for daily reports across all inspections',
}

export default function DailyReportsDashboardPage() {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Inspection Management', href: '/dashboard' },
        { label: 'Daily Reports', href: '/daily-reports' },
        { label: 'Dashboard', current: true }
      ]}
    >
      <DailyReportsDashboardContainer />
    </DashboardLayout>
  )
}
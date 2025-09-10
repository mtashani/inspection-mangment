import { Metadata } from 'next'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { CreateDailyReportContainer } from '@/components/maintenance-events/create-daily-report-container'

export const metadata: Metadata = {
  title: 'Create Daily Report | Inspection Management System',
  description: 'Create a new daily report for an inspection',
}

interface CreateDailyReportPageProps {
  searchParams?: {
    inspectionId?: string
  }
}

export default function CreateDailyReportPage({ searchParams }: CreateDailyReportPageProps) {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Inspection Management', href: '/dashboard' },
        { label: 'Daily Reports', href: '/daily-reports' },
        { label: 'Create Report', current: true }
      ]}
    >
      <CreateDailyReportContainer 
        preselectedInspectionId={searchParams?.inspectionId ? parseInt(searchParams.inspectionId) : undefined}
      />
    </DashboardLayout>
  )
}
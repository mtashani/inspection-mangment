import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DailyReportEditContainer } from '@/components/maintenance-events/daily-report-edit-container'

interface DailyReportEditPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: DailyReportEditPageProps): Promise<Metadata> {
  return {
    title: `Edit Daily Report #${params.id} | Inspection Management System`,
    description: `Edit daily report #${params.id}`,
  }
}

export default function DailyReportEditPage({ params }: DailyReportEditPageProps) {
  const reportId = parseInt(params.id)
  
  if (isNaN(reportId)) {
    notFound()
  }

  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Inspection Management', href: '/dashboard' },
        { label: 'Daily Reports', href: '/daily-reports' },
        { label: `Report #${reportId}`, href: `/daily-reports/${reportId}` },
        { label: 'Edit', current: true }
      ]}
    >
      <DailyReportEditContainer reportId={reportId} />
    </DashboardLayout>
  )
}
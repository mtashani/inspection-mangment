import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DailyReportViewContainer } from '@/components/maintenance-events/daily-report-view-container'

interface DailyReportPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: DailyReportPageProps): Promise<Metadata> {
  return {
    title: `Daily Report #${params.id} | Inspection Management System`,
    description: `View details for daily report #${params.id}`,
  }
}

export default function DailyReportPage({ params }: DailyReportPageProps) {
  const reportId = parseInt(params.id)
  
  if (isNaN(reportId)) {
    notFound()
  }

  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Inspection Management', href: '/dashboard' },
        { label: 'Daily Reports', href: '/daily-reports' },
        { label: `Report #${reportId}`, current: true }
      ]}
    >
      <DailyReportViewContainer reportId={reportId} />
    </DashboardLayout>
  )
}
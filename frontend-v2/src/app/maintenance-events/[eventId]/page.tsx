import { Metadata } from 'next'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { EventDetailsContainer } from '@/components/maintenance-events/event-details-container'

export const metadata: Metadata = {
  title: 'Event Details | Maintenance Events',
  description: 'View maintenance event details, inspections, and daily reports',
}

interface EventDetailsPageProps {
  params: Promise<{ eventId: string }>
  searchParams?: Promise<{
    tab?: string
    search?: string
  }>
}

export default async function EventDetailsPage({ params, searchParams }: EventDetailsPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Inspection Management', href: '/dashboard' },
        { label: 'Maintenance Events', href: '/maintenance-events' },
        { label: 'Event Details', current: true }
      ]}
    >
      <EventDetailsContainer 
        eventId={resolvedParams.eventId} 
        initialTab={resolvedSearchParams?.tab}
        initialSearch={resolvedSearchParams?.search}
      />
    </DashboardLayout>
  )
}
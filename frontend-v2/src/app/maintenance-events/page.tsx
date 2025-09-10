import { Metadata } from 'next'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { EventsOverviewContainer } from '@/components/maintenance-events/events-overview-container'
import { EventsFilters } from '@/types/maintenance-events'

export const metadata: Metadata = {
  title: 'Maintenance Events | Inspection Management System',
  description: 'View and manage maintenance events, inspections, and daily reports',
}

interface MaintenanceEventsOverviewPageProps {
  searchParams?: {
    search?: string
    status?: string
    eventType?: string
    dateFrom?: string
    dateTo?: string
  }
}

export default function MaintenanceEventsOverviewPage({ 
  searchParams 
}: MaintenanceEventsOverviewPageProps) {
  // Convert search params to filters
  const initialFilters: EventsFilters = {}
  
  if (searchParams?.search) {
    initialFilters.search = searchParams.search
  }
  
  if (searchParams?.status) {
    initialFilters.status = searchParams.status as string
  }
  
  if (searchParams?.eventType) {
    initialFilters.eventType = searchParams.eventType as string
  }
  
  if (searchParams?.dateFrom) {
    initialFilters.dateFrom = searchParams.dateFrom
  }
  
  if (searchParams?.dateTo) {
    initialFilters.dateTo = searchParams.dateTo
  }

  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Inspection Management', href: '/dashboard' },
        { label: 'Maintenance Events', current: true }
      ]}
    >
      <EventsOverviewContainer initialFilters={initialFilters} />
    </DashboardLayout>
  )
}
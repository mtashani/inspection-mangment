import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { InspectorPayrollDetails } from '@/components/admin/payroll/inspector-payroll-details'

interface InspectorPayrollPageProps {
  params: {
    inspectorId: string
  }
}

export async function generateMetadata({ params }: InspectorPayrollPageProps): Promise<Metadata> {
  return {
    title: `Inspector Payroll | Admin Panel`,
    description: `Payroll details for inspector ${params.inspectorId}`,
  }
}

export default function InspectorPayrollPage({ params }: InspectorPayrollPageProps) {
  const inspectorId = parseInt(params.inspectorId)
  
  if (isNaN(inspectorId)) {
    notFound()
  }

  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin Panel', href: '/admin' },
        { label: 'Payroll Management', href: '/admin/payroll' },
        { label: `Inspector ${inspectorId}`, current: true }
      ]}
    >
      <div className="container mx-auto px-4 py-8">
        <InspectorPayrollDetails inspectorId={inspectorId} />
      </div>
    </DashboardLayout>
  )
}
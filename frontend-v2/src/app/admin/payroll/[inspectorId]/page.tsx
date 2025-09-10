import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { InspectorPayrollDetails } from '@/components/admin/payroll/inspector-payroll-details'
import { AdminPermissionGuard } from '@/components/admin/shared/admin-permission-guard'

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
    <AdminPermissionGuard requiredPermission="canViewPayroll">
      <div className="container mx-auto px-4 py-8">
        <InspectorPayrollDetails inspectorId={inspectorId} />
      </div>
    </AdminPermissionGuard>
  )
}
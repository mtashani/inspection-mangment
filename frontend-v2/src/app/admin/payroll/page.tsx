import { Metadata } from 'next'
import { PayrollDashboard } from '@/components/admin/payroll/payroll-dashboard'
import { AdminPermissionGuard } from '@/components/admin/shared/admin-permission-guard'

export const metadata: Metadata = {
  title: 'Payroll Management | Admin Panel',
  description: 'Manage inspector payroll, generate reports, and track compensation',
}

export default function PayrollPage() {
  return (
    <AdminPermissionGuard requiredPermission="canViewPayroll">
      <div className="container mx-auto px-4 py-8">
        <PayrollDashboard />
      </div>
    </AdminPermissionGuard>
  )
}
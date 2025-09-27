import { Metadata } from 'next'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PayrollManagement } from '@/components/admin/payroll/payroll-management'

export const metadata: Metadata = {
  title: 'Payroll Management | Admin Panel',
  description: 'Manage inspector payroll, generate reports, and track compensation',
}

export default function PayrollPage() {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin Panel', href: '/admin' },
        { label: 'Payroll Management', current: true }
      ]}
    >
      <div className="container mx-auto px-4 py-8">
        <PayrollManagement />
      </div>
    </DashboardLayout>
  )
}
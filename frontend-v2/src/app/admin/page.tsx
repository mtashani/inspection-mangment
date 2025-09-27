import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AdminDashboard } from '@/components/admin/dashboard/admin-dashboard';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Administrative dashboard for inspection management system',
};

export default function AdminPage() {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin Panel', current: true }
      ]}
    >
      <AdminDashboard />
    </DashboardLayout>
  );
}
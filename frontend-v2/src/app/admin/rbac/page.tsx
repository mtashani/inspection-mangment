import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EnhancedRBACManagement } from '@/components/admin/rbac/enhanced-rbac-management';

export default function RBACPage() {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin Panel', href: '/admin' },
        { label: 'RBAC Management', current: true }
      ]}
    >
      <div className="container mx-auto px-4 py-8">
        <EnhancedRBACManagement />
      </div>
    </DashboardLayout>
  );
}

export const metadata = {
  title: 'RBAC Management',
  description: 'Role-Based Access Control management system',
};
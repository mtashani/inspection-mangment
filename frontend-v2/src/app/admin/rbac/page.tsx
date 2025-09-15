import { RBACManagement } from '@/components/admin/rbac/rbac-management';

export default function RBACPage() {
  return <RBACManagement />;
}

export const metadata = {
  title: 'RBAC Management',
  description: 'Role-Based Access Control management system',
};
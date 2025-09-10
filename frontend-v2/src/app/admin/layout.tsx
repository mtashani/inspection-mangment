'use client';

import { AdminLayout } from '@/components/admin/shared/admin-layout';
import { AdminErrorBoundary } from '@/components/admin/shared/admin-error-boundary';
import { AdminPermissionGuard } from '@/components/admin/shared/admin-permission-guard';
import { useAdminBreadcrumbs } from '@/hooks/admin/use-admin-breadcrumbs';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbs = useAdminBreadcrumbs();

  return (
    <AdminErrorBoundary>
      <AdminPermissionGuard>
        <AdminLayout breadcrumbs={breadcrumbs}>
          {children}
        </AdminLayout>
      </AdminPermissionGuard>
    </AdminErrorBoundary>
  );
}
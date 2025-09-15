'use client';

import { ReactNode } from 'react';
import { AdminPermissionGuard } from '@/components/admin/shared/admin-permission-guard';
import { useAdminBreadcrumbs } from '@/hooks/admin/use-admin-breadcrumbs';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/shared/admin-sidebar';
import { AdminNavHeader } from '@/components/admin/shared/admin-nav-header';

// Create a layout component that provides admin-specific UI within the main layout structure
function AdminLayoutContent({ 
  children,
  breadcrumbs 
}: { 
  children: ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminNavHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbs = useAdminBreadcrumbs();

  return (
    <AdminPermissionGuard>
      <AdminLayoutContent breadcrumbs={breadcrumbs}>
        {children}
      </AdminLayoutContent>
    </AdminPermissionGuard>
  );
}
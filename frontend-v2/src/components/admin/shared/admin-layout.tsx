'use client';

import React from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminNavHeader } from './admin-nav-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export function AdminLayout({ children, breadcrumbs }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AdminNavHeader breadcrumbs={breadcrumbs} />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
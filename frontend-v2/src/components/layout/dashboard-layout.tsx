'use client';

import { ReactNode } from 'react';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { NavHeader } from '@/components/navigation/nav-header';

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
}

export function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <NavHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
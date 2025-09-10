'use client';

import * as React from 'react';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  Upload,
  BarChart3,
  Settings,
  Shield,
  ArrowLeft,
} from 'lucide-react';

import { AdminNavMain } from './admin-nav-main';
import { AdminNavProjects } from './admin-nav-projects';
import { AdminTeamSwitcher } from './admin-team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Admin navigation data
const adminData = {
  user: {
    name: 'Admin User',
    email: 'admin@inspection.com',
    avatar: '/avatars/admin.jpg',
  },
  teams: [
    {
      name: 'Admin Panel',
      logo: Shield,
      plan: 'Administrative',
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: BarChart3,
      isActive: true,
    },
    {
      title: 'Inspectors',
      url: '/admin/inspectors',
      icon: Users,
      items: [
        {
          title: 'All Inspectors',
          url: '/admin/inspectors',
        },
        {
          title: 'Create Inspector',
          url: '/admin/inspectors/create',
        },
        {
          title: 'Specialties',
          url: '/admin/inspectors/specialties',
        },
      ],
    },
    {
      title: 'Attendance',
      url: '/admin/attendance',
      icon: Calendar,
      items: [
        {
          title: 'Overview',
          url: '/admin/attendance',
        },
        {
          title: 'Work Cycles',
          url: '/admin/attendance/cycles',
        },
        {
          title: 'Reports',
          url: '/admin/attendance/reports',
        },
      ],
    },
    {
      title: 'Templates',
      url: '/admin/templates',
      icon: FileText,
      items: [
        {
          title: 'All Templates',
          url: '/admin/templates',
        },
        {
          title: 'Create Template',
          url: '/admin/templates/create',
        },
        {
          title: 'Template Builder',
          url: '/admin/templates/builder',
        },
      ],
    },
    {
      title: 'Payroll',
      url: '/admin/payroll',
      icon: DollarSign,
      items: [
        {
          title: 'Dashboard',
          url: '/admin/payroll',
        },
        {
          title: 'Monthly Reports',
          url: '/admin/payroll/reports',
        },
        {
          title: 'Settings',
          url: '/admin/payroll/settings',
        },
      ],
    },
    {
      title: 'Bulk Operations',
      url: '/admin/bulk-operations',
      icon: Upload,
    },
    {
      title: 'Settings',
      url: '/admin/settings',
      icon: Settings,
    },
  ],
  projects: [
    {
      name: 'System Health',
      url: '/admin/system-health',
      icon: BarChart3,
    },
    {
      name: 'Audit Logs',
      url: '/admin/audit-logs',
      icon: FileText,
    },
    {
      name: 'Backup & Restore',
      url: '/admin/backup',
      icon: Upload,
    },
  ],
};

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AdminTeamSwitcher teams={adminData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <AdminNavMain items={adminData.navMain} />
        <AdminNavProjects projects={adminData.projects} />
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to App</span>
            </Link>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
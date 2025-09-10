'use client';

import * as React from 'react';
import {
  Frame,
  Shield,
  BarChart3,
  FileText,
  Wrench,
  Users,
  Calendar,
  AlertTriangle,
  Settings,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';

import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';

// This is sample data for the sidebar
const data = {
  user: {
    name: 'Admin User',
    email: 'admin@inspection.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Inspection Management',
      logo: Shield,
      plan: 'Professional',
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: BarChart3,
      isActive: true,
    },
    {
      title: 'Equipment',
      url: '#',
      icon: Settings,
      items: [
        {
          title: 'All Equipment',
          url: '/equipment',
        },
        {
          title: 'Add Equipment',
          url: '/equipment/add',
        },
        {
          title: 'Maintenance Schedule',
          url: '/equipment/maintenance',
        },
      ],
    },
    {
      title: 'Maintenance Events',
      url: '/maintenance-events',
      icon: Wrench,
      isActive: true,
    },
    {
      title: 'Daily Reports',
      url: '#',
      icon: FileText,
      items: [
        {
          title: 'Dashboard',
          url: '/daily-reports/dashboard',
        },
        {
          title: 'All Reports',
          url: '/daily-reports',
        },
        {
          title: 'Create Report',
          url: '/daily-reports/create',
        },
      ],
    },
    {
      title: 'Inspections',
      url: '#',
      icon: Shield,
      items: [
        {
          title: 'All Inspections',
          url: '/inspections',
        },
        {
          title: 'New Inspection',
          url: '/inspections/new',
        },
        {
          title: 'Pending Reviews',
          url: '/inspections/pending',
        },
      ],
    },
    {
      title: 'Reports',
      url: '#',
      icon: FileText,
      items: [
        {
          title: 'Inspection Reports',
          url: '/reports/inspections',
        },
        {
          title: 'Equipment Reports',
          url: '/reports/equipment',
        },
        {
          title: 'Compliance Reports',
          url: '/reports/compliance',
        },
      ],
    },
    {
      title: 'Inspectors',
      url: '#',
      icon: Users,
      items: [
        {
          title: 'All Inspectors',
          url: '/inspectors',
        },
        {
          title: 'Add Inspector',
          url: '/inspectors/add',
        },
        {
          title: 'Certifications',
          url: '/inspectors/certifications',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Recent Inspections',
      url: '/inspections/recent',
      icon: Frame,
    },
    {
      name: 'Overdue Items',
      url: '/overdue',
      icon: AlertTriangle,
    },
    {
      name: 'Calendar',
      url: '/calendar',
      icon: Calendar,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  // Update user data with actual auth data
  const sidebarData = {
    ...data,
    user: {
      name: user?.name || 'User',
      email: user?.email || 'user@inspection.com',
      avatar: '/avatars/shadcn.jpg',
    },
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavProjects projects={sidebarData.projects} />
      </SidebarContent>
      <SidebarFooter>
        {/* User navigation moved to header */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

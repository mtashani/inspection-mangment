'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useNavigation } from '@/hooks/use-navigation';
import { iconMap } from '@/lib/navigation-config';

interface NavProjectsProps {
  groupLabel?: string;
}

/**
 * Permission-aware projects navigation component
 * Shows quick access items based on user permissions
 */
export function NavProjectsPermissionAware({ groupLabel = 'Quick Access' }: NavProjectsProps) {
  const { projects, isLoading } = useNavigation();
  const pathname = usePathname();

  // Show loading state
  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  // Don't render if no projects are available
  if (projects.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map(project => {
          const Icon = project.icon ? iconMap[project.icon as keyof typeof iconMap] : null;
          const isActive = pathname === project.href;

          return (
            <SidebarMenuItem key={project.title}>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link href={project.href}>
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{project.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
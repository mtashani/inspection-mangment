'use client';

import * as React from 'react';
import { Shield } from 'lucide-react';

import { NavMainPermissionAware } from '@/components/navigation/nav-main-permission-aware';
import { NavProjectsPermissionAware } from '@/components/navigation/nav-projects-permission-aware';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/contexts/permission-context';

// Team data for the sidebar
const teams = [
  {
    name: 'Inspection Management',
    logo: Shield,
    plan: 'Professional',
  },
];

interface AppSidebarPermissionAwareProps extends React.ComponentProps<typeof Sidebar> {
  showQuickAccess?: boolean;
}

/**
 * Permission-aware application sidebar
 * Automatically filters navigation based on user permissions
 */
export function AppSidebarPermissionAware({ 
  showQuickAccess = true,
  ...props 
}: AppSidebarPermissionAwareProps) {
  const { user } = useAuth();
  const { isLoading: permissionsLoading } = usePermissions();

  // Update team data with actual user info
  const sidebarData = {
    teams: teams.map(team => ({
      ...team,
      // Could customize team info based on user role/department
    })),
    user: {
      name: user?.name || 'User',
      email: user?.email || 'user@inspection.com',
      avatar: user?.avatar || '/avatars/default.jpg',
    },
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      
      <SidebarContent>
        <NavMainPermissionAware />
        {showQuickAccess && <NavProjectsPermissionAware />}
        
        {/* Show loading indicator if permissions are still loading */}
        {permissionsLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 border-2 border-muted border-t-transparent rounded-full animate-spin" />
              <span>Loading permissions...</span>
            </div>
          </div>
        )}
      </SidebarContent>
      
      <SidebarFooter>
        {/* User navigation could be added here */}
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}

/**
 * Hook for getting sidebar state and user info
 */
export function useSidebarData() {
  const { user } = useAuth();
  const { permissions, roles, isLoading } = usePermissions();

  return {
    user: {
      name: user?.name || 'User',
      email: user?.email || 'user@inspection.com',
      avatar: user?.avatar || '/avatars/default.jpg',
      roles: roles,
      permissions: permissions,
    },
    isLoading,
    hasPermissions: permissions.length > 0,
    hasRoles: roles.length > 0,
  };
}
import { useMemo } from 'react';
import { usePermissions } from '@/contexts/permission-context';
import { NavigationItem } from '@/types/permissions';
import { navigationConfig, projectsConfig } from '@/lib/navigation-config';

/**
 * Hook for filtering navigation items based on user permissions
 */
export function useNavigation() {
  const { hasPermission, hasRole, isLoading } = usePermissions();

  // Filter navigation items based on permissions
  const filterNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .map(item => {
        // Check if user has access to this item
        const hasItemAccess = checkItemAccess(item);
        
        if (!hasItemAccess) {
          return null;
        }

        // If item has children, filter them recursively
        if (item.children && item.children.length > 0) {
          const filteredChildren = filterNavigationItems(item.children);
          
          // If no children are accessible, hide the parent item
          if (filteredChildren.length === 0) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren,
          };
        }

        return item;
      })
      .filter((item): item is NavigationItem => item !== null);
  };

  // Check if user has access to a specific navigation item
  const checkItemAccess = (item: NavigationItem): boolean => {
    // If item requires a specific role
    if (item.role) {
      return hasRole(item.role);
    }

    // If item requires a specific permission
    if (item.permission) {
      return hasPermission(item.permission.resource, item.permission.action);
    }

    // If no specific permission or role required, allow access
    return true;
  };

  // Memoize filtered navigation to avoid unnecessary recalculations
  const filteredNavigation = useMemo(() => {
    if (isLoading) {
      return [];
    }
    return filterNavigationItems(navigationConfig);
  }, [hasPermission, hasRole, isLoading]);

  // Memoize filtered projects
  const filteredProjects = useMemo(() => {
    if (isLoading) {
      return [];
    }
    return filterNavigationItems(projectsConfig);
  }, [hasPermission, hasRole, isLoading]);

  return {
    navigation: filteredNavigation,
    projects: filteredProjects,
    isLoading,
    checkItemAccess,
  };
}

/**
 * Hook for checking if a specific navigation item should be visible
 */
export function useNavigationItemAccess(item: NavigationItem) {
  const { hasPermission, hasRole } = usePermissions();

  const hasAccess = useMemo(() => {
    // If item requires a specific role
    if (item.role) {
      return hasRole(item.role);
    }

    // If item requires a specific permission
    if (item.permission) {
      return hasPermission(item.permission.resource, item.permission.action);
    }

    // If no specific permission or role required, allow access
    return true;
  }, [item, hasPermission, hasRole]);

  return hasAccess;
}

/**
 * Hook for getting navigation breadcrumbs with permission checking
 */
export function useNavigationBreadcrumbs(currentPath: string) {
  const { navigation } = useNavigation();

  const findBreadcrumbs = (items: NavigationItem[], path: string, breadcrumbs: NavigationItem[] = []): NavigationItem[] | null => {
    for (const item of items) {
      const currentBreadcrumbs = [...breadcrumbs, item];

      // Check if this is the current item
      if (item.href === path) {
        return currentBreadcrumbs;
      }

      // Check children if they exist
      if (item.children) {
        const childBreadcrumbs = findBreadcrumbs(item.children, path, currentBreadcrumbs);
        if (childBreadcrumbs) {
          return childBreadcrumbs;
        }
      }
    }

    return null;
  };

  const breadcrumbs = useMemo(() => {
    return findBreadcrumbs(navigation, currentPath) || [];
  }, [navigation, currentPath]);

  return breadcrumbs;
}

/**
 * Hook for getting quick actions based on user permissions
 */
export function useQuickActions() {
  const { hasPermission } = usePermissions();

  const quickActions = useMemo(() => {
    const actions = [];

    // Add quick actions based on permissions
    if (hasPermission('report', 'create')) {
      actions.push({
        title: 'Create Report',
        description: 'Create a new inspection report',
        href: '/reports/create',
        icon: 'FileText',
        color: 'primary' as const,
      });
    }

    if (hasPermission('psv', 'create')) {
      actions.push({
        title: 'PSV Calibration',
        description: 'Create new PSV calibration report',
        href: '/psv/reports/create',
        icon: 'Gauge',
        color: 'success' as const,
      });
    }

    if (hasPermission('ndt', 'create')) {
      actions.push({
        title: 'NDT Inspection',
        description: 'Create new NDT inspection report',
        href: '/ndt/reports/create',
        icon: 'Zap',
        color: 'warning' as const,
      });
    }

    if (hasPermission('admin', 'manage_inspectors')) {
      actions.push({
        title: 'Add Inspector',
        description: 'Add a new inspector to the system',
        href: '/inspectors/add',
        icon: 'Users',
        color: 'secondary' as const,
      });
    }

    return actions;
  }, [hasPermission]);

  return quickActions;
}
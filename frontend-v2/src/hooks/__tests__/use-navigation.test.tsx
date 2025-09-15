import React from 'react';
import { render, screen } from '@testing-library/react';
import { useNavigation, useNavigationItemAccess, useNavigationBreadcrumbs } from '../use-navigation';
import { PermissionProvider } from '@/contexts/permission-context';
import { NavigationItem } from '@/types/permissions';

// Mock the auth context
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  token: null,
  inspector: null,
  login: jest.fn(),
  logout: jest.fn(),
  checkAuth: jest.fn(),
  isAdmin: jest.fn(),
};

jest.mock('@/contexts/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockAuthContext,
}));

// Test component for useNavigation hook
function NavigationTestComponent() {
  const { navigation, projects, isLoading } = useNavigation();
  
  if (isLoading) {
    return <div>Loading navigation...</div>;
  }
  
  return (
    <div>
      <div data-testid="navigation-count">{navigation.length}</div>
      <div data-testid="projects-count">{projects.length}</div>
      <div data-testid="navigation-items">
        {navigation.map(item => (
          <div key={item.title} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
            {item.title}
            {item.children && (
              <div data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}-children`}>
                {item.children.map(child => (
                  <div key={child.title} data-testid={`nav-child-${child.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {child.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Test component for useNavigationItemAccess hook
function NavigationItemAccessTestComponent({ item }: { item: NavigationItem }) {
  const hasAccess = useNavigationItemAccess(item);
  
  return (
    <div data-testid="has-access">{hasAccess.toString()}</div>
  );
}

// Test component for useNavigationBreadcrumbs hook
function BreadcrumbsTestComponent({ path }: { path: string }) {
  const breadcrumbs = useNavigationBreadcrumbs(path);
  
  return (
    <div>
      <div data-testid="breadcrumbs-count">{breadcrumbs.length}</div>
      <div data-testid="breadcrumbs">
        {breadcrumbs.map((item, index) => (
          <div key={index} data-testid={`breadcrumb-${index}`}>
            {item.title}
          </div>
        ))}
      </div>
    </div>
  );
}

describe('Navigation Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.isLoading = false;
  });

  describe('useNavigation', () => {
    it('should return empty navigation when not authenticated', () => {
      mockAuthContext.isAuthenticated = false;
      mockAuthContext.user = null;
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <NavigationTestComponent />
        </PermissionProvider>
      );

      // Should show dashboard (no permission required) but filtered items should be minimal
      expect(screen.getByTestId('navigation-count')).toHaveTextContent('1'); // Only Dashboard
      expect(screen.getByTestId('projects-count')).toHaveTextContent('1'); // Only Calendar
    });

    it('should filter navigation based on user permissions', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'psv-inspector',
        email: 'psv@example.com',
        name: 'PSV Inspector',
        roles: ['PSV Inspector'],
        permissions: ['psv:create', 'psv:view', 'report:view'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <NavigationTestComponent />
        </PermissionProvider>
      );

      // Should have access to Dashboard, some Equipment items, PSV Reports, etc.
      const navigationCount = parseInt(screen.getByTestId('navigation-count').textContent || '0');
      expect(navigationCount).toBeGreaterThan(1);

      // Should have PSV Reports section
      expect(screen.getByTestId('nav-psv-reports')).toBeInTheDocument();
    });

    it('should show admin navigation for admin users', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['Global Admin'],
        permissions: ['admin:manage', 'admin:manage_roles', 'admin:manage_permissions'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <NavigationTestComponent />
        </PermissionProvider>
      );

      // Should have access to Administration section
      expect(screen.getByTestId('nav-administration')).toBeInTheDocument();
      expect(screen.getByTestId('nav-administration-children')).toBeInTheDocument();
    });

    it('should filter child navigation items based on permissions', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['PSV Inspector'],
        permissions: ['psv:view'], // Only view permission, not create
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <NavigationTestComponent />
        </PermissionProvider>
      );

      // Should have PSV Reports section
      expect(screen.getByTestId('nav-psv-reports')).toBeInTheDocument();
      
      // Should have "All PSV Reports" but not "Create PSV Report"
      expect(screen.getByTestId('nav-child-all-psv-reports')).toBeInTheDocument();
      expect(screen.queryByTestId('nav-child-create-psv-report')).not.toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockAuthContext.isLoading = true;

      render(
        <PermissionProvider>
          <NavigationTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByText('Loading navigation...')).toBeInTheDocument();
    });
  });

  describe('useNavigationItemAccess', () => {
    it('should return true for items with no permission requirements', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'user',
        email: 'user@example.com',
        name: 'User',
        roles: [],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      const item: NavigationItem = {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'BarChart3',
      };

      render(
        <PermissionProvider>
          <NavigationItemAccessTestComponent item={item} />
        </PermissionProvider>
      );

      expect(screen.getByTestId('has-access')).toHaveTextContent('true');
    });

    it('should return false for items requiring permissions user does not have', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'user',
        email: 'user@example.com',
        name: 'User',
        roles: [],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      const item: NavigationItem = {
        title: 'Create PSV Report',
        href: '/psv/reports/create',
        permission: { resource: 'psv', action: 'create' },
      };

      render(
        <PermissionProvider>
          <NavigationItemAccessTestComponent item={item} />
        </PermissionProvider>
      );

      expect(screen.getByTestId('has-access')).toHaveTextContent('false');
    });

    it('should return true for items requiring permissions user has', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'psv-inspector',
        email: 'psv@example.com',
        name: 'PSV Inspector',
        roles: ['PSV Inspector'],
        permissions: ['psv:create'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      const item: NavigationItem = {
        title: 'Create PSV Report',
        href: '/psv/reports/create',
        permission: { resource: 'psv', action: 'create' },
      };

      render(
        <PermissionProvider>
          <NavigationItemAccessTestComponent item={item} />
        </PermissionProvider>
      );

      expect(screen.getByTestId('has-access')).toHaveTextContent('true');
    });

    it('should check role-based access', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['Global Admin'],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      const item: NavigationItem = {
        title: 'Administration',
        href: '/admin',
        role: 'Global Admin',
      };

      render(
        <PermissionProvider>
          <NavigationItemAccessTestComponent item={item} />
        </PermissionProvider>
      );

      expect(screen.getByTestId('has-access')).toHaveTextContent('true');
    });
  });

  describe('useNavigationBreadcrumbs', () => {
    it('should return empty breadcrumbs for unknown paths', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'user',
        email: 'user@example.com',
        name: 'User',
        roles: [],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <BreadcrumbsTestComponent path="/unknown-path" />
        </PermissionProvider>
      );

      expect(screen.getByTestId('breadcrumbs-count')).toHaveTextContent('0');
    });

    it('should return correct breadcrumbs for nested paths', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'psv-inspector',
        email: 'psv@example.com',
        name: 'PSV Inspector',
        roles: ['PSV Inspector'],
        permissions: ['psv:create', 'psv:view'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <BreadcrumbsTestComponent path="/psv/reports/create" />
        </PermissionProvider>
      );

      const breadcrumbsCount = parseInt(screen.getByTestId('breadcrumbs-count').textContent || '0');
      expect(breadcrumbsCount).toBeGreaterThan(0);

      // Should include PSV Reports and Create PSV Report
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('PSV Reports');
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('Create PSV Report');
    });
  });
});
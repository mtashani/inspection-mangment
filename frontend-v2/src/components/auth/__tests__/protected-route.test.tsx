import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../protected-route';
import { RoleBasedRoute } from '../role-based-route';
import { PermissionGuard, usePermissionCheck } from '../permission-guard';
import { PermissionProvider } from '@/contexts/permission-context';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

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

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('Protected Route Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.isLoading = false;
  });

  describe('ProtectedRoute', () => {
    it('should redirect to login when not authenticated', async () => {
      render(
        <PermissionProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should render children when authenticated and no specific permissions required', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        name: 'Test User',
        roles: [],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should show access denied when missing required permission', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        name: 'Test User',
        roles: [],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <ProtectedRoute permission={{ resource: 'psv', action: 'create' }}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });

    it('should render children when user has required permission', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['PSV Inspector'],
        permissions: ['psv:create'],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <ProtectedRoute permission={{ resource: 'psv', action: 'create' }}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should redirect instead of showing access denied when showAccessDenied is false', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        name: 'Test User',
        roles: [],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <ProtectedRoute 
            permission={{ resource: 'psv', action: 'create' }}
            showAccessDenied={false}
            redirectTo="/custom-unauthorized"
          >
            <div>Protected Content</div>
          </ProtectedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-unauthorized');
      });
    });

    it('should show loading state while checking permissions', () => {
      mockAuthContext.isLoading = true;

      render(
        <PermissionProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </PermissionProvider>
      );

      expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
    });
  });

  describe('RoleBasedRoute', () => {
    it('should show access denied when user lacks required role', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['NDT Inspector'],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <RoleBasedRoute allowedRoles={['Global Admin']}>
            <div>Admin Content</div>
          </RoleBasedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
      });
    });

    it('should render children when user has required role', async () => {
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

      render(
        <PermissionProvider>
          <RoleBasedRoute allowedRoles={['Global Admin']}>
            <div>Admin Content</div>
          </RoleBasedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Content')).toBeInTheDocument();
      });
    });

    it('should render children when user has any of the allowed roles', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['NDT Inspector'],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <RoleBasedRoute allowedRoles={['NDT Inspector', 'Mechanical Inspector']}>
            <div>Inspector Content</div>
          </RoleBasedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Inspector Content')).toBeInTheDocument();
      });
    });

    it('should require all roles when requireAll is true', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['NDT Inspector'], // Only has one of the required roles
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <RoleBasedRoute 
            allowedRoles={['NDT Inspector', 'QC Inspector']} 
            requireAll={true}
          >
            <div>Multi-Role Content</div>
          </RoleBasedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('Multi-Role Content')).not.toBeInTheDocument();
      });
    });

    it('should show custom fallback when provided', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        name: 'Test User',
        roles: [],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <RoleBasedRoute 
            allowedRoles={['Global Admin']}
            fallback={<div>Custom Fallback</div>}
          >
            <div>Admin Content</div>
          </RoleBasedRoute>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
        expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('PermissionGuard', () => {
    it('should render children when user has required permission', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['PSV Inspector'],
        permissions: ['psv:create'],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <PermissionGuard permission={{ resource: 'psv', action: 'create' }}>
            <div>PSV Create Button</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('PSV Create Button')).toBeInTheDocument();
      });
    });

    it('should show inline access denied when user lacks permission', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: [],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <PermissionGuard permission={{ resource: 'psv', action: 'create' }}>
            <div>PSV Create Button</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.queryByText('PSV Create Button')).not.toBeInTheDocument();
      });
    });

    it('should handle multiple permissions with requireAll', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['PSV Inspector'],
        permissions: ['psv:create', 'psv:view'], // Has both permissions
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <PermissionGuard 
            permissions={[
              { resource: 'psv', action: 'create' },
              { resource: 'psv', action: 'view' }
            ]}
            requireAll={true}
          >
            <div>PSV Full Access Content</div>
          </PermissionGuard>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('PSV Full Access Content')).toBeInTheDocument();
      });
    });
  });

  describe('usePermissionCheck', () => {
    function TestComponent() {
      const { hasAccess, isLoading } = usePermissionCheck({
        permission: { resource: 'psv', action: 'create' }
      });

      if (isLoading) return <div>Loading...</div>;
      
      return (
        <div>
          <div data-testid="has-access">{hasAccess.toString()}</div>
        </div>
      );
    }

    it('should return correct access status', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['PSV Inspector'],
        permissions: ['psv:create'],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-access')).toHaveTextContent('true');
      });
    });

    it('should return false when user lacks permission', async () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: [],
        permissions: [],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-access')).toHaveTextContent('false');
      });
    });
  });
});
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionProvider, usePermissions } from '../permission-context';
import { AuthProvider } from '../auth-context';
import { PermissionCheck } from '@/types/permissions';

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

jest.mock('../auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockAuthContext,
}));

// Test component that uses permissions
function TestComponent() {
  const {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isLoading,
  } = usePermissions();

  if (isLoading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div>
      <div data-testid="permissions">{JSON.stringify(permissions)}</div>
      <div data-testid="roles">{JSON.stringify(roles)}</div>
      <div data-testid="has-psv-create">{hasPermission('psv', 'create').toString()}</div>
      <div data-testid="has-ndt-approve">{hasPermission('ndt', 'approve').toString()}</div>
      <div data-testid="has-any-permission">
        {hasAnyPermission([
          { resource: 'psv', action: 'create' },
          { resource: 'ndt', action: 'view' }
        ]).toString()}
      </div>
      <div data-testid="has-all-permissions">
        {hasAllPermissions([
          { resource: 'psv', action: 'create' },
          { resource: 'psv', action: 'view' }
        ]).toString()}
      </div>
      <div data-testid="has-admin-role">{hasRole('Global Admin').toString()}</div>
      <div data-testid="has-any-role">
        {hasAnyRole(['NDT Inspector', 'Mechanical Inspector']).toString()}
      </div>
    </div>
  );
}

describe('PermissionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('usePermissions must be used within a PermissionProvider');
    
    consoleSpy.mockRestore();
  });

  it('should provide empty permissions and roles when user is not authenticated', async () => {
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.isLoading = false;

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('permissions')).toHaveTextContent('[]');
      expect(screen.getByTestId('roles')).toHaveTextContent('[]');
      expect(screen.getByTestId('has-psv-create')).toHaveTextContent('false');
      expect(screen.getByTestId('has-admin-role')).toHaveTextContent('false');
    });
  });

  it('should provide permissions and roles when user is authenticated', async () => {
    const mockUser = {
      id: 1,
      username: 'test-inspector',
      email: 'test@example.com',
      name: 'Test Inspector',
      roles: ['NDT Inspector', 'PSV Inspector'],
      permissions: ['psv:create', 'psv:view', 'ndt:create', 'ndt:view', 'ndt:approve'],
      is_active: true,
      employee_id: 'EMP001',
    };

    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = mockUser;
    mockAuthContext.isLoading = false;

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('permissions')).toHaveTextContent(
        JSON.stringify(mockUser.permissions)
      );
      expect(screen.getByTestId('roles')).toHaveTextContent(
        JSON.stringify(mockUser.roles)
      );
    });
  });

  it('should correctly check individual permissions', async () => {
    const mockUser = {
      id: 1,
      username: 'test-inspector',
      email: 'test@example.com',
      name: 'Test Inspector',
      roles: ['PSV Inspector'],
      permissions: ['psv:create', 'psv:view'],
      is_active: true,
      employee_id: 'EMP001',
    };

    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = mockUser;
    mockAuthContext.isLoading = false;

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('has-psv-create')).toHaveTextContent('true');
      expect(screen.getByTestId('has-ndt-approve')).toHaveTextContent('false');
    });
  });

  it('should correctly check multiple permissions with hasAnyPermission', async () => {
    const mockUser = {
      id: 1,
      username: 'test-inspector',
      email: 'test@example.com',
      name: 'Test Inspector',
      roles: ['PSV Inspector'],
      permissions: ['psv:create', 'psv:view'],
      is_active: true,
      employee_id: 'EMP001',
    };

    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = mockUser;
    mockAuthContext.isLoading = false;

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      // Should return true because user has psv:create (even though they don't have ndt:view)
      expect(screen.getByTestId('has-any-permission')).toHaveTextContent('true');
    });
  });

  it('should correctly check multiple permissions with hasAllPermissions', async () => {
    const mockUser = {
      id: 1,
      username: 'test-inspector',
      email: 'test@example.com',
      name: 'Test Inspector',
      roles: ['PSV Inspector'],
      permissions: ['psv:create', 'psv:view'],
      is_active: true,
      employee_id: 'EMP001',
    };

    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = mockUser;
    mockAuthContext.isLoading = false;

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      // Should return true because user has both psv:create and psv:view
      expect(screen.getByTestId('has-all-permissions')).toHaveTextContent('true');
    });
  });

  it('should correctly check roles', async () => {
    const mockUser = {
      id: 1,
      username: 'test-admin',
      email: 'admin@example.com',
      name: 'Test Admin',
      roles: ['Global Admin', 'NDT Inspector'],
      permissions: ['admin:manage', 'ndt:create'],
      is_active: true,
      employee_id: 'EMP002',
    };

    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = mockUser;
    mockAuthContext.isLoading = false;

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('has-admin-role')).toHaveTextContent('true');
      expect(screen.getByTestId('has-any-role')).toHaveTextContent('true');
    });
  });

  it('should show loading state initially', () => {
    mockAuthContext.isLoading = true;

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>
    );

    expect(screen.getByText('Loading permissions...')).toBeInTheDocument();
  });

  it('should handle user with no permissions or roles', async () => {
    const mockUser = {
      id: 1,
      username: 'test-user',
      email: 'user@example.com',
      name: 'Test User',
      roles: [],
      permissions: [],
      is_active: true,
      employee_id: 'EMP003',
    };

    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = mockUser;
    mockAuthContext.isLoading = false;

    render(
      <PermissionProvider>
        <TestComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('permissions')).toHaveTextContent('[]');
      expect(screen.getByTestId('roles')).toHaveTextContent('[]');
      expect(screen.getByTestId('has-psv-create')).toHaveTextContent('false');
      expect(screen.getByTestId('has-admin-role')).toHaveTextContent('false');
      expect(screen.getByTestId('has-any-permission')).toHaveTextContent('false');
      expect(screen.getByTestId('has-all-permissions')).toHaveTextContent('false');
      expect(screen.getByTestId('has-any-role')).toHaveTextContent('false');
    });
  });
});
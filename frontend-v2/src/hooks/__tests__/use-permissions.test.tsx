import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  usePermissions, 
  useRoles, 
  useResourcePermissions,
  usePSVPermissions,
  useNDTPermissions,
  useAdminPermissions,
  useMultiplePermissions,
  useConditionalRender
} from '../use-permissions';
import { PermissionProvider } from '@/contexts/permission-context';
import { RESOURCES, ACTIONS } from '@/types/permissions';

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

// Test components for different hooks
function PermissionsTestComponent() {
  const { permissions, roles, hasPermission } = usePermissions();
  
  return (
    <div>
      <div data-testid="permissions-count">{permissions.length}</div>
      <div data-testid="roles-count">{roles.length}</div>
      <div data-testid="has-psv-create">{hasPermission('psv', 'create').toString()}</div>
    </div>
  );
}

function RolesTestComponent() {
  const { isAdmin, isManager, isInspector, isOperator } = useRoles();
  
  return (
    <div>
      <div data-testid="is-admin">{isAdmin().toString()}</div>
      <div data-testid="is-manager">{isManager().toString()}</div>
      <div data-testid="is-inspector">{isInspector().toString()}</div>
      <div data-testid="is-operator">{isOperator().toString()}</div>
    </div>
  );
}

function ResourcePermissionsTestComponent() {
  const psvPerms = usePSVPermissions();
  const ndtPerms = useNDTPermissions();
  const adminPerms = useAdminPermissions();
  
  return (
    <div>
      <div data-testid="psv-can-create">{psvPerms.canCreate().toString()}</div>
      <div data-testid="psv-can-approve">{psvPerms.canApprove().toString()}</div>
      <div data-testid="ndt-can-view">{ndtPerms.canView().toString()}</div>
      <div data-testid="admin-can-manage-roles">{adminPerms.canManageRoles().toString()}</div>
    </div>
  );
}

function MultiplePermissionsTestComponent() {
  const multiPerms = useMultiplePermissions([
    { resource: 'psv', action: 'create' },
    { resource: 'ndt', action: 'view' },
    { resource: 'admin', action: 'manage' }
  ]);
  
  return (
    <div>
      <div data-testid="has-any">{multiPerms.hasAny().toString()}</div>
      <div data-testid="has-all">{multiPerms.hasAll().toString()}</div>
      <div data-testid="individual-count">{multiPerms.individual.length}</div>
    </div>
  );
}

function ConditionalRenderTestComponent() {
  const { renderIfPermission, renderIfRole } = useConditionalRender();
  
  return (
    <div>
      {renderIfPermission('psv', 'create', <div data-testid="psv-create-content">PSV Create Content</div>)}
      {renderIfRole('Global Admin', <div data-testid="admin-content">Admin Content</div>)}
    </div>
  );
}

describe('Permission Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePermissions', () => {
    it('should return permission functions', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['PSV Inspector'],
        permissions: ['psv:create', 'psv:view'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <PermissionsTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('permissions-count')).toHaveTextContent('2');
      expect(screen.getByTestId('roles-count')).toHaveTextContent('1');
      expect(screen.getByTestId('has-psv-create')).toHaveTextContent('true');
    });
  });

  describe('useRoles', () => {
    it('should correctly identify admin role', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['Global Admin'],
        permissions: ['admin:manage'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <RolesTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('is-manager')).toHaveTextContent('false');
      expect(screen.getByTestId('is-inspector')).toHaveTextContent('false');
      expect(screen.getByTestId('is-operator')).toHaveTextContent('false');
    });

    it('should correctly identify manager roles', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'manager',
        email: 'manager@example.com',
        name: 'Manager User',
        roles: ['Mechanical Manager'],
        permissions: ['mechanical:approve'],
        is_active: true,
        employee_id: 'EMP002',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <RolesTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('is-manager')).toHaveTextContent('true');
      expect(screen.getByTestId('is-inspector')).toHaveTextContent('false');
      expect(screen.getByTestId('is-operator')).toHaveTextContent('false');
    });

    it('should correctly identify inspector roles', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['NDT Inspector'],
        permissions: ['ndt:create', 'ndt:view'],
        is_active: true,
        employee_id: 'EMP003',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <RolesTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('is-manager')).toHaveTextContent('false');
      expect(screen.getByTestId('is-inspector')).toHaveTextContent('true');
      expect(screen.getByTestId('is-operator')).toHaveTextContent('false');
    });

    it('should correctly identify operator roles', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'operator',
        email: 'operator@example.com',
        name: 'Operator User',
        roles: ['PSV Test Operator'],
        permissions: ['psv:execute_test'],
        is_active: true,
        employee_id: 'EMP004',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <RolesTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('is-manager')).toHaveTextContent('false');
      expect(screen.getByTestId('is-inspector')).toHaveTextContent('false');
      expect(screen.getByTestId('is-operator')).toHaveTextContent('true');
    });
  });

  describe('Resource Permission Hooks', () => {
    it('should correctly check resource-specific permissions', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['PSV Inspector', 'Global Admin'],
        permissions: ['psv:create', 'ndt:view', 'admin:manage_roles'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <ResourcePermissionsTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('psv-can-create')).toHaveTextContent('true');
      expect(screen.getByTestId('psv-can-approve')).toHaveTextContent('false');
      expect(screen.getByTestId('ndt-can-view')).toHaveTextContent('true');
      expect(screen.getByTestId('admin-can-manage-roles')).toHaveTextContent('true');
    });
  });

  describe('useMultiplePermissions', () => {
    it('should correctly check multiple permissions', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['PSV Inspector'],
        permissions: ['psv:create', 'ndt:view'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <MultiplePermissionsTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('has-any')).toHaveTextContent('true'); // Has psv:create and ndt:view
      expect(screen.getByTestId('has-all')).toHaveTextContent('false'); // Doesn't have admin:manage
      expect(screen.getByTestId('individual-count')).toHaveTextContent('3');
    });
  });

  describe('useConditionalRender', () => {
    it('should conditionally render based on permissions and roles', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['Global Admin'],
        permissions: ['psv:create', 'admin:manage'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <ConditionalRenderTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('psv-create-content')).toBeInTheDocument();
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });

    it('should not render when permissions are missing', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['NDT Inspector'],
        permissions: ['ndt:create'],
        is_active: true,
        employee_id: 'EMP001',
      };
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <ConditionalRenderTestComponent />
        </PermissionProvider>
      );

      expect(screen.queryByTestId('psv-create-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('should return false for all permission checks when not authenticated', () => {
      mockAuthContext.isAuthenticated = false;
      mockAuthContext.user = null;
      mockAuthContext.isLoading = false;

      render(
        <PermissionProvider>
          <RolesTestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('is-manager')).toHaveTextContent('false');
      expect(screen.getByTestId('is-inspector')).toHaveTextContent('false');
      expect(screen.getByTestId('is-operator')).toHaveTextContent('false');
    });
  });
});
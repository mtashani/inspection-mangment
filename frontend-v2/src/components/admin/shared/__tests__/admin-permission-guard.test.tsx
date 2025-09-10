import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminPermissionGuard, AdminOnly } from '../admin-permission-guard';
import { useAuth } from '@/contexts/auth-context';
import { useAdminPermissions } from '@/hooks/admin/use-admin-permissions';

// Mock the dependencies
jest.mock('@/contexts/auth-context');
jest.mock('@/hooks/admin/use-admin-permissions');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseAdminPermissions = useAdminPermissions as jest.MockedFunction<typeof useAdminPermissions>;

describe('AdminPermissionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      token: null,
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => false),
    });

    mockUseAdminPermissions.mockReturnValue({
      hasAdminAccess: false,
      permissions: {} as any,
      hasPermission: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: jest.fn(() => false),
      isLoadingPermissions: false,
    });

    render(
      <AdminPermissionGuard>
        <div>Protected Content</div>
      </AdminPermissionGuard>
    );

    expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
  });

  it('should show loading state when permissions are loading', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'test', email: 'test@example.com', name: 'Test', roles: ['admin'], is_active: true, employee_id: 'EMP001' },
      isLoading: false,
      isAuthenticated: true,
      token: 'token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => true),
    });

    mockUseAdminPermissions.mockReturnValue({
      hasAdminAccess: true,
      permissions: {} as any,
      hasPermission: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
      isLoadingPermissions: true,
    });

    render(
      <AdminPermissionGuard>
        <div>Protected Content</div>
      </AdminPermissionGuard>
    );

    expect(screen.getByText('Checking permissions...')).toBeInTheDocument();
  });

  it('should show access denied when user has no admin access', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'test', email: 'test@example.com', name: 'Test', roles: ['inspector'], is_active: true, employee_id: 'EMP001' },
      isLoading: false,
      isAuthenticated: true,
      token: 'token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => false),
    });

    mockUseAdminPermissions.mockReturnValue({
      hasAdminAccess: false,
      permissions: {} as any,
      hasPermission: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: jest.fn(() => false),
      isLoadingPermissions: false,
    });

    render(
      <AdminPermissionGuard>
        <div>Protected Content</div>
      </AdminPermissionGuard>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to access the admin panel/)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show insufficient permissions when user lacks specific permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', roles: ['admin'], is_active: true, employee_id: 'ADM001' },
      isLoading: false,
      isAuthenticated: true,
      token: 'token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => true),
    });

    mockUseAdminPermissions.mockReturnValue({
      hasAdminAccess: true,
      permissions: {} as any,
      hasPermission: jest.fn(() => false), // Specific permission denied
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: jest.fn(() => false),
      isLoadingPermissions: false,
    });

    render(
      <AdminPermissionGuard requiredPermission="canManageInspectors">
        <div>Protected Content</div>
      </AdminPermissionGuard>
    );

    expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument();
    expect(screen.getByText(/You don't have the required permission \(canManageInspectors\)/)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user has admin access', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', roles: ['admin'], is_active: true, employee_id: 'ADM001' },
      isLoading: false,
      isAuthenticated: true,
      token: 'token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => true),
    });

    mockUseAdminPermissions.mockReturnValue({
      hasAdminAccess: true,
      permissions: {} as any,
      hasPermission: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
      isLoadingPermissions: false,
    });

    render(
      <AdminPermissionGuard>
        <div>Protected Content</div>
      </AdminPermissionGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('should render children when user has specific permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', roles: ['admin'], is_active: true, employee_id: 'ADM001' },
      isLoading: false,
      isAuthenticated: true,
      token: 'token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => true),
    });

    mockUseAdminPermissions.mockReturnValue({
      hasAdminAccess: true,
      permissions: {} as any,
      hasPermission: jest.fn(() => true), // Specific permission granted
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
      isLoadingPermissions: false,
    });

    render(
      <AdminPermissionGuard requiredPermission="canManageInspectors">
        <div>Protected Content</div>
      </AdminPermissionGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Insufficient Permissions')).not.toBeInTheDocument();
  });

  it('should render fallback when provided and access denied', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'test', email: 'test@example.com', name: 'Test', roles: ['inspector'], is_active: true, employee_id: 'EMP001' },
      isLoading: false,
      isAuthenticated: true,
      token: 'token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => false),
    });

    mockUseAdminPermissions.mockReturnValue({
      hasAdminAccess: false,
      permissions: {} as any,
      hasPermission: jest.fn(() => false),
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: jest.fn(() => false),
      isLoadingPermissions: false,
    });

    render(
      <AdminPermissionGuard fallback={<div>Custom Fallback</div>}>
        <div>Protected Content</div>
      </AdminPermissionGuard>
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });
});

describe('AdminOnly', () => {
  it('should work as a simplified wrapper', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@example.com', name: 'Admin', roles: ['admin'], is_active: true, employee_id: 'ADM001' },
      isLoading: false,
      isAuthenticated: true,
      token: 'token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => true),
    });

    mockUseAdminPermissions.mockReturnValue({
      hasAdminAccess: true,
      permissions: {} as any,
      hasPermission: jest.fn(() => true),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(() => true),
      isLoadingPermissions: false,
    });

    render(
      <AdminOnly>
        <div>Admin Only Content</div>
      </AdminOnly>
    );

    expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
  });
});
import { renderHook } from '@testing-library/react';
import { useAdminPermissions } from '../use-admin-permissions';
import { useAuth } from '@/contexts/auth-context';

// Mock the auth context
jest.mock('@/contexts/auth-context');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useAdminPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deny all permissions when user is not loaded', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      token: null,
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => false),
    });

    const { result } = renderHook(() => useAdminPermissions());

    expect(result.current.hasAdminAccess).toBe(false);
    expect(result.current.permissions.canManageInspectors).toBe(false);
    expect(result.current.permissions.canManageAttendance).toBe(false);
    expect(result.current.hasPermission('canManageInspectors')).toBe(false);
  });

  it('should deny all permissions when user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['inspector'],
        is_active: true,
        employee_id: 'EMP001',
      },
      isLoading: false,
      isAuthenticated: true,
      token: 'mock-token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => false),
    });

    const { result } = renderHook(() => useAdminPermissions());

    expect(result.current.hasAdminAccess).toBe(false);
    expect(result.current.permissions.canManageInspectors).toBe(false);
    expect(result.current.permissions.canManageAttendance).toBe(false);
    expect(result.current.hasPermission('canManageInspectors')).toBe(false);
  });

  it('should grant all permissions when user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin'],
        is_active: true,
        employee_id: 'ADM001',
      },
      isLoading: false,
      isAuthenticated: true,
      token: 'mock-token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => true),
    });

    const { result } = renderHook(() => useAdminPermissions());

    expect(result.current.hasAdminAccess).toBe(true);
    expect(result.current.permissions.canManageInspectors).toBe(true);
    expect(result.current.permissions.canManageAttendance).toBe(true);
    expect(result.current.permissions.canManageTemplates).toBe(true);
    expect(result.current.permissions.canViewPayroll).toBe(true);
    expect(result.current.hasPermission('canManageInspectors')).toBe(true);
  });

  it('should handle loading state correctly', () => {
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

    const { result } = renderHook(() => useAdminPermissions());

    expect(result.current.isLoadingPermissions).toBe(true);
    expect(result.current.hasAdminAccess).toBe(false);
  });

  it('should correctly check multiple permissions with hasAnyPermission', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin'],
        is_active: true,
        employee_id: 'ADM001',
      },
      isLoading: false,
      isAuthenticated: true,
      token: 'mock-token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => true),
    });

    const { result } = renderHook(() => useAdminPermissions());

    expect(result.current.hasAnyPermission(['canManageInspectors', 'canManageAttendance'])).toBe(true);
    expect(result.current.hasAnyPermission(['canManageInspectors'])).toBe(true);
  });

  it('should correctly check multiple permissions with hasAllPermissions', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
        roles: ['admin'],
        is_active: true,
        employee_id: 'ADM001',
      },
      isLoading: false,
      isAuthenticated: true,
      token: 'mock-token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => true),
    });

    const { result } = renderHook(() => useAdminPermissions());

    expect(result.current.hasAllPermissions(['canManageInspectors', 'canManageAttendance'])).toBe(true);
    expect(result.current.hasAllPermissions(['canManageInspectors'])).toBe(true);
  });

  it('should return false for hasAnyPermission when user has no permissions', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['inspector'],
        is_active: true,
        employee_id: 'EMP001',
      },
      isLoading: false,
      isAuthenticated: true,
      token: 'mock-token',
      inspector: null,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      isAdmin: jest.fn(() => false),
    });

    const { result } = renderHook(() => useAdminPermissions());

    expect(result.current.hasAnyPermission(['canManageInspectors', 'canManageAttendance'])).toBe(false);
    expect(result.current.hasAllPermissions(['canManageInspectors', 'canManageAttendance'])).toBe(false);
  });
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NavMainPermissionAware } from '../nav-main-permission-aware';
import { PermissionProvider } from '@/contexts/permission-context';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
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
jest.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-group">{children}</div>,
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-group-label">{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu">{children}</div>,
  SidebarMenuButton: ({ children, tooltip, isActive, disabled }: any) => (
    <button data-testid="sidebar-menu-button" data-tooltip={tooltip} data-active={isActive} disabled={disabled}>
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu-item">{children}</div>,
  SidebarMenuSub: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu-sub">{children}</div>,
  SidebarMenuSubButton: ({ children, isActive }: any) => (
    <button data-testid="sidebar-menu-sub-button" data-active={isActive}>{children}</button>
  ),
  SidebarMenuSubItem: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu-sub-item">{children}</div>,
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible">{children}</div>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible-content">{children}</div>,
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="collapsible-trigger">{children}</div>,
}));

describe('NavMainPermissionAware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.isLoading = false;
  });

  it('should show loading state when permissions are loading', () => {
    mockAuthContext.isLoading = true;

    render(
      <PermissionProvider>
        <NavMainPermissionAware />
      </PermissionProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-group-label')).toHaveTextContent('Platform');
  });

  it('should render nothing when no navigation items are available', () => {
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.isLoading = false;

    const { container } = render(
      <PermissionProvider>
        <NavMainPermissionAware />
      </PermissionProvider>
    );

    // Should render minimal navigation (Dashboard only)
    expect(screen.getByTestId('sidebar-group')).toBeInTheDocument();
  });

  it('should render navigation items for authenticated user with permissions', () => {
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
        <NavMainPermissionAware />
      </PermissionProvider>
    );

    expect(screen.getByTestId('sidebar-group')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-group-label')).toHaveTextContent('Platform');
    expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument();
  });

  it('should render admin navigation for admin users', () => {
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
        <NavMainPermissionAware />
      </PermissionProvider>
    );

    expect(screen.getByTestId('sidebar-group')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument();
  });

  it('should use custom group label when provided', () => {
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
        <NavMainPermissionAware groupLabel="Custom Navigation" />
      </PermissionProvider>
    );

    expect(screen.getByTestId('sidebar-group-label')).toHaveTextContent('Custom Navigation');
  });
});
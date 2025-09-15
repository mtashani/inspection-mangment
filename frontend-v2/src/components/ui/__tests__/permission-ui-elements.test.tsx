import React from 'react';
import { render, screen } from '@testing-library/react';
import { PermissionButton, CreateButton, EditButton, DeleteButton, ApproveButton } from '../permission-button';
import { PermissionInput, PermissionSelect, PermissionCheckbox } from '../permission-form-field';
import { PermissionBadge, StatusBadge, PermissionIndicator, RoleBadge } from '../permission-badge';
import { PermissionProvider } from '@/contexts/permission-context';

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
  Button: ({ children, disabled, title, ...props }: any) => (
    <button disabled={disabled} title={title} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => <div data-testid="select" {...props}>{children}</div>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value, disabled }: any) => (
    <div data-testid="select-item" data-value={value} data-disabled={disabled}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: (props: any) => <input type="checkbox" {...props} />,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} className={className} {...props}>
      {children}
    </span>
  ),
}));

describe('Permission-Based UI Elements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockAuthContext.isLoading = false;
  });

  describe('PermissionButton', () => {
    it('should render button when user has permission', () => {
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
          <PermissionButton permission={{ resource: 'psv', action: 'create' }}>
            Create PSV Report
          </PermissionButton>
        </PermissionProvider>
      );

      expect(screen.getByRole('button')).toHaveTextContent('Create PSV Report');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should disable button when user lacks permission and disableWhenNoAccess is true', () => {
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
          <PermissionButton 
            permission={{ resource: 'psv', action: 'create' }}
            disableWhenNoAccess={true}
          >
            Create PSV Report
          </PermissionButton>
        </PermissionProvider>
      );

      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveAttribute('title', "You don't have permission to perform this action");
    });

    it('should hide button when user lacks permission and hideWhenNoAccess is true', () => {
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
          <PermissionButton 
            permission={{ resource: 'psv', action: 'create' }}
            hideWhenNoAccess={true}
          >
            Create PSV Report
          </PermissionButton>
        </PermissionProvider>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Create PSV Report')).not.toBeInTheDocument();
    });
  });

  describe('Specialized Action Buttons', () => {
    it('should render CreateButton with correct permission', () => {
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
          <CreateButton resource="psv">Create PSV</CreateButton>
        </PermissionProvider>
      );

      expect(screen.getByRole('button')).toHaveTextContent('Create PSV');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should render EditButton with correct permission for own items', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['PSV Inspector'],
        permissions: ['psv:edit_own'],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <EditButton resource="psv" isOwn={true}>Edit PSV</EditButton>
        </PermissionProvider>
      );

      expect(screen.getByRole('button')).toHaveTextContent('Edit PSV');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should render DeleteButton with correct permission scope', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'manager',
        email: 'manager@example.com',
        name: 'Manager User',
        roles: ['PSV Manager'],
        permissions: ['psv:delete_section'],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <DeleteButton resource="psv" scope="section">Delete PSV</DeleteButton>
        </PermissionProvider>
      );

      expect(screen.getByRole('button')).toHaveTextContent('Delete PSV');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should render ApproveButton with correct permission', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'manager',
        email: 'manager@example.com',
        name: 'Manager User',
        roles: ['PSV Manager'],
        permissions: ['psv:approve'],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <ApproveButton resource="psv">Approve PSV</ApproveButton>
        </PermissionProvider>
      );

      expect(screen.getByRole('button')).toHaveTextContent('Approve PSV');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  describe('Permission Form Fields', () => {
    it('should render PermissionInput when user has permission', () => {
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
          <PermissionInput 
            permission={{ resource: 'psv', action: 'create' }}
            label="PSV Serial Number"
            placeholder="Enter serial number"
          />
        </PermissionProvider>
      );

      expect(screen.getByLabelText('PSV Serial Number')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter serial number')).toBeInTheDocument();
    });

    it('should make field read-only when user lacks permission', () => {
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
          <PermissionInput 
            permission={{ resource: 'psv', action: 'create' }}
            label="PSV Serial Number"
            placeholder="Enter serial number"
            readOnlyWhenNoAccess={true}
          />
        </PermissionProvider>
      );

      expect(screen.getByText(/Read-only: insufficient permissions/)).toBeInTheDocument();
    });

    it('should hide field when user lacks permission and hideWhenNoAccess is true', () => {
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
          <PermissionInput 
            permission={{ resource: 'psv', action: 'create' }}
            label="PSV Serial Number"
            placeholder="Enter serial number"
            hideWhenNoAccess={true}
          />
        </PermissionProvider>
      );

      expect(screen.queryByLabelText('PSV Serial Number')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Permission Badges', () => {
    it('should render PermissionBadge when user has permission', () => {
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.user = {
        id: 1,
        username: 'inspector',
        email: 'inspector@example.com',
        name: 'Inspector User',
        roles: ['PSV Inspector'],
        permissions: ['psv:view'],
        is_active: true,
        employee_id: 'EMP001',
      };

      render(
        <PermissionProvider>
          <PermissionBadge permission={{ resource: 'psv', action: 'view' }}>
            PSV Access
          </PermissionBadge>
        </PermissionProvider>
      );

      expect(screen.getByTestId('badge')).toHaveTextContent('PSV Access');
    });

    it('should hide PermissionBadge when user lacks permission', () => {
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
          <PermissionBadge permission={{ resource: 'psv', action: 'view' }}>
            PSV Access
          </PermissionBadge>
        </PermissionProvider>
      );

      expect(screen.queryByText('PSV Access')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should render StatusBadge with correct variant', () => {
      render(
        <PermissionProvider>
          <StatusBadge status="approved" />
        </PermissionProvider>
      );

      expect(screen.getByTestId('badge')).toHaveTextContent('approved');
      expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'default');
    });

    it('should render PermissionIndicator with correct access state', () => {
      render(
        <PermissionProvider>
          <PermissionIndicator hasAccess={true} accessType="edit" />
        </PermissionProvider>
      );

      expect(screen.getByTestId('badge')).toHaveTextContent('Can Edit');
      expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'default');
    });

    it('should render RoleBadge with correct styling', () => {
      render(
        <PermissionProvider>
          <RoleBadge role="Global Admin" />
        </PermissionProvider>
      );

      expect(screen.getByTestId('badge')).toHaveTextContent('Global Admin');
      expect(screen.getByTestId('badge')).toHaveAttribute('data-variant', 'destructive');
    });
  });
});
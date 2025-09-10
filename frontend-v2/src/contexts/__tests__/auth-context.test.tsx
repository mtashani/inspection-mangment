import { render, screen, waitFor } from '@/test-utils';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ReactNode } from 'react';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

import axios from 'axios';
const mockAxios = axios as jest.Mocked<typeof axios>;

// Test component that uses auth context
function TestComponent() {
  const { user, login, logout, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.name : 'No User'}</div>
      <button
        onClick={() => login({ username: 'testuser', password: 'password' })}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
}

function AuthWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockAxios.post.mockClear();
    mockAxios.get.mockClear();
  });

  it('provides initial auth state', () => {
    render(
      <AuthWrapper>
        <TestComponent />
      </AuthWrapper>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  it('handles successful login', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      employee_id: 'EMP001',
      roles: ['inspector'],
    };

    const mockLoginResponse = {
      data: {
        access_token: 'mock-token',
        token_type: 'bearer',
      },
    };

    const mockUserResponse = {
      data: mockUser,
    };

    mockAxios.post.mockResolvedValueOnce(mockLoginResponse);
    mockAxios.get.mockResolvedValueOnce(mockUserResponse);

    const { user } = render(
      <AuthWrapper>
        <TestComponent />
      </AuthWrapper>
    );

    const loginBtn = screen.getByTestId('login-btn');
    await user.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'access_token',
      'mock-token'
    );
    expect(mockAxios.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/auth/login',
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        withCredentials: true,
      }
    );
  });

  it('handles login failure', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('Login failed'));

    const { user } = render(
      <AuthWrapper>
        <TestComponent />
      </AuthWrapper>
    );

    const loginBtn = screen.getByTestId('login-btn');
    await user.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });

    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('handles logout', async () => {
    // Setup initial logged in state
    const mockUser = {
      id: 1,
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      employee_id: 'EMP001',
      roles: ['inspector'],
    };

    mockLocalStorage.getItem.mockReturnValue('existing-token');
    mockAxios.get.mockResolvedValueOnce({
      data: mockUser,
    });

    const { user } = render(
      <AuthWrapper>
        <TestComponent />
      </AuthWrapper>
    );

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    const logoutBtn = screen.getByTestId('logout-btn');
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
  });

  it('loads user from token on mount', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      employee_id: 'EMP001',
      roles: ['inspector'],
    };

    mockLocalStorage.getItem.mockReturnValue('existing-token');
    mockAxios.get.mockResolvedValueOnce({
      data: mockUser,
    });

    render(
      <AuthWrapper>
        <TestComponent />
      </AuthWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    expect(mockAxios.get).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/auth/me',
      {
        headers: { Authorization: 'Bearer existing-token' },
        withCredentials: true,
      }
    );
  });

  it('handles invalid token on mount', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-token');
    mockAxios.get.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <AuthWrapper>
        <TestComponent />
      </AuthWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
  });
});

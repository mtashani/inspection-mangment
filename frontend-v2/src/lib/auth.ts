import axios from 'axios';
import { logAuthError, logApiError } from '@/lib/error-logger';
import { shouldUseMockData, devInfo } from '@/lib/utils/development';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  roles: string[];
  is_active: boolean;
  employee_id: string;
  avatar?: string; // Optional avatar URL
  // Additional inspector-specific fields
  department?: string;
  position?: string;
  certification_level?: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Create form data for OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/api/v1/auth/login`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          withCredentials: true, // Include cookies
        }
      );

      const { access_token } = response.data;
      this.token = access_token;

      // Store token in localStorage and cookies
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', access_token);
        // Also set as cookie for middleware
        document.cookie = `access_token=${access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
      }

      // Get user info
      const user = await this.getCurrentUser();
      return user;
    } catch (error) {
      // Log the error for debugging
      logAuthError(error instanceof Error ? error : 'Unknown login error', 'login');
      
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        logApiError(error, '/api/v1/auth/login', 'POST', status);
        
        if (status === 401) {
          throw new Error('Invalid username or password. Please check your credentials and try again.');
        } else if (status === 403) {
          throw new Error('Your account has been disabled. Please contact your administrator.');
        } else if (status === 429) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.');
        } else if (status && status >= 500) {
          throw new Error('Server error. Please try again later or contact support.');
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
      }
      
      // Fallback error message
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  }

  async getCurrentUser(): Promise<User> {
    if (!this.token) {
      throw new Error('No authentication token');
    }

    try {
      const response = await axios.get<User>(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      // Only log authentication errors for non-401 errors or in production
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status !== 401 || process.env.NODE_ENV === 'production') {
          logAuthError(error, 'token_refresh');
          logApiError(error, '/api/v1/auth/me', 'GET', status);
        }
      } else {
        logAuthError(error instanceof Error ? error : 'Failed to get current user', 'token_refresh');
      }
      
      this.logout();
      throw new Error('Failed to get user information');
    }
  }

  logout(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      // Clear cookie
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Log successful logout
      logAuthError('User logged out', 'logout');
      
      // Clear cookies by making a logout request
      axios
        .post(
          `${API_BASE_URL}/api/v1/auth/logout`,
          {},
          {
            withCredentials: true,
          }
        )
        .catch((error) => {
          // Log logout API error but don't throw
          logApiError(error, '/api/v1/auth/logout', 'POST');
        });
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authService = AuthService.getInstance();

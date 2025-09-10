'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Inspector, SpecialtyCode } from '@/types/inspector'

interface AuthContextType {
  isAuthenticated: boolean
  inspector: Inspector | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  error: string | null
  hasPermission: (resource: string, action: string) => boolean
  hasSpecialty: (specialty: SpecialtyCode) => boolean
  isAdmin: () => boolean
  canAccessFeature: (feature: string) => boolean
  refreshProfile: () => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  inspector: null,
  login: async () => false,
  logout: () => {},
  loading: false,
  error: null,
  hasPermission: () => false,
  hasSpecialty: () => false,
  isAdmin: () => false,
  canAccessFeature: () => false,
  refreshProfile: async () => {}
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState<boolean>(false) // FIXED: Add flag to prevent multiple checks
  const router = useRouter()

  // Check for existing token on mount
  useEffect(() => {
    if (authChecked) {
      console.log('🔐 AuthContext: Auth already checked, skipping')
      return
    }

    const checkAuth = async () => {
      console.log('🔐 AuthContext: Checking authentication status on mount')
      
      try {
        // No token needed, backend reads from HttpOnly cookie
        const response = await fetch('http://localhost:8000/api/v1/auth/me', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })

        console.log('🔐 AuthContext: Auth check response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('🔐 AuthContext: Authentication check successful, user:', data.username)
          
          // FIXED: Set state atomically to prevent race conditions
          setInspector(data)
          setIsAuthenticated(true)
          console.log('🔐 AuthContext: Auth state set - isAuthenticated: TRUE, user:', data.username)
        } else {
          console.log('🔐 AuthContext: Authentication check failed, status:', response.status)
          setIsAuthenticated(false)
          setInspector(null)
        }
      } catch (e) {
        console.error('🔐 AuthContext: Authentication check error:', e)
        setIsAuthenticated(false)
        setInspector(null)
      } finally {
        // FIXED: Mark auth as checked and set loading to false
        setAuthChecked(true)
        setLoading(false)
        console.log('🔐 AuthContext: Auth check complete - loading: FALSE, checked: TRUE')
      }
    }

    checkAuth()
  }, [authChecked])

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('🔐 AuthContext: Starting login process for:', username)
    setLoading(true)
    setError(null)

    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      console.log('🔐 AuthContext: Sending login request to backend')
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString(),
        credentials: 'include'
      })

      if (response.ok) {
        // No need to store token, backend sets HttpOnly cookie
        // Get user profile
        console.log('🔐 AuthContext: Fetching user profile')
        const profileResponse = await fetch('http://localhost:8000/api/v1/auth/me', {
          credentials: 'include'
        })
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          console.log('🔐 AuthContext: Profile fetched, setting authenticated state')
          console.log('🔐 AuthContext: Profile data:', { username: profile.username, id: profile.id })
          
          // FIXED: Set state in correct order and ensure synchronous updates
          setInspector(profile)
          setIsAuthenticated(true)
          
          // FIXED: Set loading to false AFTER auth state is set
          // This prevents race conditions with AuthGuard
          setLoading(false)
          
          console.log('🔐 AuthContext: LOGIN COMPLETE - Auth state updated, AuthGuard will handle redirect')
          return true
        } else {
          throw new Error('Failed to fetch user profile')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Login failed'
      console.error('🔐 AuthContext: Login failed:', errorMessage)
      setError(errorMessage)
      setLoading(false)
      return false
    }
  }

  // Logout function
  const logout = async () => {
      try {
          // Call backend logout endpoint to clear HttpOnly cookie
          await fetch('http://localhost:8000/api/v1/auth/logout', {
              method: 'POST',
              credentials: 'include',
          });
      } catch (e) {
          console.error('Logout failed:', e);
      } finally {
          // Reset state and redirect to login page
          setIsAuthenticated(false);
          setInspector(null);
          router.push('/login');
      }
  }

  // Check if user has permission
  const hasPermission = (resource: string, action: string): boolean => {
    if (!inspector || !inspector.permissions) {
      return false
    }

    return (
      inspector.permissions.includes(`${resource}:${action}`) || // Specific permission
      inspector.permissions.includes(`${resource}:*`) || // All actions on resource
      inspector.permissions.includes(`*:${action}`) || // All resources for action
      inspector.permissions.includes('*:*') // Superuser
    )
  }

  // Check if user has specialty
  const hasSpecialty = (specialty: SpecialtyCode): boolean => {
    if (!inspector || !inspector.specialties) {
      return false
    }
    return inspector.specialties.includes(specialty)
  }

  // Check if user is admin
  const isAdmin = (): boolean => {
    if (!inspector || !inspector.roles) {
      return false
    }
    // Handle both string array and object array formats
    return inspector.roles.some((role: string | { name: string }) => {
      if (typeof role === 'string') {
        return role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator'
      }
      return role?.name?.toLowerCase() === 'admin' || role?.name?.toLowerCase() === 'administrator'
    })
  }

  // Check if user can access feature
  const canAccessFeature = (feature: string): boolean => {
    if (!inspector) return false

    // Admin can access everything
    if (isAdmin()) return true

    // Feature-specific checks
    switch (feature) {
      case 'admin_panel':
        return isAdmin()
      case 'psv_calibration':
        return hasSpecialty('PSV')
      case 'crane_inspection':
        return hasSpecialty('CRANE')
      case 'corrosion_analysis':
        return hasSpecialty('CORROSION')
      case 'bulk_import':
        return isAdmin()
      case 'bulk_export':
        return isAdmin() || hasSpecialty('PSV') || hasSpecialty('CRANE') || hasSpecialty('CORROSION')
      default:
        return false
    }
  }

  // Refresh user profile
  const refreshProfile = async (): Promise<void> => {
      try {
          const response = await fetch('http://localhost:8000/api/v1/auth/me', {
              credentials: 'include',
          });
  
          if (response.ok) {
              const profile = await response.json();
              setInspector(profile);
              setIsAuthenticated(true);
          } else {
              setIsAuthenticated(false);
              setInspector(null);
          }
      } catch (e) {
          console.error('Failed to refresh profile:', e);
          setIsAuthenticated(false);
          setInspector(null);
      }
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      inspector,
      login,
      logout,
      loading,
      error,
      hasPermission,
      hasSpecialty,
      isAdmin,
      canAccessFeature,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}
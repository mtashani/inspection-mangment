'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ModernLoading } from './modern-loading'
import { ModernAccessDenied } from './modern-access-denied'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Public routes that don't need authentication
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  useEffect(() => {
    console.log('🛡️ AuthGuard: Current state:', {
      loading,
      isAuthenticated,
      pathname,
      isPublicRoute,
      timestamp: new Date().toLocaleTimeString()
    })
    
    // Wait for authentication check to complete
    if (loading) {
      console.log('🛡️ AuthGuard: Still loading, waiting...')
      return
    }

    console.log('🛡️ AuthGuard: Loading complete, processing authentication')
    
    // FIXED: Handle authenticated users on login page
    if (isAuthenticated && pathname === '/login') {
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/equipment'
      console.log('🛡️ AuthGuard: Authenticated user on login page, redirecting to:', redirectTo)
      sessionStorage.removeItem('redirectAfterLogin')
      router.replace(redirectTo)
      return
    }
    
    // FIXED: Handle unauthenticated users on protected routes
    if (!isAuthenticated && !isPublicRoute) {
      console.log('🛡️ AuthGuard: Unauthenticated user on protected route, redirecting to login')
      if (pathname !== '/login') {
        console.log('🛡️ AuthGuard: Storing redirect path:', pathname)
        sessionStorage.setItem('redirectAfterLogin', pathname)
      }
      router.push('/login')
      return
    }
    
    console.log('🛡️ AuthGuard: No redirect needed')
  }, [loading, isAuthenticated, pathname, isPublicRoute, router])

  // Show loading state while checking authentication
  if (loading) {
    return <ModernLoading message="Checking authentication..." />
  }

  // Show access denied for unauthenticated users on protected routes
  if (!loading && !isAuthenticated && !isPublicRoute) {
    return (
      <ModernAccessDenied
        title="Authentication Required"
        message="You need to be logged in to access this page. Please sign in to continue."
        showHomeButton={false}
        showHelpButton={false}
      />
    )
  }

  return <>{children}</>
}
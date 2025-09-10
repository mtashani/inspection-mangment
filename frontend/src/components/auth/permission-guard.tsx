'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { SpecialtyCode } from '@/types/inspector'

interface PermissionGuardProps {
  children: ReactNode
  requiredPermission?: string
  requiredSpecialty?: SpecialtyCode
  requiredRole?: string
  adminOnly?: boolean
  fallback?: ReactNode
  className?: string
}

export default function PermissionGuard({
  children,
  requiredPermission,
  requiredSpecialty,
  requiredRole,
  adminOnly = false,
  fallback,
  className
}: PermissionGuardProps) {
  const { inspector, hasPermission, hasSpecialty, isAdmin } = useAuth()

  // If user is not authenticated, don't render anything
  if (!inspector) {
    return fallback ? <div className={className}>{fallback}</div> : null
  }

  // Check admin requirement
  if (adminOnly && !isAdmin()) {
    return fallback ? <div className={className}>{fallback}</div> : null
  }

  // Check specific role requirement
  if (requiredRole && !inspector.roles.some(role => role.name.toLowerCase() === requiredRole.toLowerCase())) {
    return fallback ? <div className={className}>{fallback}</div> : null
  }

  // Check permission requirement
  if (requiredPermission) {
    const [resource, action] = requiredPermission.split(':')
    if (!hasPermission(resource, action)) {
      return fallback ? <div className={className}>{fallback}</div> : null
    }
  }

  // Check specialty requirement
  if (requiredSpecialty && !hasSpecialty(requiredSpecialty)) {
    return fallback ? <div className={className}>{fallback}</div> : null
  }

  // All checks passed, render children
  return <div className={className}>{children}</div>
}

// Specialized components for common use cases
export function AdminOnly({ children, fallback, className }: { 
  children: ReactNode
  fallback?: ReactNode
  className?: string 
}) {
  return (
    <PermissionGuard adminOnly fallback={fallback} className={className}>
      {children}
    </PermissionGuard>
  )
}

export function SpecialtyRequired({ 
  specialty, 
  children, 
  fallback, 
  className 
}: { 
  specialty: SpecialtyCode
  children: ReactNode
  fallback?: ReactNode
  className?: string 
}) {
  return (
    <PermissionGuard requiredSpecialty={specialty} fallback={fallback} className={className}>
      {children}
    </PermissionGuard>
  )
}

export function RoleRequired({ 
  role, 
  children, 
  fallback, 
  className 
}: { 
  role: string
  children: ReactNode
  fallback?: ReactNode
  className?: string 
}) {
  return (
    <PermissionGuard requiredRole={role} fallback={fallback} className={className}>
      {children}
    </PermissionGuard>
  )
}

export function PermissionRequired({ 
  permission, 
  children, 
  fallback, 
  className 
}: { 
  permission: string
  children: ReactNode
  fallback?: ReactNode
  className?: string 
}) {
  return (
    <PermissionGuard requiredPermission={permission} fallback={fallback} className={className}>
      {children}
    </PermissionGuard>
  )
}

// Access denied fallback component
export function AccessDenied({ message, className }: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={`bg-red-50 border border-red-200 text-red-800 rounded-md p-4 ${className || ''}`}>
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div>
          <h3 className="text-sm font-medium">Access Denied</h3>
          <p className="text-sm mt-1">{message || 'You do not have permission to access this section.'}</p>
        </div>
      </div>
    </div>
  )
}

// Hook for checking permissions in components
export function usePermissions() {
  const { inspector, hasPermission, hasSpecialty, isAdmin } = useAuth()

  const checkAccess = {
    hasPermission: (resource: string, action: string) => hasPermission(resource, action),
    hasSpecialty: (specialty: SpecialtyCode) => hasSpecialty(specialty),
    isAdmin: () => isAdmin(),
    hasRole: (role: string) => inspector?.roles.some(r => r.name.toLowerCase() === role.toLowerCase()) || false,
    canAccess: (requirements: {
      permission?: string
      specialty?: SpecialtyCode
      role?: string
      adminOnly?: boolean
    }) => {
      if (!inspector) return false
      if (requirements.adminOnly && !isAdmin()) return false
      if (requirements.role && !checkAccess.hasRole(requirements.role)) return false
      if (requirements.permission) {
        const [resource, action] = requirements.permission.split(':')
        if (!hasPermission(resource, action)) return false
      }
      if (requirements.specialty && !hasSpecialty(requirements.specialty)) return false
      return true
    }
  }

  return checkAccess
}
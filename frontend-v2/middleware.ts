import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key-for-local-development-change-in-production'
const ALGORITHM = 'HS256'

// Route permissions mapping
const ROUTE_PERMISSIONS = {
  // Admin routes - permission-based
  '/admin': {
    type: 'permission' as const,
    required: ['system_superadmin', 'system_hr_manage']
  },
  
  // Inspector Management routes
  '/admin/inspectors': {
    type: 'permission' as const,
    required: ['system_hr_manage']
  },
  
  // RBAC Management - requires system_superadmin permission ONLY
  '/admin/rbac': {
    type: 'permission' as const,
    required: ['system_superadmin']
  },
  
  // Technical department routes - permission-based
  '/maintenance-events': {
    type: 'permission' as const,
    required: ['maintenance_view']
  },
  '/daily-reports': {
    type: 'permission' as const,
    required: ['maintenance_view'] // یا هر permission مناسب
  },
  
  // Inspection department routes
  '/psv': {
    type: 'permission' as const,
    required: ['mechanical_view']
  },
  '/ndt': {
    type: 'permission' as const,
    required: ['ndt_view']
  },
  '/corrosion': {
    type: 'permission' as const,
    required: ['corrosion_view']
  },
  
  // Public routes (no authentication required)
  '/dashboard': {
    type: 'public' as const
  },
  '/login': {
    type: 'public' as const
  },
  '/unauthorized': {
    type: 'public' as const
  }
}

type RouteConfig = {
  type: 'role' | 'permission' | 'public'
  required?: string[]
  permission?: string
}

interface JWTPayload {
  sub: string
  roles: string[]
  permissions: string[]
  exp: number
  iat: number
}

function checkRouteAccess(pathname: string, user: JWTPayload): boolean {
  // Find the most specific route match
  const routeKey = Object.keys(ROUTE_PERMISSIONS)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0] // Most specific first
  
  if (!routeKey) {
    // No specific rule found, allow access (default behavior)
    return true
  }
  
  const config = ROUTE_PERMISSIONS[routeKey as keyof typeof ROUTE_PERMISSIONS]
  
  switch (config.type) {
    case 'public':
      return true
    
    case 'role':
      const hasRole = user.roles?.some(role => 
        config.required?.some(requiredRole => {
          const normalizedUserRole = role?.trim()
          const normalizedRequiredRole = requiredRole.trim()
          return normalizedUserRole === normalizedRequiredRole || 
                 normalizedUserRole.toLowerCase() === normalizedRequiredRole.toLowerCase()
        })
      ) || false
      
      const hasPermission = config.permission ? 
        user.permissions?.includes(config.permission) || false : false
      
      return hasRole || hasPermission
    
    case 'permission':
      return user.permissions?.some(permission => 
        config.required?.includes(permission)
      ) || false
    
    default:
      return false
  }
}
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Always log middleware execution
  console.log(`🚀 MIDDLEWARE running for: ${pathname}`)
  
  const response = NextResponse.next()
  response.headers.set('x-middleware-executed', 'true')
  response.headers.set('x-middleware-path', pathname)

  // Check if route needs protection
  const routeKey = Object.keys(ROUTE_PERMISSIONS)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0]
    
  if (!routeKey) {
    // No specific rule, allow access (default behavior)
    console.log('🟢 No specific route rule - allowing access')
    return response
  }
  
  const config = ROUTE_PERMISSIONS[routeKey as keyof typeof ROUTE_PERMISSIONS]
  
  if (config.type === 'public') {
    console.log('🟢 Public route - allowing access')
    return response
  }
  
  // Protected route - check authentication
  console.log(`🛡️ Protected route detected: ${routeKey} (${config.type})`)
  
  // Get token from cookie
  const token = request.cookies.get('access_token')?.value
  
  if (!token) {
    console.log('❌ No token found - redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verify JWT token
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const user = payload as unknown as JWTPayload
    
    console.log('🎯 Token verified, checking access for:', {
      route: routeKey,
      type: config.type,
      required: config.required,
      userRoles: user.roles,
      userPermissions: user.permissions
    })
    
    // Check route access
    const hasAccess = checkRouteAccess(pathname, user)
    
    if (!hasAccess) {
      console.log('❌ Access denied - insufficient permissions')
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    console.log('✅ Access granted')
    response.headers.set('x-access-granted', 'true')
    response.headers.set('x-user-id', user.sub)
    response.headers.set('x-user-roles', JSON.stringify(user.roles))
    response.headers.set('x-user-permissions', JSON.stringify(user.permissions))
    
  } catch (error) {
    console.error('❌ JWT verification failed:', error)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
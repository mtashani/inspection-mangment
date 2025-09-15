import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key-for-local-development-change-in-production'
const ALGORITHM = 'HS256'

interface JWTPayload {
  sub: string
  roles: string[]
  permissions: string[]
  exp: number
  iat: number
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Always log middleware execution
  console.log(`🚀 MIDDLEWARE running for: ${pathname}`)
  
  const response = NextResponse.next()
  response.headers.set('x-middleware-executed', 'true')
  response.headers.set('x-middleware-path', pathname)

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    console.log('🛡️ Admin route detected')
    
    // Get token from cookie
    const token = request.cookies.get('access_token')?.value
    
    if (!token) {
      console.log('❌ No token found - redirecting to login')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      // Debug: Log token and secret info
      console.log('🔑 Token length:', token.length)
      console.log('🔐 JWT_SECRET preview:', JWT_SECRET.substring(0, 20) + '...')
      
      // Try to decode JWT manually to see what's inside
      try {
        const parts = token.split('.')
        if (parts.length === 3) {
          const header = JSON.parse(atob(parts[0]))
          const payload = JSON.parse(atob(parts[1]))
          console.log('🔍 JWT Header:', header)
          console.log('🔍 JWT Payload preview:', {
            sub: payload.sub,
            roles: payload.roles,
            exp: payload.exp,
            iat: payload.iat,
            alg: header.alg
          })
        }
      } catch (e) {
        console.log('⚠️ Could not decode JWT manually:', e.message)
      }
      
      // Verify JWT token
      const secret = new TextEncoder().encode(JWT_SECRET)
      const { payload } = await jwtVerify(token, secret)
      const user = payload as unknown as JWTPayload
      
      console.log('🎯 Token verified, user roles:', user.roles)
      
      // Check if user has admin role (exact match for 'Global Admin')
      const isAdmin = user.roles?.includes('Global Admin') || false
      
      if (!isAdmin) {
        console.log('❌ User is not admin - redirecting to unauthorized')
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      
      console.log('✅ Admin access granted')
      response.headers.set('x-admin-access', 'granted')
      response.headers.set('x-user-id', user.sub)
      response.headers.set('x-user-roles', JSON.stringify(user.roles))
      
    } catch (error) {
      console.error('❌ JWT verification failed:', error)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
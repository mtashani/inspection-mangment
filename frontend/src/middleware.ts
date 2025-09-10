import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't need authentication
  const publicRoutes = ['/login']
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // FIXED: Let AuthGuard handle all authentication logic
  // Middleware was conflicting with React-based authentication
  console.log('🔧 Middleware: Allowing request to:', pathname)
  console.log('🔧 Middleware: Available cookies:', request.cookies.getAll().map(c => c.name))
  
  // Allow all requests through - AuthGuard will handle authentication
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files and api routes
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
}
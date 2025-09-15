import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE IS WORKING!', request.nextUrl.pathname)
  
  const response = NextResponse.next()
  response.headers.set('x-test-middleware', 'working')
  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
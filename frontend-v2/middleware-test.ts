import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE IS RUNNING!', request.nextUrl.pathname)
  
  const response = NextResponse.next()
  response.headers.set('x-middleware-test', 'working')
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*),'
  ],
}
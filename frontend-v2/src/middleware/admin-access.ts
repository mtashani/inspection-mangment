import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  sub: string;
  username: string;
  roles: string[];
  exp: number;
  iat: number;
}

/**
 * Validates admin access from JWT token
 */
export async function validateAdminAccess(request: NextRequest): Promise<{
  isValid: boolean;
  isAdmin: boolean;
  user?: JWTPayload;
  error?: string;
}> {
  try {
    // Get token from Authorization header or cookie
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // Try to get from cookie
      token = request.cookies.get('access_token')?.value;
    }

    if (!token) {
      return {
        isValid: false,
        isAdmin: false,
        error: 'No authentication token provided'
      };
    }

    // Verify JWT token
    console.log('🔑 JWT Secret being used:', JWT_SECRET?.substring(0, 10) + '...');
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    try {
      const { payload } = await jwtVerify(token, secret);
      
      const user = payload as unknown as JWTPayload;
      console.log('🎯 Decoded JWT payload:', {
        sub: user.sub,
        username: user.username,
        roles: user.roles,
        exp: user.exp,
        iat: user.iat,
        tokenExpiry: user.exp ? new Date(user.exp * 1000).toISOString() : 'No expiry',
        currentTime: new Date().toISOString(),
        isExpired: user.exp ? Date.now() >= user.exp * 1000 : false
      });
      
      // Check if token is expired
      if (user.exp && Date.now() >= user.exp * 1000) {
        console.error('❌ Token has expired!');
        return {
          isValid: false,
          isAdmin: false,
          error: 'Token has expired'
        };
      }

      // Check if user has admin role (check for 'admin' substring in any role)
      const isAdmin = user.roles?.some(role => {
        const hasAdmin = role.toLowerCase().includes('admin');
        console.log(`🔍 Checking role "${role}" - contains admin: ${hasAdmin}`);
        return hasAdmin;
      }) || false;
      
      // Debug logging
      console.log('🔍 Final admin access check result:', {
        userRoles: user.roles,
        isAdmin,
        userId: user.sub,
        username: user.username
      });

      return {
        isValid: true,
        isAdmin,
        user
      };
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', {
        error: jwtError.message,
        tokenPreview: token.substring(0, 50) + '...',
        secretPreview: JWT_SECRET?.substring(0, 10) + '...'
      });
      throw jwtError;
    }
  } catch (error) {
    console.error('❌ JWT verification failed:', error);
    return {
      isValid: false,
      isAdmin: false,
      error: error instanceof Error ? error.message : 'Token validation failed'
    };
  }
}

/**
 * Middleware function to protect admin routes
 */
export async function adminAccessMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply to admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const validation = await validateAdminAccess(request);

  if (!validation.isValid) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!validation.isAdmin) {
    // Redirect to unauthorized page if not admin
    const unauthorizedUrl = new URL('/unauthorized', request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Add user info to headers for use in components
  const response = NextResponse.next();
  response.headers.set('x-user-id', validation.user?.sub || '');
  response.headers.set('x-user-roles', JSON.stringify(validation.user?.roles || []));
  
  return response;
}

/**
 * Server-side admin access validation for API routes
 */
export async function validateAdminAPIAccess(request: NextRequest): Promise<{
  success: boolean;
  user?: JWTPayload;
  error?: string;
  status?: number;
}> {
  const validation = await validateAdminAccess(request);

  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error || 'Authentication failed',
      status: 401
    };
  }

  if (!validation.isAdmin) {
    return {
      success: false,
      error: 'Admin access required',
      status: 403
    };
  }

  return {
    success: true,
    user: validation.user
  };
}

/**
 * Higher-order function to wrap API handlers with admin access validation
 */
export function withAdminAccess(
  handler: (request: NextRequest, context: { user: JWTPayload }) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const validation = await validateAdminAPIAccess(request);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    return handler(request, { user: validation.user! });
  };
}

/**
 * Client-side utility to check admin access
 */
export function checkClientAdminAccess(): {
  hasToken: boolean;
  token: string | null;
} {
  if (typeof window === 'undefined') {
    return { hasToken: false, token: null };
  }

  const token = localStorage.getItem('access_token') || 
                document.cookie
                  .split('; ')
                  .find(row => row.startsWith('access_token='))
                  ?.split('=')[1];

  return {
    hasToken: !!token,
    token: token || null
  };
}
/**
 * Authentication and Session Debug Test
 * This utility helps diagnose authentication and session issues
 */

interface AuthTestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
}

interface SessionInfo {
  hasToken: boolean
  tokenValue?: string
  tokenLength?: number
  tokenParts?: number
  decodedHeader?: any
  decodedPayload?: any
  isExpired?: boolean
  expiryDate?: string
  roles?: string[]
  permissions?: string[]
}

export class AuthSessionTester {
  private results: AuthTestResult[] = []

  constructor() {
    this.results = []
  }

  // Check if we're running in browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined'
  }

  // Get cookie value by name
  private getCookie(name: string): string | null {
    if (!this.isBrowser()) return null
    
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  // Decode JWT token without verification
  private decodeJWT(token: string): { header: any; payload: any } | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      
      return { header, payload }
    } catch (error) {
      return null
    }
  }

  // Check if token is expired
  private isTokenExpired(payload: any): boolean {
    if (!payload.exp) return true
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
  }

  // Format timestamp
  private formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString()
  }

  // Test 1: Check if access token exists
  private testTokenPresence(): SessionInfo {
    const token = this.getCookie('access_token')
    
    if (!token) {
      this.results.push({
        test: 'Token Presence',
        status: 'FAIL',
        message: 'No access_token cookie found'
      })
      return { hasToken: false }
    }

    this.results.push({
      test: 'Token Presence',
      status: 'PASS',
      message: `Access token found (${token.length} characters)`
    })

    return {
      hasToken: true,
      tokenValue: token,
      tokenLength: token.length
    }
  }

  // Test 2: Validate token structure
  private testTokenStructure(sessionInfo: SessionInfo): SessionInfo {
    if (!sessionInfo.hasToken || !sessionInfo.tokenValue) {
      this.results.push({
        test: 'Token Structure',
        status: 'FAIL',
        message: 'No token to validate'
      })
      return sessionInfo
    }

    const parts = sessionInfo.tokenValue.split('.')
    sessionInfo.tokenParts = parts.length

    if (parts.length !== 3) {
      this.results.push({
        test: 'Token Structure',
        status: 'FAIL',
        message: `Invalid JWT structure. Expected 3 parts, got ${parts.length}`
      })
      return sessionInfo
    }

    const decoded = this.decodeJWT(sessionInfo.tokenValue)
    if (!decoded) {
      this.results.push({
        test: 'Token Structure',
        status: 'FAIL',
        message: 'Failed to decode JWT token'
      })
      return sessionInfo
    }

    sessionInfo.decodedHeader = decoded.header
    sessionInfo.decodedPayload = decoded.payload

    this.results.push({
      test: 'Token Structure',
      status: 'PASS',
      message: 'JWT token structure is valid',
      details: {
        algorithm: decoded.header.alg,
        type: decoded.header.typ
      }
    })

    return sessionInfo
  }

  // Test 3: Check token expiration
  private testTokenExpiration(sessionInfo: SessionInfo): SessionInfo {
    if (!sessionInfo.decodedPayload) {
      this.results.push({
        test: 'Token Expiration',
        status: 'FAIL',
        message: 'No payload to check expiration'
      })
      return sessionInfo
    }

    const payload = sessionInfo.decodedPayload
    const isExpired = this.isTokenExpired(payload)
    sessionInfo.isExpired = isExpired

    if (payload.exp) {
      sessionInfo.expiryDate = this.formatTimestamp(payload.exp)
    }

    if (isExpired) {
      this.results.push({
        test: 'Token Expiration',
        status: 'FAIL',
        message: `Token has expired`,
        details: {
          expiryDate: sessionInfo.expiryDate,
          currentTime: new Date().toLocaleString()
        }
      })
    } else {
      this.results.push({
        test: 'Token Expiration',
        status: 'PASS',
        message: `Token is valid until ${sessionInfo.expiryDate}`
      })
    }

    return sessionInfo
  }

  // Test 4: Check user roles and permissions
  private testUserPermissions(sessionInfo: SessionInfo): SessionInfo {
    if (!sessionInfo.decodedPayload) {
      this.results.push({
        test: 'User Permissions',
        status: 'FAIL',
        message: 'No payload to check permissions'
      })
      return sessionInfo
    }

    const payload = sessionInfo.decodedPayload
    sessionInfo.roles = payload.roles || []
    sessionInfo.permissions = payload.permissions || []

    // Check for admin roles
    const adminRoles = ['Super Admin', 'Global Admin', 'System Administrator']
    const hasAdminRole = sessionInfo.roles.some(role => 
      adminRoles.some(adminRole => 
        role.toLowerCase().trim() === adminRole.toLowerCase().trim()
      )
    )

    // Check for admin permissions
    const hasAdminPermission = sessionInfo.permissions.includes('system_superadmin')

    if (hasAdminRole || hasAdminPermission) {
      this.results.push({
        test: 'User Permissions',
        status: 'PASS',
        message: 'User has admin access',
        details: {
          roles: sessionInfo.roles,
          permissions: sessionInfo.permissions,
          hasAdminRole,
          hasAdminPermission
        }
      })
    } else {
      this.results.push({
        test: 'User Permissions',
        status: 'FAIL',
        message: 'User does not have admin access',
        details: {
          roles: sessionInfo.roles,
          permissions: sessionInfo.permissions,
          requiredRoles: adminRoles,
          requiredPermissions: ['system_superadmin']
        }
      })
    }

    return sessionInfo
  }

  // Test 5: Check localStorage/sessionStorage
  private testLocalStorage(): void {
    if (!this.isBrowser()) {
      this.results.push({
        test: 'Local Storage',
        status: 'WARNING',
        message: 'Not running in browser environment'
      })
      return
    }

    const authData = localStorage.getItem('auth')
    const userData = localStorage.getItem('user')
    const sessionData = sessionStorage.getItem('auth')

    const storageInfo = {
      localStorage_auth: authData ? 'present' : 'not found',
      localStorage_user: userData ? 'present' : 'not found',
      sessionStorage_auth: sessionData ? 'present' : 'not found'
    }

    this.results.push({
      test: 'Local Storage',
      status: 'PASS',
      message: 'Storage check completed',
      details: storageInfo
    })
  }

  // Test 6: Test API connectivity
  private async testApiConnectivity(): Promise<void> {
    try {
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        this.results.push({
          test: 'API Connectivity',
          status: 'PASS',
          message: 'Auth endpoint is accessible and user is authenticated',
          details: data
        })
      } else if (response.status === 401) {
        this.results.push({
          test: 'API Connectivity',
          status: 'FAIL',
          message: 'Authentication failed - token is invalid or expired'
        })
      } else {
        this.results.push({
          test: 'API Connectivity',
          status: 'FAIL',
          message: `Auth endpoint failed: ${response.status} ${response.statusText}`
        })
      }
    } catch (error) {
      this.results.push({
        test: 'API Connectivity',
        status: 'FAIL',
        message: 'Failed to connect to auth endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Run all tests
  public async runAllTests(): Promise<{
    summary: {
      total: number
      passed: number
      failed: number
      warnings: number
    }
    sessionInfo: SessionInfo
    results: AuthTestResult[]
    recommendations: string[]
  }> {
    console.log('🔍 Starting Authentication & Session Debug Tests...')
    
    this.results = []
    
    // Run synchronous tests
    let sessionInfo = this.testTokenPresence()
    sessionInfo = this.testTokenStructure(sessionInfo)
    sessionInfo = this.testTokenExpiration(sessionInfo)
    sessionInfo = this.testUserPermissions(sessionInfo)
    this.testLocalStorage()

    // Run async tests
    await this.testApiConnectivity()

    // Calculate summary
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARNING').length
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(sessionInfo)

    return {
      summary,
      sessionInfo,
      results: this.results,
      recommendations
    }
  }

  // Generate recommendations based on test results
  private generateRecommendations(sessionInfo: SessionInfo): string[] {
    const recommendations: string[] = []

    if (!sessionInfo.hasToken) {
      recommendations.push('🔑 No access token found. Please log in again.')
      recommendations.push('🧹 Clear browser cookies and cache before logging in.')
    } else if (sessionInfo.isExpired) {
      recommendations.push('⏰ Your session has expired. Please log in again.')
      recommendations.push('🔄 Consider implementing automatic token refresh.')
    } else if (sessionInfo.roles && sessionInfo.roles.length === 0) {
      recommendations.push('👤 No roles assigned to user. Contact administrator.')
    } else if (!this.results.find(r => r.test === 'User Permissions' && r.status === 'PASS')) {
      recommendations.push('🚫 Insufficient permissions for admin access.')
      recommendations.push('📞 Contact administrator to assign admin role.')
    }

    if (this.results.some(r => r.test === 'API Connectivity' && r.status === 'FAIL')) {
      recommendations.push('🌐 API connectivity issues detected. Check network connection.')
      recommendations.push('🔧 Verify backend server is running.')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All tests passed. If you still cannot access admin pages, try:')
      recommendations.push('🔄 Refresh the page and try again.')
      recommendations.push('🧹 Clear browser cache and cookies.')
      recommendations.push('🔍 Check browser console for JavaScript errors.')
    }

    return recommendations
  }

  // Print results to console
  public printResults(testResults: any): void {
    console.log('\n' + '='.repeat(50))
    console.log('🔍 AUTHENTICATION & SESSION DEBUG REPORT')
    console.log('='.repeat(50))
    
    console.log('\n📊 SUMMARY:')
    console.log(`Total Tests: ${testResults.summary.total}`)
    console.log(`✅ Passed: ${testResults.summary.passed}`)
    console.log(`❌ Failed: ${testResults.summary.failed}`)
    console.log(`⚠️  Warnings: ${testResults.summary.warnings}`)

    console.log('\n🔍 DETAILED RESULTS:')
    testResults.results.forEach((result: AuthTestResult) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
      console.log(`${icon} ${result.test}: ${result.message}`)
      if (result.details) {
        console.log(`   Details:`, result.details)
      }
    })

    console.log('\n📋 SESSION INFO:')
    console.log(`Token Present: ${testResults.sessionInfo.hasToken}`)
    if (testResults.sessionInfo.hasToken) {
      console.log(`Token Length: ${testResults.sessionInfo.tokenLength}`)
      console.log(`Token Expired: ${testResults.sessionInfo.isExpired}`)
      console.log(`Expiry Date: ${testResults.sessionInfo.expiryDate}`)
      console.log(`Roles: ${JSON.stringify(testResults.sessionInfo.roles)}`)
      console.log(`Permissions: ${JSON.stringify(testResults.sessionInfo.permissions)}`)
    }

    console.log('\n💡 RECOMMENDATIONS:')
    testResults.recommendations.forEach((rec: string) => {
      console.log(`   ${rec}`)
    })

    console.log('\n' + '='.repeat(50))
  }
}

// Helper function to run tests from browser console
export async function runAuthDebugTest(): Promise<void> {
  const tester = new AuthSessionTester()
  const results = await tester.runAllTests()
  tester.printResults(results)
  return results
}

// Export for use in components
export default AuthSessionTester
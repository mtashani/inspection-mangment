/**
 * WebSocket Authentication Test
 * 
 * This script can be run in the browser console to test
 * the real authentication integration with WebSocket connections.
 */

// Import types and services
import { authService } from '@/lib/auth';
import { webSocketService } from '@/lib/services/websocket-service';

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  roles: string[];
};

const wsAuthTest = {
  /**
   * Test authentication token retrieval
   */
  testTokenRetrieval() {
    console.log('🧪 Testing Authentication Token Retrieval...')
    
    // Check token
    const token = authService.getToken()
    console.log('🔑 Token status:', token ? '✅ Found' : '❌ Not found')
    
    if (token) {
      // Don't log the full token for security, just show it exists and length
      console.log(`📏 Token length: ${token.length} characters`)
      console.log(`🔍 Token preview: ${token.substring(0, 20)}...`)
      
      // Check if it looks like a JWT
      const parts = token.split('.')
      if (parts.length === 3) {
        console.log('✅ Token appears to be a valid JWT (3 parts)')
        
        try {
          // Decode header (don't decode payload for security)
          const header = JSON.parse(atob(parts[0]))
          console.log('📋 JWT Header:', header)
        } catch (e) {
          console.warn('⚠️ Could not decode JWT header')
        }
      } else {
        console.warn(`⚠️ Token doesn't look like JWT (${parts.length} parts instead of 3)`)
      }
    }
    
    return !!token
  },

  /**
   * Test WebSocket connection with real authentication
   */
  async testWebSocketAuth() {
    console.log('🧪 Testing WebSocket Authentication...')
    
    const hasToken = this.testTokenRetrieval()
    
    if (!hasToken) {
      console.error('❌ No token available. Please login first.')
      console.log('💡 To login, go to the login page and enter credentials.')
      return false
    }
    
    // Test WebSocket connection
    console.log('🔌 Testing WebSocket connection...')
    
    try {
      const status = webSocketService.getConnectionStatus()
      console.log('📊 Current WebSocket status:', status)
      
      if (!status.connected && !status.connecting) {
        console.log('🔄 Attempting to connect...')
        
        const token = authService.getToken()
        if (token) {
          await webSocketService.connect(token)
          
          // Wait a bit and check status
          setTimeout(() => {
            const newStatus = webSocketService.getConnectionStatus()
            console.log('📊 New WebSocket status:', newStatus)
            
            if (newStatus.connected) {
              console.log('✅ WebSocket connected successfully!')
            } else {
              console.log('❌ WebSocket connection failed')
            }
          }, 2000)
        }
      } else {
        console.log('ℹ️ WebSocket already connected or connecting')
      }
    } catch (error) {
      console.error('❌ WebSocket connection test failed:', error)
      return false
    }
    
    return true
  },

  /**
   * Test authentication status
   */
  testAuthStatus() {
    console.log('🧪 Testing Authentication Status...')
    
    const isAuthenticated = authService.isAuthenticated()
    console.log('🔐 Authentication status:', isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated')
    
    if (isAuthenticated) {
      console.log('👤 Attempting to get current user...')
      
      authService.getCurrentUser()
        .then((user: User) => {
          console.log('✅ Current user:', {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            roles: user.roles
          })
        })
        .catch((error: any) => {
          console.error('❌ Failed to get current user:', error)
        })
    }
    
    return isAuthenticated
  },

  /**
   * Run all authentication tests
   */
  async runAllTests() {
    console.log('🚀 Starting WebSocket Authentication Tests...')
    console.log('==========================================')
    
    const authStatus = this.testAuthStatus()
    
    if (authStatus) {
      await this.testWebSocketAuth()
    } else {
      console.log('⚠️ User not authenticated. WebSocket test skipped.')
      console.log('💡 To test WebSocket connection, please login first.')
    }
    
    console.log('==========================================')
    console.log('✅ Authentication tests completed!')
    
    // Provide helpful next steps
    if (!authStatus) {
      console.log('📋 Next steps:')
      console.log('1. Go to the login page')
      console.log('2. Login with valid credentials')
      console.log('3. Run this test again: wsAuthTest.runAllTests()')
    } else {
      console.log('📋 WebSocket should now connect automatically!')
      console.log('🔔 Try creating a new maintenance event to test notifications.')
    }
  }
}

// Export for browser console use
if (typeof window !== 'undefined') {
  (window as any).wsAuthTest = wsAuthTest
  
  console.log('🧪 WebSocket Authentication Test loaded!')
  console.log('💡 Run: wsAuthTest.runAllTests()')
  console.log('🔧 Individual tests: wsAuthTest.testTokenRetrieval(), wsAuthTest.testAuthStatus()')
}

export default wsAuthTest
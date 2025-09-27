/**
 * Console-based Authentication Debug Test
 * Run this script in browser console to debug auth issues
 * 
 * Usage: Copy and paste this entire script into browser console
 */

(function() {
  console.log('🔍 Starting Authentication Debug Test...')
  
  // Helper function to get cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop().split(';').shift()
    }
    return null
  }

  // Helper function to decode JWT
  function decodeJWT(token) {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      
      return { header, payload }
    } catch (error) {
      return null
    }
  }

  // Helper function to check if token is expired
  function isTokenExpired(payload) {
    if (!payload.exp) return true
    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
  }

  // Helper function to format timestamp
  function formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleString()
  }

  // Main debug function
  function debugAuth() {
    console.log('\n' + '='.repeat(60))
    console.log('🔐 AUTHENTICATION DEBUG REPORT')
    console.log('='.repeat(60))
    
    const results = {
      issues: [],
      recommendations: []
    }

    // Test 1: Check access token
    console.log('\n1️⃣ Checking Access Token...')
    const token = getCookie('access_token')
    
    if (!token) {
      console.log('❌ No access token found in cookies')
      results.issues.push('No access token cookie')
      results.recommendations.push('Log in again to get new token')
    } else {
      console.log(`✅ Access token found (${token.length} characters)`)
      console.log('🔹 Token preview:', token.substring(0, 50) + '...')
      
      // Test 2: Check token structure
      console.log('\n2️⃣ Checking Token Structure...')
      const decoded = decodeJWT(token)
      
      if (!decoded) {
        console.log('❌ Invalid JWT token structure')
        results.issues.push('Invalid JWT token structure')
        results.recommendations.push('Clear cookies and log in again')
      } else {
        console.log('✅ Valid JWT token structure')
        console.log('🔹 Algorithm:', decoded.header.alg)
        console.log('🔹 Token Type:', decoded.header.typ)
        
        // Test 3: Check token expiration
        console.log('\n3️⃣ Checking Token Expiration...')
        const isExpired = isTokenExpired(decoded.payload)
        
        if (isExpired) {
          console.log('❌ Token has expired')
          if (decoded.payload.exp) {
            console.log('🔹 Expired on:', formatTimestamp(decoded.payload.exp))
          }
          results.issues.push('Token has expired')
          results.recommendations.push('Session expired - log in again')
        } else {
          console.log('✅ Token is still valid')
          if (decoded.payload.exp) {
            console.log('🔹 Expires on:', formatTimestamp(decoded.payload.exp))
          }
        }
        
        // Test 4: Check user info
        console.log('\n4️⃣ Checking User Information...')
        console.log('🔹 User ID:', decoded.payload.sub || 'Not found')
        console.log('🔹 Issued at:', decoded.payload.iat ? formatTimestamp(decoded.payload.iat) : 'Not found')
        
        // Test 5: Check roles and permissions
        console.log('\n5️⃣ Checking Roles and Permissions...')
        const roles = decoded.payload.roles || []
        const permissions = decoded.payload.permissions || []
        
        console.log('🔹 User Roles:', roles)
        console.log('🔹 User Permissions:', permissions)
        
        // Check for admin access
        const adminRoles = ['Super Admin', 'Global Admin', 'System Administrator']
        const hasAdminRole = roles.some(role => 
          adminRoles.some(adminRole => 
            role.toLowerCase().trim() === adminRole.toLowerCase().trim()
          )
        )
        const hasAdminPermission = permissions.includes('system_superadmin')
        
        if (hasAdminRole || hasAdminPermission) {
          console.log('✅ User has admin access')
        } else {
          console.log('❌ User does not have admin access')
          results.issues.push('Insufficient admin permissions')
          results.recommendations.push('Contact administrator to assign admin role')
        }
      }
    }

    // Test 6: Check other storage
    console.log('\n6️⃣ Checking Browser Storage...')
    const authData = localStorage.getItem('auth')
    const userData = localStorage.getItem('user')
    const sessionData = sessionStorage.getItem('auth')
    
    console.log('🔹 localStorage auth:', authData ? 'Present' : 'Not found')
    console.log('🔹 localStorage user:', userData ? 'Present' : 'Not found')
    console.log('🔹 sessionStorage auth:', sessionData ? 'Present' : 'Not found')

    // Test 7: Check current URL and admin access
    console.log('\n7️⃣ Checking Current Page Access...')
    const currentPath = window.location.pathname
    console.log('🔹 Current path:', currentPath)
    
    if (currentPath.startsWith('/admin')) {
      console.log('🔹 Trying to access admin page')
      if (results.issues.length > 0) {
        console.log('❌ Admin access blocked due to authentication issues')
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 SUMMARY')
    console.log('='.repeat(60))
    
    if (results.issues.length === 0) {
      console.log('✅ No authentication issues detected!')
      console.log('💡 If you still cannot access admin pages, try:')
      console.log('   - Refresh the page')
      console.log('   - Check for JavaScript errors in console')
      console.log('   - Clear browser cache')
    } else {
      console.log('❌ Issues found:')
      results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
      
      console.log('\n💡 Recommendations:')
      results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`)
      })
    }

    // Quick fix buttons
    console.log('\n🔧 QUICK ACTIONS:')
    console.log('Run these commands to fix common issues:')
    console.log('')
    console.log('// Clear all cookies and reload page')
    console.log('document.cookie.split(";").forEach(c => { const eqPos = c.indexOf("="); const name = eqPos > -1 ? c.substr(0, eqPos) : c; document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"; }); localStorage.clear(); sessionStorage.clear(); window.location.reload();')
    console.log('')
    console.log('// Go to login page')
    console.log('window.location.href = "/login"')
    console.log('')
    console.log('// Go to admin page (test access)')
    console.log('window.location.href = "/admin"')
    
    console.log('\n' + '='.repeat(60))
    
    return {
      token: token ? 'Present' : 'Missing',
      decoded: token ? decodeJWT(token) : null,
      issues: results.issues,
      recommendations: results.recommendations
    }
  }

  // Run the debug test
  const result = debugAuth()
  
  // Make result available globally for further inspection
  window.authDebugResult = result
  
  console.log('\n🔍 Debug complete! Result stored in window.authDebugResult')
  console.log('📝 You can inspect the full result object by typing: window.authDebugResult')
  
  return result
})()
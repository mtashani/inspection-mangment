/**
 * Debug script to test admin authentication
 * Run this in the browser console after logging in
 */

async function debugAdminAuth() {
  console.log('🔍 Debugging Admin Authentication...');
  console.log('=' * 50);
  
  // 1. Check stored tokens
  const accessToken = localStorage.getItem('access_token');
  const authToken = localStorage.getItem('auth_token'); // Old key
  
  console.log('📦 Token Storage:');
  console.log('  access_token:', accessToken ? `✅ Present (${accessToken.length} chars)` : '❌ Missing');
  console.log('  auth_token (old):', authToken ? `⚠️ Present (${authToken.length} chars)` : '✅ Correctly absent');
  
  if (!accessToken) {
    console.log('❌ No access token found. Please login first.');
    return;
  }
  
  // 2. Decode JWT token manually
  try {
    const parts = accessToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('🎯 JWT Payload:');
      console.log('  User ID:', payload.sub);
      console.log('  Roles:', payload.roles);
      console.log('  Permissions:', payload.permissions?.length || 0, 'permissions');
      console.log('  Expires:', new Date(payload.exp * 1000).toLocaleString());
      console.log('  Is Expired:', Date.now() >= payload.exp * 1000);
      
      // Check admin role
      const hasAdmin = payload.roles?.includes('Global Admin');
      console.log('  Has Global Admin:', hasAdmin ? '✅ Yes' : '❌ No');
      
      if (!hasAdmin) {
        console.log('⚠️ User does not have Global Admin role. Current roles:', payload.roles);
        return;
      }
    }
  } catch (e) {
    console.log('❌ Failed to decode JWT:', e.message);
    return;
  }
  
  // 3. Test cookie presence
  const cookies = document.cookie;
  const hasAccessTokenCookie = cookies.includes('access_token=');
  console.log('🍪 Cookie Status:');
  console.log('  access_token cookie:', hasAccessTokenCookie ? '✅ Present' : '❌ Missing');
  console.log('  All cookies:', cookies || 'None');
  
  // 4. Test admin API endpoints
  const apiBaseUrl = 'http://localhost:8000/api/v1';
  
  console.log('🧪 Testing Admin API Endpoints...');
  
  // Test dashboard stats
  try {
    const dashboardResponse = await fetch(`${apiBaseUrl}/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Dashboard API:');
    console.log('  Status:', dashboardResponse.status, dashboardResponse.statusText);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('  Response:', dashboardData);
    } else {
      const errorText = await dashboardResponse.text();
      console.log('  Error:', errorText);
    }
  } catch (error) {
    console.log('📊 Dashboard API Error:', error.message);
  }
  
  // Test inspectors endpoint
  try {
    const inspectorsResponse = await fetch(`${apiBaseUrl}/inspectors`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('👥 Inspectors API:');
    console.log('  Status:', inspectorsResponse.status, inspectorsResponse.statusText);
    
    if (inspectorsResponse.ok) {
      const inspectorsData = await inspectorsResponse.json();
      console.log('  Response length:', Array.isArray(inspectorsData) ? inspectorsData.length : 'Not an array');
    } else {
      const errorText = await inspectorsResponse.text();
      console.log('  Error:', errorText);
    }
  } catch (error) {
    console.log('👥 Inspectors API Error:', error.message);
  }
  
  console.log('✅ Admin authentication debug complete!');
}

// Auto-run if this is being executed
if (typeof window !== 'undefined') {
  debugAdminAuth();
}
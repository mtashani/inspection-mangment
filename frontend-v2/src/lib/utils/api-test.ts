/**
 * API testing utilities for debugging
 */

import { maintenanceEventsApi } from '@/lib/api/maintenance-events';

export async function testMaintenanceEventsAPI() {
  console.group('🔍 Testing Maintenance Events API');
  
  try {
    // Test events list
    console.log('Testing events list...');
    const events = await maintenanceEventsApi.getMaintenanceEvents();
    console.log('✅ Events list:', events);
    
    // Test events summary
    console.log('Testing events summary...');
    const summary = await maintenanceEventsApi.getEventsSummary();
    console.log('✅ Events summary:', summary);
    
    console.log('🎉 All API tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    console.groupEnd();
  }
}

// Helper to test API with authentication
export async function testAPIWithAuth() {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    console.warn('⚠️ No authentication token found. Please login first.');
    return;
  }
  
  console.log('🔑 Token found, testing API...');
  await testMaintenanceEventsAPI();
}

// Add to window for manual testing
if (typeof window !== 'undefined') {
  (window as any).testAPI = testAPIWithAuth;
  (window as any).testMaintenanceEventsAPI = testMaintenanceEventsAPI;
  
  // Also add direct API testing
  (window as unknown).testDirectAPI = async () => {
    const token = localStorage.getItem('access_token');
    console.log('Token:', token ? 'Found' : 'Not found');
    
    if (!token) {
      console.error('No token found. Please login first.');
      return;
    }
    
    try {
      // Test direct fetch
      const response = await fetch('http://localhost:8000/api/v1/maintenance/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Direct fetch response:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Direct fetch data:', data);
      } else {
        const errorText = await response.text();
        console.error('Direct fetch error:', errorText);
      }
    } catch (error) {
      console.error('Direct fetch failed:', error);
    }
  };
}
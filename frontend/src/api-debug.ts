// API Debug Helper
// This file helps diagnose API connectivity issues

import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function testApiConnection() {
  console.log(`Testing API connection to: ${API_URL}`);
  
  try {
    // Test basic API health check endpoint
    const healthResponse = await fetch(`${API_URL}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Health check response:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health check data:', healthData);
    } else {
      console.error('Health check failed:', await healthResponse.text().catch(() => 'No response text'));
    }
    
    // Test PSV endpoint
    const psvResponse = await fetch(`${API_URL}/api/psv`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('PSV endpoint response:', psvResponse.status);
    
    if (psvResponse.ok) {
      const psvData = await psvResponse.json();
      console.log('PSV data items:', psvData.length);
    } else {
      console.error('PSV endpoint failed:', await psvResponse.text().catch(() => 'No response text'));
    }
    
    // Test RBI Configuration endpoint
    const rbiResponse = await fetch(`${API_URL}/api/psv/rbi/config`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('RBI config endpoint response:', rbiResponse.status);
    
    if (rbiResponse.ok) {
      const rbiData = await rbiResponse.json();
      console.log('RBI config items:', rbiData.length);
    } else {
      console.error('RBI config endpoint failed:', await rbiResponse.text().catch(() => 'No response text'));
    }
    
    return {
      success: healthResponse.ok && psvResponse.ok && rbiResponse.ok,
      healthStatus: healthResponse.status,
      psvStatus: psvResponse.status,
      rbiStatus: rbiResponse.status,
    };
    
  } catch (error) {
    console.error('API connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function showApiDebugToast(result: {
  success: boolean;
  error?: string;
  healthStatus?: number;
  psvStatus?: number;
  rbiStatus?: number;
}) {
  if (result.success) {
    toast.success("API Connection Successful", {
      description: `All endpoints are working correctly. Backend server is running at ${API_URL}`,
    });
  } else if ('error' in result) {
    toast.error("API Connection Failed", {
      description: `Cannot connect to backend server at ${API_URL}: ${result.error}`,
    });
  } else {
    toast.error("API Endpoint Issues", {
      description: `Health: ${result.healthStatus}, PSV: ${result.psvStatus}, RBI: ${result.rbiStatus}`,
    });
  }
}
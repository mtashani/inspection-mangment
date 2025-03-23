import { RBIConfiguration, RBICalculationResult, RBILevel } from "@/components/psv/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Get active RBI configuration
export async function getActiveRBIConfiguration(): Promise<RBIConfiguration | null> {
  try {
    const response = await fetch(`${API_URL}/api/psv/rbi/config/active`);
    
    // Endpoint doesn't exist yet - try getting all configs and find the active one
    if (!response.ok) {
      console.warn("Active RBI config endpoint not available, trying all configs");
      const allConfigsResponse = await fetch(`${API_URL}/api/psv/rbi/config`);
      
      if (!allConfigsResponse.ok) {
        console.error("Failed to fetch any RBI configurations");
        return null;
      }
      
      const allConfigs = await allConfigsResponse.json();
      if (Array.isArray(allConfigs) && allConfigs.length > 0) {
        // Try to find an active config
        const activeConfig = allConfigs.find(config => config.active);
        if (activeConfig) {
          return activeConfig;
        }
        // If no active config, return the first one as fallback
        console.warn("No active RBI configuration found, using first available");
        return allConfigs[0];
      }
      
      // No configs available
      return null;
    }
    
    const configs = await response.json();
    
    // If an array of configs is returned, find the first active one
    if (Array.isArray(configs)) {
      const activeConfig = configs.find(config => config.active);
      if (activeConfig) {
        return activeConfig;
      }
      if (configs.length > 0) {
        return configs[0]; // Fallback to first config if none are active
      }
      return null;
    }
    
    // If a single config is returned directly
    return configs;
  } catch (error) {
    console.error("Error getting active RBI configuration:", error);
    return null;
  }
}

// Calculate RBI for a PSV with specified level
export async function calculateRBI(tagNumber: string, level: number): Promise<RBICalculationResult> {
  try {
    // Skip API call entirely for now - always use mock data for demonstration
    console.warn("Using mock RBI calculation data while backend endpoint is being developed");
    return getMockRBICalculationResult(tagNumber, level);
    
    /* Commenting out real API call until backend is fixed
    const encodedTag = encodeURIComponent(tagNumber);
    
    // Check if endpoint exists
    const response = await fetch(`${API_URL}/api/psv/rbi/${encodedTag}/calculate?level=${level}`, {
      method: "POST",
    });

    if (!response.ok) {
      // If endpoint doesn't exist or returns error, return mock data for demonstration
      console.warn(`RBI calculation endpoint returned ${response.status}, using mock data`);
      return getMockRBICalculationResult(tagNumber, level);
    }

    return response.json();
    */
  } catch (error) {
    console.error(`Error calculating RBI for ${tagNumber}:`, error);
    // Always fallback to mock data if there's an error
    return getMockRBICalculationResult(tagNumber, level);
  }
}

// Mock RBI calculation result for demonstration purposes - TEMPORARY SOLUTION
// This function generates realistic mock data while the backend endpoint is being developed
// It should be removed once the actual API is working correctly
function getMockRBICalculationResult(tagNumber: string, level: number): RBICalculationResult {
  const now = new Date();
  const monthsToAdd = level * 12; // Higher level means longer interval
  const nextDate = new Date(now);
  nextDate.setMonth(now.getMonth() + monthsToAdd);
  
  return {
    tag_number: tagNumber,
    recommended_interval: monthsToAdd,
    next_calibration_date: nextDate.toISOString(),
    risk_score: 100 - (level * 15), // Higher level means lower risk
    risk_category: level === 1 ? "High" : level === 2 ? "Medium" : "Low",
    details: {
      "Service Factor": 1.2,
      "Age Factor": 0.8,
      "Maintenance History": 0.9,
      "Environmental Factor": 1.1,
      "Pressure Rating": 1.0
    },
    rbi_level: level as RBILevel,
    current_risk_score: 100 - (level * 20)
  };
}

// Get the appropriate RBI level for a specific PSV based on active configuration and calculation
export async function getAppropriateRBILevel(psvTagNumber: string): Promise<RBILevel> {
  try {
    // First get the active RBI configuration
    const activeConfig = await getActiveRBIConfiguration();
    
    if (!activeConfig) {
      console.warn("No active RBI configuration found, defaulting to level 1");
      return 1; // Default to level 1 if no config
    }
    
    // Use the active configuration's level to calculate RBI
    const calculationResult = await calculateRBI(psvTagNumber, activeConfig.level);
    
    // The calculation result includes the recommended RBI level for this PSV
    return calculationResult.rbi_level || 1;
  } catch (error) {
    console.error("Error determining appropriate RBI level:", error);
    return 1; // Default to level 1 on error
  }
}

// Existing RBI-related functions can be kept here
export async function fetchRBIConfigurations() {
  try {
    const response = await fetch(`${API_URL}/api/psv/rbi/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch RBI configurations');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching RBI configurations:', error);
    throw error;
  }
}

export async function createRBIConfiguration(data: Omit<RBIConfiguration, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const response = await fetch(`${API_URL}/api/psv/rbi/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create RBI configuration');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating RBI configuration:', error);
    throw error;
  }
}

export async function updateRBIConfiguration(id: number, data: Partial<Omit<RBIConfiguration, 'id' | 'created_at' | 'updated_at'>>) {
  try {
    const response = await fetch(`${API_URL}/api/psv/rbi/config/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update RBI configuration');
    }

    return response.json();
  } catch (error) {
    console.error('Error updating RBI configuration:', error);
    throw error;
  }
}
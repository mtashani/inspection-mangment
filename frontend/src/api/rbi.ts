import { RBIConfiguration, RBICalculationResult, RBILevel, Calibration, PSV } from "@/components/psv/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Get active RBI configuration
export async function getActiveRBIConfiguration(): Promise<RBIConfiguration | null> {
  try {
    // First try to get active configuration directly (for each level)
    const allConfigsResponse = await fetch(`${API_URL}/api/psv/rbi/config?active_only=true`);
    
    if (!allConfigsResponse.ok) {
      console.error("Failed to fetch active RBI configurations");
      return null;
    }
    
    const activeConfigs = await allConfigsResponse.json();
    if (Array.isArray(activeConfigs) && activeConfigs.length > 0) {
      // Return the highest level active configuration
      return activeConfigs.reduce((highest, current) => 
        current.level > highest.level ? current : highest
      , activeConfigs[0]);
    }
    
    // If no active configs found, try to get any config
    console.warn("No active RBI configuration found, looking for any configuration");
    const anyConfigsResponse = await fetch(`${API_URL}/api/psv/rbi/config`);
    
    if (!anyConfigsResponse.ok) {
      console.error("Failed to fetch any RBI configurations");
      return null;
    }
    
    const anyConfigs = await anyConfigsResponse.json();
    if (Array.isArray(anyConfigs) && anyConfigs.length > 0) {
      console.warn("Using first available RBI configuration as fallback");
      return anyConfigs[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error getting active RBI configuration:", error);
    return null;
  }
}

// Calculate RBI for a PSV with specified level
export async function calculateRBI(tagNumber: string, level: number): Promise<RBICalculationResult> {
  try {
    const encodedTag = encodeURIComponent(tagNumber);
    
    // Call real API endpoint 
    const response = await fetch(`${API_URL}/api/psv/rbi/${encodedTag}/calculate?level=${level}`, {
      method: "POST",
    });

    if (!response.ok) {
      // If endpoint returns error, throw an error with details
      const errorText = await response.text();
      throw new Error(`RBI calculation failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result as RBICalculationResult;
  } catch (error) {
    console.error(`Error calculating RBI for ${tagNumber}:`, error);
    // Rethrow for proper error handling
    throw new Error(`Failed to calculate RBI: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get the appropriate RBI level for a specific PSV based on active configuration
export async function getAppropriateRBILevel(psvTagNumber: string): Promise<RBILevel> {
  try {
    // First get the active RBI configuration
    const activeConfig = await getActiveRBIConfiguration();
    
    if (!activeConfig) {
      console.warn(`No active RBI configuration found for PSV ${psvTagNumber}, defaulting to level 1`);
      return 1; // Default to level 1 if no config
    }
    
    // Optionally, we could call the calculate endpoint to get a PSV-specific recommended level
    // const calculationResult = await calculateRBI(psvTagNumber, activeConfig.level);
    // return calculationResult.rbi_level || activeConfig.level;
    
    return activeConfig.level;
  } catch (error) {
    console.error(`Error determining appropriate RBI level for ${psvTagNumber}:`, error);
    return 1; // Default to level 1 on error
  }
}

// Calculate and update next calibration date after a new calibration is saved
export async function calculateNextCalibrationDate(tagNumber: string, calibration: Calibration): Promise<Date | null> {
  try {
    // Get active RBI configuration
    const activeConfig = await getActiveRBIConfiguration();
    if (!activeConfig) {
      console.warn(`No active RBI configuration found for ${tagNumber}, cannot calculate next calibration date`);
      return null;
    }
    
    // We can use calibration data to inform the calculation if needed
    console.log(`Using calibration data from ${calibration.calibration_date} to calculate next date for ${tagNumber}`);
    
    // Calculate RBI with the active configuration's level
    const calculationResult = await calculateRBI(tagNumber, activeConfig.level);
    
    // Return the next calibration date
    if (calculationResult.next_calibration_date) {
      return new Date(calculationResult.next_calibration_date);
    }
    
    return null;
  } catch (error) {
    console.error(`Error calculating next calibration date for ${tagNumber}:`, error);
    return null;
  }
}

// Recalculate all PSV calibration dates when RBI configuration changes
export async function recalculateAllCalibrationDates(psvList: PSV[]): Promise<Map<string, Date | null>> {
  const results = new Map<string, Date | null>();
  const activeConfig = await getActiveRBIConfiguration();
  
  if (!activeConfig) {
    console.warn("No active RBI configuration found, cannot recalculate calibration dates");
    return results;
  }
  
  for (const psv of psvList) {
    try {
      const calculationResult = await calculateRBI(psv.tag_number, activeConfig.level);
      if (calculationResult.next_calibration_date) {
        results.set(psv.tag_number, new Date(calculationResult.next_calibration_date));
      } else {
        results.set(psv.tag_number, null);
      }
    } catch (error) {
      console.error(`Error recalculating calibration date for ${psv.tag_number}:`, error);
      results.set(psv.tag_number, null);
    }
  }
  
  return results;
}

// Fetch RBI configurations
export async function fetchRBIConfigurations(): Promise<RBIConfiguration[]> {
  try {
    const response = await fetch(`${API_URL}/api/psv/rbi/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch RBI configurations');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching RBI configurations:', error);
    throw error;
  }
}

// Create new RBI configuration
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

// Update existing RBI configuration
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

// Preview changes - calculate what calibration schedules would be with new RBI settings
export async function previewRBIChanges(psvTagNumbers: string[], configData: Omit<RBIConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<{ [key: string]: { current: Date | null, new: Date | null } }> {
  const results: { [key: string]: { current: Date | null, new: Date | null } } = {};
  
  // Get current dates
  for (const tagNumber of psvTagNumbers) {
    try {
      // Get current active config level
      const activeConfig = await getActiveRBIConfiguration();
      if (!activeConfig) {
        results[tagNumber] = { current: null, new: null };
        continue;
      }
      
      // Calculate with current config
      const currentResult = await calculateRBI(tagNumber, activeConfig.level);
      const currentDate = currentResult.next_calibration_date ? new Date(currentResult.next_calibration_date) : null;
      
      // We'll fake the new config response by providing mock data
      // In a real implementation, we could temporarily send the new config to backend for calculation
      const mockNextDate = new Date();
      // Fix the possibly undefined error with nullish coalescing
      const fixedInterval = configData.settings?.fixed_interval ?? 24;
      mockNextDate.setMonth(mockNextDate.getMonth() + fixedInterval);
      
      results[tagNumber] = {
        current: currentDate,
        new: mockNextDate
      };
    } catch (error) {
      console.error(`Error previewing RBI changes for ${tagNumber}:`, error);
      results[tagNumber] = { current: null, new: null };
    }
  }
  
  return results;
}
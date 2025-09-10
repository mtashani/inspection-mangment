import { PSV, PSVSummary, Calibration, PSVStatus, PSVSeatType, PSVActionType, PSVOperationMode, PSVReliefService, PSVBonnetType, WorkMaintenance, TestMedium } from "@/components/psv/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Flag to enable mock data during debugging
const USE_MOCK_DATA = true; // Set to false when actual API works

interface PSVFilters {
  skip?: number;
  limit?: number;
  tag_number?: string;
  status?: string;
  service?: string;
  unit?: string[];
  type?: string[];
  train?: string[];
}

// Define interfaces for backend data structures
interface BackendPSV {
  tag_number: string;
  unique_no?: string;
  status?: string;
  frequency?: number;
  last_calibration_date?: string;
  expire_date?: string;
  unit?: string;
  train?: string;
  type?: string;
  type_no?: string;
  action_type?: string;
  operation_mode?: string;
  relief_service?: string;
  bonnet_type?: string;
  serial_no?: string;
  set_pressure: number | string;
  cdtp?: number | string;
  back_pressure?: number | string;
  nps?: number | string;
  inlet_size?: number | string;
  inlet_rating?: number | string;
  outlet_size?: number | string;
  outlet_rating?: number | string;
  orifice_size?: number | string;
  seat_type?: string;
  body_material?: string;
  trim_material?: string;
  installation_date?: string;
  operating_pressure?: number | string;
  p_and_id?: string;
  line_number?: string;
  service?: string;
  data_sheet_no?: string;
  manufacturer?: string;
  has_fire_case?: boolean;
  is_boiler_psv?: boolean;
  negative_pressure?: number | string;
  positive_pressure?: number | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Allow for additional properties
}

interface BackendCalibration {
  id: number;
  tag_number: string;
  calibration_date: string;
  work_maintenance?: string;
  change_parts?: string;
  test_medium?: string;
  inspector?: string;
  test_operator?: string;
  general_condition?: string;
  approved_by?: string;
  work_no?: string;
  pre_repair_pop_test?: number;
  pre_repair_leak_test?: number;
  post_repair_pop_test?: number;
  post_repair_leak_test?: number;
  negative_pressure_test?: number;
  positive_pressure_test?: number;
  body_condition_score?: number;
  body_condition_notes?: string;
  internal_parts_score?: number;
  internal_parts_notes?: string;
  seat_plug_condition_score?: number;
  seat_plug_notes?: string;
  repairs_required?: boolean;
  repair_time?: number;
  created_at: string;
  updated_at?: string;
  [key: string]: unknown; // Allow for additional properties
}

// Mock data for testing
const MOCK_PSVS: PSV[] = [
  {
    tag_number: "PSV-1001",
    unique_no: "UN-1001",
    status: PSVStatus.Main,
    frequency: 12,
    last_calibration_date: "2024-05-01T00:00:00.000Z",
    expire_date: "2025-05-01T00:00:00.000Z",
    unit: "Unit-100",
    train: "Train A",
    type_no: "SRV Type 1",
    action_type: PSVActionType.Conventional,
    operation_mode: PSVOperationMode.SpringLoaded,
    relief_service: PSVReliefService.PressureRelief,
    set_pressure: 10.5,
    body_material: "Carbon Steel",
    service: "Natural Gas",
    manufacturer: "Manufacturer A",
    created_at: "2023-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z"
  },
  {
    tag_number: "PSV-1002",
    unique_no: "UN-1002",
    status: PSVStatus.Main,
    frequency: 24,
    last_calibration_date: "2023-11-15T00:00:00.000Z",
    expire_date: "2025-11-15T00:00:00.000Z",
    unit: "Unit-200",
    train: "Train B",
    type_no: "SRV Type 2",
    action_type: PSVActionType.QuickOpening,
    operation_mode: PSVOperationMode.PilotOperated,
    relief_service: PSVReliefService.PressureRelief,
    set_pressure: 15.2,
    body_material: "Stainless Steel",
    service: "Steam",
    manufacturer: "Manufacturer B",
    created_at: "2023-02-01T00:00:00.000Z",
    updated_at: "2024-02-01T00:00:00.000Z"
  },
  {
    tag_number: "PSV-1003",
    unique_no: "UN-1003",
    status: PSVStatus.Spare,
    frequency: 36,
    last_calibration_date: "2022-08-20T00:00:00.000Z",
    expire_date: "2025-08-20T00:00:00.000Z",
    unit: "Unit-300",
    train: "Train C",
    type_no: "SRV Type 3",
    action_type: PSVActionType.Conventional,
    operation_mode: PSVOperationMode.SpringLoaded,
    relief_service: PSVReliefService.VacuumRelief,
    set_pressure: 8.7,
    body_material: "Alloy Steel",
    service: "Process Water",
    manufacturer: "Manufacturer C",
    created_at: "2023-03-01T00:00:00.000Z",
    updated_at: "2024-03-01T00:00:00.000Z"
  },
  {
    tag_number: "PSV-1004",
    unique_no: "UN-1004",
    status: PSVStatus.Main,
    frequency: 48,
    unit: "Unit-400",
    train: "Train D",
    type_no: "SRV Type 4",
    action_type: PSVActionType.QuickOpening,
    operation_mode: PSVOperationMode.PowerActuated,
    relief_service: PSVReliefService.PressureRelief,
    set_pressure: 12.0,
    body_material: "Duplex",
    service: "Hydrogen",
    manufacturer: "Manufacturer D",
    created_at: "2023-04-01T00:00:00.000Z",
    updated_at: "2024-04-01T00:00:00.000Z"
  },
  {
    tag_number: "PSV-1005",
    unique_no: "UN-1005",
    status: PSVStatus.Spare,
    frequency: 60,
    last_calibration_date: "2020-12-10T00:00:00.000Z",
    expire_date: "2025-12-10T00:00:00.000Z",
    unit: "Unit-500",
    train: "Train E",
    type_no: "SRV Type 5",
    action_type: PSVActionType.Conventional,
    operation_mode: PSVOperationMode.Deadweight,
    relief_service: PSVReliefService.PressureRelief,
    set_pressure: 5.5,
    body_material: "Monel",
    service: "Hydrocarbon",
    manufacturer: "Manufacturer E",
    created_at: "2023-05-01T00:00:00.000Z",
    updated_at: "2024-05-01T00:00:00.000Z"
  }
];

// Adapter function to convert backend PSV data to frontend PSV type
function adaptPSVData(backendPSV: BackendPSV): PSV {
  return {
    tag_number: backendPSV.tag_number,
    unique_no: backendPSV.unique_no || '',
    status: (backendPSV.status as PSVStatus) || PSVStatus.Main,
    frequency: backendPSV.frequency || 0,
    last_calibration_date: backendPSV.last_calibration_date || undefined,
    expire_date: backendPSV.expire_date || undefined,
    unit: backendPSV.unit || undefined,
    train: backendPSV.train || undefined,
    
    // Handle renamed fields
    type_no: backendPSV.type_no || backendPSV.type || undefined,
    
    // New enum fields - with fallbacks
    action_type: backendPSV.action_type as PSVActionType || undefined,
    operation_mode: backendPSV.operation_mode as PSVOperationMode || undefined,
    relief_service: backendPSV.relief_service as PSVReliefService || undefined,
    bonnet_type: backendPSV.bonnet_type as PSVBonnetType || undefined,
    
    // Handle type changes (string -> number) with proper conversion
    serial_no: backendPSV.serial_no || undefined,
    set_pressure: typeof backendPSV.set_pressure === 'string' ? 
      parseFloat(backendPSV.set_pressure) : 
      (backendPSV.set_pressure || 0),
    cdtp: typeof backendPSV.cdtp === 'string' ? 
      parseFloat(backendPSV.cdtp) : 
      backendPSV.cdtp,
    back_pressure: typeof backendPSV.back_pressure === 'string' ? 
      parseFloat(backendPSV.back_pressure) : 
      backendPSV.back_pressure,
    
    nps: typeof backendPSV.nps === 'string' ? 
      parseFloat(backendPSV.nps) : 
      backendPSV.nps,
    inlet_size: typeof backendPSV.inlet_size === 'string' ? 
      parseFloat(backendPSV.inlet_size) : 
      backendPSV.inlet_size,
    inlet_rating: typeof backendPSV.inlet_rating === 'string' ? 
      parseFloat(backendPSV.inlet_rating) : 
      backendPSV.inlet_rating,
    outlet_size: typeof backendPSV.outlet_size === 'string' ? 
      parseFloat(backendPSV.outlet_size) : 
      backendPSV.outlet_size,
    outlet_rating: typeof backendPSV.outlet_rating === 'string' ? 
      parseFloat(backendPSV.outlet_rating) : 
      backendPSV.outlet_rating,
    
    orifice_size: typeof backendPSV.orifice_size === 'string' ? 
      parseFloat(backendPSV.orifice_size) : 
      backendPSV.orifice_size,
    seat_type: backendPSV.seat_type as PSVSeatType || PSVSeatType.Metal,
    body_material: backendPSV.body_material || undefined,
    trim_material: backendPSV.trim_material || undefined,
    
    installation_date: backendPSV.installation_date || undefined,
    operating_pressure: typeof backendPSV.operating_pressure === 'string' ? 
      parseFloat(backendPSV.operating_pressure) : 
      backendPSV.operating_pressure,
    
    p_and_id: backendPSV.p_and_id || undefined,
    line_number: backendPSV.line_number || undefined,
    service: backendPSV.service || undefined,
    data_sheet_no: backendPSV.data_sheet_no || undefined,
    manufacturer: backendPSV.manufacturer || undefined,
    
    has_fire_case: backendPSV.has_fire_case || false,
    is_boiler_psv: backendPSV.is_boiler_psv || false,
    
    negative_pressure: typeof backendPSV.negative_pressure === 'string' ? 
      parseFloat(backendPSV.negative_pressure) : 
      backendPSV.negative_pressure,
    positive_pressure: typeof backendPSV.positive_pressure === 'string' ? 
      parseFloat(backendPSV.positive_pressure) : 
      backendPSV.positive_pressure,
    
    created_at: backendPSV.created_at || new Date().toISOString(),
    updated_at: backendPSV.updated_at || new Date().toISOString(),
  };
}

// Fixed fetchPSVs to properly handle array parameters in GET request
export async function fetchPSVs(filters?: PSVFilters): Promise<PSV[]> {
  try {
    // Return mock data for testing if enabled
    if (USE_MOCK_DATA) {
      console.log("⚠️ USING MOCK PSV DATA - Set USE_MOCK_DATA=false for actual API");
      
      // Apply simple filters if provided
      let filteredData = [...MOCK_PSVS];
      
      if (filters) {
        if (filters.tag_number) {
          filteredData = filteredData.filter(p => 
            p.tag_number.toLowerCase().includes(filters.tag_number!.toLowerCase())
          );
        }
        
        if (filters.status) {
          filteredData = filteredData.filter(p => p.status === filters.status);
        }
        
        if (filters.service) {
          filteredData = filteredData.filter(p => 
            p.service?.toLowerCase().includes(filters.service!.toLowerCase())
          );
        }
        
        if (filters.unit && filters.unit.length > 0) {
          filteredData = filteredData.filter(p => 
            filters.unit!.some(u => p.unit?.includes(u))
          );
        }
        
        if (filters.train && filters.train.length > 0) {
          filteredData = filteredData.filter(p => 
            filters.train!.some(t => p.train?.includes(t))
          );
        }
        
        if (filters.type && filters.type.length > 0) {
          filteredData = filteredData.filter(p => 
            filters.type!.some(t => p.type_no?.includes(t))
          );
        }
      }
      
      // Return filtered mock data with pagination
      const skip = filters?.skip || 0;
      const limit = filters?.limit || 100;
      return filteredData.slice(skip, skip + limit);
    }
    
    // Attempt to use the real API if mock data is disabled
    let url = `${API_URL}/api/psv`;
    
    // Add query parameters if filters are provided
    if (filters) {
      const params = new URLSearchParams();
      
      // Add simple filters
      if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
      if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
      if (filters.tag_number) params.append('tag_number', filters.tag_number);
      if (filters.status) params.append('status', filters.status);
      if (filters.service) params.append('service', filters.service);
      
      // Add array filters (multiple values) as separate query parameters with the same name
      if (filters.unit && filters.unit.length > 0) {
        filters.unit.forEach(u => params.append('unit', u));
      }
      
      if (filters.type && filters.type.length > 0) {
        filters.type.forEach(t => params.append('type', t));
      }
      
      if (filters.train && filters.train.length > 0) {
        filters.train.forEach(t => params.append('train', t));
      }
      
      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }
    }
    
    // Debug info
    console.log('Fetching PSVs with URL:', url);
    
    // Make GET request without a body
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text');
      console.error(`Failed to fetch PSVs: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch PSVs: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Debug info
    console.log(`Received ${Array.isArray(data) ? data.length : 0} PSVs from API:`, data);
    
    if (!Array.isArray(data)) {
      console.error("API didn't return an array for PSVs:", data);
      return [];
    }
    
    // Use adapter to convert all PSV data
    return data.map(item => adaptPSVData(item as BackendPSV));
  } catch (error) {
    console.error("Error fetching PSV data:", error);
    // Return empty array instead of throwing, so UI can still render
    return [];
  }
}

// Mock summary for testing
const MOCK_SUMMARY: PSVSummary = {
  total: { main: 3, spare: 2 },
  underCalibration: { main: 1, spare: 0 },
  outOfCalibration: { main: 0, spare: 1 },
  dueNextMonth: { main: 1, spare: 0 },
  neverCalibrated: { main: 1, spare: 1 },
  rbiLevel: { level1: 2, level2: 1, level3: 1, level4: 1 }
};

export async function fetchPSVSummary(): Promise<PSVSummary> {
  if (USE_MOCK_DATA) {
    console.log("⚠️ USING MOCK PSV SUMMARY DATA");
    return MOCK_SUMMARY;
  }

  const response = await fetch(`${API_URL}/api/psv/summary`);
  if (!response.ok) {
    throw new Error('Failed to fetch PSV summary');
  }
  return response.json();
}

// Mock calibrations for testing
const MOCK_CALIBRATIONS: Calibration[] = [
  {
    id: 1,
    tag_number: "PSV-1001",
    calibration_date: "2024-05-01T00:00:00.000Z",
    work_maintenance: WorkMaintenance.Adjust,
    test_medium: TestMedium.Air,
    inspector: "John Doe",
    test_operator: "Jane Smith",
    approved_by: "Mike Johnson",
    work_no: "WO-2024-001",
    post_repair_pop_test: 10.2,
    post_repair_leak_test: 9.8,
    created_at: "2024-05-01T00:00:00.000Z"
  },
  {
    id: 2,
    tag_number: "PSV-1001",
    calibration_date: "2023-05-15T00:00:00.000Z",
    work_maintenance: WorkMaintenance.Lapping,
    test_medium: TestMedium.Nitrogen,
    inspector: "Robert Brown",
    test_operator: "Sarah Davis",
    approved_by: "Mike Johnson",
    work_no: "WO-2023-042",
    post_repair_pop_test: 10.4,
    post_repair_leak_test: 9.9,
    created_at: "2023-05-15T00:00:00.000Z"
  }
];

export async function fetchPSVById(id: string): Promise<PSV> {
  try {
    // Use mock data if enabled
    if (USE_MOCK_DATA) {
      console.log(`⚠️ USING MOCK PSV DATA FOR ID: ${id}`);
      const found = MOCK_PSVS.find(p => p.tag_number === id);
      if (!found) {
        throw new Error(`PSV with ID ${id} not found in mock data`);
      }
      return found;
    }
    
    // Encode tag number to handle special characters
    const encodedId = encodeURIComponent(id.trim());
    const response = await fetch(`${API_URL}/api/psv/${encodedId}`);
    
    if (!response.ok) {
      // Get error details from response if available
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch PSV: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data) {
      throw new Error('No PSV data received');
    }
    
    // Use adapter to convert PSV data
    return adaptPSVData(data as BackendPSV);
  } catch (error) {
    console.error('Error fetching PSV:', error);
    throw error;
  }
}

// Helper function to convert string to WorkMaintenance enum safely
function toWorkMaintenance(value?: string): WorkMaintenance {
  if (value === WorkMaintenance.Adjust) return WorkMaintenance.Adjust;
  if (value === WorkMaintenance.Cleaning) return WorkMaintenance.Cleaning;
  if (value === WorkMaintenance.Lapping) return WorkMaintenance.Lapping;
  return WorkMaintenance.Adjust; // Default value
}

// Helper function to convert string to TestMedium enum safely
function toTestMedium(value?: string): TestMedium {
  if (value === TestMedium.Air) return TestMedium.Air;
  if (value === TestMedium.Nitrogen) return TestMedium.Nitrogen;
  if (value === TestMedium.Steam) return TestMedium.Steam;
  if (value === TestMedium.Water) return TestMedium.Water;
  return TestMedium.Air; // Default value
}

export async function fetchCalibrations(tagNumber: string): Promise<Calibration[]> {
  try {
    // Use mock data if enabled
    if (USE_MOCK_DATA) {
      console.log(`⚠️ USING MOCK CALIBRATION DATA FOR: ${tagNumber}`);
      return MOCK_CALIBRATIONS.filter(c => c.tag_number === tagNumber);
    }
    
    const encodedTag = encodeURIComponent(tagNumber.trim());
    const response = await fetch(`${API_URL}/api/psv/calibration/${encodedTag}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch calibrations: ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid calibration data received');
    }

    // Use adapter to convert all calibration data
    const adaptedData = data.map(item => adaptCalibrationData(item as BackendCalibration));
    
    // Sort calibrations by date (newest first)
    return adaptedData.sort((a, b) =>
      new Date(b.calibration_date).getTime() - new Date(a.calibration_date).getTime()
    );
  } catch (error) {
    console.error('Error fetching calibrations:', error);
    throw error;
  }
}

// Adapter function to convert backend calibration data to frontend type
function adaptCalibrationData(backendCalibration: BackendCalibration): Calibration {
  return {
    id: backendCalibration.id,
    tag_number: backendCalibration.tag_number,
    calibration_date: backendCalibration.calibration_date,
    work_maintenance: toWorkMaintenance(backendCalibration.work_maintenance),
    change_parts: backendCalibration.change_parts,
    test_medium: toTestMedium(backendCalibration.test_medium),
    inspector: backendCalibration.inspector || "",
    test_operator: backendCalibration.test_operator || "",
    general_condition: backendCalibration.general_condition,
    approved_by: backendCalibration.approved_by || "",
    work_no: backendCalibration.work_no || "",
    
    pre_repair_pop_test: backendCalibration.pre_repair_pop_test,
    pre_repair_leak_test: backendCalibration.pre_repair_leak_test,
    post_repair_pop_test: backendCalibration.post_repair_pop_test || 0,
    post_repair_leak_test: backendCalibration.post_repair_leak_test || 0,
    
    negative_pressure_test: backendCalibration.negative_pressure_test,
    positive_pressure_test: backendCalibration.positive_pressure_test,
    
    body_condition_score: backendCalibration.body_condition_score,
    body_condition_notes: backendCalibration.body_condition_notes,
    internal_parts_score: backendCalibration.internal_parts_score,
    internal_parts_notes: backendCalibration.internal_parts_notes,
    seat_plug_condition_score: backendCalibration.seat_plug_condition_score,
    seat_plug_notes: backendCalibration.seat_plug_notes,
    
    repairs_required: backendCalibration.repairs_required,
    repair_time: backendCalibration.repair_time,
    
    created_at: backendCalibration.created_at,
    updated_at: backendCalibration.updated_at,
  };
}

export async function fetchPSVTypes(): Promise<string[]> {
  if (USE_MOCK_DATA) {
    return ["SRV Type 1", "SRV Type 2", "SRV Type 3", "SRV Type 4", "SRV Type 5"];
  }
  
  try {
    console.log('Fetching PSV types from:', `${API_URL}/api/psv/types`);
    const response = await fetch(`${API_URL}/api/psv/types`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text');
      console.warn(`PSV types endpoint returned ${response.status}: ${errorText}`);
      // Return default types if API fails
      return ["Gate", "Globe", "Safety Relief", "Pilot Operated"];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('PSV types response is not an array, using defaults');
      return ["Gate", "Globe", "Safety Relief", "Pilot Operated"];
    }
    
    // Deduplicate the data to avoid React key conflicts
    const uniqueTypes = [...new Set(data.filter(Boolean))];
    console.log(`Received ${data.length} types, ${uniqueTypes.length} unique types`);
    return uniqueTypes;
  } catch (error) {
    console.warn('Error fetching PSV types, using defaults:', error);
    // Return default types on error
    return ["Gate", "Globe", "Safety Relief", "Pilot Operated"];
  }
}

export async function fetchPSVUnits(): Promise<string[]> {
  if (USE_MOCK_DATA) {
    return ["Unit-100", "Unit-200", "Unit-300", "Unit-400", "Unit-500"];
  }
  
  try {
    console.log('Fetching PSV units from:', `${API_URL}/api/psv/units`);
    const response = await fetch(`${API_URL}/api/psv/units`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text');
      console.warn(`PSV units endpoint returned ${response.status}: ${errorText}`);
      // Return default units if API fails
      return ["U-100", "U-200", "U-300", "U-400"];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('PSV units response is not an array, using defaults');
      return ["U-100", "U-200", "U-300", "U-400"];
    }
    
    // Deduplicate the data to avoid React key conflicts
    const uniqueUnits = [...new Set(data.filter(Boolean))];
    console.log(`Received ${data.length} units, ${uniqueUnits.length} unique units`);
    return uniqueUnits;
  } catch (error) {
    console.warn('Error fetching PSV units, using defaults:', error);
    // Return default units on error
    return ["U-100", "U-200", "U-300", "U-400"];
  }
}

export async function fetchPSVTrains(): Promise<string[]> {
  if (USE_MOCK_DATA) {
    return ["Train A", "Train B", "Train C", "Train D", "Train E"];
  }
  
  try {
    console.log('Fetching PSV trains from:', `${API_URL}/api/psv/trains`);
    const response = await fetch(`${API_URL}/api/psv/trains`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No response text');
      console.warn(`PSV trains endpoint returned ${response.status}: ${errorText}`);
      // Return default trains if API fails
      return ["Train A", "Train B", "Train C", "Train D"];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('PSV trains response is not an array, using defaults');
      return ["Train A", "Train B", "Train C", "Train D"];
    }
    
    // Deduplicate the data to avoid React key conflicts
    const uniqueTrains = [...new Set(data.filter(Boolean))];
    console.log(`Received ${data.length} trains, ${uniqueTrains.length} unique trains`);
    return uniqueTrains;
  } catch (error) {
    console.warn('Error fetching PSV trains, using defaults:', error);
    // Return default trains on error
    return ["Train A", "Train B", "Train C", "Train D"];
  }
}

// Add a new API function to update a calibration record
export async function updateCalibration(id: number, calibrationData: Partial<Calibration>): Promise<Calibration> {
  try {
    // Use mock data if enabled
    if (USE_MOCK_DATA) {
      console.log(`⚠️ USING MOCK UPDATE CALIBRATION FOR ID: ${id}`);
      // Simulate update and return the updated data
      return {
        ...MOCK_CALIBRATIONS.find(c => c.id === id)!,
        ...calibrationData,
        updated_at: new Date().toISOString()
      };
    }
    
    console.log(`Updating calibration ID ${id} with data:`, calibrationData);
    
    // Make sure ID is a number
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new Error(`Invalid calibration ID: ${id}`);
    }
    
    // Connect directly to the backend API for updates
    const url = `${API_URL}/api/psv/calibration/${numericId}`;
    console.log(`Making PUT request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(calibrationData)
    });
    
    console.log("Update API route response status:", response.status);
    console.log("Update API route response status text:", response.statusText);

    // For debugging
    console.log('Update response status:', response.status);
    
    if (!response.ok) {
      let errorDetail = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || `Status ${response.status}: ${response.statusText}`;
      } catch {
        // Couldn't parse JSON error response
        errorDetail = `Failed to parse error: ${response.statusText}`;
      }
      
      console.error('Error updating calibration:', errorDetail);
      throw new Error(errorDetail);
    }

    const result = await response.json();
    return adaptCalibrationData(result as BackendCalibration);
  } catch (error) {
    console.error('Error in updateCalibration function:', error);
    throw error;
  }
}

// Add a new API function to delete a calibration record
export async function deleteCalibration(id: number): Promise<void> {
  try {
    // Use mock data if enabled
    if (USE_MOCK_DATA) {
      console.log(`⚠️ USING MOCK DELETE CALIBRATION FOR ID: ${id}`);
      // Just log the deletion
      return;
    }
    
    console.log(`Deleting calibration with ID: ${id}`);
    
    // Connect directly to the backend API for deletion
    const url = `${API_URL}/api/psv/calibration/${id}`;
    console.log(`Making DELETE request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': '*/*'
      }
    });

    console.log('Delete response status:', response.status);
    
    if (!response.ok) {
      let errorDetail = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || `Status ${response.status}: ${response.statusText}`;
      } catch {
        // Couldn't parse JSON error response
        errorDetail = `Failed to parse error: ${response.statusText}`;
      }
      
      console.error('Error deleting calibration:', errorDetail);
      throw new Error(errorDetail);
    }
  } catch (error) {
    console.error('Error in deleteCalibration function:', error);
    throw error;
  }
}
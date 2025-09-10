export type RBILevel = 1 | 2 | 3 | 4;

// Define calibration status type
export type CalibrationStatus = "OVERDUE" | "DUE_SOON" | "COMPLIANT" | "NEVER_CALIBRATED";

// PSV Enums based on backend models
export enum PSVStatus {
  Main = "Main",
  Spare = "Spare"
}

export enum PSVSeatType {
  Metal = "metal",
  Soft = "soft"
}

export enum TestMedium {
  Nitrogen = "Nitrogen",
  Air = "Air",
  Steam = "Steam",
  Water = "Water"
}

export enum WorkMaintenance {
  Adjust = "Adjust",
  Cleaning = "Cleaning",
  Lapping = "Lapping"
}

export enum LeakageClass {
  None = "None",
  Minimal = "Minimal",
  Low = "Low",
  Moderate = "Moderate",
  Excessive = "Excessive"
}

export enum EnvironmentType {
  Clean = "Clean",
  Normal = "Normal",
  Dirty = "Dirty",
  Corrosive = "Corrosive",
  Highly_Corrosive = "Highly Corrosive"
}

export enum PSVActionType {
  Conventional = "Conventional",
  QuickOpening = "QuickOpening"
}

export enum PSVOperationMode {
  SpringLoaded = "SpringLoaded",
  PilotOperated = "PilotOperated",
  PowerActuated = "PowerActuated",
  TemperatureActuated = "TemperatureActuated",
  Deadweight = "Deadweight"
}

export enum PSVReliefService {
  PressureRelief = "PressureRelief",
  VacuumRelief = "VacuumRelief"
}

export enum PSVBonnetType {
  Open = "Open",
  Closed = "Closed"
}

export interface RBIConfiguration {
  id: number;
  level: RBILevel;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  settings: {
    fixed_interval?: number;
    pop_test_thresholds?: {
      min: number;
      max: number;
    };
    leak_test_thresholds?: {
      min: number;
      max: number;
    };
    parameter_weights?: Record<string, number>;
    risk_matrix?: Record<string, number[]>;
    service_risk_categories?: Record<string, number>;
  };
}

export interface RBICalculationResult {
  tag_number: string;
  recommended_interval: number;
  next_calibration_date: string;
  risk_score: number;
  risk_category: string;
  details?: Record<string, number | string>;
  rbi_level: RBILevel;
  current_risk_score: number;
}

export interface PSV {
  tag_number: string; // Primary key in backend
  unique_no: string;
  status: PSVStatus;
  frequency: number; // months
  last_calibration_date?: string;
  expire_date?: string;
  unit?: string;
  train?: string;

  // Changed from type to type_no
  type_no?: string;
  
  // New enum fields
  action_type?: PSVActionType;
  operation_mode?: PSVOperationMode;
  relief_service?: PSVReliefService;
  bonnet_type?: PSVBonnetType;
  
  // Fields with type changes (string -> number)
  serial_no?: string;
  set_pressure: number; // Barg
  cdtp?: number; // Barg
  back_pressure?: number; // Barg
  
  // Changed from string to number
  nps?: number;
  inlet_size?: number; // Size in inches
  inlet_rating?: number; // Rating class
  outlet_size?: number; // Size in inches
  outlet_rating?: number; // Rating class
  
  // API 527 related fields
  orifice_size?: number; // Size in inches
  seat_type?: PSVSeatType;
  body_material?: string;
  trim_material?: string;
  
  // New fields for RBI Level 4
  installation_date?: string;
  operating_pressure?: number; // Barg
  
  // Optional fields
  p_and_id?: string;
  line_number?: string;
  service?: string;
  data_sheet_no?: string;
  manufacturer?: string;
  
  // Additional property fields
  has_fire_case?: boolean;
  is_boiler_psv?: boolean;
  
  // Vacuum PSV specific fields
  negative_pressure?: number; // Barg
  positive_pressure?: number; // Barg
  
  created_at: string;
  updated_at: string;
}

export interface PSVSummary {
  total: {
    main: number;
    spare: number;
  };
  underCalibration: {
    main: number;
    spare: number;
  };
  outOfCalibration: {
    main: number;
    spare: number;
  };
  dueNextMonth: {
    main: number;
    spare: number;
  };
  neverCalibrated: {
    main: number;
    spare: number;
  };
  rbiLevel: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
}

export interface Calibration {
  id: number;
  tag_number: string;
  calibration_date: string;
  work_maintenance: WorkMaintenance;
  change_parts?: string;
  test_medium: TestMedium;
  inspector: string;
  test_operator: string;
  general_condition?: string;
  approved_by: string;
  work_no: string;
  
  // Level 2+ RBI fields - all optional now
  pre_repair_pop_test?: number;
  pre_repair_leak_test?: number;
  post_repair_pop_test?: number;
  post_repair_leak_test?: number;
  
  // Vacuum PSV specific fields
  negative_pressure_test?: number;
  positive_pressure_test?: number;
  
  // Level 3 Assessment Fields (1-5 scale)
  body_condition_score?: number;
  body_condition_notes?: string;
  internal_parts_score?: number;
  internal_parts_notes?: string;
  seat_plug_condition_score?: number;
  seat_plug_notes?: string;
  
  // New fields for improved RBI Level 4
  repairs_required?: boolean;
  repair_time?: number; // Hours
  
  created_at: string;
  updated_at?: string;
}
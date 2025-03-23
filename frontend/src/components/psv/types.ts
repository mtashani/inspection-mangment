export type RBILevel = 1 | 2 | 3 | 4;

// Define calibration status type
export type CalibrationStatus = "OVERDUE" | "DUE_SOON" | "COMPLIANT" | "NEVER_CALIBRATED";

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
  id: number;
  tag_number: string;
  unique_no: string;
  line_number?: string;
  p_and_id?: string;
  unit?: string;
  train?: string;
  status: string;
  set_pressure: number;
  manufacturer?: string;
  serial_no?: string;
  service?: string;
  type?: string;
  inlet_size?: string;
  outlet_size?: string;
  inlet_rating?: string;
  outlet_rating?: string;
  body_material?: string;
  capacity?: number;
  back_pressure?: number;
  cdtp?: number;
  nps?: string;
  orifice_designation?: string;
  last_calibration_date?: string;
  expire_date?: string;
  data_sheet_no?: string;
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
  result?: string;
  pop_pressure: number;
  leak_test_pressure: number;
  seat_tightness?: string;
  body_condition?: string;
  spring_condition?: string;
  notes?: string;
  attachments?: string[];
  technician?: string;
  created_at: string;
  updated_at: string;
  
  // Fields used in the PSV detail page
  work_no: string;
  work_maintenance: string;
  test_medium: string;
  pre_repair_pop_test?: number;
  post_repair_pop_test: number;
  pre_repair_leak_test?: number;
  post_repair_leak_test: number;
  inspector: string;
  test_operator: string;
  approved_by: string;
}
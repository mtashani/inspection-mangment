export type CouponStatus = "Installed" | "Removed" | "Analyzed";

export type CouponType = "Strip" | "Rod" | "Disc" | "Cylinder" | "Spiral" | "Electrical" | "Custom";

export type CouponOrientation = "Flush" | "Parallel" | "Perpendicular";

export type CorrosionType = "Uniform" | "Pitting" | "Crevice" | "Galvanic" | "MIC" | "Erosion" | "Other";

export type SystemRiskCategory = "high_risk" | "medium_risk" | "low_risk";

export type MonitoringLevel = 1 | 2;

export interface CorrosionLocation {
  id: number;
  location_id: string;
  name: string;
  description?: string;
  system: string;
  unit: string;
  line_number?: string;
  p_and_id?: string;
  system_risk_category: SystemRiskCategory;
  fluid_type: string;
  operating_temperature: number; // °C
  operating_pressure: number;    // Bar
  created_at: string;
  updated_at: string;
}

export interface CorrosionCoupon {
  coupon_id: string;
  location_id: string;
  coupon_type: CouponType;
  material_type: string;
  surface_area: number;  // cm²
  initial_weight: number; // grams
  dimensions: string;
  installation_date: string; // ISO date string
  scheduled_removal_date: string; // ISO date string
  actual_removal_date?: string; // ISO date string
  orientation: CouponOrientation;
  system_type: string;
  fluid_velocity?: number; // m/s
  temperature: number; // °C
  pressure: number; // Bar
  notes?: string;
  status: CouponStatus;
  monitoring_level: MonitoringLevel;
  created_at: string;
  updated_at: string;
  location?: CorrosionLocation;
}

export interface CorrosionAnalysisReport {
  report_id: number;
  coupon_id: string;
  analysis_date: string; // ISO date string
  final_weight: number; // grams
  weight_loss: number; // grams
  exposure_days: number;
  corrosion_rate: number; // mm/year
  corrosion_type: CorrosionType;
  pitting_density?: number; // pits per unit area
  max_pit_depth?: number; // mm
  visual_inspection: string;
  microscopic_analysis?: string;
  cleaned_by: string;
  analyzed_by: string;
  approved_by: string;
  images: string[];
  recommendations: string;
  calculated_severity: 1 | 2 | 3 | 4 | 5;
  manual_override_severity?: 1 | 2 | 3 | 4 | 5;
  calculation_factors: {
    rate_factor: number;
    type_factor: number;
    pitting_factor: number;
    material_factor: number;
    visual_factor: number;
  };
  created_at: string;
  updated_at: string;
  coupon?: CorrosionCoupon;
}

export interface CorrosionMonitoringSettings {
  id: number;
  rbi_level: number;
  inspection_frequency: {
    high_risk: number; // days
    medium_risk: number; // days
    low_risk: number; // days
  };
  severity_thresholds: {
    corrosion_rate: {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      level5: number;
    };
    pitting_density: {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      level5: number;
    };
    pit_depth: {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      level5: number;
    };
  };
  material_factors: {
    [material: string]: {
      base_corrosion_rate: number;
      severity_multiplier: number;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface CorrosionSummary {
  total: {
    installed: number;
    removed: number;
    analyzed: number;
    total: number;
  };
  byType: {
    strip: number;
    rod: number;
    disc: number;
    cylinder: number;
    spiral: number;
    electrical: number;
    custom: number;
  };
  byRiskCategory: {
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
  bySeverityLevel: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
  };
  upcomingRemovals: number;
  overdue: number;
}

// Form Data Interfaces
export interface CouponFormData {
  coupon_id: string;
  location_id: string;
  coupon_type: CouponType;
  material_type: string;
  surface_area: number;
  initial_weight: number;
  dimensions: string;
  installation_date: Date;
  scheduled_removal_date: Date;
  orientation: CouponOrientation;
  system_type: string;
  fluid_velocity?: number;
  temperature: number;
  pressure: number;
  notes?: string;
  monitoring_level: MonitoringLevel;
}

export interface AnalysisFormData {
  coupon_id: string;
  analysis_date: Date;
  final_weight: number;
  corrosion_rate: number;
  corrosion_type: CorrosionType;
  pitting_density?: number;
  max_pit_depth?: number;
  visual_inspection: string;
  microscopic_analysis?: string;
  cleaned_by: string;
  analyzed_by: string;
  approved_by: string;
  images: string[];
  recommendations: string;
  manual_override_severity?: number;
  exposure_days: number;
}

export interface LocationFormData {
  location_id: string;
  name: string;
  description?: string;
  system: string;
  unit: string;
  line_number?: string;
  p_and_id?: string;
  system_risk_category: SystemRiskCategory;
  fluid_type: string;
  operating_temperature: number;
  operating_pressure: number;
}
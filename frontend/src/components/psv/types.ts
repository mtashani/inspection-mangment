export type PSVStatus = 'Spare' | 'Main';
export type TestMedium = 'Nitrogen' | 'Air' | 'Steam' | 'Water';
export type WorkMaintenance = 'Adjust' | 'Cleaning' | 'Lapping';
export type CalibrationStatus = 'NEVER_CALIBRATED' | 'OVERDUE' | 'DUE_SOON' | 'COMPLIANT';

// RBI Levels (1-4)
export type RBILevel = 1 | 2 | 3 | 4;

export interface PSV {
    tag_number: string;
    unique_no: string;
    status: PSVStatus;
    frequency: number; // months
    last_calibration_date: string;
    expire_date: string;
    unit: string;
    train: string;
    type: string;
    serial_no: string;
    set_pressure: number; // Barg
    cdtp: number; // Barg
    back_pressure: number; // Barg
    nps: string;
    inlet_size: string;
    inlet_rating: string;
    outlet_size: string;
    outlet_rating: string;
    p_and_id: string;
    line_number: string;
    service: string;
    data_sheet_no: string;
    manufacturer: string;
    created_at: string;
    updated_at: string;
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
    
    // Level 2+ RBI fields
    pre_repair_pop_test?: number;
    pre_repair_leak_test?: number;
    post_repair_pop_test: number;
    post_repair_leak_test: number;
    
    // Level 3 Assessment Fields (1-5 scale)
    body_condition_score?: number;
    body_condition_notes?: string;
    internal_parts_score?: number;
    internal_parts_notes?: string;
    seat_plug_condition_score?: number;
    seat_plug_notes?: string;
    
    created_at: string;
}

export interface RBIConfiguration {
    id: number;
    level: RBILevel;
    name: string;
    description?: string;
    active: boolean;
    settings: {
        fixed_interval?: number; // For Level 1
        pop_test_thresholds?: {
            min: number;
            max: number;
        };
        leak_test_thresholds?: {
            min: number;
            max: number;
        };
        parameter_weights?: {
            [key: string]: number;
        };
        risk_matrix?: {
            [key: string]: number[];
        };
        service_risk_categories?: {
            [key: string]: number;
        };
    };
    created_at: string;
    updated_at: string;
}

export interface ServiceRiskCategory {
    id: number;
    service_type: string;
    cof_score: number; // 1-5 per API 581
    description?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface RBICalculationResult {
    tag_number: string;
    rbi_level: RBILevel;
    current_risk_score: number;
    recommended_interval: number; // months
    next_calibration_date: string;
    pof_score?: number; // Probability of Failure (Level 3+)
    cof_score?: number; // Consequence of Failure (Level 4)
    risk_category?: string;
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

export interface PSVAnalytics {
    month: string;
    totalDue: number;
    calibrated: number;
    remaining: number;
    neverCalibrated: number;
    rbiDistribution: {
        level1: number;
        level2: number;
        level3: number;
        level4: number;
    };
    avgRiskScore: number;
}
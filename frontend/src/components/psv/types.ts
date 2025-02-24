export type PSVType = 'OPEN_BONNET' | 'PILOT' | 'OTHER';
export type TestMedium = 'AIR' | 'WATER' | 'NITROGEN' | 'STEAM';
export type CalibrationStatus = 'NEVER_CALIBRATED' | 'OVERDUE' | 'DUE_SOON' | 'COMPLIANT';

export interface PSV {
  id: string;
  tag: string;
  location: string;
  unit: string;
  popPressure: number;
  type: PSVType;
  testMedium: TestMedium;
  maxLeakage: number;
  calibrationInterval: number; // in months
  lastCalibrationDate?: string;
  nextCalibrationDate?: string;
  calibrationCount: number;
  isSpare: boolean;
  serialNo?: string;
  manufacturer?: string;
  manufacturerSerialNo?: string;
}

export interface PSVCalibration {
  id: string;
  psvId: string;
  calibrationDate: string;
  workPerformed: string[];
  testMedium: TestMedium;
  workOrderNumber: string;
  inspector: string;
  operator: string;
  approver: string;
  supervisor?: string;
  docNumber?: string;
  reportNo?: string;
  frequencyMonths?: number;
  oldestInterval?: string;
  nextCalibrationDate?: string;
  initialPopPressure: number;
  finalPopPressure: number;
  initialSecondPopPressure?: number;
  finalSecondPopPressure?: number;
  initialLeakage: number;
  finalLeakage: number;
  workshopEntryPressure: number;
  workshopExitPressure: number;
  generalCondition?: string;
}

export interface PSVSummary {
  total: {
    regular: number;
    spare: number;
  };
  underCalibration: {
    regular: number;
    spare: number;
  };
  outOfCalibration: {
    regular: number;
    spare: number;
  };
  dueNextMonth: {
    regular: number;
    spare: number;
  };
  neverCalibrated: {
    regular: number;
    spare: number;
  };
}

export interface PSVAnalytics {
  month: string;
  totalDue: number;
  calibrated: number;
  remaining: number;
  neverCalibrated: number;
}
import { PSV, PSVCalibration, PSVSummary, PSVAnalytics, CalibrationStatus } from './types';
import { addMonths, subMonths } from 'date-fns';

const today = new Date();

export const mockPSVs: PSV[] = [
  {
    id: '1',
    tag: 'PSV-1001',
    location: 'Unit 100',
    unit: 'Distillation',
    popPressure: 150.5,
    type: 'OPEN_BONNET',
    testMedium: 'AIR',
    maxLeakage: 0.1,
    calibrationInterval: 12,
    lastCalibrationDate: subMonths(today, 6).toISOString(),
    nextCalibrationDate: addMonths(today, 6).toISOString(),
    calibrationCount: 5,
    isSpare: false
  },
  {
    id: '2',
    tag: 'PSV-1002',
    location: 'Unit 200',
    unit: 'Reactor',
    popPressure: 200.0,
    type: 'PILOT',
    testMedium: 'NITROGEN',
    maxLeakage: 0.05,
    calibrationInterval: 36,
    lastCalibrationDate: subMonths(today, 38).toISOString(),
    nextCalibrationDate: subMonths(today, 2).toISOString(),
    calibrationCount: 2,
    isSpare: false
  },
  {
    id: '3',
    tag: 'PSV-S001',
    location: 'Warehouse',
    unit: 'Spares',
    popPressure: 175.0,
    type: 'OPEN_BONNET',
    testMedium: 'WATER',
    maxLeakage: 0.15,
    calibrationInterval: 24,
    calibrationCount: 0,
    isSpare: true
  },
  {
    id: '4',
    tag: 'PSV-1003',
    location: 'Unit 300',
    unit: 'Compressor',
    popPressure: 300.0,
    type: 'PILOT',
    testMedium: 'STEAM',
    maxLeakage: 0.08,
    calibrationInterval: 12,
    lastCalibrationDate: subMonths(today, 11).toISOString(),
    nextCalibrationDate: addMonths(today, 1).toISOString(),
    calibrationCount: 8,
    isSpare: false
  }
];

export const mockCalibrations: PSVCalibration[] = [
  {
    id: '1',
    psvId: '1',
    calibrationDate: subMonths(today, 6).toISOString(),
    workPerformed: ['CLEANING', 'CALIBRATION'],
    testMedium: 'AIR',
    workOrderNumber: 'WO-2024-001',
    inspector: 'John Doe',
    operator: 'Jane Smith',
    approver: 'Mike Johnson',
    initialPopPressure: 148.5,
    finalPopPressure: 150.5,
    initialLeakage: 0.15,
    finalLeakage: 0.08,
    workshopEntryPressure: 145.0,
    workshopExitPressure: 150.5
  },
  {
    id: '2',
    psvId: '1',
    calibrationDate: subMonths(today, 18).toISOString(),
    workPerformed: ['CLEANING', 'CALIBRATION', 'REPAIR'],
    testMedium: 'AIR',
    workOrderNumber: 'WO-2023-042',
    inspector: 'John Doe',
    operator: 'Jane Smith',
    approver: 'Mike Johnson',
    initialPopPressure: 142.0,
    finalPopPressure: 150.0,
    initialLeakage: 0.25,
    finalLeakage: 0.1,
    workshopEntryPressure: 140.0,
    workshopExitPressure: 150.0
  }
];

export const mockSummary: PSVSummary = {
  total: {
    regular: 3,
    spare: 1
  },
  underCalibration: {
    regular: 1,
    spare: 0
  },
  outOfCalibration: {
    regular: 1,
    spare: 0
  },
  dueNextMonth: {
    regular: 1,
    spare: 0
  },
  neverCalibrated: {
    regular: 0,
    spare: 1
  }
};

export const mockAnalytics: PSVAnalytics[] = [
  {
    month: 'January 2024',
    totalDue: 10,
    calibrated: 8,
    remaining: 2,
    neverCalibrated: 1
  },
  {
    month: 'February 2024',
    totalDue: 15,
    calibrated: 12,
    remaining: 3,
    neverCalibrated: 1
  },
  {
    month: 'March 2024',
    totalDue: 8,
    calibrated: 5,
    remaining: 3,
    neverCalibrated: 1
  }
];

export const getCalibrationStatus = (psv: PSV): CalibrationStatus => {
  if (!psv.lastCalibrationDate) {
    return 'NEVER_CALIBRATED';
  }

  const nextCalibration = new Date(psv.nextCalibrationDate!);
  const today = new Date();
  
  if (nextCalibration < today) {
    return 'OVERDUE';
  }

  const oneMonth = addMonths(today, 1);
  if (nextCalibration <= oneMonth) {
    return 'DUE_SOON';
  }

  return 'COMPLIANT';
};

export const getStatusColor = (status: CalibrationStatus): string => {
  switch (status) {
    case 'NEVER_CALIBRATED':
      return 'bg-red-900 text-white';
    case 'OVERDUE':
      return 'bg-red-500 text-white';
    case 'DUE_SOON':
      return 'bg-yellow-500';
    default:
      return 'bg-white';
  }
};
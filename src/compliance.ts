import type { ClassThresholds, EquipmentClass, RetestInterval } from './types';

export const CLASS_THRESHOLDS: Record<EquipmentClass, ClassThresholds> = {
  'Class I': {
    earth: '< 1.0',
    insulation: '> 1.0',
    leakage: '< 5.0',
    polarity: 'N/A',
    rcdTripTime: 'N/A',
    rcdTripCurrent: 'N/A',
    hasEarth: true,
    hasInsulation: true,
    hasLeakage: true,
    hasPolarity: false,
    hasRCD: false,
  },
  'Class II': {
    earth: 'N/A',
    insulation: '> 2.0',
    leakage: '< 1.0',
    polarity: 'N/A',
    rcdTripTime: 'N/A',
    rcdTripCurrent: 'N/A',
    hasEarth: false,
    hasInsulation: true,
    hasLeakage: true,
    hasPolarity: false,
    hasRCD: false,
  },
  'Lead / Cord Set': {
    earth: '< 1.0',
    insulation: '> 1.0',
    leakage: '< 1.0',
    polarity: 'Pass',
    rcdTripTime: 'N/A',
    rcdTripCurrent: 'N/A',
    hasEarth: true,
    hasInsulation: true,
    hasLeakage: true,
    hasPolarity: true,
    hasRCD: false,
  },
  'Portable RCD': {
    earth: 'N/A',
    insulation: 'N/A',
    leakage: 'N/A',
    polarity: 'N/A',
    rcdTripTime: '< 300',
    rcdTripCurrent: '< 30',
    hasEarth: false,
    hasInsulation: false,
    hasLeakage: false,
    hasPolarity: false,
    hasRCD: true,
  },
};

export const DEFECT_REASONS = [
  'Frayed Cable',
  'Cracked/Damaged Casing',
  'Damaged Plug',
  'High Earth Resistance',
  'Low Insulation Resistance',
  'High Leakage Current',
  'Failed Polarity',
  'RCD Trip Time Exceeded',
  'RCD Trip Current Exceeded',
  'Missing Safety Guards',
  'Other',
];

export const ACTIONS_TAKEN = [
  'Tagged Out',
  'Quarantined',
  'Scrapped',
  'Sent for Repair',
  'Repaired & Retested',
];

export const QUICK_PRESETS = [
  'Power Board',
  'IEC Lead',
  '18V Charger',
  'Extension Lead',
  'Laptop Charger',
  'Angle Grinder',
  'Kettle',
  'Desktop PC',
  'Monitor',
  'Printer',
  'Microwave',
  'Fan Heater',
];

export function calculateNextTestDue(testDate: string, interval: RetestInterval): string {
  const d = new Date(testDate + 'T00:00:00');
  d.setMonth(d.getMonth() + interval);
  return d.toISOString().slice(0, 10);
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generatePassValues(cls: EquipmentClass): {
  earthContinuity: string;
  insulationResistance: string;
  leakageCurrent: string;
  polarityCheck: 'PASS' | 'FAIL' | 'N/A';
  rcdTripTime: string;
  rcdTripCurrent: string;
} {
  const t = CLASS_THRESHOLDS[cls];
  return {
    earthContinuity: t.earth,
    insulationResistance: t.insulation,
    leakageCurrent: t.leakage,
    polarityCheck: t.hasPolarity ? 'PASS' : 'N/A',
    rcdTripTime: t.rcdTripTime,
    rcdTripCurrent: t.rcdTripCurrent,
  };
}

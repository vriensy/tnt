export type EquipmentClass = 'Class I' | 'Class II' | 'Lead / Cord Set' | 'Portable RCD';

export type TestStatus = 'PASS' | 'FAIL' | 'N/A';

export type RetestInterval = 3 | 6 | 12 | 24 | 60;

export interface Customer {
  id?: number;
  name: string;
  createdAt: string;
}

export interface Site {
  id?: number;
  customerId: number;
  address: string;
  createdAt: string;
}

export interface SiteLocation {
  id?: number;
  siteId: number;
  name: string;
  createdAt: string;
}

export interface JobInfo {
  id: number;
  clientName: string;
  siteAddress: string;
  testerName: string;
  patTesterSerial: string;
  customerId?: number;
  siteId?: number;
  updatedAt: string;
}

export interface Asset {
  id?: number;
  tagId: string;
  clientName: string;
  siteAddress: string;
  description: string;
  location: string;
  equipmentClass: EquipmentClass;
  visualInspection: TestStatus;
  earthContinuity: string;
  insulationResistance: string;
  leakageCurrent: string;
  polarityCheck: TestStatus;
  rcdTripTime: string;
  rcdTripCurrent: string;
  overallStatus: TestStatus;
  testDate: string;
  retestInterval: RetestInterval;
  nextTestDue: string;
  testerName: string;
  patTesterId: string;
  defectNotes: string;
  actionTaken: string;
  createdAt: string;
}

export interface ClassThresholds {
  earth: string;
  insulation: string;
  leakage: string;
  polarity: string;
  rcdTripTime: string;
  rcdTripCurrent: string;
  hasEarth: boolean;
  hasInsulation: boolean;
  hasLeakage: boolean;
  hasPolarity: boolean;
  hasRCD: boolean;
}

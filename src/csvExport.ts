import type { Asset } from './types';

const CSV_COLUMNS = [
  'Client_Name',
  'Site_Address',
  'Asset_ID',
  'Description',
  'Location',
  'Equipment_Class',
  'Visual_Inspection',
  'Earth_Continuity_Ohm',
  'Insulation_Resistance_MOhm',
  'Leakage_Current_mA',
  'Polarity_Check',
  'RCD_Trip_Time_ms',
  'RCD_Trip_Current_mA',
  'Overall_Status',
  'Test_Date',
  'Retest_Interval',
  'Next_Test_Due',
  'Tester_Name',
  'PAT_Tester_ID',
  'Defect_Notes',
  'Action_Taken',
] as const;

function escapeCSV(value: string): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function generateCSV(assets: Asset[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = assets.map((a) => {
    const values = [
      a.clientName,
      a.siteAddress,
      a.tagId,
      a.description,
      a.location,
      a.equipmentClass,
      a.visualInspection,
      a.earthContinuity,
      a.insulationResistance,
      a.leakageCurrent,
      a.polarityCheck,
      a.rcdTripTime,
      a.rcdTripCurrent,
      a.overallStatus,
      a.testDate,
      `${a.retestInterval} months`,
      a.nextTestDue,
      a.testerName,
      a.patTesterId,
      a.defectNotes,
      a.actionTaken,
    ];
    return values.map(escapeCSV).join(',');
  });
  return [header, ...rows].join('\r\n');
}

export function downloadCSV(assets: Asset[], filename: string): void {
  const csv = generateCSV(assets);
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

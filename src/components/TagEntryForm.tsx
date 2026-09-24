import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Tag,
  MapPin,
  FileText,
  Hash,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { Asset, EquipmentClass, RetestInterval, TestStatus } from '../types';
import { CLASS_THRESHOLDS, DEFECT_REASONS, ACTIONS_TAKEN, QUICK_PRESETS, calculateNextTestDue, generatePassValues, todayString } from '../compliance';
import { getHighestTagNumber, tagIdExists } from '../db';
import type { JobInfoState } from '../hooks/useJobInfo';

interface Props {
  jobInfo: JobInfoState;
  subLocation: string;
  onSubLocationChange: (v: string) => void;
  retestInterval: RetestInterval;
  onRetestIntervalChange: (v: RetestInterval) => void;
  editingAsset: Asset | null;
  onSave: (asset: Asset, isEdit: boolean) => void;
  onCancelEdit: () => void;
}

const CLASS_OPTIONS: EquipmentClass[] = ['Class I', 'Class II', 'Lead / Cord Set', 'Portable RCD'];
const INTERVAL_OPTIONS: RetestInterval[] = [3, 6, 12, 24, 60];

function blankForm(): Asset {
  return {
    tagId: '',
    clientName: '',
    siteAddress: '',
    description: '',
    location: '',
    equipmentClass: 'Class I',
    visualInspection: 'PASS',
    earthContinuity: '',
    insulationResistance: '',
    leakageCurrent: '',
    polarityCheck: 'N/A',
    rcdTripTime: '',
    rcdTripCurrent: '',
    overallStatus: 'PASS',
    testDate: todayString(),
    retestInterval: 12,
    nextTestDue: '',
    testerName: '',
    patTesterId: '',
    defectNotes: '',
    actionTaken: '',
    createdAt: '',
  };
}

export function TagEntryForm({
  jobInfo,
  subLocation,
  onSubLocationChange,
  retestInterval,
  onRetestIntervalChange,
  editingAsset,
  onSave,
  onCancelEdit,
}: Props) {
  const [form, setForm] = useState<Asset>(blankForm());
  const [autoIncrement, setAutoIncrement] = useState(true);
  const [showFailFields, setShowFailFields] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [resumePrompt, setResumePrompt] = useState<{ tagId: string; number: number } | null>(null);
  const [tagPrefix, setTagPrefix] = useState('TAG-');
  const tagIdInputRef = useRef<HTMLInputElement>(null);

  const thresholds = useMemo(() => CLASS_THRESHOLDS[form.equipmentClass], [form.equipmentClass]);

  // When editing an asset, load it into the form
  useEffect(() => {
    if (editingAsset) {
      setForm({ ...editingAsset });
      setShowFailFields(editingAsset.overallStatus === 'FAIL');
      setAutoIncrement(false);
      // Extract prefix from tag ID
      const match = editingAsset.tagId.match(/^([A-Za-z\-]*?)(\d+)$/);
      if (match) {
        setTagPrefix(match[1] || 'TAG-');
      }
    }
  }, [editingAsset]);

  // Sync job info into form whenever it changes (but not when editing)
  useEffect(() => {
    if (!editingAsset) {
      setForm((prev) => ({
        ...prev,
        clientName: jobInfo.clientName,
        siteAddress: jobInfo.siteAddress,
        testerName: jobInfo.testerName,
        patTesterId: jobInfo.patTesterSerial,
        location: subLocation,
        retestInterval,
      }));
    }
  }, [jobInfo, subLocation, retestInterval, editingAsset]);

  // Auto-generate next tag ID when not editing
  useEffect(() => {
    if (!editingAsset && autoIncrement) {
      getHighestTagNumber(tagPrefix).then((max) => {
        const nextNum = max + 1;
        const padded = String(nextNum).padStart(3, '0');
        setForm((prev) => ({ ...prev, tagId: `${tagPrefix}${padded}` }));
      });
    }
  }, [tagPrefix, autoIncrement, editingAsset]);

  // Real-time duplicate check
  const checkDuplicate = useCallback(async (tagId: string) => {
    if (!tagId.trim()) {
      setDuplicateWarning(false);
      return;
    }
    const exists = await tagIdExists(tagId.trim());
    setDuplicateWarning(exists);
  }, []);

  const handleTagIdChange = (value: string) => {
    const trimmed = value.trim();
    setForm((prev) => ({ ...prev, tagId: trimmed }));
    checkDuplicate(trimmed);
  };

  const handleClassChange = (cls: EquipmentClass) => {
    setForm((prev) => ({ ...prev, equipmentClass: cls }));
  };

  const handlePreset = (preset: string) => {
    setForm((prev) => ({ ...prev, description: preset }));
  };

  const buildPassAsset = (): Asset => {
    const passValues = generatePassValues(form.equipmentClass);
    const testDate = form.testDate || todayString();
    return {
      ...form,
      tagId: form.tagId.trim(),
      visualInspection: 'PASS' as TestStatus,
      earthContinuity: passValues.earthContinuity,
      insulationResistance: passValues.insulationResistance,
      leakageCurrent: passValues.leakageCurrent,
      polarityCheck: passValues.polarityCheck,
      rcdTripTime: passValues.rcdTripTime,
      rcdTripCurrent: passValues.rcdTripCurrent,
      overallStatus: 'PASS' as TestStatus,
      defectNotes: '',
      actionTaken: '',
      testDate,
      retestInterval,
      nextTestDue: calculateNextTestDue(testDate, retestInterval),
      clientName: jobInfo.clientName,
      siteAddress: jobInfo.siteAddress,
      testerName: jobInfo.testerName,
      patTesterId: jobInfo.patTesterSerial,
      location: subLocation,
      createdAt: editingAsset?.createdAt || new Date().toISOString(),
    };
  };

  const handleQuickPass = async () => {
    if (!form.tagId.trim()) {
      tagIdInputRef.current?.focus();
      return;
    }
    const asset = buildPassAsset();
    const isEdit = editingAsset !== null || duplicateWarning;
    await handleSave(asset, isEdit);
    // Reset form for next entry
    if (!editingAsset) {
      setShowFailFields(false);
      setForm((prev) => ({
        ...blankForm(),
        equipmentClass: prev.equipmentClass,
        description: '',
      }));
    }
  };

  const handleFail = () => {
    setShowFailFields(true);
    setForm((prev) => ({
      ...prev,
      overallStatus: 'FAIL' as TestStatus,
      visualInspection: 'FAIL' as TestStatus,
    }));
  };

  const handleFailSave = async () => {
    if (!form.tagId.trim()) {
      tagIdInputRef.current?.focus();
      return;
    }
    const testDate = form.testDate || todayString();
    const asset: Asset = {
      ...form,
      tagId: form.tagId.trim(),
      overallStatus: 'FAIL' as TestStatus,
      testDate,
      retestInterval,
      nextTestDue: calculateNextTestDue(testDate, retestInterval),
      clientName: jobInfo.clientName,
      siteAddress: jobInfo.siteAddress,
      testerName: jobInfo.testerName,
      patTesterId: jobInfo.patTesterSerial,
      location: subLocation,
      createdAt: editingAsset?.createdAt || new Date().toISOString(),
    };
    const isEdit = editingAsset !== null || duplicateWarning;
    await handleSave(asset, isEdit);
    setShowFailFields(false);
    if (!editingAsset) {
      setForm((prev) => ({
        ...blankForm(),
        equipmentClass: prev.equipmentClass,
        description: '',
      }));
    }
  };

  // After saving with overwrite, check if we should prompt resume
  const handleSave = async (asset: Asset, isEdit: boolean) => {
    await onSave(asset, isEdit);
    if (isEdit && !editingAsset) {
      // Overwrite case — check for resume prompt
      const match = asset.tagId.match(/^([A-Za-z\-]*?)(\d+)$/);
      if (match) {
        const prefix = match[1] || 'TAG-';
        const currentNum = parseInt(match[2], 10);
        const highest = await getHighestTagNumber(prefix);
        if (highest > currentNum) {
          const nextNum = highest + 1;
          const padded = String(nextNum).padStart(3, '0');
          setResumePrompt({ tagId: `${prefix}${padded}`, number: nextNum });
        }
      }
    }
    if (editingAsset) {
      // After editing, check if tag is lower than highest
      const match = asset.tagId.match(/^([A-Za-z\-]*?)(\d+)$/);
      if (match) {
        const prefix = match[1] || 'TAG-';
        const currentNum = parseInt(match[2], 10);
        const highest = await getHighestTagNumber(prefix);
        if (highest > currentNum) {
          const nextNum = highest + 1;
          const padded = String(nextNum).padStart(3, '0');
          setResumePrompt({ tagId: `${prefix}${padded}`, number: nextNum });
        }
      }
    }
  };

  const handleResume = () => {
    if (resumePrompt) {
      setForm((prev) => ({ ...prev, tagId: resumePrompt.tagId }));
      setResumePrompt(null);
      setAutoIncrement(true);
      setShowFailFields(false);
      setForm((prev) => ({
        ...blankForm(),
        tagId: resumePrompt.tagId,
        equipmentClass: prev.equipmentClass,
      }));
    }
  };

  const setField = (field: keyof Asset, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Resume Prompt */}
      {resumePrompt && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 text-sm text-blue-900">
            Resume from highest tag ({resumePrompt.tagId})?
          </div>
          <button
            onClick={handleResume}
            className="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Resume {resumePrompt.tagId}
          </button>
        </div>
      )}

      {/* Tag ID */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Asset Tag ID</label>
        <div className="relative mt-0.5">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={tagIdInputRef}
            type="text"
            value={form.tagId}
            onChange={(e) => handleTagIdChange(e.target.value)}
            placeholder="TAG-001"
            autoCapitalize="characters"
            autoCorrect="off"
            className="w-full h-12 pl-9 pr-12 rounded-lg border border-gray-200 bg-white text-base font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Auto-increment toggle */}
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <button
            type="button"
            onClick={() => setAutoIncrement(!autoIncrement)}
            className={`relative w-10 h-6 rounded-full transition-colors ${autoIncrement ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoIncrement ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-xs text-gray-600 font-medium">Auto-increment Tag ID</span>
        </label>
        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-yellow-50 border border-yellow-300">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 font-medium">
              Warning: Tag ID already exists. Saving will overwrite existing record.
            </p>
          </div>
        )}
      </div>

      {/* Description + Quick Presets */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Description</label>
        <div className="relative mt-0.5">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="e.g. Power Board, IEC Lead"
            className="w-full h-11 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                form.description === preset
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Location (sticky) */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Sub-Location (remembers between tags)</label>
        <div className="relative mt-0.5">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={subLocation}
            onChange={(e) => onSubLocationChange(e.target.value)}
            placeholder="e.g. Kitchenette, Workshop"
            className="w-full h-11 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Equipment Class Selector */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Equipment Class</label>
        <div className="grid grid-cols-2 gap-2 mt-0.5">
          {CLASS_OPTIONS.map((cls) => (
            <button
              key={cls}
              onClick={() => handleClassChange(cls)}
              className={`h-12 rounded-lg text-sm font-semibold border transition-all active:scale-95 ${
                form.equipmentClass === cls
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
        {/* Threshold display */}
        <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Hash className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-semibold text-gray-500">Pass Thresholds</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
            {thresholds.hasEarth && <span>Earth: <strong>{thresholds.earth} Ω</strong></span>}
            {thresholds.hasInsulation && <span>Insulation: <strong>{thresholds.insulation} MΩ</strong></span>}
            {thresholds.hasLeakage && <span>Leakage: <strong>{thresholds.leakage} mA</strong></span>}
            {thresholds.hasPolarity && <span>Polarity: <strong>Pass</strong></span>}
            {thresholds.hasRCD && <span>Trip: <strong>{thresholds.rcdTripTime} ms / {thresholds.rcdTripCurrent} mA</strong></span>}
          </div>
        </div>
      </div>

      {/* Retest Interval */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> Retest Interval (remembers between tags)
        </label>
        <div className="flex gap-2 mt-0.5">
          {INTERVAL_OPTIONS.map((interval) => (
            <button
              key={interval}
              onClick={() => onRetestIntervalChange(interval)}
              className={`flex-1 h-11 rounded-lg text-sm font-semibold border transition-all active:scale-95 ${
                retestInterval === interval
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {interval}mo
            </button>
          ))}
        </div>
      </div>

      {/* Editing banner */}
      {editingAsset && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
          <span className="text-sm text-blue-800 font-medium">Editing: {editingAsset.tagId}</span>
          <button
            onClick={onCancelEdit}
            className="px-3 py-1.5 rounded-lg bg-white text-blue-600 text-xs font-semibold border border-blue-200 active:scale-95 transition-transform"
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* Primary Actions */}
      {!showFailFields ? (
        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleQuickPass}
            className="w-full h-[52px] rounded-xl bg-green-600 text-white font-bold text-base shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-6 h-6" />
            QUICK PASS & SAVE
          </button>
          <button
            onClick={handleFail}
            className="w-full h-12 rounded-xl bg-red-50 text-red-600 font-bold text-sm border-2 border-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            FAIL — Log Defect
          </button>
        </div>
      ) : (
        <FailFields
          form={form}
          setField={setField}
          thresholds={thresholds}
          onSave={handleFailSave}
          onCancel={() => {
            setShowFailFields(false);
            setForm((prev) => ({ ...prev, overallStatus: 'PASS' as TestStatus, visualInspection: 'PASS' as TestStatus }));
          }}
        />
      )}
    </div>
  );
}

function FailFields({
  form,
  setField,
  thresholds,
  onSave,
  onCancel,
}: {
  form: Asset;
  setField: (field: keyof Asset, value: string) => void;
  thresholds: typeof CLASS_THRESHOLDS['Class I'];
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 p-3 rounded-xl bg-red-50 border border-red-200">
      <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
        <XCircle className="w-5 h-5" />
        Defect Logging
      </div>

      {/* Measurement fields */}
      <div className="grid grid-cols-2 gap-2">
        {thresholds.hasEarth && (
          <NumField label="Earth (Ω)" value={form.earthContinuity} onChange={(v) => setField('earthContinuity', v)} threshold={thresholds.earth} />
        )}
        {thresholds.hasInsulation && (
          <NumField label="Insulation (MΩ)" value={form.insulationResistance} onChange={(v) => setField('insulationResistance', v)} threshold={thresholds.insulation} />
        )}
        {thresholds.hasLeakage && (
          <NumField label="Leakage (mA)" value={form.leakageCurrent} onChange={(v) => setField('leakageCurrent', v)} threshold={thresholds.leakage} />
        )}
        {thresholds.hasPolarity && (
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">Polarity</label>
            <select
              value={form.polarityCheck}
              onChange={(e) => setField('polarityCheck', e.target.value)}
              className="w-full h-11 mt-0.5 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
            </select>
          </div>
        )}
        {thresholds.hasRCD && (
          <>
            <NumField label="Trip Time (ms)" value={form.rcdTripTime} onChange={(v) => setField('rcdTripTime', v)} threshold={thresholds.rcdTripTime} />
            <NumField label="Trip Current (mA)" value={form.rcdTripCurrent} onChange={(v) => setField('rcdTripCurrent', v)} threshold={thresholds.rcdTripCurrent} />
          </>
        )}
      </div>

      {/* Defect Reason */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Defect Reason *</label>
        <select
          value={form.defectNotes}
          onChange={(e) => setField('defectNotes', e.target.value)}
          className="w-full h-11 mt-0.5 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="">Select defect...</option>
          {DEFECT_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Action Taken */}
      <div>
        <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Action Taken *</label>
        <select
          value={form.actionTaken}
          onChange={(e) => setField('actionTaken', e.target.value)}
          className="w-full h-11 mt-0.5 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="">Select action...</option>
          {ACTIONS_TAKEN.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 h-12 rounded-xl bg-white text-gray-600 font-semibold text-sm border border-gray-200 active:scale-95 transition-transform"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!form.defectNotes || !form.actionTaken}
          className="flex-[2] h-12 rounded-xl bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5" />
          Save FAIL Record
        </button>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, threshold }: { label: string; value: string; onChange: (v: string) => void; threshold: string }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 uppercase">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Pass: ${threshold}`}
        className="w-full h-11 mt-0.5 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      />
    </div>
  );
}

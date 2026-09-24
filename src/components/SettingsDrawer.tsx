import { useRef, useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, Database, Trash2, Info } from 'lucide-react';
import type { Asset } from '../types';
import { downloadCSV, downloadJSON } from '../csvExport';
import { db } from '../db';

interface Props {
  open: boolean;
  onClose: () => void;
  assets: Asset[];
  onReplaceAll: (assets: Asset[]) => Promise<void>;
  onClearAll: () => Promise<void>;
}

export function SettingsDrawer({ open, onClose, assets, onReplaceAll, onClearAll }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleBackup = async () => {
    const allAssets = await db.assets.toArray();
    const job = await db.jobInfo.get(1);
    const data = { exportDate: new Date().toISOString(), jobInfo: job, assets: allAssets };
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJSON(data, `testtag-backup-${dateStr}.json`);
    setMessage('Database backed up successfully.');
  };

  const handleExportCSV = () => {
    if (assets.length === 0) {
      setMessage('No assets to export.');
      return;
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(assets, `asset-register-${dateStr}.csv`);
    setMessage('CSV exported successfully.');
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.assets && Array.isArray(data.assets)) {
        await onReplaceAll(data.assets);
        setMessage(`Restored ${data.assets.length} asset records.`);
      } else {
        setMessage('Invalid backup file format.');
      }
    } catch {
      setMessage('Failed to read backup file.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClearAll = async () => {
    if (confirm('Delete ALL data permanently? This cannot be undone.')) {
      await onClearAll();
      setMessage('All data has been deleted.');
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl z-50 shadow-2xl">
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base">Settings & Data</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-90 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          {message && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800 font-medium">
              {message}
            </div>
          )}

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 active:scale-[0.98] transition-transform hover:border-blue-400"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-sm text-gray-900">Export Asset Register (.CSV)</div>
              <div className="text-xs text-gray-500">Download all tested assets as CSV</div>
            </div>
            <Download className="w-5 h-5 text-gray-300" />
          </button>

          {/* JSON Backup */}
          <button
            onClick={handleBackup}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 active:scale-[0.98] transition-transform hover:border-blue-400"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-sm text-gray-900">Backup Database (.JSON)</div>
              <div className="text-xs text-gray-500">Export all data for transfer or safekeeping</div>
            </div>
            <Download className="w-5 h-5 text-gray-300" />
          </button>

          {/* JSON Restore */}
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 active:scale-[0.98] transition-transform hover:border-blue-400"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Upload className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-sm text-gray-900">Restore Database (.JSON)</div>
              <div className="text-xs text-gray-500">Upload a backup file to restore data</div>
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleRestore} className="hidden" />

          {/* Danger zone */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 uppercase tracking-wide mb-1.5">
              <Info className="w-3.5 h-3.5" /> Danger Zone
            </div>
            <button
              onClick={handleClearAll}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-red-200 bg-red-50 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-sm text-red-700">Delete All Data</div>
                <div className="text-xs text-red-400">Permanently remove all assets and job info</div>
              </div>
            </button>
          </div>

          <div className="pt-3 text-center">
            <p className="text-[11px] text-gray-400">AS/NZS 3760:2022 Test & Tag PWA · Offline-capable</p>
          </div>
        </div>
      </div>
    </>
  );
}

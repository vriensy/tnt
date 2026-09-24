import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Plus, Settings, FileSpreadsheet } from 'lucide-react';
import type { Asset, RetestInterval } from './types';
import { useAssets } from './hooks/useAssets';
import { useJobInfo } from './hooks/useJobInfo';
import { useServiceWorker } from './hooks/useServiceWorker';
import { db } from './db';
import { downloadCSV } from './csvExport';
import { JobHeader } from './components/JobHeader';
import { TagEntryForm } from './components/TagEntryForm';
import { AssetRegister, SummaryHeader } from './components/AssetRegister';
import { SettingsDrawer } from './components/SettingsDrawer';
import { UpdateBanner, OfflineIndicator } from './components/UpdateBanner';

type Tab = 'entry' | 'register';

export default function App() {
  const { assets, addAsset, updateAsset, deleteAsset, replaceAll } = useAssets();
  const { jobInfo, update } = useJobInfo();
  const { updateAvailable, applyUpdate, canInstall, promptInstall, checkForUpdate } = useServiceWorker();

  const [tab, setTab] = useState<Tab>('entry');
  const [subLocation, setSubLocation] = useState('');
  const [retestInterval, setRetestInterval] = useState<RetestInterval>(12);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleSave = useCallback(
    async (asset: Asset, isEdit: boolean) => {
      if (isEdit && asset.id) {
        await updateAsset(asset.id, asset);
        showToast(`Updated ${asset.tagId}`);
      } else {
        const { id, ...rest } = asset;
        void id;
        await addAsset(rest as Asset);
        showToast(`Saved ${asset.tagId}`);
      }
      setEditingAsset(null);
    },
    [addAsset, updateAsset, showToast],
  );

  const handleEdit = useCallback((asset: Asset) => {
    setEditingAsset(asset);
    setTab('entry');
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteAsset(id);
      showToast('Asset deleted');
    },
    [deleteAsset, showToast],
  );

  const handleClearAll = useCallback(async () => {
    await db.assets.clear();
    await db.jobInfo.clear();
    window.location.reload();
  }, []);

  const handleExportCSV = useCallback(() => {
    if (assets.length === 0) {
      showToast('No assets to export');
      return;
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(assets, `asset-register-${dateStr}.csv`);
    showToast('CSV exported');
  }, [assets, showToast]);

  const hasBanner = updateAvailable || canInstall;
  const bannerHeight = hasBanner ? (updateAvailable && canInstall ? 76 : 44) : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <UpdateBanner
        updateAvailable={updateAvailable}
        onApplyUpdate={applyUpdate}
        canInstall={canInstall}
        onInstall={promptInstall}
      />

      {/* App Header */}
      <header
        className="sticky z-30 bg-blue-600 text-white shadow-md"
        style={{ top: bannerHeight }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <ZapIcon />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Test & Tag</h1>
              <p className="text-[10px] text-blue-200 leading-tight">AS/NZS 3760:2022</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportCSV}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
              aria-label="Export CSV"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        <OfflineIndicator isOffline={isOffline} />
      </header>

      {/* Job Header (sticky below app header) */}
      {tab === 'entry' && (
        <div style={{ marginTop: 0 }}>
          <JobHeader jobInfo={jobInfo} onChange={update} />
        </div>
      )}

      {/* Summary stats for register tab */}
      {tab === 'register' && <SummaryHeader assets={assets} />}

      {/* Main content */}
      <main>
        {tab === 'entry' ? (
          <TagEntryForm
            jobInfo={jobInfo}
            subLocation={subLocation}
            onSubLocationChange={setSubLocation}
            retestInterval={retestInterval}
            onRetestIntervalChange={setRetestInterval}
            editingAsset={editingAsset}
            onSave={handleSave}
            onCancelEdit={() => setEditingAsset(null)}
          />
        ) : (
          <AssetRegister assets={assets} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center h-16 pb-safe">
        <TabButton
          active={tab === 'entry'}
          onClick={() => setTab('entry')}
          icon={<Plus className="w-5 h-5" />}
          label="New Tag"
        />
        <TabButton
          active={tab === 'register'}
          onClick={() => setTab('register')}
          icon={<ClipboardList className="w-5 h-5" />}
          label={`Register (${assets.length})`}
        />
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-20" />

      {/* Settings Drawer */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        assets={assets}
        onReplaceAll={replaceAll}
        onClearAll={handleClearAll}
        updateAvailable={updateAvailable}
        onApplyUpdate={applyUpdate}
        onCheckForUpdate={checkForUpdate}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
        active ? 'text-blue-600' : 'text-gray-400'
      }`}
    >
      {icon}
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

function ZapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

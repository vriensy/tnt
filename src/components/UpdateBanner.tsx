import { AlertTriangle, RefreshCw, Download } from 'lucide-react';

interface Props {
  updateAvailable: boolean;
  onApplyUpdate: () => void;
  canInstall: boolean;
  onInstall: () => void;
}

export function UpdateBanner({ updateAvailable, onApplyUpdate, canInstall, onInstall }: Props) {
  if (!updateAvailable && !canInstall) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-1 px-3 py-2 bg-amber-500 text-amber-950 shadow-lg">
      {updateAvailable && (
        <button
          onClick={onApplyUpdate}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-amber-950 text-amber-50 font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          <RefreshCw className="w-4 h-4" />
          New Version Available — Tap to Reload
        </button>
      )}
      {canInstall && (
        <button
          onClick={onInstall}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-amber-900/80 text-amber-50 font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          <Download className="w-4 h-4" />
          Install App to Home Screen
        </button>
      )}
    </div>
  );
}

export function OfflineIndicator({ isOffline }: { isOffline: boolean }) {
  if (!isOffline) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gray-800 text-gray-100 text-xs font-medium">
      <AlertTriangle className="w-3.5 h-3.5" />
      Offline Mode — data saved locally on device
    </div>
  );
}

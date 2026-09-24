import { CheckCircle2, XCircle, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Asset } from '../types';
import { Pencil, Trash2 } from 'lucide-react';

interface Props {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: number) => void;
}

export function SummaryHeader({ assets }: { assets: Asset[] }) {
  const passed = assets.filter((a) => a.overallStatus === 'PASS').length;
  const failed = assets.filter((a) => a.overallStatus === 'FAIL').length;
  const total = assets.length;

  return (
    <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-white border-b border-gray-200">
      <StatCard label="Total" value={total} color="text-gray-900" bg="bg-gray-50" />
      <StatCard label="Passed" value={passed} color="text-green-700" bg="bg-green-50" icon={<CheckCircle2 className="w-4 h-4" />} />
      <StatCard label="Failed" value={failed} color="text-red-700" bg="bg-red-50" icon={<XCircle className="w-4 h-4" />} />
    </div>
  );
}

function StatCard({ label, value, color, bg, icon }: { label: string; value: number; color: string; bg: string; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-lg ${bg} py-2 px-2 text-center`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[11px] font-medium text-gray-500 flex items-center justify-center gap-1 mt-0.5">
        {icon}
        {label}
      </div>
    </div>
  );
}

export function AssetRegister({ assets, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return assets;
    const q = search.toLowerCase();
    return assets.filter(
      (a) =>
        a.tagId.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [assets, search]);

  return (
    <div>
      {/* Search */}
      <div className="px-4 py-2.5 bg-white border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Tag ID, location, or description..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="px-4 py-12 text-center text-gray-400 text-sm">
          {assets.length === 0 ? 'No assets tested yet. Start by adding one above.' : 'No results found.'}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map((asset) => (
            <AssetRow key={asset.id} asset={asset} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssetRow({ asset, onEdit, onDelete }: { asset: Asset; onEdit: (a: Asset) => void; onDelete: (id: number) => void }) {
  const isPass = asset.overallStatus === 'PASS';
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white active:bg-gray-50 transition-colors">
      {/* Status dot */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${isPass ? 'bg-green-100' : 'bg-red-100'}`}>
        {isPass ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-gray-900 truncate">{asset.tagId}</span>
          <span className="text-xs text-gray-400">{asset.equipmentClass}</span>
        </div>
        <div className="text-xs text-gray-500 truncate">
          {asset.description || '—'} {asset.location && `· ${asset.location}`}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          {asset.testDate} → Due {asset.nextTestDue}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(asset)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-90 transition-all"
          aria-label="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete ${asset.tagId}? This cannot be undone.`)) {
              onDelete(asset.id!);
            }
          }}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

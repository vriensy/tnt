import { useEffect, useState } from 'react';
import { X, ChevronRight, Pencil, Trash2, Check } from 'lucide-react';
import type { Customer, Site } from '../types';
import { useSites } from '../hooks/useSites';
import { useLocations } from '../hooks/useLocations';

interface Props {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onRenameCustomer: (id: number, name: string) => Promise<void>;
  onDeleteCustomer: (id: number) => Promise<void>;
  onCustomerChanged: (id: number, newName: string | null) => void;
  onSiteChanged: (id: number, newAddress: string | null) => void;
}

export function CustomerManager({
  open,
  onClose,
  customers,
  onRenameCustomer,
  onDeleteCustomer,
  onCustomerChanged,
  onSiteChanged,
}: Props) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl z-50 shadow-2xl">
        <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base">Customers & Sites</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-90 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400 text-sm">
            No customers saved yet. They're added automatically the first time you use the Client Name field.
          </div>
        ) : (
          <div>
            {customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                onRename={async (name) => {
                  await onRenameCustomer(customer.id!, name);
                  onCustomerChanged(customer.id!, name);
                }}
                onDelete={async () => {
                  await onDeleteCustomer(customer.id!);
                  onCustomerChanged(customer.id!, null);
                }}
                onSiteChanged={onSiteChanged}
              />
            ))}
          </div>
        )}

        <div className="px-4 py-3 text-[11px] text-gray-400 border-t border-gray-100">
          Renaming or deleting here doesn't change tags you've already saved — it only affects what's offered when picking a customer, site, or location for new tags.
        </div>
      </div>
    </>
  );
}

function CustomerRow({
  customer,
  onRename,
  onDelete,
  onSiteChanged,
}: {
  customer: Customer;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onSiteChanged: (id: number, newAddress: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { sites, renameSite, removeSite } = useSites(customer.id);

  return (
    <div className="border-b border-gray-100">
      <ManageRow
        name={customer.name}
        subtitle={expanded || sites.length > 0 ? `${sites.length} site${sites.length === 1 ? '' : 's'}` : undefined}
        expandable
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
        onRename={onRename}
        onDelete={onDelete}
        deleteConfirmMessage={
          sites.length > 0
            ? `Delete "${customer.name}"? This also deletes its ${sites.length} saved site(s) and any locations under them. Existing saved tags are unaffected.`
            : `Delete "${customer.name}"? Existing saved tags are unaffected.`
        }
        renameLabel="customer"
      />
      {expanded && (
        <div className="pl-6 pb-1">
          {sites.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No saved sites yet.</div>
          ) : (
            sites.map((site) => (
              <SiteRow
                key={site.id}
                site={site}
                onRename={async (address) => {
                  await renameSite(site.id!, address);
                  onSiteChanged(site.id!, address);
                }}
                onDelete={async () => {
                  await removeSite(site.id!);
                  onSiteChanged(site.id!, null);
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SiteRow({
  site,
  onRename,
  onDelete,
}: {
  site: Site;
  onRename: (address: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const { locations, renameLocation, removeLocation } = useLocations(site.id);

  return (
    <div className="border-l-2 border-gray-100">
      <ManageRow
        name={site.address}
        subtitle={expanded || locations.length > 0 ? `${locations.length} location${locations.length === 1 ? '' : 's'}` : undefined}
        expandable
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
        onRename={onRename}
        onDelete={onDelete}
        deleteConfirmMessage={
          locations.length > 0
            ? `Delete "${site.address}"? This also deletes its ${locations.length} saved location(s). Existing saved tags are unaffected.`
            : `Delete "${site.address}"? Existing saved tags are unaffected.`
        }
        renameLabel="site"
      />
      {expanded && (
        <div className="pl-6 pb-1">
          {locations.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No saved locations yet.</div>
          ) : (
            locations.map((loc) => (
              <ManageRow
                key={loc.id}
                name={loc.name}
                onRename={(name) => renameLocation(loc.id!, name)}
                onDelete={() => removeLocation(loc.id!)}
                deleteConfirmMessage={`Delete "${loc.name}"? Existing saved tags are unaffected.`}
                renameLabel="location"
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ManageRow({
  name,
  subtitle,
  expandable,
  expanded,
  onToggleExpand,
  onRename,
  onDelete,
  deleteConfirmMessage,
  renameLabel,
}: {
  name: string;
  subtitle?: string;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onRename: (newName: string) => Promise<void>;
  onDelete: () => Promise<void>;
  deleteConfirmMessage: string;
  renameLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(name);
  }, [name]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      setDraft(name);
      return;
    }
    setSaving(true);
    try {
      await onRename(trimmed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(deleteConfirmMessage)) {
      await onDelete();
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditing(false);
              setDraft(name);
            }
          }}
          className="flex-1 h-9 px-2.5 rounded-lg border border-blue-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50 active:scale-90 transition-all disabled:opacity-50"
          aria-label="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setDraft(name);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-90 transition-all"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {expandable && (
        <button
          onClick={onToggleExpand}
          className="w-6 h-6 flex items-center justify-center text-gray-400 flex-shrink-0"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      )}
      <div className="flex-1 min-w-0 px-1">
        <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
        {subtitle && <div className="text-xs text-gray-400 truncate">{subtitle}</div>}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-90 transition-all"
        aria-label={`Rename ${renameLabel}`}
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleDelete}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all"
        aria-label={`Delete ${renameLabel}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

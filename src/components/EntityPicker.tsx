import { useMemo, useRef, useState } from 'react';
import { Plus, Check } from 'lucide-react';

interface Props<T> {
  label: string;
  icon: React.ElementType;
  placeholder: string;
  value: string;
  items: T[];
  getName: (item: T) => string;
  getSubtitle?: (item: T) => string | undefined;
  disabled?: boolean;
  disabledHint?: string;
  onChangeText: (text: string) => void;
  onSelect: (item: T) => void;
  onAddNew: (name: string) => Promise<T | undefined>;
}

export function EntityPicker<T>({
  label,
  icon: Icon,
  placeholder,
  value,
  items,
  getName,
  getSubtitle,
  disabled,
  disabledHint,
  onChangeText,
  onSelect,
  onAddNew,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = value.trim();

  const filtered = useMemo(() => {
    if (!trimmed) return items;
    const q = trimmed.toLowerCase();
    return items.filter((item) => getName(item).toLowerCase().includes(q));
  }, [items, trimmed, getName]);

  const exactMatch = useMemo(
    () => items.some((item) => getName(item).toLowerCase() === trimmed.toLowerCase()),
    [items, trimmed, getName],
  );

  const handleFocus = () => {
    if (disabled) return;
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setOpen(true);
  };

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setOpen(false), 150);
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setOpen(false);
  };

  const handleAddNew = async () => {
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const item = await onAddNew(trimmed);
      if (item) onSelect(item);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="block relative">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="relative mt-0.5">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={disabled ? disabledHint || placeholder : placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full h-11 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      {open && !disabled && (filtered.length > 0 || (trimmed && !exactMatch)) && (
        <div className="absolute z-40 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-blue-50 active:bg-blue-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">{getName(item)}</div>
                {getSubtitle?.(item) && (
                  <div className="text-xs text-gray-400 truncate">{getSubtitle(item)}</div>
                )}
              </div>
              {getName(item).toLowerCase() === trimmed.toLowerCase() && (
                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
            </button>
          ))}

          {trimmed && !exactMatch && (
            <button
              type="button"
              onClick={handleAddNew}
              disabled={saving}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-green-50 active:bg-green-100 transition-colors border-t border-gray-100 disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0">
                <Plus className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div className="text-sm font-medium text-green-700 truncate">
                {saving ? 'Saving…' : `Save "${trimmed}" as new ${label.toLowerCase()}`}
              </div>
            </button>
          )}
        </div>
      )}
    </label>
  );
}

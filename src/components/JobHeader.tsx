import { Building2, MapPin, User, Cpu } from 'lucide-react';
import type { JobInfoState } from '../hooks/useJobInfo';
import type { Customer, Site } from '../types';
import { EntityPicker } from './EntityPicker';

interface Props {
  jobInfo: JobInfoState;
  onChange: (patch: Partial<JobInfoState>) => void;
  customers: Customer[];
  onAddCustomer: (name: string) => Promise<Customer>;
  sites: Site[];
  onAddSite: (address: string) => Promise<Site | undefined>;
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="relative mt-0.5">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>
    </label>
  );
}

export function JobHeader({ jobInfo, onChange, customers, onAddCustomer, sites, onAddSite }: Props) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-2.5 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-sm font-bold text-gray-800">Job Details</h2>
        <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          AS/NZS 3760:2022
        </span>
      </div>

      <EntityPicker<Customer>
        label="Client Name"
        icon={Building2}
        placeholder="e.g. Acme Corporation"
        value={jobInfo.clientName}
        items={customers}
        getName={(c) => c.name}
        onChangeText={(v) => onChange({ clientName: v, customerId: undefined })}
        onSelect={(customer) =>
          onChange({
            clientName: customer.name,
            customerId: customer.id,
            // A new customer means the previously selected site no longer applies.
            siteId: undefined,
            siteAddress: '',
          })
        }
        onAddNew={onAddCustomer}
      />

      <EntityPicker<Site>
        label="Site Address"
        icon={MapPin}
        placeholder="e.g. 123 Main St, Sydney NSW"
        value={jobInfo.siteAddress}
        items={sites}
        getName={(s) => s.address}
        disabled={!jobInfo.customerId}
        disabledHint="Select a client first"
        onChangeText={(v) => onChange({ siteAddress: v, siteId: undefined })}
        onSelect={(site) => onChange({ siteAddress: site.address, siteId: site.id })}
        onAddNew={onAddSite}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <Field
          icon={User}
          label="Tester Name"
          value={jobInfo.testerName}
          onChange={(v) => onChange({ testerName: v })}
          placeholder="John Smith"
        />
        <Field
          icon={Cpu}
          label="PAT Serial #"
          value={jobInfo.patTesterSerial}
          onChange={(v) => onChange({ patTesterSerial: v })}
          placeholder="SN-00123"
        />
      </div>
    </div>
  );
}

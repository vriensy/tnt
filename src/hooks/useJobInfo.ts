import { useCallback, useEffect, useState } from 'react';
import { getJobInfo, saveJobInfo } from '../db';
import type { JobInfo } from '../types';

export interface JobInfoState {
  clientName: string;
  siteAddress: string;
  testerName: string;
  patTesterSerial: string;
  customerId?: number;
  siteId?: number;
}

const EMPTY: JobInfoState = {
  clientName: '',
  siteAddress: '',
  testerName: '',
  patTesterSerial: '',
  customerId: undefined,
  siteId: undefined,
};

export function useJobInfo() {
  const [jobInfo, setJobInfo] = useState<JobInfoState>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getJobInfo().then((info) => {
      if (info) {
        setJobInfo({
          clientName: info.clientName,
          siteAddress: info.siteAddress,
          testerName: info.testerName,
          patTesterSerial: info.patTesterSerial,
          customerId: info.customerId,
          siteId: info.siteId,
        });
      }
      setLoaded(true);
    });
  }, []);

  const update = useCallback((patch: Partial<JobInfoState>) => {
    setJobInfo((prev) => {
      const next = { ...prev, ...patch };
      saveJobInfo(next as Omit<JobInfo, 'id' | 'updatedAt'>);
      return next;
    });
  }, []);

  return { jobInfo, update, loaded };
}

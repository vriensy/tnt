import { useCallback, useEffect, useState } from 'react';
import { addSite, deleteSite, getSitesForCustomer } from '../db';
import type { Site } from '../types';

/** Sites belonging to the given customer. Refetches whenever customerId changes. */
export function useSites(customerId: number | undefined) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!customerId) {
      setSites([]);
      setLoading(false);
      return;
    }
    const all = await getSitesForCustomer(customerId);
    setSites(all);
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addOrGetSite = useCallback(
    async (address: string): Promise<Site | undefined> => {
      if (!customerId) return undefined;
      const site = await addSite(customerId, address);
      await refresh();
      return site;
    },
    [customerId, refresh],
  );

  const removeSite = useCallback(
    async (id: number): Promise<void> => {
      await deleteSite(id);
      await refresh();
    },
    [refresh],
  );

  return { sites, loading, addOrGetSite, removeSite };
}

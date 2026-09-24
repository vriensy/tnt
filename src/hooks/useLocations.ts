import { useCallback, useEffect, useState } from 'react';
import { addLocation, deleteLocation, getLocationsForSite } from '../db';
import type { SiteLocation } from '../types';

/** Locations (rooms/areas) belonging to the given site. Refetches whenever siteId changes. */
export function useLocations(siteId: number | undefined) {
  const [locations, setLocations] = useState<SiteLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!siteId) {
      setLocations([]);
      setLoading(false);
      return;
    }
    const all = await getLocationsForSite(siteId);
    setLocations(all);
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addOrGetLocation = useCallback(
    async (name: string): Promise<SiteLocation | undefined> => {
      if (!siteId) return undefined;
      const loc = await addLocation(siteId, name);
      await refresh();
      return loc;
    },
    [siteId, refresh],
  );

  const removeLocation = useCallback(
    async (id: number): Promise<void> => {
      await deleteLocation(id);
      await refresh();
    },
    [refresh],
  );

  return { locations, loading, addOrGetLocation, removeLocation };
}

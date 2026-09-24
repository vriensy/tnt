import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';
import type { Asset } from '../types';

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await db.assets.orderBy('createdAt').toArray();
    setAssets(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addAsset = useCallback(async (asset: Asset): Promise<number> => {
    const id = await db.assets.add(asset);
    await refresh();
    return id;
  }, [refresh]);

  const updateAsset = useCallback(async (id: number, asset: Asset): Promise<void> => {
    await db.assets.put({ ...asset, id });
    await refresh();
  }, [refresh]);

  const deleteAsset = useCallback(async (id: number): Promise<void> => {
    await db.assets.delete(id);
    await refresh();
  }, [refresh]);

  const replaceAll = useCallback(async (newAssets: Asset[]): Promise<void> => {
    await db.assets.clear();
    if (newAssets.length > 0) {
      const cleaned = newAssets.map(({ id, ...rest }) => rest as Asset);
      await db.assets.bulkAdd(cleaned);
    }
    await refresh();
  }, [refresh]);

  return { assets, loading, refresh, addAsset, updateAsset, deleteAsset, replaceAll };
}

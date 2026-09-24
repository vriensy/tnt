import Dexie, { type Table } from 'dexie';
import type { Asset, JobInfo } from './types';

class TestTagDB extends Dexie {
  assets!: Table<Asset, number>;
  jobInfo!: Table<JobInfo, number>;

  constructor() {
    super('TestTagDB');
    this.version(1).stores({
      assets: '++id, tagId, location, equipmentClass, overallStatus, testDate, createdAt',
      jobInfo: '++id',
    });
  }
}

export const db = new TestTagDB();

export const JOB_INFO_ID = 1;

export async function getJobInfo(): Promise<JobInfo | undefined> {
  return db.jobInfo.get(JOB_INFO_ID);
}

export async function saveJobInfo(info: Omit<JobInfo, 'id' | 'updatedAt'>): Promise<void> {
  await db.jobInfo.put({
    ...info,
    id: JOB_INFO_ID,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Returns the full tag ID with the highest trailing number across ALL assets,
 * irrespective of prefix — e.g. "SITE-042" beats "TAG-007" beats "B12".
 * Use compliance.ts's nextTagId() on the result to get the next one to use.
 */
export async function getHighestTagId(): Promise<string | undefined> {
  const all = await db.assets.toArray();
  let best: { tagId: string; num: number } | undefined;
  for (const a of all) {
    const match = a.tagId.match(/^(.*?)(\d+)$/);
    if (!match) continue;
    const n = parseInt(match[2], 10);
    if (isNaN(n)) continue;
    if (!best || n > best.num) best = { tagId: a.tagId, num: n };
  }
  return best?.tagId;
}

export async function tagIdExists(tagId: string): Promise<boolean> {
  const count = await db.assets.where('tagId').equals(tagId).count();
  return count > 0;
}

export async function findAssetByTagId(tagId: string): Promise<Asset | undefined> {
  return db.assets.where('tagId').equals(tagId).first();
}

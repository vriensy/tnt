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

export async function getHighestTagNumber(prefix: string): Promise<number> {
  const all = await db.assets.toArray();
  let max = 0;
  const prefixLower = prefix.toLowerCase();
  for (const a of all) {
    const tag = a.tagId;
    const idx = tag.toLowerCase().indexOf(prefixLower);
    if (idx === 0) {
      const numPart = tag.slice(prefix.length).trim();
      const n = parseInt(numPart, 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return max;
}

export async function tagIdExists(tagId: string): Promise<boolean> {
  const count = await db.assets.where('tagId').equals(tagId).count();
  return count > 0;
}

export async function findAssetByTagId(tagId: string): Promise<Asset | undefined> {
  return db.assets.where('tagId').equals(tagId).first();
}

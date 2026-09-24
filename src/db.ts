import Dexie, { type Table } from 'dexie';
import type { Asset, Customer, JobInfo, Site, SiteLocation } from './types';

class TestTagDB extends Dexie {
  assets!: Table<Asset, number>;
  jobInfo!: Table<JobInfo, number>;
  customers!: Table<Customer, number>;
  sites!: Table<Site, number>;
  locations!: Table<SiteLocation, number>;

  constructor() {
    super('TestTagDB');
    this.version(1).stores({
      assets: '++id, tagId, location, equipmentClass, overallStatus, testDate, createdAt',
      jobInfo: '++id',
    });
    // v2 is purely additive — a new customers table. Existing assets/jobInfo
    // data is untouched; Dexie carries it forward automatically.
    this.version(2).stores({
      assets: '++id, tagId, location, equipmentClass, overallStatus, testDate, createdAt',
      jobInfo: '++id',
      customers: '++id, &name, createdAt',
    });
    // v3 is additive too — sites (per customer) and locations/rooms (per site).
    this.version(3).stores({
      assets: '++id, tagId, location, equipmentClass, overallStatus, testDate, createdAt',
      jobInfo: '++id',
      customers: '++id, &name, createdAt',
      sites: '++id, customerId, address, createdAt',
      locations: '++id, siteId, name, createdAt',
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

export async function getAllCustomers(): Promise<Customer[]> {
  return db.customers.orderBy('name').toArray();
}

export async function findCustomerByName(name: string): Promise<Customer | undefined> {
  const target = name.trim().toLowerCase();
  if (!target) return undefined;
  const all = await db.customers.toArray();
  return all.find((c) => c.name.trim().toLowerCase() === target);
}

export async function addCustomer(name: string): Promise<Customer> {
  const trimmedName = name.trim();
  const existing = await findCustomerByName(trimmedName);
  if (existing) return existing;
  const customer: Customer = { name: trimmedName, createdAt: new Date().toISOString() };
  const id = await db.customers.add(customer);
  return { ...customer, id };
}

export async function deleteCustomer(id: number): Promise<void> {
  await db.customers.delete(id);
}

export async function getSitesForCustomer(customerId: number): Promise<Site[]> {
  return db.sites.where('customerId').equals(customerId).sortBy('address');
}

export async function findSiteByAddress(customerId: number, address: string): Promise<Site | undefined> {
  const target = address.trim().toLowerCase();
  if (!target) return undefined;
  const sites = await getSitesForCustomer(customerId);
  return sites.find((s) => s.address.trim().toLowerCase() === target);
}

export async function addSite(customerId: number, address: string): Promise<Site> {
  const trimmed = address.trim();
  const existing = await findSiteByAddress(customerId, trimmed);
  if (existing) return existing;
  const site: Site = { customerId, address: trimmed, createdAt: new Date().toISOString() };
  const id = await db.sites.add(site);
  return { ...site, id };
}

export async function deleteSite(id: number): Promise<void> {
  await db.sites.delete(id);
}

export async function getLocationsForSite(siteId: number): Promise<SiteLocation[]> {
  return db.locations.where('siteId').equals(siteId).sortBy('name');
}

export async function findLocationByName(siteId: number, name: string): Promise<SiteLocation | undefined> {
  const target = name.trim().toLowerCase();
  if (!target) return undefined;
  const locations = await getLocationsForSite(siteId);
  return locations.find((l) => l.name.trim().toLowerCase() === target);
}

export async function addLocation(siteId: number, name: string): Promise<SiteLocation> {
  const trimmed = name.trim();
  const existing = await findLocationByName(siteId, trimmed);
  if (existing) return existing;
  const loc: SiteLocation = { siteId, name: trimmed, createdAt: new Date().toISOString() };
  const id = await db.locations.add(loc);
  return { ...loc, id };
}

export async function deleteLocation(id: number): Promise<void> {
  await db.locations.delete(id);
}

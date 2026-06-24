import Dexie, { type Table } from 'dexie'
import type { ComponentNode, GroupClassPreset } from '@/shared/types/component'

export interface SiteRecord {
  id: string
  title: string
  components: ComponentNode[]
  createdAt: number
  updatedAt: number
  groupClassPresets: GroupClassPreset[]
}
class BailuDB extends Dexie {
  sites!: Table<SiteRecord, string>
  constructor() { super('bailu'); this.version(1).stores({ sites: 'id, title, createdAt, updatedAt' }) }
}
const db = new BailuDB()
export async function saveSite(site: SiteRecord) { await db.sites.put({ ...site }) }
export async function loadSite(id: string): Promise<SiteRecord | undefined> { return db.sites.get(id) }
export async function loadAllSites(): Promise<SiteRecord[]> { return db.sites.toArray() }
export async function deleteSite(id: string) { await db.sites.delete(id) }

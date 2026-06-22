import Dexie, { type Table } from 'dexie'
export interface SiteRecord { id: string; title: string; components: any[]; createdAt: number; updatedAt: number }
class BailuDB extends Dexie {
  sites!: Table<SiteRecord, string>
  constructor() {
    super('bailu')
    this.version(1).stores({ sites: 'id, title, createdAt, updatedAt' })
  }
}
const db = new BailuDB()
export async function saveSite(site: SiteRecord) { await db.sites.put({ ...site }) }
export async function loadSite(id: string): Promise<SiteRecord | undefined> { return db.sites.get(id) }

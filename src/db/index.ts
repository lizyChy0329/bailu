import Dexie, { type EntityTable } from 'dexie'
import type { SiteConfig } from '@/shared/types/site'
import { toRaw } from 'vue'

const db = new Dexie('bailu') as Dexie & {
  sites: EntityTable<SiteConfig, 'id'>
}

db.version(1).stores({
  sites: 'id, title, updatedAt',
})

export async function listSites(): Promise<SiteConfig[]> {
  return db.sites.orderBy('updatedAt').reverse().toArray()
}

export async function getSite(id: string): Promise<SiteConfig | undefined> {
  return db.sites.get(id)
}

export async function saveSite(site: SiteConfig): Promise<void> {
  site.updatedAt = Date.now()
  await db.sites.put(structuredClone(toRaw(site)))
}

export async function deleteSite(id: string): Promise<void> {
  await db.sites.delete(id)
}

export default db

import type { EditorialRepository } from '../domain'
import { CreatorEditorialRepository } from './creatorRepository'
import { MockEditorialRepository } from './mockRepository'

export function createRepository(): EditorialRepository {
  if (import.meta.env.DEV) return new MockEditorialRepository()
  if (!window.ZOHO?.CREATOR?.DATA) {
    throw new Error('Zoho Creator SDK is unavailable. Reload the Creator application to reconnect.')
  }
  return new CreatorEditorialRepository()
}

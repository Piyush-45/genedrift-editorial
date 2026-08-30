import type { EditorialRepository } from '../domain'
import { CreatorEditorialRepository } from './creatorRepository'
import { MockEditorialRepository } from './mockRepository'

export function createRepository(): EditorialRepository {
  return !import.meta.env.DEV && window.ZOHO?.CREATOR?.DATA
    ? new CreatorEditorialRepository()
    : new MockEditorialRepository()
}

import type { SaveRevisionInput } from './domain'

const warning = 'Local recovery is unavailable in this browser. Keep this page open until your draft is saved to Creator.'

/** Browser storage is a backup, never a prerequisite for saving to Creator. */
export function createRecoveryStorage(storage: () => Storage, onUnavailable: (message: string) => void) {
  return {
    getItem(key: string): string | null {
      try { return storage().getItem(key) } catch { onUnavailable(warning); return null }
    },
    setItem(key: string, value: string): void {
      try { storage().setItem(key, value) } catch { onUnavailable(warning) }
    },
    removeItem(key: string): void {
      try { storage().removeItem(key) } catch { onUnavailable(warning) }
    },
  }
}

export function parseRecovery(raw: string, revisionId: string): SaveRevisionInput {
  const value = JSON.parse(raw) as SaveRevisionInput
  const strings = ['id', 'title', 'slug', 'excerpt', 'seoTitle', 'seoDescription', 'expectedChecksum', 'expectedVersionToken'] as const
  if (!value || strings.some((key) => typeof value[key] !== 'string')
    || value.id !== revisionId || !value.expectedVersionToken
    || !['Index Follow', 'Noindex Follow', 'Noindex Nofollow'].includes(value.robotsDirective)
    || !Number.isFinite(value.wordCount) || !Number.isFinite(value.readingTimeMinutes)
    || !Array.isArray(value.tagIds) || value.tagIds.some((id) => typeof id !== 'string')
    || typeof value.saveTaxonomy !== 'boolean'
    || !value.document || value.document.type !== 'doc' || !Array.isArray(value.document.content)) {
    throw new Error('The local recovery copy is damaged and cannot be restored.')
  }
  return value
}

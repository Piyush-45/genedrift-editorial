import type { JSONContent } from '@tiptap/react'

export const EMPTY_DOCUMENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}

export function makeOpaqueId(prefix: string): string {
  const random = crypto.getRandomValues(new Uint32Array(4))
  return `${prefix}-${Array.from(random, (value) => value.toString(16).padStart(8, '0')).join('')}`
}

export function documentText(document: JSONContent): string {
  const values: string[] = []
  const visit = (node: JSONContent) => {
    if (node.text) values.push(node.text)
    node.content?.forEach(visit)
    if (node.type === 'paragraph' || node.type === 'heading') values.push('\n')
  }
  visit(document)
  return values.join(' ').replace(/\s+/g, ' ').trim()
}

export function metricsFor(document: JSONContent) {
  const text = documentText(document)
  const wordCount = text ? text.split(/\s+/).length : 0
  return {
    plainText: text,
    wordCount,
    readingTimeMinutes: wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 220)),
  }
}

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function sha256Blob(value: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await value.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  if (error && typeof error === 'object') {
    const value = error as Record<string, unknown>
    const nested = value.error && typeof value.error === 'object'
      ? value.error as Record<string, unknown>
      : undefined
    const message = value.message || value.error_message || nested?.message || nested?.error_message
    const code = value.code || value.error_code || nested?.code || nested?.error_code
    if (message) return `${code ? `[${String(code)}] ` : ''}${String(message)}`
    try {
      const serialized = JSON.stringify(error)
      if (serialized && serialized !== '{}') return serialized.slice(0, 500)
    } catch {
      // Fall through to the stable fallback.
    }
  }
  return fallback
}

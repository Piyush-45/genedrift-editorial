import type { JSONContent } from '@tiptap/react'
import type { MediaAsset } from './domain'

const MEDIA_SCHEME = 'genedrift-media:'

export function collectMediaIds(document: JSONContent): string[] {
  const ids = new Set<string>()
  const visit = (node: JSONContent) => {
    if (node.type === 'mediaImage' && typeof node.attrs?.mediaId === 'string') {
      ids.add(node.attrs.mediaId)
    }
    node.content?.forEach(visit)
  }
  visit(document)
  return [...ids]
}

export function collectCreatorMediaRecordIds(document: JSONContent): string[] {
  const ids = new Set<string>()
  const visit = (node: JSONContent) => {
    if (node.type === 'mediaImage' && typeof node.attrs?.creatorRecordId === 'string' && /^\d+$/.test(node.attrs.creatorRecordId)) {
      ids.add(node.attrs.creatorRecordId)
    }
    node.content?.forEach(visit)
  }
  visit(document)
  return [...ids]
}

export function canonicalizeMedia(document: JSONContent): JSONContent {
  const visit = (node: JSONContent): JSONContent => {
    const next = { ...node }
    if (node.attrs) next.attrs = { ...node.attrs }
    if (next.type === 'mediaImage' && typeof next.attrs?.mediaId === 'string') {
      next.attrs.src = `${MEDIA_SCHEME}${next.attrs.mediaId}`
    }
    if (node.content) next.content = node.content.map(visit)
    return next
  }
  return visit(document)
}

export function hydrateMedia(document: JSONContent, assets: Map<string, MediaAsset>): JSONContent {
  const visit = (node: JSONContent): JSONContent => {
    const next = { ...node }
    if (node.attrs) next.attrs = { ...node.attrs }
    if (next.type === 'mediaImage' && typeof next.attrs?.mediaId === 'string') {
      const asset = assets.get(next.attrs.mediaId)
      if (asset) {
        next.attrs = {
          ...next.attrs,
          // Creator record IDs were used by the first widget release. Normalize
          // every loaded document to the portable MED-* identity before its next
          // save so Creator and Catalyst resolve the same asset.
          mediaId: asset.uuid || asset.id,
          creatorRecordId: asset.id,
          src: asset.previewUrl,
          alt: asset.altText,
          caption: asset.caption,
          credit: asset.credit,
        }
      }
    }
    if (node.content) next.content = node.content.map(visit)
    return next
  }
  return visit(document)
}

export function mediaDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('The selected file could not be read as an image.'))
    }
    image.src = url
  })
}

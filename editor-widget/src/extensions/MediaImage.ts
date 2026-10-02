import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { isCreatorImageSource } from '../creatorImageSource'
import { MediaImageNodeView } from '../components/MediaImageNodeView'

export const MediaImage = Node.create({
  name: 'mediaImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      mediaId: { default: '' },
      creatorRecordId: { default: '' },
      src: { default: '' },
      alt: { default: '' },
      caption: { default: '' },
      credit: { default: '' },
      displaySize: { default: 'large' },
      alignment: { default: 'center' },
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-media-id]' }]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaImageNodeView)
  },

  renderHTML({ HTMLAttributes }) {
    const caption = String(HTMLAttributes.caption || '')
    const imageAttributes = isCreatorImageSource(String(HTMLAttributes.src || ''))
      ? { alt: HTMLAttributes.alt, loading: 'lazy' }
      : { src: HTMLAttributes.src, alt: HTMLAttributes.alt, loading: 'lazy' }
    return [
      'figure',
      mergeAttributes({
        'data-media-id': HTMLAttributes.mediaId,
        'data-creator-record-id': HTMLAttributes.creatorRecordId,
        'data-size': HTMLAttributes.displaySize,
        'data-alignment': HTMLAttributes.alignment,
      }),
      ['img', imageAttributes],
      ...(caption ? [['figcaption', {}, caption]] : []),
    ]
  },
})

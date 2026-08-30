import { mergeAttributes, Node } from '@tiptap/core'

export const MediaImage = Node.create({
  name: 'mediaImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      mediaId: { default: '' },
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

  renderHTML({ HTMLAttributes }) {
    const caption = [HTMLAttributes.caption, HTMLAttributes.credit].filter(Boolean).join(' · ')
    return [
      'figure',
      mergeAttributes({
        'data-media-id': HTMLAttributes.mediaId,
        'data-size': HTMLAttributes.displaySize,
        'data-alignment': HTMLAttributes.alignment,
      }),
      ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt, loading: 'lazy' }],
      ...(caption ? [['figcaption', {}, caption]] : []),
    ]
  },
})

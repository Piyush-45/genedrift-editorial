import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { AlignCenter, AlignLeft, AlignRight, Pencil, Trash2 } from 'lucide-react'
import { CreatorImage } from '../creatorImageSource'

export function MediaImageNodeView({ node, selected, editor, getPos, updateAttributes, deleteNode }: NodeViewProps) {
  const attrs = node.attrs
  const caption = String(attrs.caption || '')
  const chooseAlignment = (alignment: 'left' | 'center' | 'right') => updateAttributes({ alignment })
  const editDetails = () => {
    const position = getPos()
    if (typeof position === 'number') editor.commands.setNodeSelection(position)
    editor.view.dom.dispatchEvent(new CustomEvent('genedrift:edit-media', { bubbles: true }))
  }
  return (
    <NodeViewWrapper
      as="figure"
      className={selected ? 'ProseMirror-selectednode' : undefined}
      data-media-id={String(attrs.mediaId || '')}
      data-creator-record-id={String(attrs.creatorRecordId || '')}
      data-size={String(attrs.displaySize || 'large')}
      data-alignment={String(attrs.alignment || 'center')}
    >
      {selected && editor.isEditable && (
        <div className="media-node-controls" contentEditable={false} onMouseDown={(event) => event.preventDefault()}>
          <div className="media-node-control-group" aria-label="Image size">
            {(['small', 'medium', 'large', 'full'] as const).map((size) => (
              <button key={size} type="button" className={attrs.displaySize === size ? 'is-active' : ''} aria-pressed={attrs.displaySize === size} title={`${size[0].toUpperCase()}${size.slice(1)} image`} onClick={() => updateAttributes({ displaySize: size })}>
                {size === 'full' ? 'Full' : size[0].toUpperCase()}
              </button>
            ))}
          </div>
          <div className="media-node-control-group" aria-label="Image alignment">
            <button type="button" className={attrs.alignment === 'left' ? 'is-active' : ''} aria-label="Align image left" aria-pressed={attrs.alignment === 'left'} onClick={() => chooseAlignment('left')}><AlignLeft /></button>
            <button type="button" className={attrs.alignment === 'center' ? 'is-active' : ''} aria-label="Center image" aria-pressed={attrs.alignment === 'center'} onClick={() => chooseAlignment('center')}><AlignCenter /></button>
            <button type="button" className={attrs.alignment === 'right' ? 'is-active' : ''} aria-label="Align image right" aria-pressed={attrs.alignment === 'right'} onClick={() => chooseAlignment('right')}><AlignRight /></button>
          </div>
          <button type="button" aria-label="Edit image details" title="Edit alt text and caption" onClick={editDetails}><Pencil /></button>
          <button type="button" className="is-danger" aria-label="Remove image" title="Remove image" onClick={deleteNode}><Trash2 /></button>
        </div>
      )}
      <CreatorImage src={String(attrs.src || '')} alt={String(attrs.alt || '')} />
      {caption && <figcaption>{caption}</figcaption>}
    </NodeViewWrapper>
  )
}

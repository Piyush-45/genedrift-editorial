import { useState } from 'react'
import { ImagePlus, Pencil, Trash2 } from 'lucide-react'
import type { Article, MediaAsset, MediaMetadata, Revision } from '../domain'
import { MediaDialog } from './MediaDialog'

type Props = {
  article: Article
  revision: Revision
  readOnly: boolean
  onChange: (changes: Partial<Revision>) => void
  onCreateImage: (file: File, metadata: MediaMetadata) => Promise<MediaAsset>
  onUpdateImage: (asset: MediaAsset, metadata: MediaMetadata) => Promise<MediaAsset>
}

function display(value?: { zc_display_value?: string; display_value?: string }) {
  return value?.zc_display_value || value?.display_value || 'Not selected'
}

export function Inspector({ article, revision, readOnly, onChange, onCreateImage, onUpdateImage }: Props) {
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [editingCover, setEditingCover] = useState(false)
  const [mediaBusy, setMediaBusy] = useState(false)
  const [mediaError, setMediaError] = useState('')

  return (
    <aside className="inspector" aria-label="Article settings">
      <div className="inspector-section">
        <h2>Article</h2>
        <label className="field-label">
          Excerpt
          <textarea
            value={revision.excerpt}
            maxLength={320}
            rows={5}
            disabled={readOnly}
            onChange={(event) => onChange({ excerpt: event.target.value })}
          />
          <span className="field-count">{revision.excerpt.length}/320</span>
        </label>
        <div className="read-only-row">
          <span>Category</span>
          <strong>{display(article.primaryCategory)}</strong>
        </div>
        <div className="read-only-row">
          <span>Tags</span>
          <div className="tag-list">
            {article.tags.length > 0
              ? article.tags.map((tag) => <span key={tag.ID || display(tag)}>{display(tag)}</span>)
              : <em>None</em>}
          </div>
        </div>
        <div className="read-only-row">
          <span>Approval</span>
          <strong>{display(article.approvalPolicy)}</strong>
        </div>
      </div>

      <div className="inspector-section">
        <h2>Cover image</h2>
        {revision.featuredMedia ? (
          <div className="cover-asset">
            <img src={revision.featuredMedia.previewUrl} alt={revision.featuredMedia.altText} />
            <div className="cover-asset-details">
              <strong>{revision.featuredMedia.altText}</strong>
              <span>{revision.featuredMedia.widthPixels} × {revision.featuredMedia.heightPixels}</span>
            </div>
            {!readOnly && <div className="cover-actions">
              <button className="icon-command" type="button" title="Edit cover details" aria-label="Edit cover details" onClick={() => {
                setEditingCover(true)
                setMediaError('')
                setMediaDialogOpen(true)
              }}><Pencil /></button>
              <button className="icon-command is-danger" type="button" title="Remove cover" aria-label="Remove cover" onClick={() => onChange({ featuredMediaId: undefined, featuredMedia: undefined })}><Trash2 /></button>
            </div>}
            {!readOnly && <button className="secondary-command cover-replace" type="button" onClick={() => {
              setEditingCover(false)
              setMediaError('')
              setMediaDialogOpen(true)
            }}><ImagePlus /> Replace</button>}
          </div>
        ) : readOnly ? (
          <div className="cover-empty is-readonly"><ImagePlus /><strong>No cover image</strong></div>
        ) : (
          <button className="cover-empty" type="button" onClick={() => {
            setEditingCover(false)
            setMediaError('')
            setMediaDialogOpen(true)
          }}><ImagePlus /><strong>Add cover image</strong><span>Required before publishing</span></button>
        )}
      </div>

      <div className="inspector-section">
        <h2>Search</h2>
        <label className="field-label">
          SEO title
          <input
            value={revision.seoTitle}
            maxLength={70}
            disabled={readOnly}
            onChange={(event) => onChange({ seoTitle: event.target.value })}
          />
          <span className="field-count">{revision.seoTitle.length}/70</span>
        </label>
        <label className="field-label">
          SEO description
          <textarea
            value={revision.seoDescription}
            maxLength={170}
            rows={4}
            disabled={readOnly}
            onChange={(event) => onChange({ seoDescription: event.target.value })}
          />
          <span className="field-count">{revision.seoDescription.length}/170</span>
        </label>
        <label className="field-label">
          Robots
          <select
            value={revision.robotsDirective}
            disabled={readOnly}
            onChange={(event) => onChange({ robotsDirective: event.target.value as Revision['robotsDirective'] })}
          >
            <option>Index Follow</option>
            <option>Noindex Follow</option>
            <option>Noindex Nofollow</option>
          </select>
        </label>
      </div>

      <div className="inspector-section inspector-summary">
        <h2>Revision</h2>
        <div><span>State</span><strong>{revision.state}</strong></div>
        <div><span>Words</span><strong>{revision.wordCount}</strong></div>
        <div><span>Reading time</span><strong>{revision.readingTimeMinutes || 0} min</strong></div>
      </div>
      <MediaDialog
        open={mediaDialogOpen}
        mode="cover"
        asset={editingCover ? revision.featuredMedia : undefined}
        requireFile={!editingCover}
        busy={mediaBusy}
        error={mediaError}
        onClose={() => !mediaBusy && setMediaDialogOpen(false)}
        onSubmit={(file, metadata) => {
          setMediaBusy(true)
          setMediaError('')
          const operation = editingCover && revision.featuredMedia
            ? onUpdateImage(revision.featuredMedia, metadata)
            : onCreateImage(file as File, metadata)
          void operation.then((asset) => {
            onChange({ featuredMediaId: asset.id, featuredMedia: asset })
            setMediaDialogOpen(false)
          }).catch((error) => {
            setMediaError(error instanceof Error ? error.message : 'The cover image could not be saved.')
          }).finally(() => setMediaBusy(false))
        }}
      />
    </aside>
  )
}

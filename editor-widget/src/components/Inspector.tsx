import { useEffect, useState } from 'react'
import { ImagePlus, Pencil, Plus, Trash2, Undo2 } from 'lucide-react'
import type { Article, LookupValue, MediaAsset, MediaMetadata, ReviewFeedback, Revision, TaxonomyKind } from '../domain'
import { MediaDialog } from './MediaDialog'
import { CreatorImage } from '../creatorImageSource'
import { formatProductTimestamp } from '../utils'

type Props = {
  article: Article
  revision: Revision
  categories: LookupValue[]
  tags: LookupValue[]
  feedback: ReviewFeedback[]
  readOnly: boolean
  canCreateCategory: boolean
  canCreateTag: boolean
  onChange: (changes: Partial<Revision>) => void
  onArticleChange: (changes: Partial<Article>) => void
  onCreateTaxonomy: (kind: TaxonomyKind, name: string) => Promise<LookupValue>
  onCreateImage: (file: File, metadata: MediaMetadata) => Promise<MediaAsset>
  onUpdateImage: (asset: MediaAsset, metadata: MediaMetadata) => Promise<MediaAsset>
}

function display(value?: { zc_display_value?: string; display_value?: string }) {
  return value?.zc_display_value || value?.display_value || 'Not selected'
}

function compactText(value?: string) {
  return (value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function visibleFeedbackComments(entry: ReviewFeedback) {
  const summary = compactText(entry.decisionSummary)
  return entry.comments.filter((comment) => {
    const body = compactText(comment.body)
    if (!body) return false
    if (!summary) return true
    const sameAuthor = compactText(comment.authorName) === compactText(entry.reviewerName)
    return !(body === summary && (sameAuthor || comment.type === 'Change Request'))
  })
}

export function Inspector({
  article, revision, categories, tags, feedback, readOnly,
  canCreateCategory, canCreateTag, onChange, onArticleChange, onCreateTaxonomy, onCreateImage, onUpdateImage,
}: Props) {
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [editingCover, setEditingCover] = useState(false)
  const [mediaBusy, setMediaBusy] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [mediaNotice, setMediaNotice] = useState('')
  const [removedCover, setRemovedCover] = useState<MediaAsset>()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [taxonomyBusy, setTaxonomyBusy] = useState<TaxonomyKind | ''>('')
  const [taxonomyError, setTaxonomyError] = useState('')

  useEffect(() => {
    setRemovedCover(undefined)
    setMediaNotice('')
  }, [revision.id])

  const createTaxonomy = async (kind: TaxonomyKind) => {
    const name = kind === 'category' ? newCategoryName : newTagName
    if (!name.trim()) return
    setTaxonomyBusy(kind)
    setTaxonomyError('')
    try {
      const term = await onCreateTaxonomy(kind, name)
      if (kind === 'category') {
        onArticleChange({ primaryCategory: term })
        setNewCategoryName('')
      } else {
        if (!article.tags.some((current) => current.ID === term.ID)) {
          onArticleChange({ tags: [...article.tags, term] })
        }
        setNewTagName('')
      }
    } catch (error) {
      setTaxonomyError(error instanceof Error ? error.message : 'The taxonomy term could not be created.')
    } finally {
      setTaxonomyBusy('')
    }
  }

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
        <label className="field-label">
          Category
          <select
            value={article.primaryCategory?.ID || ''}
            disabled={readOnly}
            onChange={(event) => onArticleChange({
              primaryCategory: categories.find((category) => category.ID === event.target.value),
            })}
          >
            <option value="">Not selected</option>
            {categories.map((category) => <option key={category.ID} value={category.ID}>{display(category)}</option>)}
          </select>
        </label>
        {!readOnly && canCreateCategory && (
          <div className="taxonomy-create-row">
            <label>
              <span>New category</span>
              <input
                value={newCategoryName}
                maxLength={150}
                placeholder="e.g. Clinical Strategy"
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void createTaxonomy('category')
                  }
                }}
              />
            </label>
            <button type="button" className="secondary-command" disabled={taxonomyBusy !== '' || newCategoryName.trim().length < 2} onClick={() => void createTaxonomy('category')}>
              <Plus /> {taxonomyBusy === 'category' ? 'Adding' : 'Add'}
            </button>
          </div>
        )}
        <div className="selected-tags-summary">
          <div>
            <strong>Selected tags</strong>
            <span>{article.tags.length ? `${article.tags.length} applied to this article` : 'No tags selected yet'}</span>
          </div>
          {article.tags.length > 0 && (
            <div className="selected-tag-list">
              {article.tags.map((tag) => <span key={tag.ID}>{display(tag)}</span>)}
            </div>
          )}
        </div>
        <fieldset className="tag-picker" disabled={readOnly}>
          <legend>{readOnly ? 'Available tags' : 'Choose tags'}</legend>
          {tags.length > 0 ? tags.map((tag) => {
            const selected = article.tags.some((current) => current.ID === tag.ID)
            return (
              <label key={tag.ID} className={selected ? 'is-selected' : ''}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onArticleChange({
                    tags: selected
                      ? article.tags.filter((current) => current.ID !== tag.ID)
                      : [...article.tags, tag],
                  })}
                />
                <span>{display(tag)}</span>
              </label>
            )
          }) : <em>No active tags are configured.</em>}
        </fieldset>
        {!readOnly && canCreateTag && (
          <div className="taxonomy-create-row">
            <label>
              <span>New tag</span>
              <input
                value={newTagName}
                maxLength={150}
                placeholder="Create and apply a tag"
                onChange={(event) => setNewTagName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void createTaxonomy('tag')
                  }
                }}
              />
            </label>
            <button type="button" className="secondary-command" disabled={taxonomyBusy !== '' || newTagName.trim().length < 2} onClick={() => void createTaxonomy('tag')}>
              <Plus /> {taxonomyBusy === 'tag' ? 'Adding' : 'Add'}
            </button>
          </div>
        )}
        {taxonomyError && <p className="taxonomy-error" role="alert">{taxonomyError}</p>}
        <p className="taxonomy-helper">
          Tags can be created while writing. New categories remain limited to editorial administrators to keep navigation consistent.
        </p>
        <div className="read-only-row">
          <span>Approval</span>
          <strong>{display(article.approvalPolicy)}</strong>
        </div>
      </div>

      {feedback.some((entry) => compactText(entry.decisionSummary) || visibleFeedbackComments(entry).length > 0) && (
        <div className="inspector-section review-feedback-section">
          <h2>Review feedback</h2>
          <p className="section-hint">Comments and decisions remain attached to their reviewed revision.</p>
          <div className="review-feedback-list">
            {feedback.filter((entry) => compactText(entry.decisionSummary) || visibleFeedbackComments(entry).length > 0).map((entry) => (
              <article className="review-feedback-card" key={entry.id}>
                <header>
                  <strong>{entry.reviewerName}</strong>
                  <span>{entry.status}</span>
                </header>
                {entry.decisionSummary && (
                  <section className="feedback-decision-note">
                    <span>Decision note</span>
                    <p className="decision-summary">{entry.decisionSummary}</p>
                  </section>
                )}
                {visibleFeedbackComments(entry).length > 0 && (
                  <div className="review-feedback-thread-comments">
                    <span className="feedback-section-label">Discussion comments</span>
                    {visibleFeedbackComments(entry).map((comment) => (
                      <div className="feedback-comment" key={comment.id}>
                        <span>{comment.authorName} · {comment.type}</span>
                        <p>{comment.body}</p>
                      </div>
                    ))}
                  </div>
                )}
                {entry.decidedAt && <time>{formatProductTimestamp(entry.decidedAt)}</time>}
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="inspector-section">
        <h2>Cover image</h2>
        {mediaNotice && <p className="media-save-notice" role="status">{mediaNotice}</p>}
        {revision.featuredMedia ? (
          <div className="cover-asset">
            <CreatorImage src={revision.featuredMedia.previewUrl} alt={revision.featuredMedia.altText} />
            <div className="cover-asset-details">
              <strong>{revision.featuredMedia.altText}</strong>
              {revision.featuredMedia.caption && <p>{revision.featuredMedia.caption}</p>}
              <span>{revision.featuredMedia.widthPixels} × {revision.featuredMedia.heightPixels}</span>
            </div>
            {!readOnly && <div className="cover-actions">
              <button className="icon-command" type="button" title="Edit cover details" aria-label="Edit cover details" onClick={() => {
                setEditingCover(true)
                setMediaError('')
                setMediaDialogOpen(true)
              }}><Pencil /></button>
              <button className="icon-command is-danger" type="button" title="Remove cover" aria-label="Remove cover" onClick={() => {
                setRemovedCover(revision.featuredMedia)
                setMediaNotice('Cover removed from this draft.')
                onChange({ featuredMediaId: undefined, featuredMedia: undefined })
              }}><Trash2 /></button>
            </div>}
            {!readOnly && <button className="secondary-command cover-replace" type="button" onClick={() => {
              setEditingCover(false)
              setMediaError('')
              setMediaDialogOpen(true)
            }}><ImagePlus /> Replace</button>}
          </div>
        ) : removedCover && !readOnly ? (
          <div className="cover-undo" role="status">
            <div><strong>Cover removed</strong><span>You can restore it while this article remains open.</span></div>
            <button className="secondary-command" type="button" onClick={() => {
              onChange({ featuredMediaId: removedCover.id, featuredMedia: removedCover })
              setRemovedCover(undefined)
              setMediaNotice('Cover restored.')
            }}><Undo2 /> Undo</button>
            <button className="cover-empty" type="button" onClick={() => {
              setEditingCover(false)
              setMediaError('')
              setMediaDialogOpen(true)
            }}><ImagePlus /><strong>Add another cover</strong></button>
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
            setRemovedCover(undefined)
            setMediaNotice(editingCover ? 'Image details saved.' : 'Cover image added.')
            setMediaDialogOpen(false)
          }).catch((error) => {
            setMediaError(error instanceof Error ? error.message : 'The cover image could not be saved.')
          }).finally(() => setMediaBusy(false))
        }}
      />
    </aside>
  )
}

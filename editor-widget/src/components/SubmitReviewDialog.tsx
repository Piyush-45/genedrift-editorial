import { AlertCircle, Check, Send, Users, X } from 'lucide-react'
import type { ReviewerOption } from '../domain'

type Props = {
  open: boolean
  approvalPolicy: string
  reviewers: ReviewerOption[]
  selectedIds: string[]
  mode: 'reviewers' | 'queue'
  busy: boolean
  error: string
  onModeChange: (mode: 'reviewers' | 'queue') => void
  onSelectionChange: (ids: string[]) => void
  onClose: () => void
  onSubmit: () => void
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'R'
}

export function SubmitReviewDialog({
  open,
  approvalPolicy,
  reviewers,
  selectedIds,
  mode,
  busy,
  error,
  onModeChange,
  onSelectionChange,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null

  const toggleReviewer = (id: string) => {
    onSelectionChange(selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id])
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="review-dialog" role="dialog" aria-modal="true" aria-labelledby="submit-review-title">
        <header>
          <div>
            <h2 id="submit-review-title">Submit for review</h2>
            <p>The saved revision will be locked while reviewers make their decisions.</p>
          </div>
          <button className="icon-command" type="button" title="Close" aria-label="Close" disabled={busy} onClick={onClose}><X /></button>
        </header>

        <div className="review-dialog-body">
          <div className="policy-summary">
            <span>Approval policy</span>
            <strong>{approvalPolicy}</strong>
            <small>Any unfilled approval slots will be placed in the shared review queue.</small>
          </div>

          <div className="mode-control" aria-label="Reviewer assignment mode">
            <button type="button" className={mode === 'reviewers' ? 'is-active' : ''} onClick={() => onModeChange('reviewers')}>
              <Users /> Suggest reviewers
            </button>
            <button type="button" className={mode === 'queue' ? 'is-active' : ''} onClick={() => onModeChange('queue')}>
              <Send /> Shared queue
            </button>
          </div>

          {mode === 'reviewers' ? (
            <div className="reviewer-list" aria-label="Eligible reviewers">
              {reviewers.length > 0 ? reviewers.map((reviewer) => {
                const selected = selectedIds.includes(reviewer.id)
                return (
                  <label className={`reviewer-option${selected ? ' is-selected' : ''}`} key={reviewer.id}>
                    <input type="checkbox" checked={selected} onChange={() => toggleReviewer(reviewer.id)} />
                    <span className="reviewer-avatar" aria-hidden="true">{initials(reviewer.displayName)}</span>
                    <span className="reviewer-identity">
                      <strong>{reviewer.displayName}</strong>
                      <small>{reviewer.jobTitle || reviewer.workEmail || 'Eligible reviewer'}</small>
                    </span>
                    <span className="reviewer-check" aria-hidden="true"><Check /></span>
                  </label>
                )
              }) : (
                <div className="empty-reviewers">No eligible reviewers are configured. Use the shared queue for this submission.</div>
              )}
            </div>
          ) : (
            <div className="queue-explanation">
              <Users />
              <div><strong>Send to the editorial review queue</strong><span>Eligible reviewers can claim the available assignments.</span></div>
            </div>
          )}

          {error && <div className="dialog-error review-error"><AlertCircle /> {error}</div>}
        </div>

        <footer>
          <button className="secondary-command" type="button" disabled={busy} onClick={onClose}>Cancel</button>
          <button
            className="submit-review-command"
            type="button"
            disabled={busy || (mode === 'reviewers' && selectedIds.length === 0)}
            onClick={onSubmit}
          >
            <Send /> {busy ? 'Submitting' : 'Submit for review'}
          </button>
        </footer>
      </section>
    </div>
  )
}

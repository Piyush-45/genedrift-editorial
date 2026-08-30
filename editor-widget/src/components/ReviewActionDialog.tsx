import { AlertCircle, Check, MessageSquare, RotateCcw, ShieldCheck, X, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { CurrentEmployee, ReviewAssignment, ReviewComment } from '../domain'

type Props = {
  open: boolean
  assignment: ReviewAssignment
  comments: ReviewComment[]
  currentEmployee?: CurrentEmployee
  busy: boolean
  error: string
  onClose: () => void
  onClaim: () => void
  onComment: (body: string) => Promise<boolean>
  onDecision: (decision: NonNullable<ReviewAssignment['decision']>, summary: string) => void
}

export function ReviewActionDialog({
  open, assignment, comments, currentEmployee, busy, error,
  onClose, onClaim, onComment, onDecision,
}: Props) {
  const [comment, setComment] = useState('')
  const [summary, setSummary] = useState('')
  if (!open) return null

  const assignedToCurrentUser = currentEmployee && (
    assignment.reviewerId === currentEmployee.id
    || (!assignment.reviewerId && assignment.reviewerName?.trim().toLowerCase() === currentEmployee.displayName.trim().toLowerCase())
  )
  const claimedByCurrentUser = assignment.status === 'Claimed' && assignedToCurrentUser
  const canClaim = assignment.status === 'Queued'
    || (assignment.status === 'Assigned' && assignedToCurrentUser)
  const submitComment = async () => {
    const value = comment.trim()
    if (!value) return
    if (await onComment(value)) setComment('')
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="review-dialog review-action-dialog" role="dialog" aria-modal="true" aria-labelledby="review-action-title">
        <header>
          <div>
            <h2 id="review-action-title">Review revision</h2>
            <p>{assignment.source} · {assignment.status}</p>
          </div>
          <button className="icon-command" type="button" title="Close" aria-label="Close" disabled={busy} onClick={onClose}><X /></button>
        </header>

        <div className="review-dialog-body">
          <div className="review-assignment-summary">
            <div><span>Reviewer</span><strong>{assignment.reviewerName || currentEmployee?.displayName || 'Shared queue'}</strong></div>
            <div><span>Assignment</span><strong>{assignment.uuid}</strong></div>
          </div>

          {canClaim && (
            <div className="claim-review-panel">
              <ShieldCheck />
              <div><strong>Claim this review</strong><span>Claiming records responsibility and enables comments and decisions.</span></div>
              <button className="submit-review-command" type="button" disabled={busy} onClick={onClaim}>Claim</button>
            </div>
          )}

          {claimedByCurrentUser && (
            <>
              <section className="review-comments-section">
                <h3>Discussion</h3>
                <div className="review-comment-list">
                  {comments.length > 0 ? comments.map((item) => (
                    <article className="review-comment" key={item.id}>
                      <div><strong>{item.authorName}</strong><span>{item.type}</span></div>
                      <p>{item.body}</p>
                    </article>
                  )) : <p className="review-empty">No comments yet.</p>}
                </div>
                <label className="field-label">Add comment
                  <textarea value={comment} maxLength={4000} rows={3} disabled={busy} onChange={(event) => setComment(event.target.value)} />
                </label>
                <button className="secondary-command" type="button" disabled={busy || !comment.trim()} onClick={() => void submitComment()}><MessageSquare /> Add comment</button>
              </section>

              <section className="review-decision-section">
                <h3>Decision</h3>
                <label className="field-label">Decision summary
                  <textarea value={summary} maxLength={4000} rows={4} disabled={busy} placeholder="Required for changes requested or rejection" onChange={(event) => setSummary(event.target.value)} />
                </label>
                <div className="decision-actions">
                  <button className="decision-command approve" type="button" disabled={busy} onClick={() => onDecision('Approved', summary.trim())}><Check /> Approve</button>
                  <button className="decision-command changes" type="button" disabled={busy || !summary.trim()} onClick={() => onDecision('Changes Requested', summary.trim())}><RotateCcw /> Request changes</button>
                  <button className="decision-command reject" type="button" disabled={busy || !summary.trim()} onClick={() => onDecision('Rejected', summary.trim())}><XCircle /> Reject</button>
                </div>
              </section>
            </>
          )}

          {!canClaim && !claimedByCurrentUser && (
            <div className="review-closed-state"><ShieldCheck /><span>This assignment is {assignment.status.toLowerCase()} and no longer accepts actions.</span></div>
          )}
          {error && <div className="dialog-error review-error"><AlertCircle /> {error}</div>}
        </div>
      </section>
    </div>
  )
}

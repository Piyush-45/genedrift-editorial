import type { ReactNode } from 'react'
import { Ellipsis } from 'lucide-react'
import type { Article } from '../domain'
import { parseProductTimestamp } from '../utils'

/* Small presentational pieces for the editorial dashboard. No data access
   here: the dashboard decides what to show, these decide how it looks. */

export type StageTone = 'draft' | 'review' | 'warn' | 'ready' | 'progress' | 'live' | 'muted' | 'danger' | 'scheduled'

export type Stage = { label: string; tone: StageTone }

export function stageOf(article: Article, opts: { pending?: boolean; needsRetry?: boolean; retracting?: boolean } = {}): Stage {
  if (opts.needsRetry) return { label: 'Not confirmed', tone: 'danger' }
  switch (article.workflowState) {
    case 'Draft': return { label: 'Draft', tone: 'draft' }
    case 'In Review': return { label: 'In review', tone: 'review' }
    case 'Changes Requested': return { label: 'Changes requested', tone: 'warn' }
    case 'Approved': return opts.pending ? { label: 'Publishing', tone: 'progress' } : { label: 'Approved', tone: 'ready' }
    case 'Scheduled': return { label: 'Scheduled', tone: 'scheduled' }
    case 'Published':
      if (opts.retracting) return { label: 'Withdrawing', tone: 'progress' }
      return opts.pending ? { label: 'Syncing', tone: 'progress' } : { label: 'Live', tone: 'live' }
    case 'Unpublished': return { label: 'Withdrawn', tone: 'muted' }
    case 'Rejected': return { label: 'Rejected', tone: 'danger' }
    case 'Archived': return { label: 'In Trash', tone: 'muted' }
    default: return { label: article.workflowState || 'Unknown', tone: 'muted' }
  }
}

/** True when an earlier version is on the website while this one is being worked on. */
export function hasLiveVersionBehind(article: Article) {
  return Boolean(article.publishedRevisionId)
    && !['Published', 'Unpublished', 'Archived'].includes(article.workflowState)
}

export function StageBadge({ stage, liveBehind }: { stage: Stage; liveBehind?: boolean }) {
  return (
    <span className="ed-stage-wrap">
      <span className={`ed-stage is-${stage.tone}`}><i aria-hidden="true" />{stage.label}</span>
      {liveBehind && <span className="ed-live-chip" title="An earlier version is live on the website">Live</span>}
    </span>
  )
}

const AVATAR_HUES = [262, 200, 160, 24, 330, 120, 290, 45]

export function Avatar({ name, size = 28 }: { name?: string; size?: number }) {
  const clean = (name || '').trim()
  const letters = clean
    ? clean.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
    : '?'
  let hash = 0
  for (const char of clean) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const hue = AVATAR_HUES[hash % AVATAR_HUES.length]
  return (
    <span
      className="ed-avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: `hsl(${hue} 70% 94%)`, color: `hsl(${hue} 45% 32%)` }}
    >
      {letters}
    </span>
  )
}

export function relativeTime(value?: string | number) {
  if (!value) return ''
  const time = typeof value === 'number' ? value : parseProductTimestamp(value)
  if (!time) return ''
  const diff = Date.now() - time
  const future = diff < 0
  const abs = Math.abs(diff)
  const minutes = Math.round(abs / 60_000)
  const hours = Math.round(abs / 3_600_000)
  const days = Math.round(abs / 86_400_000)
  const phrase = (text: string) => (future ? `in ${text}` : `${text} ago`)
  if (minutes < 1) return future ? 'in a moment' : 'just now'
  if (minutes < 60) return phrase(`${minutes}m`)
  if (hours < 24) return phrase(`${hours}h`)
  if (days < 7) return phrase(`${days}d`)
  const date = new Date(time)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) }).format(date)
}

export function absoluteTime(value?: string | number) {
  if (!value) return ''
  const time = typeof value === 'number' ? value : parseProductTimestamp(value)
  if (!time) return ''
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(time))
}

export function When({ value, prefix }: { value?: string | number; prefix?: string }) {
  const text = relativeTime(value)
  if (!text) return <span className="ed-when is-empty">—</span>
  return <time className="ed-when" title={absoluteTime(value)}>{prefix ? `${prefix} ` : ''}{text}</time>
}

export type MenuAction = { label: string; onClick: () => void; icon?: ReactNode; danger?: boolean; disabled?: boolean }

export function RowMenu({ actions }: { actions: MenuAction[] }) {
  if (!actions.length) return null
  return (
    <details className="ed-menu" onClick={(event) => event.stopPropagation()}>
      <summary aria-label="More actions" title="More actions"><Ellipsis /></summary>
      <div role="menu">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            role="menuitem"
            className={action.danger ? 'is-danger' : ''}
            disabled={action.disabled}
            onClick={(event) => {
              const details = (event.currentTarget.closest('details') as HTMLDetailsElement | null)
              if (details) details.open = false
              action.onClick()
            }}
          >
            {action.icon}{action.label}
          </button>
        ))}
      </div>
    </details>
  )
}

export function Section({
  title,
  count,
  hint,
  action,
  tone,
  children,
}: {
  title: string
  count?: number
  hint?: string
  action?: ReactNode
  tone?: 'attention'
  children: ReactNode
}) {
  return (
    <section className={`ed-section${tone ? ` is-${tone}` : ''}`}>
      <header>
        <div>
          <h2>{title}{typeof count === 'number' && <span className="ed-count">{count}</span>}</h2>
          {hint && <p>{hint}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function EmptyState({ icon, title, detail, action }: { icon: ReactNode; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="ed-empty">
      <span className="ed-empty-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      {detail && <p>{detail}</p>}
      {action}
    </div>
  )
}

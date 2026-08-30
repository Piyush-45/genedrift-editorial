import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronDown,
  Cloud,
  FileText,
  Eye,
  EyeOff,
  GitBranch,
  History,
  Inbox,
  LayoutDashboard,
  PanelRightClose,
  PanelRightOpen,
  ClipboardCheck,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { Article, AuditEvent, CurrentEmployee, DashboardData, MediaAsset, MediaMetadata, ReviewAssignment, Revision, SaveRevisionInput, WorkspaceData } from './domain'
import { ArticleEditor } from './components/ArticleEditor'
import { Inspector } from './components/Inspector'
import { SubmitReviewDialog } from './components/SubmitReviewDialog'
import { ReviewActionDialog } from './components/ReviewActionDialog'
import { createRepository } from './repository'
import { canonicalizeMedia } from './media'
import { errorMessage, metricsFor, slugify } from './utils'

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

const repository = createRepository()

function recoveryKey(revisionId: string) {
  return `genedrift:recovery:${revisionId}`
}

function saveInput(revision: Revision): SaveRevisionInput {
  return {
    id: revision.id,
    title: revision.title,
    slug: revision.slug,
    excerpt: revision.excerpt,
    seoTitle: revision.seoTitle,
    seoDescription: revision.seoDescription,
    robotsDirective: revision.robotsDirective,
    wordCount: revision.wordCount,
    readingTimeMinutes: revision.readingTimeMinutes,
    featuredMediaId: revision.featuredMediaId,
    document: canonicalizeMedia(revision.document),
    expectedChecksum: revision.checksum || '',
    expectedVersionToken: revision.versionToken,
  }
}

const CLOSED_ASSIGNMENT_STATES = new Set<ReviewAssignment['status']>(['Approved', 'Changes Requested', 'Rejected', 'Cancelled'])
const ACTIVE_ASSIGNMENT_STATES = new Set<ReviewAssignment['status']>(['Queued', 'Assigned', 'Claimed'])
const WORKING_ARTICLE_STATES = new Set(['Draft', 'Changes Requested', 'In Review'])
const CREATOR_APP_URL = 'https://creatorapp.zoho.in/opensourceindia22/genedrift-editorial-platform/'

type DashboardStateFilter = 'all' | 'draft' | 'in-review' | 'changes-requested' | 'approved' | 'scheduled' | 'published' | 'unpublished' | 'queued' | 'assigned' | 'claimed' | 'closed'
type DashboardView = 'all' | 'articles' | 'reviews' | 'publishing'
type DashboardSort = 'recent' | 'title' | 'state'

const DASHBOARD_STATE_OPTIONS: Record<DashboardView, Array<{ value: DashboardStateFilter; label: string }>> = {
  all: [
    { value: 'all', label: 'All states' },
    { value: 'draft', label: 'Draft' },
    { value: 'in-review', label: 'In review' },
    { value: 'changes-requested', label: 'Changes requested' },
    { value: 'approved', label: 'Approved' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'unpublished', label: 'Unpublished' },
    { value: 'queued', label: 'Queued review' },
    { value: 'assigned', label: 'Assigned review' },
    { value: 'claimed', label: 'Claimed review' },
    { value: 'closed', label: 'Closed decisions' },
  ],
  articles: [
    { value: 'all', label: 'All article states' },
    { value: 'draft', label: 'Draft' },
    { value: 'in-review', label: 'In review' },
    { value: 'changes-requested', label: 'Changes requested' },
    { value: 'approved', label: 'Approved' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'unpublished', label: 'Unpublished' },
  ],
  reviews: [
    { value: 'all', label: 'All review states' },
    { value: 'queued', label: 'Queued' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'claimed', label: 'Claimed' },
    { value: 'approved', label: 'Approved decisions' },
    { value: 'closed', label: 'All closed decisions' },
  ],
  publishing: [
    { value: 'all', label: 'All publishing states' },
    { value: 'approved', label: 'Ready to publish' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'published', label: 'Published' },
    { value: 'unpublished', label: 'Unpublished' },
  ],
}

function displayLookup(value?: { zc_display_value?: string; display_value?: string }) {
  return value?.zc_display_value || value?.display_value || 'Unassigned'
}

function initials(name?: string) {
  return (name || 'GE')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'GE'
}

function formatShortDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatClockTime(value?: number) {
  if (!value) return 'just now'
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function timestampValue(value?: string) {
  if (!value) return 0
  const direct = Date.parse(value)
  if (!Number.isNaN(direct)) return direct
  const normalized = value.replace(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/, '$1 $2 $3')
  const fallback = Date.parse(normalized)
  return Number.isNaN(fallback) ? 0 : fallback
}

function latestAssignmentTime(assignment: ReviewAssignment) {
  return Math.max(
    timestampValue(assignment.decidedAt),
    timestampValue(assignment.claimedAt),
    timestampValue(assignment.assignedAt),
  )
}

function activeReviewAssignment(assignment: ReviewAssignment, article?: Article) {
  if (!ACTIVE_ASSIGNMENT_STATES.has(assignment.status)) return false
  if (!article) return true
  return article.workflowState === 'In Review'
}

function creatorParentBaseUrl() {
  const referrer = document.referrer
  if (referrer.includes('/opensourceindia22/genedrift-editorial-platform/')) {
    return referrer.split('#')[0]
  }
  if (window.location.href.includes('/opensourceindia22/genedrift-editorial-platform/')) {
    return window.location.href.split('#')[0]
  }
  return CREATOR_APP_URL
}

function navigateParent(url: string) {
  const navigateParentURL = window.ZOHO?.CREATOR?.UTIL?.navigateParentURL
  if (repository.source === 'creator' && navigateParentURL) {
    try {
      void navigateParentURL({ action: 'open', url, window: 'same' })
      return
    } catch {
      // Fall back below if Creator parent navigation is unavailable at runtime.
    }
  }
  window.open(url, '_top')
}

function openWorkspaceArticle(articleId: string, revisionId?: string) {
  const revisionQuery = revisionId ? `&revisionId=${encodeURIComponent(revisionId)}` : ''
  if (repository.source === 'creator') {
    navigateParent(`${creatorParentBaseUrl()}#Page:Article_Workspace?articleId=${encodeURIComponent(articleId)}${revisionQuery}`)
    return
  }
  window.location.href = `${window.location.pathname}?articleId=${encodeURIComponent(articleId)}${revisionQuery}`
}

function openNewArticleForm() {
  if (repository.source === 'creator') {
    navigateParent(`${creatorParentBaseUrl()}#Form:Articles`)
    return
  }
  window.location.reload()
}

function defaultApprovalPolicyId(data: DashboardData) {
  return data.approvalPolicies.find((policy) => displayLookup(policy) === 'Standard Review')?.ID
    || data.approvalPolicies[0]?.ID
    || ''
}

function StatusPill({ state }: { state: string }) {
  const tone = state.toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-pill is-${tone}`}>{state || 'Unknown'}</span>
}

function eventTone(state: string) {
  return state.toLowerCase().replace(/\s+/g, '-')
}

function includesQuery(values: string[], query: string) {
  if (!query) return true
  return values.some((value) => value.toLowerCase().includes(query))
}

function normalizedIdentity(value?: string) {
  return (value || '').trim().toLowerCase()
}

function lookupBelongsToEmployee(value: { ID?: string; zc_display_value?: string; display_value?: string }, currentEmployee?: CurrentEmployee) {
  if (!currentEmployee) return false
  if (value.ID) return value.ID === currentEmployee.id
  return normalizedIdentity(displayLookup(value)) === normalizedIdentity(currentEmployee.displayName)
}

function canEditArticle(article: Article, currentEmployee?: CurrentEmployee) {
  if (!currentEmployee) return false
  return currentEmployee.roles.includes('CEO')
    || currentEmployee.roles.includes('Editorial Admin')
    || lookupBelongsToEmployee(article.owner, currentEmployee)
    || lookupBelongsToEmployee(article.primaryAuthor, currentEmployee)
}

function assignmentBelongsToCurrentReviewer(assignment: ReviewAssignment, currentEmployee?: CurrentEmployee) {
  if (!currentEmployee) return false
  return assignment.reviewerId === currentEmployee.id
    || (!assignment.reviewerId
      && normalizedIdentity(assignment.reviewerName) === normalizedIdentity(currentEmployee.displayName))
}

function articleMatchesFilter(article: Article, query: string, stateFilter: DashboardStateFilter) {
  const stateTone = eventTone(article.workflowState)
  const stateMatches = stateFilter === 'all' || stateTone === stateFilter
  return stateMatches && includesQuery([
    article.workingTitle,
    article.workflowState,
    displayLookup(article.owner),
    displayLookup(article.primaryAuthor),
    displayLookup(article.primaryCategory),
    displayLookup(article.approvalPolicy),
    ...article.tags.map(displayLookup),
  ], query)
}

function assignmentMatchesFilter(assignment: ReviewAssignment, article: Article | undefined, query: string, stateFilter: DashboardStateFilter) {
  const stateTone = eventTone(assignment.status)
  const stateMatches = stateFilter === 'all'
    || stateTone === stateFilter
    || (stateFilter === 'closed' && CLOSED_ASSIGNMENT_STATES.has(assignment.status))
  const queryMatches = includesQuery([
    assignment.status,
    assignment.decision || '',
    assignment.decisionSummary,
    assignment.reviewerName || '',
    assignment.source,
    assignment.articleTitle || '',
    assignment.revisionTitle || '',
    article?.workingTitle || '',
    article?.workflowState || '',
    displayLookup(article?.primaryAuthor),
    displayLookup(article?.primaryCategory),
  ], query)
  return stateMatches && queryMatches
}

function RoleBadge({ role }: { role: string }) {
  return <span className={`role-badge is-${eventTone(role)}`}>{role}</span>
}

function DashboardMetric({
  icon,
  label,
  value,
  detail,
  active,
  onClick,
}: {
  icon: ReactNode
  label: string
  value: number
  detail?: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button type="button" className={`metric${active ? ' is-active' : ''}`} aria-pressed={active} onClick={onClick}>
      <div className="metric-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {detail && <em>{detail}</em>}
      </div>
    </button>
  )
}

function DashboardRow({
  article,
  assignment,
  label,
  compact,
}: {
  article?: Article
  assignment?: ReviewAssignment
  label?: string
  compact?: boolean
}) {
  const articleTitle = article?.workingTitle || assignment?.articleTitle || assignment?.revisionTitle || 'Unavailable article'
  const meta = [
    assignment?.reviewerName ? assignment.reviewerName : '',
    assignment?.source ? `Source: ${assignment.source}` : '',
    article?.primaryCategory ? displayLookup(article.primaryCategory) : '',
  ].filter(Boolean).join(' · ')
  const state = assignment?.status || article?.workflowState || label || 'Open'
  const targetArticleId = assignment?.articleId || article?.id
  const timestamp = formatShortDate(assignment?.decidedAt || assignment?.claimedAt || assignment?.assignedAt)
  const summary = assignment?.decisionSummary?.trim()
  return (
    <li className={`dashboard-row${compact ? ' is-compact' : ''}`}>
      <div className="row-avatar" aria-hidden="true">{initials(assignment?.reviewerName || displayLookup(article?.primaryAuthor) || articleTitle)}</div>
      <div className="row-main">
        <div className="row-title-line">
          <strong title={articleTitle}>{articleTitle}</strong>
          {timestamp && <time>{timestamp}</time>}
        </div>
        <span>{summary || meta || label || 'Article workspace'}</span>
      </div>
      <div className="row-actions">
        <StatusPill state={state} />
        <button type="button" className="secondary-command" disabled={!targetArticleId} onClick={() => targetArticleId && openWorkspaceArticle(targetArticleId, assignment?.revisionId)}>
          Open
        </button>
      </div>
    </li>
  )
}

function ReviewHistoryRow({
  assignment,
  article,
}: {
  assignment: ReviewAssignment
  article?: Article
}) {
  const articleTitle = article?.workingTitle || assignment.articleTitle || assignment.revisionTitle || 'Unavailable article'
  const reviewer = assignment.reviewerName || 'Reviewer'
  const decision = assignment.decision || assignment.status
  const summary = assignment.decisionSummary?.trim()
  const timestamp = formatShortDate(assignment.decidedAt || assignment.assignedAt)
  return (
    <li className="history-card">
      <div className="row-avatar" aria-hidden="true">{initials(reviewer)}</div>
      <div className="history-main">
        <div className="history-title">
          <strong title={articleTitle}>{articleTitle}</strong>
          {timestamp && <time>{timestamp}</time>}
        </div>
        <dl className="history-facts">
          <div><dt>Decision</dt><dd><StatusPill state={decision} /></dd></div>
          <div><dt>Reviewer</dt><dd>{reviewer}</dd></div>
          <div><dt>Source</dt><dd>{assignment.source}</dd></div>
        </dl>
        {summary && <p>{summary}</p>}
      </div>
      <button type="button" className="secondary-command" disabled={!assignment.articleId || !assignment.revisionId} onClick={() => openWorkspaceArticle(assignment.articleId, assignment.revisionId)}>
        Open snapshot
      </button>
    </li>
  )
}

function ArticleStatusRow({
  article,
  note,
  statusOverride,
  actionLabel = 'Open',
  secondaryAction,
  tertiaryAction,
  secondaryBusy,
  tertiaryBusy,
}: {
  article: Article
  note?: string
  statusOverride?: string
  actionLabel?: string
  secondaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
    icon?: ReactNode
    busyLabel?: string
  }
  tertiaryAction?: {
    label: string
    onClick: () => void
    disabled?: boolean
    icon?: ReactNode
    busyLabel?: string
  }
  secondaryBusy?: boolean
  tertiaryBusy?: boolean
}) {
  return (
    <li className="dashboard-row">
      <div className="row-avatar" aria-hidden="true">{initials(displayLookup(article.primaryAuthor) || article.workingTitle)}</div>
      <div className="row-main">
        <div className="row-title-line">
          <strong title={article.workingTitle || 'Untitled article'}>{article.workingTitle || 'Untitled article'}</strong>
        </div>
        <span>{note || [displayLookup(article.primaryAuthor), displayLookup(article.primaryCategory)].filter(Boolean).join(' · ')}</span>
      </div>
      <div className="row-actions">
        <StatusPill state={statusOverride || article.workflowState} />
        {secondaryAction && (
          <button type="button" className="publish-command" disabled={secondaryAction.disabled || secondaryBusy} onClick={secondaryAction.onClick}>
            {secondaryAction.icon || <Send />} {secondaryBusy ? secondaryAction.busyLabel || secondaryAction.label : secondaryAction.label}
          </button>
        )}
        {tertiaryAction && (
          <button type="button" className="secondary-command" disabled={tertiaryAction.disabled || tertiaryBusy} onClick={tertiaryAction.onClick}>
            {tertiaryAction.icon} {tertiaryBusy ? tertiaryAction.busyLabel || tertiaryAction.label : tertiaryAction.label}
          </button>
        )}
        <button type="button" className="secondary-command" onClick={() => openWorkspaceArticle(article.id)}>
          {actionLabel}
        </button>
      </div>
    </li>
  )
}

function AdminOverview({
  queuedCount,
  inReviewCount,
  changesRequestedCount,
  approvedCount,
}: {
  queuedCount: number
  inReviewCount: number
  changesRequestedCount: number
  approvedCount: number
}) {
  const items = [
    { label: 'Shared queue slots', value: queuedCount, detail: 'Need reviewer claim' },
    { label: 'In review', value: inReviewCount, detail: 'Waiting on decisions' },
    { label: 'Changes requested', value: changesRequestedCount, detail: 'Back with authors' },
    { label: 'Ready to publish', value: approvedCount, detail: 'Publisher next step' },
  ]
  return (
    <DashboardPanel title="Admin overview" icon={<LayoutDashboard />} empty={false}>
      <div className="overview-grid">
        {items.map((item) => (
          <div key={item.label} className="overview-item">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <em>{item.detail}</em>
          </div>
        ))}
      </div>
    </DashboardPanel>
  )
}

function DashboardPanel({
  title,
  icon,
  empty,
  children,
  aside,
  emptyMessage = 'Nothing here right now.',
  scrollable = true,
  wide = false,
}: {
  title: string
  icon: ReactNode
  empty: boolean
  children: ReactNode
  aside?: ReactNode
  emptyMessage?: string
  scrollable?: boolean
  wide?: boolean
}) {
  return (
    <section className={`dashboard-panel${scrollable ? ' is-scrollable' : ''}${wide ? ' is-wide' : ''}`}>
      <header>
        <h2>{icon}{title}</h2>
        {aside}
      </header>
      <div className="dashboard-panel-body">
        {empty ? <p className="dashboard-empty">{emptyMessage}</p> : children}
      </div>
    </section>
  )
}

function ActivityTimeline({
  articles,
  assignments,
  auditEvents,
}: {
  articles: Article[]
  assignments: ReviewAssignment[]
  auditEvents: AuditEvent[]
}) {
  const articlesById = new Map(articles.map((article) => [article.id, article]))
  const articlesByUuid = new Map(articles.map((article) => [article.uuid, article]))
  const assignmentEvents = assignments.flatMap((assignment) => {
    const article = articlesById.get(assignment.articleId)
    const title = article?.workingTitle || assignment.articleTitle || assignment.revisionTitle || 'Untitled article'
    const items = []
    if (assignment.assignedAt) {
      items.push({
        id: `${assignment.id}-assigned`,
        at: assignment.assignedAt,
        title,
        label: assignment.status === 'Queued' ? 'Shared queue opened' : 'Review assigned',
        actor: assignment.status === 'Queued' ? 'Unassigned reviewer slot' : assignment.reviewerName || 'Reviewer',
        detail: assignment.source,
        state: assignment.status === 'Queued' ? 'Queued' : 'Assigned',
      })
    }
    if (assignment.claimedAt) {
      items.push({
        id: `${assignment.id}-claimed`,
        at: assignment.claimedAt,
        title,
        label: 'Review claimed',
        actor: assignment.reviewerName || 'Reviewer',
        detail: 'Reviewer started the assignment',
        state: 'Claimed',
      })
    }
    if (assignment.decidedAt) {
      items.push({
        id: `${assignment.id}-decided`,
        at: assignment.decidedAt,
        title,
        label: 'Decision recorded',
        actor: assignment.reviewerName || 'Reviewer',
        detail: assignment.decisionSummary?.trim() || assignment.decision || assignment.status,
        state: assignment.status,
      })
    }
    return items
  })
  const auditActivity = auditEvents.map((event) => {
    const article = articlesByUuid.get(event.entityUuid)
    return {
      id: `audit-${event.id}`,
      at: event.occurredAt,
      title: article?.workingTitle || event.entityType || 'Workflow event',
      label: event.eventType || 'Workflow event',
      actor: event.actorName || 'System',
      detail: event.summary || [event.previousState, event.newState].filter(Boolean).join(' to '),
      state: event.newState || event.eventType,
    }
  })
  const events = (auditActivity.length ? auditActivity : assignmentEvents)
    .sort((a, b) => timestampValue(b.at) - timestampValue(a.at))
    .slice(0, 40)

  return (
    <DashboardPanel title="Recent activity" icon={<GitBranch />} empty={events.length === 0} wide>
      <ol className="timeline-list">
        {events.map((event) => (
          <li key={event.id}>
            <span className={`timeline-dot is-${eventTone(event.state)}`} />
            <div>
              <div className="timeline-head">
                <strong>{event.label}</strong>
                <StatusPill state={event.state} />
              </div>
              <span>{event.title}</span>
              <em>{event.actor} · {event.detail}</em>
            </div>
            <time>{formatShortDate(event.at)}</time>
          </li>
        ))}
      </ol>
    </DashboardPanel>
  )
}

function EditorialDashboard({
  data,
  onRefresh,
  updatedAt,
}: {
  data: DashboardData
  onRefresh: () => Promise<void>
  updatedAt: number
}) {
  const [scope, setScope] = useState<'mine' | 'queue' | 'all'>('mine')
  const [view, setView] = useState<DashboardView>('all')
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<DashboardStateFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<DashboardSort>('recent')
  const [refreshBusy, setRefreshBusy] = useState(false)
  const [liveRefreshBusy, setLiveRefreshBusy] = useState(false)
  const [liveRefreshError, setLiveRefreshError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createCategoryId, setCreateCategoryId] = useState(data.categories[0]?.ID || '')
  const [createPolicyId, setCreatePolicyId] = useState(defaultApprovalPolicyId(data))
  const [createBusy, setCreateBusy] = useState(false)
  const [createError, setCreateError] = useState('')
  const [publishBusyId, setPublishBusyId] = useState('')
  const [optimisticPublicationIds, setOptimisticPublicationIds] = useState<Set<string>>(() => new Set())
  const publicationActionRef = useRef(new Set<string>())
  const [scheduleArticleTarget, setScheduleArticleTarget] = useState<Article | null>(null)
  const [scheduleAt, setScheduleAt] = useState(() => formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)))
  const [scheduleBusy, setScheduleBusy] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [retractArticleTarget, setRetractArticleTarget] = useState<Article | null>(null)
  const [retractReason, setRetractReason] = useState('')
  const [replacementPath, setReplacementPath] = useState('')
  const [retractBusy, setRetractBusy] = useState(false)
  const [retractError, setRetractError] = useState('')
  const [dashboardNotice, setDashboardNotice] = useState('')
  const [dashboardError, setDashboardError] = useState('')
  const currentEmployee = data.currentEmployee
  const roles = Array.from(new Set(currentEmployee?.roles || []))
  const isReviewer = roles.includes('Reviewer')
  const isAuthor = roles.includes('Author')
  const isPublisher = roles.includes('Publisher')
  const showAll = !currentEmployee || roles.includes('CEO') || roles.includes('Editorial Admin')
  const articlesById = new Map(data.articles.map((article) => [article.id, article]))
  const activePublicationJobByArticleId = new Map(
    data.publicationJobs
      .filter((job) => job.status === 'Queued' || job.status === 'Processing')
      .map((job) => [job.articleId, job]),
  )
  const hasActivePublicationJobs = activePublicationJobByArticleId.size > 0
  const publicationPending = (articleId: string) => optimisticPublicationIds.has(articleId)
    || activePublicationJobByArticleId.has(articleId)
  const validAssignments = data.assignments.filter((assignment) => assignment.articleId && assignment.revisionId)
  const queryText = query.trim().toLowerCase()
  const articleIsMine = (article: Article) => lookupBelongsToEmployee(article.owner, currentEmployee)
    || lookupBelongsToEmployee(article.primaryAuthor, currentEmployee)
  const reviewerRevisionParticipation = new Set(
    validAssignments
      .filter((assignment) => assignmentBelongsToCurrentReviewer(assignment, currentEmployee) && assignment.status !== 'Cancelled')
      .map((assignment) => assignment.revisionId),
  )
  const canSeeAssignment = (assignment: ReviewAssignment) => showAll
    || assignmentBelongsToCurrentReviewer(assignment, currentEmployee)
    || (assignment.status === 'Queued' && isReviewer && !reviewerRevisionParticipation.has(assignment.revisionId))
  const visibleArticles = data.articles.filter((article) => showAll || articleIsMine(article))
  const visibleAssignments = validAssignments.filter(canSeeAssignment)
  const filterableArticles = [
    ...visibleArticles,
    ...visibleAssignments.flatMap((assignment) => {
      const linkedArticle = articlesById.get(assignment.articleId)
      return linkedArticle ? [linkedArticle] : []
    }),
  ]
  const categoryOptions = Array.from(new Set(
    filterableArticles
      .map((article) => displayLookup(article.primaryCategory))
      .filter((category) => category && category !== 'Unassigned'),
  )).sort((a, b) => a.localeCompare(b))
  const matchesCategory = (article?: Article) => categoryFilter === 'all'
    || normalizedIdentity(displayLookup(article?.primaryCategory)) === normalizedIdentity(categoryFilter)
  const latestActivityByArticleId = new Map<string, number>()
  const noteArticleActivity = (articleId: string | undefined, at: string | undefined) => {
    if (!articleId) return
    latestActivityByArticleId.set(articleId, Math.max(latestActivityByArticleId.get(articleId) || 0, timestampValue(at)))
  }
  for (const assignment of validAssignments) {
    noteArticleActivity(assignment.articleId, assignment.assignedAt)
    noteArticleActivity(assignment.articleId, assignment.claimedAt)
    noteArticleActivity(assignment.articleId, assignment.decidedAt)
  }
  const articlesByUuidForActivity = new Map(data.articles.map((article) => [article.uuid, article]))
  for (const event of data.auditEvents) {
    noteArticleActivity(articlesByUuidForActivity.get(event.entityUuid)?.id, event.occurredAt)
  }
  const scopedAssignments = visibleAssignments.filter((assignment) => {
    if (scope === 'queue') return assignment.status === 'Queued'
    if (scope === 'all') return true
    return assignmentBelongsToCurrentReviewer(assignment, currentEmployee)
  }).filter((assignment) => {
    const linkedArticle = articlesById.get(assignment.articleId)
    return matchesCategory(linkedArticle) && assignmentMatchesFilter(assignment, linkedArticle, queryText, stateFilter)
  })
  const scopedArticles = visibleArticles.filter((article) => {
    if (scope === 'queue') return article.workflowState === 'Approved' || article.workflowState === 'Scheduled'
    if (scope === 'mine') return articleIsMine(article)
    return true
  }).filter((article) => matchesCategory(article) && articleMatchesFilter(article, queryText, stateFilter))
  const articleSort = (a: Article, b: Article) => {
    if (sortOrder === 'title') return a.workingTitle.localeCompare(b.workingTitle)
    if (sortOrder === 'state') return a.workflowState.localeCompare(b.workflowState) || a.workingTitle.localeCompare(b.workingTitle)
    return (latestActivityByArticleId.get(b.id) || timestampValue(b.lastPublishedAt) || timestampValue(b.scheduledAt))
      - (latestActivityByArticleId.get(a.id) || timestampValue(a.lastPublishedAt) || timestampValue(a.scheduledAt))
      || a.workingTitle.localeCompare(b.workingTitle)
  }
  const assignmentSort = (a: ReviewAssignment, b: ReviewAssignment) => {
    const articleA = articlesById.get(a.articleId)
    const articleB = articlesById.get(b.articleId)
    if (sortOrder === 'title') return (articleA?.workingTitle || a.articleTitle || '').localeCompare(articleB?.workingTitle || b.articleTitle || '')
    if (sortOrder === 'state') return a.status.localeCompare(b.status) || latestAssignmentTime(b) - latestAssignmentTime(a)
    return latestAssignmentTime(b) - latestAssignmentTime(a)
  }
  const visibleQueueRevisionIds = new Set<string>()
  const inboxAssignments = scopedAssignments
    .filter((assignment) => activeReviewAssignment(assignment, articlesById.get(assignment.articleId)) && canSeeAssignment(assignment))
    .sort(assignmentSort)
    .filter((assignment) => {
      if (showAll || assignment.status !== 'Queued') return true
      if (visibleQueueRevisionIds.has(assignment.revisionId)) return false
      visibleQueueRevisionIds.add(assignment.revisionId)
      return true
    })
  const reviewHistory = scopedAssignments
    .filter((assignment) => CLOSED_ASSIGNMENT_STATES.has(assignment.status) && canSeeAssignment(assignment))
    .sort(assignmentSort)
  const workArticles = scopedArticles
    .filter((article) => WORKING_ARTICLE_STATES.has(article.workflowState))
    .sort(articleSort)
  const publishedArticles = scopedArticles
    .filter((article) => article.workflowState === 'Published')
    .sort(articleSort)
  const unpublishedArticles = scopedArticles
    .filter((article) => article.workflowState === 'Unpublished')
    .sort(articleSort)
  const reviewerOnly = isReviewer && !showAll && !roles.includes('Author')
  const approvedCount = reviewerOnly
    ? reviewHistory.filter((assignment) => assignment.status === 'Approved').length
    : visibleArticles.filter((article) => article.workflowState === 'Approved' && (scope !== 'mine' || articleIsMine(article))).length
  const approvedLabel = reviewerOnly ? 'My approvals' : 'Approved articles'
  const canCreateArticle = !!currentEmployee && (showAll || roles.includes('Author'))
  const sharedQueueCount = inboxAssignments.filter((assignment) => assignment.status === 'Queued').length
  const assignedToMeCount = inboxAssignments.filter((assignment) => assignmentBelongsToCurrentReviewer(assignment, currentEmployee)).length
  const changesRequestedCount = workArticles.filter((article) => article.workflowState === 'Changes Requested').length
  const publishingQueue = data.articles
    .filter((article) => (article.workflowState === 'Approved' || article.workflowState === 'Scheduled') && (
      showAll
      || isPublisher
      || lookupBelongsToEmployee(article.owner, currentEmployee)
      || lookupBelongsToEmployee(article.primaryAuthor, currentEmployee)
    ))
    .filter((article) => {
      if (scope === 'mine' && !articleIsMine(article)) return false
      if (scope === 'all' && !showAll && !articleIsMine(article)) return false
      return matchesCategory(article) && articleMatchesFilter(article, queryText, stateFilter === 'all' ? 'all' : stateFilter)
    })
    .sort(articleSort)
  const visibleAuditEvents = data.auditEvents.filter((event) => {
    if (showAll) return true
    if (event.actorId === currentEmployee?.id) return true
    return visibleArticles.some((article) => article.uuid === event.entityUuid)
  }).filter((event) => {
    const linkedArticle = articlesByUuidForActivity.get(event.entityUuid)
    if (linkedArticle && !matchesCategory(linkedArticle)) return false
    return includesQuery([
      event.eventType,
      event.actorName || '',
      event.summary || '',
      event.previousState || '',
      event.newState || '',
      linkedArticle?.workingTitle || '',
    ], queryText)
  })
  const roleLine = roles.length ? roles.join(', ') : 'Editorial user'
  const currentStateOptions = DASHBOARD_STATE_OPTIONS[view]
  const filtersActive = query.trim() !== '' || stateFilter !== 'all' || categoryFilter !== 'all' || sortOrder !== 'recent'
  const emptyMessage = filtersActive ? 'No items match the current filters.' : 'Nothing here right now.'
  const showReviewPanels = view === 'all' || view === 'reviews'
  const showArticlePanels = view === 'all' || view === 'articles'
  const showPublishingPanels = view === 'all' || view === 'publishing'
  const articlePanelItems = view === 'articles' ? [...scopedArticles].sort(articleSort) : workArticles

  useEffect(() => {
    setOptimisticPublicationIds((current) => {
      const next = new Set([...current].filter((articleId) => {
        const article = articlesById.get(articleId)
        return article?.workflowState === 'Approved' && activePublicationJobByArticleId.has(articleId)
      }))
      if (next.size === current.size && [...next].every((id) => current.has(id))) return current
      return next
    })
  }, [data.articles, data.publicationJobs])

  const changeView = (nextView: DashboardView) => {
    setView(nextView)
    setStateFilter('all')
  }

  const clearFilters = () => {
    setQuery('')
    setStateFilter('all')
    setCategoryFilter('all')
    setSortOrder('recent')
  }

  const refreshDashboard = async () => {
    setRefreshBusy(true)
    setLiveRefreshError('')
    try {
      await onRefresh()
    } catch (error) {
      setLiveRefreshError(errorMessage(error, 'Live update failed. Retrying automatically.'))
    } finally {
      setRefreshBusy(false)
    }
  }

  useEffect(() => {
    let disposed = false
    let timer: number | undefined
    const delay = hasActivePublicationJobs ? 5_000 : 45_000

    const schedule = () => {
      if (disposed) return
      timer = window.setTimeout(() => void tick(), delay)
    }

    const tick = async () => {
      if (disposed) return
      if (document.hidden) {
        schedule()
        return
      }
      setLiveRefreshBusy(true)
      try {
        await onRefresh()
        if (!disposed) setLiveRefreshError('')
      } catch (error) {
        if (!disposed) setLiveRefreshError(errorMessage(error, 'Live update failed. Retrying automatically.'))
      } finally {
        if (!disposed) {
          setLiveRefreshBusy(false)
          schedule()
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden || disposed) return
      if (timer !== undefined) window.clearTimeout(timer)
      void tick()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    schedule()
    return () => {
      disposed = true
      if (timer !== undefined) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasActivePublicationJobs, onRefresh])

  const createArticle = async () => {
    setCreateBusy(true)
    setCreateError('')
    try {
      const result = await repository.createDraftArticle({
        title: createTitle,
        categoryId: createCategoryId || undefined,
        approvalPolicyId: createPolicyId,
      })
      openWorkspaceArticle(result.articleId)
    } catch (error) {
      setCreateError(errorMessage(error, 'The article could not be created.'))
    } finally {
      setCreateBusy(false)
    }
  }

  const publishArticle = async (article: Article) => {
    if (publicationActionRef.current.has(article.id) || publicationPending(article.id)) return
    publicationActionRef.current.add(article.id)
    setOptimisticPublicationIds((current) => new Set(current).add(article.id))
    setPublishBusyId(article.id)
    setDashboardNotice('')
    setDashboardError('')
    try {
      const result = await repository.publishArticle(article.id)
      setDashboardNotice(result.message || `${article.workingTitle} was published.`)
      await onRefresh()
    } catch (error) {
      setOptimisticPublicationIds((current) => {
        const next = new Set(current)
        next.delete(article.id)
        return next
      })
      setDashboardError(errorMessage(error, 'The article could not be published.'))
    } finally {
      publicationActionRef.current.delete(article.id)
      setPublishBusyId('')
    }
  }

  const openScheduleDialog = (article: Article) => {
    if (publicationPending(article.id) || publicationActionRef.current.has(article.id)) return
    setScheduleArticleTarget(article)
    setScheduleAt(formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)))
    setScheduleError('')
    setDashboardNotice('')
    setDashboardError('')
  }

  const scheduleApprovedArticle = async () => {
    if (!scheduleArticleTarget) return
    const articleId = scheduleArticleTarget.id
    if (publicationActionRef.current.has(articleId) || publicationPending(articleId)) return
    publicationActionRef.current.add(articleId)
    setOptimisticPublicationIds((current) => new Set(current).add(articleId))
    setScheduleBusy(true)
    setScheduleError('')
    try {
      const result = await repository.scheduleArticle(scheduleArticleTarget.id, scheduleAt)
      setDashboardNotice(result.message || `${scheduleArticleTarget.workingTitle} was scheduled.`)
      setScheduleArticleTarget(null)
      await onRefresh()
    } catch (error) {
      setOptimisticPublicationIds((current) => {
        const next = new Set(current)
        next.delete(articleId)
        return next
      })
      setScheduleError(errorMessage(error, 'The article could not be scheduled.'))
    } finally {
      publicationActionRef.current.delete(articleId)
      setScheduleBusy(false)
    }
  }

  const openRetractDialog = (article: Article) => {
    setRetractArticleTarget(article)
    setRetractReason('')
    setReplacementPath('')
    setRetractError('')
    setDashboardNotice('')
    setDashboardError('')
  }

  const retractPublishedArticle = async () => {
    if (!retractArticleTarget) return
    const articleId = retractArticleTarget.id
    if (publicationActionRef.current.has(articleId) || publicationPending(articleId)) return
    publicationActionRef.current.add(articleId)
    setOptimisticPublicationIds((current) => new Set(current).add(articleId))
    setRetractBusy(true)
    setRetractError('')
    try {
      const result = await repository.retractArticle(retractArticleTarget.id, retractReason.trim(), replacementPath.trim())
      setDashboardNotice(result.message || `${retractArticleTarget.workingTitle} retraction was accepted.`)
      setRetractArticleTarget(null)
      await onRefresh()
    } catch (error) {
      setOptimisticPublicationIds((current) => {
        const next = new Set(current)
        next.delete(articleId)
        return next
      })
      setRetractError(errorMessage(error, 'The article could not be retracted.'))
    } finally {
      publicationActionRef.current.delete(articleId)
      setRetractBusy(false)
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <div className="dashboard-kicker"><LayoutDashboard /> Editorial dashboard</div>
          <h1>GeneDrift Insights</h1>
          <p>{currentEmployee ? `${currentEmployee.displayName} · ${roleLine}` : 'Editorial user'}</p>
          <div className="role-badges">
            {roles.map((role) => <RoleBadge key={role} role={role} />)}
            {isAuthor && isReviewer && <span className="role-note"><ShieldCheck /> Self-review blocked</span>}
          </div>
        </div>
        <button type="button" className="submit-review-command" disabled={!canCreateArticle} onClick={() => {
          setCreateTitle('')
          setCreateCategoryId(data.categories[0]?.ID || '')
          setCreatePolicyId(defaultApprovalPolicyId(data))
          setCreateError('')
          setCreateOpen(true)
        }}>
          <Plus /> New article
        </button>
      </header>

      <section className="dashboard-commandbar" aria-label="Dashboard filters">
        <div className="dashboard-command-primary">
          <div className="dashboard-scope" role="tablist" aria-label="Dashboard scope">
            <button type="button" className={scope === 'mine' ? 'is-active' : ''} onClick={() => setScope('mine')}>Mine</button>
            <button type="button" className={scope === 'queue' ? 'is-active' : ''} onClick={() => setScope('queue')}>Queue</button>
            <button type="button" className={scope === 'all' ? 'is-active' : ''} disabled={!showAll} onClick={() => setScope('all')}>All</button>
          </div>
          <label className="dashboard-search">
            <Search />
            <span className="sr-only">Search dashboard</span>
            <input value={query} placeholder="Search titles, people, categories or decisions" onChange={(event) => setQuery(event.target.value)} />
            {query && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setQuery('')}><X /></button>}
          </label>
          <button type="button" className="dashboard-refresh" disabled={refreshBusy} onClick={() => void refreshDashboard()}>
            <RotateCcw /> {refreshBusy ? 'Refreshing' : 'Refresh'}
          </button>
        </div>

        <div className="dashboard-filterbar">
          <div className="dashboard-view" role="tablist" aria-label="Work type">
            {([
              ['all', 'All work'],
              ['articles', 'Articles'],
              ['reviews', 'Reviews'],
              ...((isPublisher || showAll) ? [['publishing', 'Publishing'] as [DashboardView, string]] : []),
            ] as Array<[DashboardView, string]>).map(([value, label]) => (
              <button key={value} type="button" className={view === value ? 'is-active' : ''} onClick={() => changeView(value)}>{label}</button>
            ))}
          </div>
          <label className="dashboard-filter">
            <span>State</span>
            <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value as DashboardStateFilter)}>
              {currentStateOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <ChevronDown aria-hidden="true" />
          </label>
          <label className="dashboard-filter">
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <ChevronDown aria-hidden="true" />
          </label>
          <label className="dashboard-filter">
            <span>Sort</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as DashboardSort)}>
              <option value="recent">Most recent</option>
              <option value="title">Title A–Z</option>
              <option value="state">Workflow state</option>
            </select>
            <ChevronDown aria-hidden="true" />
          </label>
          <button type="button" className="clear-filters" disabled={!filtersActive} onClick={clearFilters}>Clear filters</button>
        </div>

        <div className="dashboard-results" aria-live="polite">
          <span><strong>{scopedArticles.length}</strong> articles</span>
          <span><strong>{scopedAssignments.length}</strong> review items</span>
          {filtersActive && <em>Filtered view</em>}
          <span className={`dashboard-live-status${liveRefreshError ? ' is-error' : ''}`} title={liveRefreshError || 'Dashboard data updates automatically'}>
            <span className={`dashboard-live-dot${liveRefreshBusy ? ' is-refreshing' : ''}`} aria-hidden="true" />
            {liveRefreshError || (liveRefreshBusy
              ? 'Updating live data…'
              : `Live · updated ${formatClockTime(updatedAt)}${hasActivePublicationJobs ? ' · every 5s' : ''}`)}
          </span>
        </div>
      </section>

      {(dashboardNotice || dashboardError) && (
        <p className={`dashboard-alert${dashboardError ? ' is-error' : ''}`}>{dashboardError || dashboardNotice}</p>
      )}

      <section className="metric-strip" aria-label="Editorial work summary">
        <DashboardMetric icon={<Inbox />} value={inboxAssignments.length} label="Review inbox" detail={`${assignedToMeCount} assigned · ${sharedQueueCount} queue`} active={view === 'reviews' && stateFilter === 'all'} onClick={() => { changeView('reviews'); setStateFilter('all') }} />
        <DashboardMetric icon={<FileText />} value={workArticles.length} label="Active articles" detail={`${changesRequestedCount} changes requested`} active={view === 'articles' && stateFilter === 'all'} onClick={() => { changeView('articles'); setStateFilter('all') }} />
        <DashboardMetric icon={<History />} value={reviewHistory.length} label="Review history" detail="Closed decisions" active={view === 'reviews' && stateFilter === 'closed'} onClick={() => { changeView('reviews'); setStateFilter('closed') }} />
        <DashboardMetric
          icon={<ClipboardCheck />}
          value={approvedCount}
          label={approvedLabel}
          detail={reviewerOnly ? 'Approved decisions' : 'Ready for next step'}
          active={view === (reviewerOnly ? 'reviews' : 'publishing') && stateFilter === 'approved'}
          onClick={() => { changeView(reviewerOnly ? 'reviews' : 'publishing'); setStateFilter('approved') }}
        />
      </section>

      <div className="dashboard-grid">
        {showReviewPanels && (
          <DashboardPanel title="Review inbox" icon={<Inbox />} empty={inboxAssignments.length === 0} emptyMessage={emptyMessage} aside={<span>{inboxAssignments.length} items · {sharedQueueCount} queue</span>}>
            <ul className="dashboard-list">
              {inboxAssignments.map((assignment) => (
                <DashboardRow key={assignment.id} assignment={assignment} article={articlesById.get(assignment.articleId)} />
              ))}
            </ul>
          </DashboardPanel>
        )}

        {showArticlePanels && (
          <DashboardPanel title={view === 'articles' ? 'All articles' : 'Article work'} icon={<FileText />} empty={articlePanelItems.length === 0} emptyMessage={emptyMessage} aside={<span>{articlePanelItems.length} {view === 'articles' ? 'shown' : 'active'}</span>}>
            <ul className="dashboard-list">
              {articlePanelItems.map((article) => (
                <ArticleStatusRow key={article.id} article={article} />
              ))}
            </ul>
          </DashboardPanel>
        )}

        {showPublishingPanels && (isPublisher || showAll) && (
          <DashboardPanel title="Publishing queue" icon={<Send />} empty={publishingQueue.length === 0} emptyMessage={emptyMessage} aside={<span>{publishingQueue.length} ready</span>}>
            <ul className="dashboard-list">
              {publishingQueue.map((article) => (
                <ArticleStatusRow
                  key={article.id}
                  article={article}
                  statusOverride={publicationPending(article.id) ? 'Processing' : undefined}
                  note={publicationPending(article.id)
                    ? `${displayLookup(article.primaryAuthor)} · Catalyst is processing this revision`
                    : article.workflowState === 'Scheduled'
                    ? `${displayLookup(article.primaryAuthor)} · scheduled ${formatShortDate(article.scheduledAt)}`
                    : `${displayLookup(article.primaryAuthor)} · ready for publisher action`}
                  secondaryAction={article.workflowState === 'Approved' && !publicationPending(article.id) ? {
                    label: 'Publish',
                    disabled: publishBusyId !== '' || scheduleBusy,
                    onClick: () => void publishArticle(article),
                    busyLabel: 'Publishing',
                  } : undefined}
                  tertiaryAction={article.workflowState === 'Approved' && !publicationPending(article.id) ? {
                    label: 'Schedule',
                    disabled: publishBusyId !== '' || scheduleBusy,
                    onClick: () => openScheduleDialog(article),
                    icon: <CalendarClock />,
                  } : undefined}
                  secondaryBusy={publishBusyId === article.id}
                />
              ))}
            </ul>
          </DashboardPanel>
        )}

        {(showArticlePanels || showPublishingPanels) && (stateFilter === 'published' || publishedArticles.length > 0 || view === 'publishing') && (
          <DashboardPanel title="Published articles" icon={<Check />} empty={publishedArticles.length === 0} emptyMessage={emptyMessage} aside={<span>{publishedArticles.length} published</span>}>
            <ul className="dashboard-list">
              {publishedArticles.map((article) => (
                <ArticleStatusRow
                  key={article.id}
                  article={article}
                  statusOverride={publicationPending(article.id) ? 'Processing' : undefined}
                  note={publicationPending(article.id)
                    ? `${displayLookup(article.primaryAuthor)} · Catalyst is processing the retraction`
                    : `${displayLookup(article.primaryAuthor)} · published ${formatShortDate(article.lastPublishedAt)}`}
                  secondaryAction={(isPublisher || showAll) && !publicationPending(article.id) ? {
                    label: 'Retract',
                    disabled: retractBusy || publishBusyId !== '' || scheduleBusy,
                    onClick: () => openRetractDialog(article),
                    icon: <EyeOff />,
                  } : undefined}
                  secondaryBusy={retractBusy && retractArticleTarget?.id === article.id}
                />
              ))}
            </ul>
          </DashboardPanel>
        )}

        {(showArticlePanels || showPublishingPanels) && (stateFilter === 'unpublished' || unpublishedArticles.length > 0) && (
          <DashboardPanel title="Retracted articles" icon={<EyeOff />} empty={unpublishedArticles.length === 0} emptyMessage={emptyMessage} aside={<span>{unpublishedArticles.length} retracted</span>}>
            <ul className="dashboard-list">
              {unpublishedArticles.map((article) => (
                <ArticleStatusRow
                  key={article.id}
                  article={article}
                  note={`${displayLookup(article.primaryAuthor)} · immutable publication retained`}
                />
              ))}
            </ul>
          </DashboardPanel>
        )}

        {showReviewPanels && (
          <DashboardPanel title="Review history" icon={<History />} empty={reviewHistory.length === 0} emptyMessage={emptyMessage} aside={<span>{reviewHistory.length} closed</span>}>
            <ul className="history-list">
              {reviewHistory.map((assignment) => (
                <ReviewHistoryRow key={assignment.id} assignment={assignment} article={articlesById.get(assignment.articleId)} />
              ))}
            </ul>
          </DashboardPanel>
        )}

        {showAll && view === 'all' && (
          <AdminOverview
            queuedCount={validAssignments.filter((assignment) => activeReviewAssignment(assignment, articlesById.get(assignment.articleId)) && assignment.status === 'Queued').length}
            inReviewCount={data.articles.filter((article) => article.workflowState === 'In Review').length}
            changesRequestedCount={data.articles.filter((article) => article.workflowState === 'Changes Requested').length}
            approvedCount={data.articles.filter((article) => article.workflowState === 'Approved').length}
          />
        )}

        {view === 'all' && <ActivityTimeline articles={visibleArticles} assignments={scopedAssignments} auditEvents={visibleAuditEvents} />}
      </div>

      {createOpen && (
        <div className="dialog-backdrop" role="presentation">
          <section className="review-dialog new-article-dialog" role="dialog" aria-modal="true" aria-labelledby="new-article-title">
            <header>
              <div>
                <h2 id="new-article-title">New article</h2>
                <p>Create a draft and open it in the editor.</p>
              </div>
              <button className="icon-command" type="button" title="Close" aria-label="Close" disabled={createBusy} onClick={() => setCreateOpen(false)}><X /></button>
            </header>
            <div className="review-dialog-body">
              <label className="field-label">
                Working title
                <input
                  value={createTitle}
                  maxLength={250}
                  autoFocus
                  onChange={(event) => setCreateTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && createTitle.trim() && createPolicyId) void createArticle()
                  }}
                />
              </label>
              <label className="field-label">
                Category
                <select value={createCategoryId} onChange={(event) => setCreateCategoryId(event.target.value)}>
                  <option value="">None</option>
                  {data.categories.map((category) => (
                    <option key={category.ID} value={category.ID}>{displayLookup(category)}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Approval policy
                <select value={createPolicyId} onChange={(event) => setCreatePolicyId(event.target.value)}>
                  {data.approvalPolicies.map((policy) => (
                    <option key={policy.ID} value={policy.ID}>{displayLookup(policy)}</option>
                  ))}
                </select>
              </label>
              {createError && <p className="dialog-error">{createError}</p>}
            </div>
            <footer>
              <button type="button" className="secondary-command" disabled={createBusy} onClick={() => openNewArticleForm()}>
                Open full form
              </button>
              <button type="button" className="secondary-command" disabled={createBusy} onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="button" className="submit-review-command" disabled={createBusy || !createTitle.trim() || !createPolicyId} onClick={() => void createArticle()}>
                <Plus /> Create and open
              </button>
            </footer>
          </section>
        </div>
      )}

      {scheduleArticleTarget && (
        <div className="dialog-backdrop" role="presentation">
          <section className="review-dialog new-article-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-article-title">
            <header>
              <div>
                <h2 id="schedule-article-title">Schedule article</h2>
                <p>{scheduleArticleTarget.workingTitle}</p>
              </div>
              <button className="icon-command" type="button" title="Close" aria-label="Close" disabled={scheduleBusy} onClick={() => setScheduleArticleTarget(null)}><X /></button>
            </header>
            <div className="review-dialog-body">
              <label className="field-label">
                Publish at
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  min={formatDateTimeLocal(new Date())}
                  onChange={(event) => setScheduleAt(event.target.value)}
                />
              </label>
              {scheduleError && <p className="dialog-error">{scheduleError}</p>}
            </div>
            <footer>
              <button type="button" className="secondary-command" disabled={scheduleBusy} onClick={() => setScheduleArticleTarget(null)}>
                Cancel
              </button>
              <button type="button" className="submit-review-command" disabled={scheduleBusy || !scheduleAt} onClick={() => void scheduleApprovedArticle()}>
                <CalendarClock /> {scheduleBusy ? 'Scheduling' : 'Schedule'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {retractArticleTarget && (
        <div className="dialog-backdrop" role="presentation">
          <section className="review-dialog new-article-dialog" role="dialog" aria-modal="true" aria-labelledby="retract-article-title">
            <header>
              <div>
                <h2 id="retract-article-title">Retract published article</h2>
                <p>{retractArticleTarget.workingTitle}</p>
              </div>
              <button className="icon-command" type="button" title="Close" aria-label="Close" disabled={retractBusy} onClick={() => setRetractArticleTarget(null)}><X /></button>
            </header>
            <div className="review-dialog-body">
              <p>This stops public serving but preserves the immutable publication and audit history.</p>
              <label className="field-label">
                Reason
                <textarea maxLength={1000} rows={4} value={retractReason} onChange={(event) => setRetractReason(event.target.value)} placeholder="Explain why this article must be withdrawn." />
              </label>
              <label className="field-label">
                Replacement path <span>(optional)</span>
                <input maxLength={255} value={replacementPath} onChange={(event) => setReplacementPath(event.target.value)} placeholder="/insights/replacement-article" />
              </label>
              {retractError && <p className="dialog-error">{retractError}</p>}
            </div>
            <footer>
              <button type="button" className="secondary-command" disabled={retractBusy} onClick={() => setRetractArticleTarget(null)}>Cancel</button>
              <button type="button" className="submit-review-command danger-command" disabled={retractBusy || retractReason.trim().length < 3} onClick={() => void retractPublishedArticle()}>
                <EyeOff /> {retractBusy ? 'Retracting' : 'Retract article'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  )
}

function App() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [dashboardUpdatedAt, setDashboardUpdatedAt] = useState(0)
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null)
  const [revision, setRevision] = useState<Revision | null>(null)
  const [loadingError, setLoadingError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [changeVersion, setChangeVersion] = useState(0)
  const [preview, setPreview] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [recovery, setRecovery] = useState<SaveRevisionInput | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewMode, setReviewMode] = useState<'reviewers' | 'queue'>('reviewers')
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([])
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [reviewActionOpen, setReviewActionOpen] = useState(false)
  const [reviewActionBusy, setReviewActionBusy] = useState(false)
  const [reviewActionError, setReviewActionError] = useState('')
  const revisionRef = useRef<Revision | null>(null)
  const changeVersionRef = useRef(0)
  const savePromiseRef = useRef<Promise<boolean> | null>(null)
  const saveQueuedRef = useRef(false)
  const titleTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const dashboardRefreshPromiseRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [articleId, revisionId] = await Promise.all([
          repository.resolveArticleId(),
          repository.resolveRevisionId(),
        ])
        if (!articleId) {
          const data = await repository.loadDashboard()
          if (!active) return
          setDashboard(data)
          setDashboardUpdatedAt(Date.now())
          return
        }
        const data = await repository.loadWorkspace(articleId, revisionId)
        if (!active) return
        setDashboard(null)
        setWorkspace(data)
        setRevision(data.revision)
        revisionRef.current = data.revision
        const stored = localStorage.getItem(recoveryKey(data.revision.id))
        if (stored && canEditArticle(data.article, data.review.currentEmployee)
          && data.revision.state === 'Draft'
          && (data.article.workflowState === 'Draft' || data.article.workflowState === 'Changes Requested')) {
          try {
            const parsed = JSON.parse(stored) as SaveRevisionInput
            if (parsed.id === data.revision.id) setRecovery(parsed)
          } catch {
            localStorage.removeItem(recoveryKey(data.revision.id))
          }
        }
      } catch (error) {
        if (active) setLoadingError(errorMessage(error, 'The workspace could not be loaded.'))
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const refreshDashboard = useCallback((): Promise<void> => {
    if (dashboardRefreshPromiseRef.current) return dashboardRefreshPromiseRef.current
    const operation = repository.loadDashboard()
      .then((data) => {
        setDashboard(data)
        setDashboardUpdatedAt(Date.now())
      })
      .finally(() => {
        if (dashboardRefreshPromiseRef.current === operation) dashboardRefreshPromiseRef.current = null
      })
    dashboardRefreshPromiseRef.current = operation
    return operation
  }, [])

  const saveNow = useCallback((): Promise<boolean> => {
    if (savePromiseRef.current) {
      saveQueuedRef.current = true
      return savePromiseRef.current
    }

    const operation = (async () => {
      let succeeded = true
      do {
        saveQueuedRef.current = false
        const current = revisionRef.current
        if (!current) break
        const savingVersion = changeVersionRef.current
        setSaveStatus('saving')
        setSaveError('')
        try {
          const saved = await repository.saveDraft(saveInput(current))
          if (savingVersion === changeVersionRef.current) {
            revisionRef.current = saved
            setRevision(saved)
            setSaveStatus('saved')
            localStorage.removeItem(recoveryKey(saved.id))
            setRecovery(null)
          } else {
            const latest = revisionRef.current
            if (latest) {
              const rebased = {
                ...latest,
                checksum: saved.checksum,
                versionToken: saved.versionToken,
              }
              revisionRef.current = rebased
              setRevision(rebased)
              localStorage.setItem(recoveryKey(rebased.id), JSON.stringify(saveInput(rebased)))
            }
            saveQueuedRef.current = true
          }
        } catch (error) {
          succeeded = false
          setSaveStatus('error')
          setSaveError(errorMessage(error, 'Draft save failed.'))
          saveQueuedRef.current = false
        }
      } while (saveQueuedRef.current)
      return succeeded
    })()
    savePromiseRef.current = operation
    void operation.finally(() => {
      savePromiseRef.current = null
    })
    return operation
  }, [])

  useEffect(() => {
    if (changeVersion === 0 || !revision) return
    const timer = window.setTimeout(() => void saveNow(), 1400)
    return () => window.clearTimeout(timer)
  }, [changeVersion, saveNow])

  useEffect(() => {
    const textarea = titleTextareaRef.current
    if (!textarea) return
    const resize = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [revision?.title, inspectorOpen])

  const updateRevision = useCallback((changes: Partial<Revision>) => {
    const current = revisionRef.current
    if (!current) return
    const next = { ...current, ...changes }
    revisionRef.current = next
    setRevision(next)
    localStorage.setItem(recoveryKey(next.id), JSON.stringify(saveInput(next)))
    changeVersionRef.current += 1
    setSaveStatus('dirty')
    setChangeVersion(changeVersionRef.current)
  }, [])

  const status = useMemo(() => {
    if (saveStatus === 'saving') return { label: 'Saving', icon: <Cloud className="spin-soft" /> }
    if (saveStatus === 'saved') return { label: 'Saved', icon: <Check /> }
    if (saveStatus === 'error') return { label: 'Save failed', icon: <AlertCircle /> }
    if (saveStatus === 'dirty') return { label: 'Unsaved changes', icon: <Cloud /> }
    return { label: 'Ready', icon: <Check /> }
  }, [saveStatus])

  const submitForReview = useCallback(async () => {
    const currentWorkspace = workspace
    if (!currentWorkspace || !revisionRef.current) return
    setReviewBusy(true)
    setReviewError('')
    setActionMessage('')
    const saved = await saveNow()
    if (!saved) {
      setReviewError('The latest draft could not be saved. Resolve the save error before submitting.')
      setReviewBusy(false)
      return
    }
    try {
      const result = await repository.submitForReview(
        currentWorkspace.article.id,
        reviewMode === 'reviewers' ? selectedReviewerIds : [],
      )
      const submittedRevision = { ...revisionRef.current, state: 'Submitted' as const }
      revisionRef.current = submittedRevision
      setRevision(submittedRevision)
      setWorkspace({
        ...currentWorkspace,
        article: { ...currentWorkspace.article, workflowState: result.state },
        revision: submittedRevision,
      })
      setPreview(true)
      setReviewDialogOpen(false)
      localStorage.removeItem(recoveryKey(submittedRevision.id))
      setRecovery(null)
      setActionMessage(`${result.message} ${result.assignmentIds.length} assignment${result.assignmentIds.length === 1 ? '' : 's'} created.`)
    } catch (error) {
      setReviewError(errorMessage(error, 'The article could not be submitted for review.'))
    } finally {
      setReviewBusy(false)
    }
  }, [reviewMode, saveNow, selectedReviewerIds, workspace])

  const updateReviewAssignment = useCallback((changes: Partial<ReviewAssignment>) => {
    setWorkspace((current) => current?.review.assignment ? {
      ...current,
      review: { ...current.review, assignment: { ...current.review.assignment, ...changes } },
    } : current)
  }, [])

  const claimReview = useCallback(async () => {
    const assignment = workspace?.review.assignment
    const currentEmployee = workspace?.review.currentEmployee
    if (!assignment || !currentEmployee) return
    setReviewActionBusy(true)
    setReviewActionError('')
    try {
      const result = await repository.claimReviewAssignment(assignment.id)
      updateReviewAssignment({ status: 'Claimed', reviewerId: currentEmployee.id, reviewerName: currentEmployee.displayName })
      setActionMessage(result.message)
    } catch (error) {
      setReviewActionError(errorMessage(error, 'The review could not be claimed.'))
    } finally {
      setReviewActionBusy(false)
    }
  }, [updateReviewAssignment, workspace])

  const addReviewComment = useCallback(async (body: string): Promise<boolean> => {
    const assignment = workspace?.review.assignment
    if (!assignment) return false
    setReviewActionBusy(true)
    setReviewActionError('')
    try {
      const comment = await repository.addReviewComment(assignment.id, 'General', body)
      setWorkspace((current) => current ? {
        ...current,
        review: { ...current.review, comments: [...current.review.comments, comment] },
      } : current)
      setActionMessage('Review comment added.')
      return true
    } catch (error) {
      setReviewActionError(errorMessage(error, 'The review comment could not be added.'))
      return false
    } finally {
      setReviewActionBusy(false)
    }
  }, [workspace])

  const recordReviewDecision = useCallback(async (decision: NonNullable<ReviewAssignment['decision']>, summary: string) => {
    const assignment = workspace?.review.assignment
    if (!assignment) return
    setReviewActionBusy(true)
    setReviewActionError('')
    try {
      const result = await repository.recordReviewDecision(assignment.id, decision, summary)
      updateReviewAssignment({ status: decision, decision, decisionSummary: summary })
      setWorkspace((current) => current ? {
        ...current,
        article: {
          ...current.article,
          workflowState: result.articleState || current.article.workflowState,
          activeDraftRevisionId: result.newDraftRevisionId || current.article.activeDraftRevisionId,
        },
      } : current)
      if (result.articleState === 'Approved' && revisionRef.current) {
        const approved = { ...revisionRef.current, state: 'Approved' as const }
        revisionRef.current = approved
        setRevision(approved)
      }
      let message = result.articleState === 'In Review'
        ? `${result.message} ${result.approvedReviewerCount || 0} of ${result.requiredApprovals || 0} approvals recorded.`
        : `${result.message} Article is now ${result.articleState}.`
      if (result.newDraftRevisionNumber) {
        message += ` Draft revision ${result.newDraftRevisionNumber} was created.`
      }
      setActionMessage(message)
      setReviewActionOpen(false)
    } catch (error) {
      setReviewActionError(errorMessage(error, 'The review decision could not be recorded.'))
    } finally {
      setReviewActionBusy(false)
    }
  }, [updateReviewAssignment, workspace])

  if (loadingError) {
    return (
      <main className="state-page">
        <div className="state-symbol error"><AlertCircle /></div>
        <h1>Workspace unavailable</h1>
        <p>{loadingError}</p>
        <button type="button" onClick={() => window.location.reload()}><RotateCcw /> Retry</button>
      </main>
    )
  }

  if (!workspace || !revision) {
    if (dashboard) return <EditorialDashboard data={dashboard} onRefresh={refreshDashboard} updatedAt={dashboardUpdatedAt} />
    return (
      <main className="loading-page" aria-label="Loading editorial workspace">
        <div className="loading-top" />
        <div className="loading-grid">
          <div className="loading-canvas"><div /><div /><div /><div /></div>
          <div className="loading-side"><div /><div /><div /></div>
        </div>
      </main>
    )
  }

  const editable = canEditArticle(workspace.article, workspace.review.currentEmployee)
    && (workspace.article.workflowState === 'Draft' || workspace.article.workflowState === 'Changes Requested')
    && revision.state === 'Draft'

  const restoreRecovery = async () => {
    if (!recovery) return
    try {
      const document = await repository.hydrateDocument(recovery.document)
      const { expectedChecksum, expectedVersionToken, ...recoveredFields } = recovery
      const restored = revisionRef.current
        ? {
          ...revisionRef.current,
          ...recoveredFields,
          checksum: revisionRef.current.checksum || expectedChecksum || undefined,
          versionToken: revisionRef.current.versionToken || expectedVersionToken,
          document,
        }
        : null
      revisionRef.current = restored
      setRevision(restored)
      setRecovery(null)
      setSaveError('')
      setSaveStatus('dirty')
      changeVersionRef.current += 1
      setChangeVersion(changeVersionRef.current)
    } catch (error) {
      setSaveError(errorMessage(error, 'The local recovery copy is damaged and could not be restored.'))
    }
  }

  return (
    <div className={`workspace${inspectorOpen ? '' : ' inspector-closed'}`}>
      <header className="workspace-header">
        <div className="header-left">
          <button className="icon-command" type="button" title="Back" aria-label="Back" onClick={() => window.history.back()}>
            <ArrowLeft />
          </button>
          <div className="brand-mark" aria-hidden="true">G</div>
          <div className="document-identity">
            <strong>GeneDrift Insights</strong>
            <span>{workspace.article.workflowState}</span>
          </div>
        </div>

        <div className={`save-state is-${saveStatus}`} aria-live="polite">
          {status.icon}<span>{status.label}</span>
        </div>

        <div className="header-actions">
          <button className="icon-command" type="button" title={preview ? 'Exit preview' : 'Preview'} aria-label={preview ? 'Exit preview' : 'Preview'} onClick={() => setPreview((value) => !value)}>
            {preview ? <EyeOff /> : <Eye />}
          </button>
          <button className="icon-command" type="button" title={inspectorOpen ? 'Hide inspector' : 'Show inspector'} aria-label={inspectorOpen ? 'Hide inspector' : 'Show inspector'} onClick={() => setInspectorOpen((value) => !value)}>
            {inspectorOpen ? <PanelRightClose /> : <PanelRightOpen />}
          </button>
          <button className="save-command" type="button" disabled={!editable || saveStatus === 'saving'} onClick={() => void saveNow()}>
            <Save /> Save draft
          </button>
          {editable && (
            <button className="submit-review-command header-submit" type="button" disabled={reviewBusy} onClick={() => {
              setReviewError('')
              setReviewDialogOpen(true)
            }}>
              <Send /> Submit for review
            </button>
          )}
          {workspace.article.workflowState === 'In Review'
            && workspace.review.assignment
            && ACTIVE_ASSIGNMENT_STATES.has(workspace.review.assignment.status)
            && workspace.review.canReview && (
            <button className="submit-review-command header-submit" type="button" onClick={() => {
              setReviewActionError('')
              setReviewActionOpen(true)
            }}>
              <ClipboardCheck /> Review
            </button>
            )}
        </div>
      </header>

      {recovery && (
        <div className="recovery-banner">
          <span><RotateCcw /> A local recovery copy is available. Restoring replaces the current draft fields.</span>
          <div>
            <button type="button" onClick={() => {
              localStorage.removeItem(recoveryKey(revision.id))
              setRecovery(null)
            }}>Discard</button>
            <button type="button" onClick={() => void restoreRecovery()}>Restore</button>
          </div>
        </div>
      )}

      {saveError && (
        <div className="error-banner" role="alert"><AlertCircle /> {saveError}</div>
      )}

      {actionMessage && (
        <div className="success-banner" role="status"><Check /> {actionMessage}</div>
      )}

      <main className="workspace-main">
        <section className="document-column">
          <div className="title-area">
            <textarea
              ref={titleTextareaRef}
              className="article-title"
              aria-label="Article title"
              value={revision.title}
              maxLength={250}
              rows={1}
              readOnly={preview || !editable}
              onChange={(event) => {
                const title = event.target.value
                const shouldUpdateSlug = revision.slug === slugify(revision.title)
                updateRevision({ title, ...(shouldUpdateSlug ? { slug: slugify(title) } : {}) })
              }}
            />
            <div className="slug-row">
              <span>/insights/</span>
              <input
                aria-label="Article slug"
                value={revision.slug}
                maxLength={180}
                readOnly={preview || !editable}
                onChange={(event) => updateRevision({ slug: slugify(event.target.value) })}
              />
            </div>
          </div>

          <ArticleEditor
            initialDocument={revision.document}
            revisionNumber={revision.number}
            preview={preview || !editable}
            onChange={(document) => {
              const metrics = metricsFor(document)
              updateRevision({ document, ...metrics })
            }}
            onCreateImage={(file: File, metadata: MediaMetadata) => repository.createImageAsset(
              file,
              metadata,
              workspace.review.currentEmployee?.id || workspace.article.owner.ID || workspace.article.primaryAuthor.ID,
            )}
            onUpdateImage={(asset: MediaAsset, metadata: MediaMetadata) => repository.updateImageAsset(asset, metadata)}
          />
        </section>

        {inspectorOpen && (
          <Inspector
            article={workspace.article}
            revision={revision}
            readOnly={!editable}
            onChange={updateRevision}
            onCreateImage={(file, metadata) => repository.createImageAsset(
              file,
              metadata,
              workspace.review.currentEmployee?.id || workspace.article.owner.ID || workspace.article.primaryAuthor.ID,
            )}
            onUpdateImage={(asset, metadata) => repository.updateImageAsset(asset, metadata)}
          />
        )}
      </main>

      <footer className="workspace-footer">
        <span>{revision.wordCount} words</span>
        <span>{revision.readingTimeMinutes || 0} min read</span>
        <span className="environment-label">{workspace.source === 'creator' ? 'Creator connected' : 'Local preview'}</span>
      </footer>


      <SubmitReviewDialog
        open={reviewDialogOpen}
        approvalPolicy={workspace.article.approvalPolicy.zc_display_value || workspace.article.approvalPolicy.display_value || 'Configured approval policy'}
        reviewers={workspace.eligibleReviewers}
        selectedIds={selectedReviewerIds}
        mode={reviewMode}
        busy={reviewBusy}
        error={reviewError}
        onModeChange={setReviewMode}
        onSelectionChange={setSelectedReviewerIds}
        onClose={() => !reviewBusy && setReviewDialogOpen(false)}
        onSubmit={() => void submitForReview()}
      />
      {workspace.review.assignment && (
        <ReviewActionDialog
          open={reviewActionOpen}
          assignment={workspace.review.assignment}
          comments={workspace.review.comments}
          currentEmployee={workspace.review.currentEmployee}
          busy={reviewActionBusy}
          error={reviewActionError}
          onClose={() => !reviewActionBusy && setReviewActionOpen(false)}
          onClaim={() => void claimReview()}
          onComment={addReviewComment}
          onDecision={(decision: NonNullable<ReviewAssignment['decision']>, summary: string) => void recordReviewDecision(decision, summary)}
        />
      )}
    </div>
  )
}

export default App

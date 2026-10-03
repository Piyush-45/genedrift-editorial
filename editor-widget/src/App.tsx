import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Globe,
  PenLine,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
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
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import type { Article, AuditEvent, CurrentEmployee, DashboardData, LookupValue, MediaAsset, MediaMetadata, PublicationJob, ReviewAssignment, ReviewComment, ReviewFeedback, Revision, SaveRevisionInput, TaxonomyKind, WorkspaceData } from './domain'
import { ArticleEditor } from './components/ArticleEditor'
import { Avatar, EmptyState, Section, SidePanel, StageBadge, Stepper, When, absoluteTime, hasLiveVersionBehind, relativeTime, stageOf } from './dashboard/parts'
import type { StageTone } from './dashboard/parts'
import './dashboard/dashboard.css'
import { Inspector } from './components/Inspector'
import { DialogFrame } from './components/DialogFrame'
import { SubmitReviewDialog } from './components/SubmitReviewDialog'
import { ReviewActionDialog } from './components/ReviewActionDialog'
import { createRepository } from './repository'
import { canonicalizeMedia } from './media'
import { createRecoveryStorage, parseRecovery } from './recovery'
import { documentText, errorMessage, formatProductTimestamp, formatRefreshTimestamp, metricsFor, parseProductTimestamp, slugify } from './utils'

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
type ActionOutcome = {
  title: string
  message: string
  dashboardLabel: string
  floating?: boolean
  nextReview?: { articleId: string; revisionId: string }
}

type FloatingNoticeState = {
  id: number
  tone: 'success' | 'error'
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

const repository = createRepository()

function recoveryKey(revisionId: string) {
  return `genedrift:recovery:${revisionId}`
}

function saveInput(revision: Revision, article?: Article, saveTaxonomy = false): SaveRevisionInput {
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
    primaryCategoryId: article?.primaryCategory?.ID,
    tagIds: article?.tags.map((tag) => tag.ID).filter(Boolean) || [],
    saveTaxonomy,
  }
}

const CLOSED_ASSIGNMENT_STATES = new Set<ReviewAssignment['status']>(['Approved', 'Changes Requested', 'Rejected', 'Cancelled'])
const ACTIVE_ASSIGNMENT_STATES = new Set<ReviewAssignment['status']>(['Queued', 'Assigned', 'Claimed'])
const WORKING_ARTICLE_STATES = new Set(['Draft', 'Changes Requested', 'In Review'])
const CREATOR_APP_SLUG = 'genedrift-editorial-platform'
const ACTIVE_PUBLICATION_REFRESH_MS = 30_000
const IDLE_DASHBOARD_REFRESH_MS = 60_000
const RESET_TEST_CONTENT_CONFIRMATION = 'RESET TEST CONTENT'

type DashboardStateFilter = 'all' | 'draft' | 'in-review' | 'changes-requested' | 'approved' | 'scheduled' | 'published' | 'unpublished' | 'archived' | 'queued' | 'assigned' | 'claimed' | 'closed'
type DashboardView = 'all' | 'articles' | 'reviews' | 'publishing' | 'archive'
type DashboardSort = 'recent' | 'title' | 'state'
type DashboardDateFilter = 'all' | 'today' | 'week'

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
  archive: [
    { value: 'archived', label: 'Trash' },
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
  return formatProductTimestamp(value)
}

function formatDashboardDateTime(value?: string) {
  return formatProductTimestamp(value)
}

function formatClockTime(value?: number) {
  return formatRefreshTimestamp(value)
}

function formatRefreshInterval(value: number) {
  return value >= 60_000 ? `${Math.round(value / 60_000)}m` : `${Math.round(value / 1000)}s`
}

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function timestampValue(value?: string) {
  return parseProductTimestamp(value)
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
  for (const candidate of [document.referrer, window.location.href]) {
    try {
      const url = new URL(candidate)
      const segments = url.pathname.split('/').filter(Boolean)
      const appIndex = segments.indexOf(CREATOR_APP_SLUG)
      if (appIndex >= 0) {
        return `${url.origin}/${segments.slice(0, appIndex + 1).join('/')}/`
      }
    } catch {
      // Try the next possible Creator URL source.
    }
  }
  return undefined
}

function creatorNavigationUrl(fragment: string) {
  const baseUrl = creatorParentBaseUrl()
  return baseUrl ? `${baseUrl}${fragment}` : fragment
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
    navigateParent(creatorNavigationUrl(`#Page:Article_Workspace?articleId=${encodeURIComponent(articleId)}${revisionQuery}`))
    return
  }
  window.location.href = `${window.location.pathname}?articleId=${encodeURIComponent(articleId)}${revisionQuery}`
}

function openNewArticleForm() {
  if (repository.source === 'creator') {
    navigateParent(creatorNavigationUrl('#Form:Articles'))
    return
  }
  window.location.reload()
}

function openDashboard() {
  if (repository.source === 'creator') {
    navigateParent(creatorNavigationUrl('#Page:Article_Workspace'))
    return
  }
  window.location.href = window.location.pathname
}

function defaultApprovalPolicyId(data: DashboardData) {
  return data.approvalPolicies.find((policy) => policy.isDefault)?.ID
    || data.approvalPolicies.find((policy) => displayLookup(policy) === 'Standard Review')?.ID
    || data.approvalPolicies[0]?.ID
    || ''
}

function approvalPolicySummary(data: DashboardData, policyId: string) {
  const policy = data.approvalPolicies.find((item) => item.ID === policyId)
  if (!policy) return ''
  const approvals = policy.requiredApprovals > 0
    ? `${policy.requiredApprovals} distinct approval${policy.requiredApprovals === 1 ? '' : 's'}`
    : ''
  return [approvals, policy.description].filter(Boolean).join(' · ')
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

function latestArticleEvent(article: Article, auditEvents: AuditEvent[], eventTypes: string[]) {
  const wanted = new Set(eventTypes.map((eventType) => eventType.toLowerCase()))
  return auditEvents
    .filter((event) => event.entityUuid === article.uuid && wanted.has(event.eventType.toLowerCase()))
    .sort((a, b) => timestampValue(b.occurredAt) - timestampValue(a.occurredAt))[0]
}

function approvedReviewerNames(article: Article, assignments: ReviewAssignment[]) {
  const names = assignments
    .filter((assignment) => assignment.articleId === article.id && assignment.status === 'Approved')
    .sort((a, b) => timestampValue(b.decidedAt) - timestampValue(a.decidedAt))
    .map((assignment) => assignment.reviewerName || 'Reviewer')
    .filter(Boolean)
  return Array.from(new Set(names))
}

function compactText(value?: string) {
  return (value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function visibleFeedbackComments(entry: { reviewerName: string; decisionSummary: string; comments: ReviewComment[] }) {
  const summary = compactText(entry.decisionSummary)
  if (!summary) return entry.comments.filter((comment) => compactText(comment.body))
  return entry.comments.filter((comment) => {
    const body = compactText(comment.body)
    if (!body) return false
    const sameAuthor = compactText(comment.authorName) === compactText(entry.reviewerName)
    const sameDecisionNote = body === summary && (sameAuthor || comment.type === 'Change Request')
    return !sameDecisionNote
  })
}

function reviewFeedbackHasVisibleContent(entry: ReviewFeedback) {
  return Boolean(compactText(entry.decisionSummary) || visibleFeedbackComments(entry).length)
}

function readinessMissing(article: Article, revision: Revision) {
  const category = displayLookup(article.primaryCategory)
  return [
    revision.wordCount < 1 && 'Article content',
    !revision.excerpt.trim() && 'Excerpt',
    (!category || category === 'Unassigned') && 'Category',
    !revision.featuredMediaId && 'Cover image',
    revision.featuredMediaId && !revision.featuredMedia?.altText.trim() && 'Cover alt text',
    !revision.seoTitle.trim() && 'SEO title',
    !revision.slug.trim() && 'Slug',
  ].filter(Boolean) as string[]
}

function latestArticleTime(article: Article, activity?: number) {
  return Math.max(
    activity || 0,
    timestampValue(article.lastPublishedAt),
    timestampValue(article.scheduledAt),
  )
}

function compareRecordIdsNewestFirst(a: string, b: string) {
  if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) return 0
  const normalizedA = a.replace(/^0+/, '') || '0'
  const normalizedB = b.replace(/^0+/, '') || '0'
  return normalizedB.length - normalizedA.length || normalizedB.localeCompare(normalizedA)
}

function withinDashboardDateFilter(timestamp: number, filter: DashboardDateFilter) {
  if (filter === 'all') return true
  if (!timestamp) return false
  const now = Date.now()
  if (filter === 'today') return new Date(timestamp).toDateString() === new Date(now).toDateString()
  if (filter === 'week') return timestamp >= now - 7 * 24 * 60 * 60 * 1000
  return true
}

function matchesPersonFilter(values: string[], personFilter: string) {
  if (personFilter === 'all') return true
  const target = normalizedIdentity(personFilter)
  return values.some((value) => normalizedIdentity(value) === target)
}

function workflowAttributionLine({
  article,
  assignments,
  auditEvents,
  activeJob,
  statusText,
}: {
  article: Article
  assignments: ReviewAssignment[]
  auditEvents: AuditEvent[]
  activeJob?: PublicationJob
  statusText: string
}) {
  const author = displayLookup(article.primaryAuthor)
  const reviewers = approvedReviewerNames(article, assignments)
  const publishEvent = latestArticleEvent(article, auditEvents, [
    'Catalyst Article Published',
    'Publication Queued',
    'Article Scheduled',
  ])
  const actor = activeJob?.requestedBy ? displayLookup(activeJob.requestedBy) : publishEvent?.actorName || ''
  const reviewerText = reviewers.length ? `approved by ${reviewers.slice(0, 2).join(', ')}${reviewers.length > 2 ? ` +${reviewers.length - 2}` : ''}` : ''
  const actorText = actor ? `published by ${actor}` : ''
  const when = formatShortDate(article.lastPublishedAt || article.scheduledAt)
  return [
    author,
    reviewerText,
    actorText,
    statusText,
    when,
  ].filter(Boolean).join(' · ').replace(/^(.+?) · approved by/, '$1 → approved by')
}

function workflowFactLines({
  article,
  assignments,
  auditEvents,
  activeJob,
  includePublisher = false,
  publisherLabel = 'Published by',
  includeRetraction = false,
}: {
  article: Article
  assignments: ReviewAssignment[]
  auditEvents: AuditEvent[]
  activeJob?: PublicationJob
  includePublisher?: boolean
  publisherLabel?: string
  includeRetraction?: boolean
}) {
  const author = displayLookup(article.primaryAuthor)
  const reviewers = approvedReviewerNames(article, assignments)
  const publishEvent = latestArticleEvent(article, auditEvents, [
    'Catalyst Article Published',
    'Publication Queued',
    'Article Scheduled',
  ])
  const retractionEvent = latestArticleEvent(article, auditEvents, [
    'Retraction Queued',
    'Catalyst Article Retracted',
  ])
  const publisher = activeJob?.requestedBy ? displayLookup(activeJob.requestedBy) : publishEvent?.actorName || ''
  const retractedBy = retractionEvent?.actorName || ''
  return [
    author && `Written by ${author}`,
    reviewers.length > 0 && `Approved by ${reviewers.slice(0, 2).join(', ')}${reviewers.length > 2 ? ` +${reviewers.length - 2}` : ''}`,
    includePublisher && publisher && `${publisherLabel} ${publisher}`,
    includeRetraction && retractedBy && `Retracted by ${retractedBy}`,
  ].filter(Boolean) as string[]
}

function articlePanelNote(article: Article) {
  const author = displayLookup(article.primaryAuthor)
  const category = displayLookup(article.primaryCategory)
  if (article.workflowState === 'Scheduled') {
    return [author, `scheduled ${formatDashboardDateTime(article.scheduledAt)}`].filter(Boolean).join(' · ')
  }
  if (article.workflowState === 'Published') {
    return [author, `published ${formatDashboardDateTime(article.lastPublishedAt)}`].filter(Boolean).join(' · ')
  }
  if (article.workflowState === 'Unpublished') {
    return [author, 'unpublished · audit retained'].filter(Boolean).join(' · ')
  }
  if (article.workflowState === 'Approved') {
    return [author, 'approved · waiting for publisher'].filter(Boolean).join(' · ')
  }
  if (article.workflowState === 'Changes Requested') {
    return [author, 'changes requested'].filter(Boolean).join(' · ')
  }
  if (article.workflowState === 'Draft' && article.publishedRevisionId) {
    return [author, 'new version in progress · published version unchanged'].filter(Boolean).join(' · ')
  }
  if (article.workflowState === 'In Review') {
    return [author, 'waiting for reviewer decision'].filter(Boolean).join(' · ')
  }
  return [author, category].filter(Boolean).join(' · ')
}

function articlePanelStatusDetail(article: Article) {
  if (article.workflowState === 'Archived') return 'Stored safely with revisions and audit history intact.'
  if (article.workflowState === 'Scheduled') return `Scheduled for ${formatDashboardDateTime(article.scheduledAt)}`
  if (article.workflowState === 'Published') return `Published ${formatDashboardDateTime(article.lastPublishedAt)}`
  if (article.workflowState === 'Unpublished') return 'Removed from public listings. Audit history is retained.'
  if (article.workflowState === 'Approved') return 'Approved and waiting for publisher action.'
  if (article.workflowState === 'Changes Requested') return 'Back with the author for revision.'
  if (article.workflowState === 'In Review') return 'Submitted and waiting on reviewer decision.'
  return ''
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

function WorkflowOutcome({ outcome, onDismiss }: { outcome: ActionOutcome; onDismiss: () => void }) {
  return (
    <section className="workflow-outcome" role="status" aria-live="polite">
      <span className="workflow-outcome-icon" aria-hidden="true"><Check /></span>
      <div>
        <strong>{outcome.title}</strong>
        <p>{outcome.message}</p>
      </div>
      <div className="workflow-outcome-actions">
        <button type="button" className="secondary-command" onClick={onDismiss}>Continue viewing</button>
        {outcome.nextReview && (
          <button type="button" className="secondary-command" onClick={() => openWorkspaceArticle(outcome.nextReview!.articleId, outcome.nextReview!.revisionId)}>
            <ClipboardCheck /> Review next
          </button>
        )}
        <button type="button" className="submit-review-command" onClick={openDashboard}>
          <LayoutDashboard /> {outcome.dashboardLabel}
        </button>
      </div>
    </section>
  )
}

function FloatingNotice({ notice, onDismiss }: { notice: FloatingNoticeState; onDismiss: () => void }) {
  return (
    <section className={`floating-notice is-${notice.tone}`} role="status" aria-live="polite">
      <span className="floating-notice-icon" aria-hidden="true">
        {notice.tone === 'error' ? <AlertCircle /> : <Check />}
      </span>
      <div>
        <strong>{notice.title}</strong>
        <p>{notice.message}</p>
      </div>
      {notice.onAction && notice.actionLabel && (
        <button type="button" className="floating-notice-action" onClick={notice.onAction}>
          {notice.actionLabel}
        </button>
      )}
      <button type="button" className="floating-notice-close" aria-label="Dismiss notification" onClick={onDismiss}>
        <X />
      </button>
    </section>
  )
}

function DashboardRow({
  article,
  assignment,
  label,
  compact,
  onOpenArticle,
}: {
  article?: Article
  assignment?: ReviewAssignment
  label?: string
  compact?: boolean
  onOpenArticle: (articleId: string, revisionId?: string) => void
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
        <button type="button" className="secondary-command" disabled={!targetArticleId} onClick={() => targetArticleId && onOpenArticle(targetArticleId, assignment?.revisionId)}>
          Open
        </button>
      </div>
    </li>
  )
}

function ReviewHistoryRow({
  assignment,
  article,
  onOpenArticle,
}: {
  assignment: ReviewAssignment
  article?: Article
  onOpenArticle: (articleId: string, revisionId?: string) => void
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
      <button type="button" className="secondary-command" disabled={!assignment.articleId || !assignment.revisionId} onClick={() => onOpenArticle(assignment.articleId, assignment.revisionId)}>
        Open snapshot
      </button>
    </li>
  )
}

function ReviewFeedbackPanel({ feedback }: { feedback: ReviewFeedback[] }) {
  const visible = feedback.filter(reviewFeedbackHasVisibleContent)
  if (!visible.length) return null
  return (
    <section className="review-feedback-hero" aria-labelledby="changes-feedback-title">
      <div className="review-feedback-hero-head">
        <div>
          <span>Reviewer feedback</span>
          <h2 id="changes-feedback-title">Changes requested</h2>
        </div>
        <em>{visible.length} reviewer thread{visible.length === 1 ? '' : 's'}</em>
      </div>
      <div className="review-feedback-threads">
        {visible.map((entry) => {
          const comments = visibleFeedbackComments(entry)
          return (
            <article className="review-feedback-thread" key={entry.id}>
              <header>
                <div>
                  <strong>{entry.reviewerName}</strong>
                  {entry.decidedAt && <time>{formatShortDate(entry.decidedAt)}</time>}
                </div>
                <StatusPill state={entry.status} />
              </header>
              {entry.decisionSummary && (
                <section className="feedback-decision-note">
                  <span>Decision note</span>
                  <p className="decision-summary">{entry.decisionSummary}</p>
                </section>
              )}
              {comments.length > 0 && (
                <div className="review-feedback-thread-comments">
                  <span className="feedback-section-label">Discussion comments</span>
                  {comments.map((comment) => (
                    <div className="feedback-comment" key={comment.id}>
                      <span>{comment.authorName} · {comment.type}</span>
                      <p>{comment.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ArticleWorkflowTimeline({ article, auditEvents }: { article: Article; auditEvents: AuditEvent[] }) {
  const events = [...auditEvents]
    .filter((event) => event.entityUuid === article.uuid)
    .sort((a, b) => timestampValue(a.occurredAt) - timestampValue(b.occurredAt))
  return (
    <details className="article-workflow-timeline">
      <summary>
        <span><History /> Workflow history</span>
        <em>{events.length ? `${events.length} recorded event${events.length === 1 ? '' : 's'}` : `Current state · ${article.workflowState}`}</em>
      </summary>
      {events.length > 0 ? (
        <ol>
          {events.map((event) => (
            <li key={event.id}>
              <span className={`timeline-dot is-${eventTone(event.newState || event.eventType)}`} aria-hidden="true" />
              <div>
                <strong>{event.eventType}</strong>
                <p>{event.summary}</p>
                <em>{event.actorName || 'Editorial system'} · {formatShortDate(event.occurredAt)}</em>
              </div>
              <StatusPill state={event.newState || event.eventType} />
            </li>
          ))}
        </ol>
      ) : (
        <p>No workflow events are visible to your current role yet.</p>
      )}
    </details>
  )
}

function RevisionComparison({ current, previous }: { current: Revision; previous?: Revision }) {
  if (!previous) return null
  const clean = (value: string) => value.trim().replace(/\s+/g, ' ')
  const shorten = (value: string) => value.length > 180 ? `${value.slice(0, 177)}…` : value || 'Not set'
  const fields = [
    { label: 'Title', before: previous.title, after: current.title },
    { label: 'Slug', before: previous.slug, after: current.slug },
    { label: 'Excerpt', before: previous.excerpt, after: current.excerpt },
    { label: 'SEO title', before: previous.seoTitle, after: current.seoTitle },
    { label: 'SEO description', before: previous.seoDescription, after: current.seoDescription },
    { label: 'Article body', before: documentText(previous.document), after: documentText(current.document) },
    { label: 'Cover image', before: previous.featuredMedia?.altText || previous.featuredMediaId || '', after: current.featuredMedia?.altText || current.featuredMediaId || '' },
  ].filter((field) => clean(field.before) !== clean(field.after))
  return (
    <details className="revision-comparison">
      <summary>
        <span><GitBranch /> Compare with revision {previous.number}</span>
        <em>{fields.length} changed field{fields.length === 1 ? '' : 's'}</em>
      </summary>
      {fields.length > 0 ? (
        <div className="revision-change-list">
          {fields.map((field) => (
            <section key={field.label}>
              <strong>{field.label}</strong>
              <div><span>Revision {previous.number}</span><p>{shorten(clean(field.before))}</p></div>
              <div className="is-current"><span>Revision {current.number}</span><p>{shorten(clean(field.after))}</p></div>
            </section>
          ))}
        </div>
      ) : <p>No content or metadata differences were detected.</p>}
    </details>
  )
}

function ArticleStatusRow({
  article,
  note,
  statusDetail,
  statusOverride,
  actionLabel = 'Open',
  secondaryAction,
  tertiaryAction,
  overflowActions,
  onOpenArticle,
  secondaryBusy,
  tertiaryBusy,
}: {
  article: Article
  note?: string
  statusDetail?: string
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
  overflowActions?: Array<{
    label: string
    onClick: () => void
    disabled?: boolean
    icon?: ReactNode
  }>
  onOpenArticle: (articleId: string, revisionId?: string) => void
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
        {statusDetail && <em className="row-state-detail">{statusDetail}</em>}
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
        <button type="button" className="secondary-command" onClick={() => onOpenArticle(article.id)}>
          {actionLabel}
        </button>
        {overflowActions && overflowActions.length > 0 && (
          <details className="row-overflow">
            <summary aria-label="More actions">•••</summary>
            <div>
              {overflowActions.map((action) => (
                <button key={action.label} type="button" disabled={action.disabled} onClick={action.onClick}>
                  {action.icon}{action.label}
                </button>
              ))}
            </div>
          </details>
        )}
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
  onOpenArticle,
  updatedAt,
}: {
  data: DashboardData
  onRefresh: () => Promise<void>
  onOpenArticle: (articleId: string, revisionId?: string) => void
  updatedAt: number
}) {
  const [scope, setScope] = useState<'mine' | 'queue' | 'all'>('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [ownership, setOwnership] = useState<'mine' | 'everyone'>('everyone')
  const [section, setSection] = useState<string>(() => {
    try { return window.localStorage.getItem('gd-editorial-section') || '' } catch { return '' }
  })
  const [panelArticleId, setPanelArticleId] = useState('')
  const [view, setView] = useState<DashboardView>('all')
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<DashboardStateFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [personFilter, setPersonFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<DashboardDateFilter>('all')
  const [sortOrder, setSortOrder] = useState<DashboardSort>('recent')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(() => new Set())
  const [refreshBusy, setRefreshBusy] = useState(false)
  const [liveRefreshBusy, setLiveRefreshBusy] = useState(false)
  const [liveRefreshError, setLiveRefreshError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createCategoryId, setCreateCategoryId] = useState('')
  const [createPolicyId, setCreatePolicyId] = useState(defaultApprovalPolicyId(data))
  const [createCategoryName, setCreateCategoryName] = useState('')
  const [createCategoryBusy, setCreateCategoryBusy] = useState(false)
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
  const [archiveArticleTarget, setArchiveArticleTarget] = useState<Article | null>(null)
  const [archiveBusyId, setArchiveBusyId] = useState('')
  const [archiveError, setArchiveError] = useState('')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const [resetError, setResetError] = useState('')
  const [dashboardNotice, setDashboardNotice] = useState('')
  const [dashboardError, setDashboardError] = useState('')
  const [publishingNotice, setPublishingNotice] = useState<FloatingNoticeState | null>(null)
  const currentEmployee = data.currentEmployee
  const roles = Array.from(new Set(currentEmployee?.roles || []))
  const isReviewer = roles.includes('Reviewer')
  const isAuthor = roles.includes('Author')
  const isPublisher = roles.includes('Publisher')
  const showAll = roles.includes('CEO') || roles.includes('Editorial Admin')
  const canCreateCategory = !!currentEmployee && showAll
  const canResetTestContent = repository.source === 'mock'
  const articlesById = new Map(data.articles.map((article) => [article.id, article]))
  const activePublicationJobByArticleId = data.publicationJobs
    .filter((job) => job.status === 'Queued' || job.status === 'Processing')
    .reduce((jobs, job) => {
      const current = jobs.get(job.articleId)
      if (!current || timestampValue(job.requestedAt) >= timestampValue(current.requestedAt)) {
        jobs.set(job.articleId, job)
      }
      return jobs
    }, new Map<string, PublicationJob>())
  const hasActivePublicationJobs = activePublicationJobByArticleId.size > 0
  const dashboardRefreshDelayMs = hasActivePublicationJobs ? ACTIVE_PUBLICATION_REFRESH_MS : IDLE_DASHBOARD_REFRESH_MS
  const publicationIsFutureSchedule = (articleId: string) => {
    const article = articlesById.get(articleId)
    const job = activePublicationJobByArticleId.get(articleId)
    if (!article || !job || article.workflowState !== 'Scheduled' || job.action !== 'Schedule') return false
    const scheduledAt = timestampValue(article.scheduledAt)
    return scheduledAt > Date.now()
  }
  const publicationPending = (articleId: string) => optimisticPublicationIds.has(articleId)
    || (activePublicationJobByArticleId.has(articleId) && !publicationIsFutureSchedule(articleId))
  const publicationNeedsReconciliation = (articleId: string) => {
    const job = activePublicationJobByArticleId.get(articleId)
    if (!job || job.status !== 'Processing') return false
    if (publicationIsFutureSchedule(articleId)) return false
    const nextRetryAt = timestampValue(job.nextRetryAt)
    if (nextRetryAt > Date.now()) return false
    const requestedAt = timestampValue(job.requestedAt)
    return requestedAt > 0 && requestedAt <= Date.now() - (5 * 60 * 1000)
  }
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
  const personOptions = Array.from(new Set([
    ...visibleArticles.flatMap((article) => [displayLookup(article.owner), displayLookup(article.primaryAuthor)]),
    ...validAssignments.map((assignment) => assignment.reviewerName || ''),
    ...data.publicationJobs.map((job) => job.requestedBy ? displayLookup(job.requestedBy) : ''),
    ...data.auditEvents.map((event) => event.actorName || ''),
  ].filter((name) => name && name !== 'Unassigned'))).sort((a, b) => a.localeCompare(b))
  const matchesCategory = (article?: Article) => categoryFilter === 'all'
    || normalizedIdentity(displayLookup(article?.primaryCategory)) === normalizedIdentity(categoryFilter)
  const articleMatchesPerson = (article: Article) => matchesPersonFilter([
    displayLookup(article.owner),
    displayLookup(article.primaryAuthor),
    ...validAssignments.filter((assignment) => assignment.articleId === article.id).map((assignment) => assignment.reviewerName || ''),
    ...data.publicationJobs.filter((job) => job.articleId === article.id && job.requestedBy).map((job) => displayLookup(job.requestedBy)),
  ], personFilter)
  const assignmentMatchesPerson = (assignment: ReviewAssignment, article?: Article) => matchesPersonFilter([
    assignment.reviewerName || '',
    displayLookup(article?.owner),
    displayLookup(article?.primaryAuthor),
  ], personFilter)
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
    return matchesCategory(linkedArticle)
      && assignmentMatchesPerson(assignment, linkedArticle)
      && withinDashboardDateFilter(latestAssignmentTime(assignment), dateFilter)
      && assignmentMatchesFilter(assignment, linkedArticle, queryText, stateFilter)
  })
  const scopedArticles = visibleArticles.filter((article) => {
    if (scope === 'queue') return article.workflowState === 'Approved' || article.workflowState === 'Scheduled'
    if (scope === 'mine') return articleIsMine(article)
    return true
  }).filter((article) => matchesCategory(article)
    && articleMatchesPerson(article)
    && withinDashboardDateFilter(latestArticleTime(article, latestActivityByArticleId.get(article.id)), dateFilter)
    && articleMatchesFilter(article, queryText, stateFilter))
  const articleSort = (a: Article, b: Article) => {
    if (sortOrder === 'title') return a.workingTitle.localeCompare(b.workingTitle)
    if (sortOrder === 'state') return a.workflowState.localeCompare(b.workflowState) || a.workingTitle.localeCompare(b.workingTitle)
    const articleActivityTime = (article: Article) => Math.max(
      latestActivityByArticleId.get(article.id) || 0,
      timestampValue(article.lastPublishedAt),
      timestampValue(article.scheduledAt),
    )
    const activityA = articleActivityTime(a)
    const activityB = articleActivityTime(b)
    if (activityA && activityB && activityA !== activityB) return activityB - activityA
    return compareRecordIdsNewestFirst(a.id, b.id)
      || activityB - activityA
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
    .filter((article) => WORKING_ARTICLE_STATES.has(article.workflowState)
      || (article.workflowState === 'Approved' && !(isPublisher || showAll)))
    .sort(articleSort)
  const publishedArticles = scopedArticles
    .filter((article) => article.workflowState === 'Published')
    .sort(articleSort)
  const unpublishedArticles = scopedArticles
    .filter((article) => article.workflowState === 'Unpublished')
    .sort(articleSort)
  const archivedArticles = scopedArticles
    .filter((article) => article.workflowState === 'Archived')
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
  const myActiveArticleCount = visibleArticles.filter((article) => articleIsMine(article) && WORKING_ARTICLE_STATES.has(article.workflowState)).length
  const readyToPublishCount = data.articles.filter((article) => article.workflowState === 'Approved').length
  const failedPublicationCount = data.publicationJobs.filter((job) => job.status === 'Failed').length
  const needsPublicationAttentionCount = failedPublicationCount
    + data.articles.filter((article) => publicationNeedsReconciliation(article.id)).length
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
      return matchesCategory(article)
        && articleMatchesPerson(article)
        && withinDashboardDateFilter(latestArticleTime(article, latestActivityByArticleId.get(article.id)), dateFilter)
        && articleMatchesFilter(article, queryText, stateFilter === 'all' ? 'all' : stateFilter)
    })
    .sort(articleSort)
  const showReviewNavigation = isReviewer || showAll || visibleAssignments.length > 0
  const showPublishingNavigation = isPublisher || showAll || visibleArticles.some((article) => (
    article.workflowState === 'Approved'
    || article.workflowState === 'Scheduled'
    || article.workflowState === 'Published'
    || article.workflowState === 'Unpublished'
  ))
  const priorityCount = changesRequestedCount
    + assignedToMeCount
    + (isReviewer || showAll ? sharedQueueCount : 0)
    + (isPublisher || showAll ? readyToPublishCount + needsPublicationAttentionCount : 0)
  const todayTitle = priorityCount
    ? `${priorityCount} item${priorityCount === 1 ? '' : 's'} need your attention`
    : 'Your editorial queue is clear'
  const todayDetail = changesRequestedCount
    ? `${changesRequestedCount} article${changesRequestedCount === 1 ? '' : 's'} returned for changes`
    : assignedToMeCount
      ? `${assignedToMeCount} review${assignedToMeCount === 1 ? '' : 's'} ready for you`
      : readyToPublishCount && (isPublisher || showAll)
        ? `${readyToPublishCount} approved article${readyToPublishCount === 1 ? '' : 's'} ready to publish`
        : 'Recent work and team activity are organized below.'
  const loadedContentCount = data.articles.length + validAssignments.length + data.publicationJobs.length + data.auditEvents.length
  const visibleAuditEvents = data.auditEvents.filter((event) => {
    if (showAll) return true
    if (event.actorId === currentEmployee?.id) return true
    return visibleArticles.some((article) => article.uuid === event.entityUuid)
  }).filter((event) => {
    const linkedArticle = articlesByUuidForActivity.get(event.entityUuid)
    if (linkedArticle && !matchesCategory(linkedArticle)) return false
    return matchesPersonFilter([event.actorName || '', linkedArticle ? displayLookup(linkedArticle.primaryAuthor) : ''], personFilter)
      && withinDashboardDateFilter(timestampValue(event.occurredAt), dateFilter)
      && includesQuery([
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
  const filterCount = [
    stateFilter !== 'all' && !(view === 'archive' && stateFilter === 'archived'),
    categoryFilter !== 'all',
    personFilter !== 'all',
    dateFilter !== 'all',
    sortOrder !== 'recent',
  ].filter(Boolean).length
  const filtersActive = query.trim() !== '' || filterCount > 0
  const emptyMessage = filtersActive
    ? 'No items match these filters. Clear filters or switch scope to see other work.'
    : scope === 'mine'
    ? 'Nothing assigned to you here right now. Queue or All may still have work.'
    : scope === 'queue'
    ? 'No shared queue work matches this view right now.'
    : 'Nothing here right now.'
  const showReviewPanels = view === 'all' || view === 'reviews'
  const showArticlePanels = view === 'all' || view === 'articles' || view === 'archive'
  const showPublishingPanels = view === 'all' || view === 'publishing'
  const articlePanelItems = view === 'archive'
    ? archivedArticles
    : view === 'articles'
      ? scopedArticles.filter((article) => article.workflowState !== 'Archived').sort(articleSort)
      : workArticles
  const panelLimit = 5
  const panelItems = <T,>(panelId: string, items: T[]) => expandedPanels.has(panelId) ? items : items.slice(0, panelLimit)
  const expandPanel = (panelId: string) => setExpandedPanels((current) => new Set(current).add(panelId))

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
    setStateFilter(nextView === 'archive' ? 'archived' : 'all')
    setQuery('')
    setFiltersOpen(false)
  }

  const openPublishingView = () => {
    setScope(showAll ? 'all' : 'queue')
    changeView('publishing')
  }

  const showPublishingNotice = (tone: FloatingNoticeState['tone'], title: string, message: string) => {
    setPublishingNotice({
      id: Date.now(),
      tone,
      title,
      message,
      actionLabel: 'Publishing dashboard',
      onAction: openPublishingView,
    })
  }

  useEffect(() => {
    if (!publishingNotice || publishingNotice.tone === 'error') return undefined
    const timer = window.setTimeout(() => {
      setPublishingNotice((current) => current?.id === publishingNotice.id ? null : current)
    }, 9_000)
    return () => window.clearTimeout(timer)
  }, [publishingNotice])

  const clearFilters = () => {
    setQuery('')
    setStateFilter(view === 'archive' ? 'archived' : 'all')
    setCategoryFilter('all')
    setPersonFilter('all')
    setDateFilter('all')
    setSortOrder('recent')
    setFiltersOpen(false)
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

    const schedule = () => {
      if (disposed) return
      timer = window.setTimeout(() => void tick(), dashboardRefreshDelayMs)
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
  }, [dashboardRefreshDelayMs, onRefresh])

  const createArticle = async () => {
    setCreateBusy(true)
    setCreateError('')
    try {
      const result = await repository.createDraftArticle({
        title: createTitle,
        categoryId: createCategoryId || undefined,
        approvalPolicyId: createPolicyId,
      })
      onOpenArticle(result.articleId)
    } catch (error) {
      setCreateError(errorMessage(error, 'The article could not be created.'))
    } finally {
      setCreateBusy(false)
    }
  }

  const createCategory = async () => {
    if (!canCreateCategory || createCategoryName.trim().length < 2) return
    setCreateCategoryBusy(true)
    setCreateError('')
    try {
      const result = await repository.createTaxonomyTerm('category', createCategoryName)
      setCreateCategoryId(result.term.ID)
      setCreateCategoryName('')
      setDashboardNotice(result.message || `${displayLookup(result.term)} is ready to use.`)
      await refreshDashboard()
    } catch (error) {
      setCreateError(errorMessage(error, 'The category could not be created.'))
    } finally {
      setCreateCategoryBusy(false)
    }
  }

  const openArchiveDialog = (article: Article) => {
    setArchiveArticleTarget(article)
    setArchiveError('')
    setDashboardNotice('')
    setDashboardError('')
  }

  const openResetDialog = () => {
    setResetConfirmation('')
    setResetError('')
    setDashboardNotice('')
    setDashboardError('')
    setResetDialogOpen(true)
  }

  const archiveDraft = async () => {
    if (!archiveArticleTarget || archiveBusyId) return
    const article = archiveArticleTarget
    setArchiveBusyId(article.id)
    setArchiveError('')
    try {
      const result = await repository.archiveDraftArticle(article.id)
      setArchiveArticleTarget(null)
      setDashboardNotice(result.message || `${article.workingTitle} was moved to Trash.`)
      await refreshDashboard()
    } catch (error) {
      setArchiveError(errorMessage(error, 'The draft could not be moved to Trash.'))
    } finally {
      setArchiveBusyId('')
    }
  }

  const restoreDraft = async (article: Article) => {
    if (archiveBusyId) return
    setArchiveBusyId(article.id)
    setDashboardNotice('')
    setDashboardError('')
    try {
      const result = await repository.restoreArchivedArticle(article.id)
      setDashboardNotice(result.message || `${article.workingTitle} was restored.`)
      await refreshDashboard()
    } catch (error) {
      setDashboardError(errorMessage(error, 'The draft could not be restored.'))
    } finally {
      setArchiveBusyId('')
    }
  }

  const resetTestContent = async () => {
    if (!canResetTestContent || resetBusy || resetConfirmation.trim() !== RESET_TEST_CONTENT_CONFIRMATION) return
    setResetBusy(true)
    setResetError('')
    try {
      const result = await repository.resetTestContent(resetConfirmation.trim())
      const deletedTotal = result.deletedArticles
        + result.deletedRevisions
        + result.deletedReviewAssignments
        + result.deletedReviewComments
        + result.deletedPublicationJobs
        + result.deletedMediaAssets
        + result.deletedAuditEvents
      setResetDialogOpen(false)
      setResetConfirmation('')
      setScope('mine')
      changeView('all')
      setDashboardNotice(result.message || `Deleted ${deletedTotal} test records from Creator.`)
      await refreshDashboard()
    } catch (error) {
      setResetError(errorMessage(error, 'Creator could not reset the test content.'))
    } finally {
      setResetBusy(false)
    }
  }

  const publishArticle = async (article: Article) => {
    if (publicationActionRef.current.has(article.id) || publicationPending(article.id)) return
    publicationActionRef.current.add(article.id)
    setOptimisticPublicationIds((current) => new Set(current).add(article.id))
    setPublishBusyId(article.id)
    setDashboardNotice('')
    setDashboardError('')
    setPublishingNotice(null)
    try {
      const result = await repository.publishArticle(article.id)
      showPublishingNotice('success', 'Publishing started', result.message || `${article.workingTitle} was sent for publishing.`)
      await refreshDashboard()
    } catch (error) {
      setOptimisticPublicationIds((current) => {
        const next = new Set(current)
        next.delete(article.id)
        return next
      })
      showPublishingNotice('error', 'Publishing failed', errorMessage(error, 'The article could not be published.'))
    } finally {
      publicationActionRef.current.delete(article.id)
      setPublishBusyId('')
    }
  }

  const reconcilePublication = async (article: Article) => {
    if (publicationActionRef.current.has(article.id) || !publicationNeedsReconciliation(article.id)) return
    publicationActionRef.current.add(article.id)
    setPublishBusyId(article.id)
    setDashboardNotice('')
    setDashboardError('')
    setPublishingNotice(null)
    try {
      const result = await repository.publishArticle(article.id)
      showPublishingNotice('success', 'Publishing retried', result.message || `${article.workingTitle} publication status was reconciled.`)
      await refreshDashboard()
    } catch (error) {
      showPublishingNotice('error', 'Retry failed', errorMessage(error, 'The publication status could not be reconciled.'))
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
    setPublishingNotice(null)
    try {
      const result = await repository.scheduleArticle(scheduleArticleTarget.id, scheduleAt)
      showPublishingNotice('success', 'Article scheduled', result.message || `${scheduleArticleTarget.workingTitle} was scheduled.`)
      setScheduleArticleTarget(null)
      await refreshDashboard()
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
    setPublishingNotice(null)
    try {
      const result = await repository.retractArticle(retractArticleTarget.id, retractReason.trim(), replacementPath.trim())
      showPublishingNotice('success', 'Retraction started', result.message || `${retractArticleTarget.workingTitle} retraction was accepted.`)
      setRetractArticleTarget(null)
      await refreshDashboard()
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

  /* ------------------------------------------------------------------ *
   * Editorial home, v0.8.
   *
   * The screen is organised around the four jobs people do, not around
   * data types: Writing, Reviewing, Publishing, Managing. Each person only
   * sees the jobs their roles allow, and each job has its own home showing
   * whose turn it is. Clicking any article opens a side panel that explains
   * where it is in Write → Review → Publish → Live before opening the editor.
   * ------------------------------------------------------------------ */
  const firstName = currentEmployee?.displayName.split(/\s+/)[0] || ''
  const hourNow = new Date().getHours()
  const greeting = hourNow < 12 ? 'Good morning' : hourNow < 17 ? 'Good afternoon' : 'Good evening'
  const canPublish = isPublisher || showAll
  const publishLocked = publishBusyId !== '' || scheduleBusy
  const DAY = 24 * 60 * 60 * 1000
  const latestJobByArticle = data.publicationJobs.reduce((jobs, job) => {
    const current = jobs.get(job.articleId)
    if (!current || timestampValue(job.requestedAt) >= timestampValue(current.requestedAt)) jobs.set(job.articleId, job)
    return jobs
  }, new Map<string, PublicationJob>())
  const jobAge = (article: Article) => {
    const job = activePublicationJobByArticleId.get(article.id)
    return job ? Date.now() - timestampValue(job.requestedAt) : 0
  }
  /** A live article whose publish record never updated: the site is fine, only the record is stale. */
  const staleRecordOnLive = (article: Article) => article.workflowState === 'Published' && jobAge(article) > 30 * 60 * 1000
  const pendingNow = (article: Article) => publicationPending(article.id) && !staleRecordOnLive(article)
  const failedJobFor = (article: Article) => {
    const job = latestJobByArticle.get(article.id)
    return job && job.status === 'Failed' && article.workflowState === 'Approved' ? job : undefined
  }
  const retryNeeded = (article: Article) => canPublish && !staleRecordOnLive(article) && article.workflowState !== 'Published' && publicationNeedsReconciliation(article.id)
  const activityOf = (article: Article) => Math.max(
    latestActivityByArticleId.get(article.id) || 0,
    timestampValue(article.lastPublishedAt),
    timestampValue(article.scheduledAt),
    timestampValue(article.archivedAt),
  )
  const byActivity = (a: Article, b: Article) => activityOf(b) - activityOf(a) || compareRecordIdsNewestFirst(a.id, b.id)
  const stageFor = (article: Article) => stageOf(article, {
    pending: pendingNow(article),
    needsRetry: retryNeeded(article),
    retracting: activePublicationJobByArticleId.get(article.id)?.action === 'Unpublish' && pendingNow(article),
  })
  const openEditor = (article: Article) => onOpenArticle(article.id)
  const isMyAssignment = (assignment: ReviewAssignment) => assignmentBelongsToCurrentReviewer(assignment, currentEmployee)
  const authorName = (article?: Article) => (article ? displayLookup(article.primaryAuthor) : '')
  const tidyText = (value?: string) => (value || '').trim().replace(/\s+/g, ' ')
  const nameList = (names: string[]) => {
    const clean = Array.from(new Set(names.map((name) => name.trim()).filter(Boolean)))
    return clean.length <= 1 ? clean.join('') : `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`
  }
  const assignmentsFor = (article: Article) => validAssignments.filter((assignment) => assignment.articleId === article.id)
  const isMe = (name: string) => normalizedIdentity(name) === normalizedIdentity(currentEmployee?.displayName)
  const youOr = (name: string) => (isMe(name) ? 'you' : name)

  /** One plain sentence: whose turn is it? */
  const whoseTurn = (article: Article): { text: string; tone: 'you' | 'other' | 'done' | 'problem' } => {
    if (retryNeeded(article) || failedJobFor(article)) return { text: 'Publishing didn’t finish. A publisher needs to try again.', tone: 'problem' }
    const author = authorName(article)
    const active = assignmentsFor(article).filter((assignment) => ACTIVE_ASSIGNMENT_STATES.has(assignment.status))
    switch (article.workflowState) {
      case 'Draft':
        return hasLiveVersionBehind(article)
          ? { text: `${isMe(author) ? 'You are' : `${author} is`} editing a new version. The current one stays live.`, tone: isMe(author) ? 'you' : 'other' }
          : { text: `${isMe(author) ? 'You are' : `${author} is`} still writing.`, tone: isMe(author) ? 'you' : 'other' }
      case 'Changes Requested':
        return { text: `Back with ${youOr(author)} to make the requested changes.`, tone: isMe(author) ? 'you' : 'other' }
      case 'In Review': {
        const claimed = active.filter((assignment) => assignment.status === 'Claimed')
        const assigned = active.filter((assignment) => assignment.status === 'Assigned')
        if (claimed.length) return { text: `Being reviewed by ${nameList(claimed.map((assignment) => youOr(assignment.reviewerName || 'a reviewer')))}.`, tone: claimed.some(isMyAssignment) ? 'you' : 'other' }
        if (assigned.length) return { text: `Waiting for ${nameList(assigned.map((assignment) => youOr(assignment.reviewerName || 'a reviewer')))} to review.`, tone: assigned.some(isMyAssignment) ? 'you' : 'other' }
        return { text: 'Waiting for any reviewer to pick it up.', tone: isReviewer && !isMe(author) ? 'you' : 'other' }
      }
      case 'Approved':
        return pendingNow(article)
          ? { text: 'Being published to the website now.', tone: 'other' }
          : { text: 'Approved. Waiting for a publisher to put it live.', tone: canPublish ? 'you' : 'other' }
      case 'Scheduled':
        return { text: `Will go live ${relativeTime(article.scheduledAt)} (${absoluteTime(article.scheduledAt)}).`, tone: 'done' }
      case 'Published':
        return { text: `Live on the website since ${absoluteTime(article.lastPublishedAt) || 'publishing'}.`, tone: 'done' }
      case 'Unpublished':
        return { text: 'Taken off the website. It can be revised and published again.', tone: 'other' }
      case 'Rejected':
        return { text: 'Rejected in review. The author can start a new version.', tone: isMe(author) ? 'you' : 'other' }
      case 'Archived':
        return { text: 'In Trash. It can be restored.', tone: 'other' }
      default:
        return { text: article.workflowState, tone: 'other' }
    }
  }

  /* ---- Sections ------------------------------------------------------ */
  type SectionKey = 'write' | 'review' | 'publish' | 'manage' | 'library' | 'trash'
  const jobModes: Array<{ key: SectionKey; label: string; about: string; icon: ReactNode }> = [
    ...(isAuthor || showAll ? [{ key: 'write' as const, label: 'Writing', about: 'Your articles, from first draft to live.', icon: <PenLine /> }] : []),
    ...(isReviewer || showAll ? [{ key: 'review' as const, label: 'Reviewing', about: 'Check other people’s articles before they go live.', icon: <ClipboardCheck /> }] : []),
    ...(canPublish ? [{ key: 'publish' as const, label: 'Publishing', about: 'Put approved articles on the website, now or at a set time.', icon: <Send /> }] : []),
    ...(showAll ? [{ key: 'manage' as const, label: 'Managing', about: 'How the whole team’s work is moving, and what is stuck.', icon: <LayoutDashboard /> }] : []),
  ]
  const validSections: SectionKey[] = [...jobModes.map((mode) => mode.key), 'library', 'trash']
  const activeSection: SectionKey = validSections.includes(section as SectionKey) ? section as SectionKey : (jobModes[0]?.key || 'library')
  const goSection = (key: SectionKey) => {
    setSection(key)
    setQuery('')
    setStageFilter('all')
    try { window.localStorage.setItem('gd-editorial-section', key) } catch { /* private mode */ }
  }

  /* Writing */
  const myArticles = visibleArticles.filter((article) => articleIsMine(article) && article.workflowState !== 'Archived')
  const boardColumns: Array<{ key: string; title: string; hint: string; states: string[]; tone: StageTone }> = [
    { key: 'drafts', title: 'Drafts', hint: 'Still being written', states: ['Draft'], tone: 'draft' },
    { key: 'changes', title: 'Needs your changes', hint: 'Reviewers asked for edits', states: ['Changes Requested', 'Rejected'], tone: 'warn' },
    { key: 'review', title: 'With reviewers', hint: 'Waiting for review', states: ['In Review'], tone: 'review' },
    { key: 'approved', title: 'Approved', hint: 'Waiting to go live', states: ['Approved', 'Scheduled'], tone: 'ready' },
    { key: 'live', title: 'Live', hint: 'On the website', states: ['Published', 'Unpublished'], tone: 'live' },
  ]

  /* Reviewing */
  const myReviewsActive = inboxAssignments.filter((assignment) => isMyAssignment(assignment) && assignment.status !== 'Queued')
  const reviewQueue = inboxAssignments.filter((assignment) => {
    if (assignment.status !== 'Queued' || reviewerRevisionParticipation.has(assignment.revisionId)) return false
    const article = articlesById.get(assignment.articleId)
    return !(article && lookupBelongsToEmployee(article.primaryAuthor, currentEmployee))
  }).filter((assignment, index, list) => list.findIndex((other) => other.revisionId === assignment.revisionId) === index)
  const myReviewHistory = reviewHistory.filter(isMyAssignment).slice(0, 6)

  /* Publishing */
  const pubProblems = data.articles.filter((article) => retryNeeded(article) || failedJobFor(article))
  const pubReady = data.articles.filter((article) => article.workflowState === 'Approved' && !pendingNow(article) && !failedJobFor(article) && !retryNeeded(article))
  const pubRunning = data.articles.filter((article) => pendingNow(article) && !retryNeeded(article))
  const pubScheduled = data.articles.filter((article) => article.workflowState === 'Scheduled' && !pendingNow(article))
    .sort((a, b) => timestampValue(a.scheduledAt) - timestampValue(b.scheduledAt))
  const pubRecent = data.articles.filter((article) => article.workflowState === 'Published')
    .sort((a, b) => timestampValue(b.lastPublishedAt) - timestampValue(a.lastPublishedAt)).slice(0, 5)

  /* Managing */
  const nonArchived = visibleArticles.filter((article) => article.workflowState !== 'Archived')
  const waitingSince = (article: Article) => {
    const decided = assignmentsFor(article).map((assignment) => timestampValue(assignment.decidedAt || assignment.assignedAt)).filter(Boolean)
    return Math.max(activityOf(article), ...decided, 0)
  }
  const stuck = nonArchived
    .filter((article) => ['In Review', 'Approved', 'Changes Requested'].includes(article.workflowState))
    .filter((article) => waitingSince(article) && Date.now() - waitingSince(article) > 3 * DAY)
    .sort((a, b) => waitingSince(a) - waitingSince(b))
  const staleRecords = data.articles.filter(staleRecordOnLive)
  const health = [
    { key: 'review', label: 'Waiting for review', value: nonArchived.filter((article) => article.workflowState === 'In Review').length, note: 'Reviewers' },
    { key: 'changes', label: 'Back with authors', value: nonArchived.filter((article) => article.workflowState === 'Changes Requested').length, note: 'Authors' },
    { key: 'ready', label: 'Ready to publish', value: nonArchived.filter((article) => article.workflowState === 'Approved').length, note: 'Publishers' },
    { key: 'live', label: 'Live on the website', value: nonArchived.filter((article) => article.workflowState === 'Published' || hasLiveVersionBehind(article)).length, note: 'Public' },
  ]
  const people = (() => {
    const map = new Map<string, { name: string; writing: number; inReview: number; reviewing: number }>()
    const row = (name: string) => {
      const key = normalizedIdentity(name)
      if (!key || key === 'unassigned') return undefined
      if (!map.has(key)) map.set(key, { name, writing: 0, inReview: 0, reviewing: 0 })
      return map.get(key)!
    }
    for (const article of nonArchived) {
      const entry = row(authorName(article))
      if (!entry) continue
      if (article.workflowState === 'Draft' || article.workflowState === 'Changes Requested') entry.writing += 1
      if (article.workflowState === 'In Review') entry.inReview += 1
    }
    for (const assignment of validAssignments) {
      if (assignment.status === 'Assigned' || assignment.status === 'Claimed') {
        const entry = row(assignment.reviewerName || '')
        if (entry) entry.reviewing += 1
      }
    }
    return [...map.values()].sort((a, b) => (b.writing + b.inReview + b.reviewing) - (a.writing + a.inReview + a.reviewing) || a.name.localeCompare(b.name))
  })()

  /* Library */
  const STAGE_FILTERS: Array<{ key: string; label: string; test: (article: Article) => boolean }> = [
    { key: 'all', label: 'All', test: () => true },
    { key: 'draft', label: 'Drafts', test: (article) => article.workflowState === 'Draft' },
    { key: 'changes', label: 'Needs changes', test: (article) => article.workflowState === 'Changes Requested' },
    { key: 'review', label: 'In review', test: (article) => article.workflowState === 'In Review' },
    { key: 'ready', label: 'Approved', test: (article) => article.workflowState === 'Approved' || article.workflowState === 'Scheduled' },
    { key: 'live', label: 'Live', test: (article) => article.workflowState === 'Published' || hasLiveVersionBehind(article) },
    { key: 'withdrawn', label: 'Withdrawn', test: (article) => article.workflowState === 'Unpublished' },
    { key: 'rejected', label: 'Rejected', test: (article) => article.workflowState === 'Rejected' },
  ]
  const ownedArticles = nonArchived.filter((article) => !(showAll && ownership === 'mine') || articleIsMine(article))
  const matchesSearch = (article?: Article) => !queryText || [article?.workingTitle || '', authorName(article), article ? displayLookup(article.primaryCategory) : '']
    .some((value) => value.toLowerCase().includes(queryText))
  const searchableArticles = ownedArticles.filter((article) => matchesSearch(article) && matchesCategory(article))
  const activeStage = STAGE_FILTERS.find((filter) => filter.key === stageFilter) || STAGE_FILTERS[0]
  const libraryRows = searchableArticles.filter(activeStage.test).sort(byActivity)
  const trashRows = visibleArticles.filter((article) => article.workflowState === 'Archived' && matchesSearch(article)).sort(byActivity)
  const openLibrary = (stage: string) => { goSection('library'); setStageFilter(stage) }

  const modeCount: Record<string, number> = {
    write: myArticles.filter((article) => article.workflowState === 'Changes Requested').length,
    review: myReviewsActive.length + reviewQueue.length,
    publish: pubProblems.length + pubReady.length,
    manage: stuck.length,
  }

  /* ---- Actions --------------------------------------------------------- */
  type Act = { label: string; onClick: () => void; icon?: ReactNode; kind?: 'primary' | 'soft' | 'plain' | 'danger'; disabled?: boolean }
  const actionsFor = (article: Article): Act[] => {
    const list: Act[] = []
    const busy = publishBusyId === article.id
    const editable = canEditArticle(article, currentEmployee)
    const myActiveReview = assignmentsFor(article).find((assignment) => isMyAssignment(assignment) && (assignment.status === 'Assigned' || assignment.status === 'Claimed'))
    const queued = reviewQueue.find((assignment) => assignment.articleId === article.id)
    if (retryNeeded(article)) list.push({ label: busy ? 'Trying again' : 'Try publishing again', icon: <RotateCcw />, kind: 'primary', disabled: publishLocked, onClick: () => void reconcilePublication(article) })
    else if (failedJobFor(article) && canPublish) list.push({ label: busy ? 'Publishing' : 'Publish again', icon: <Send />, kind: 'primary', disabled: publishLocked, onClick: () => void publishArticle(article) })
    else if (canPublish && article.workflowState === 'Approved' && !pendingNow(article)) {
      list.push({ label: busy ? 'Publishing' : 'Publish now', icon: <Send />, kind: 'primary', disabled: publishLocked, onClick: () => void publishArticle(article) })
      list.push({ label: 'Schedule', icon: <CalendarClock />, kind: 'plain', disabled: publishLocked, onClick: () => openScheduleDialog(article) })
    }
    if (myActiveReview) list.push({ label: 'Review', icon: <ClipboardCheck />, kind: list.length ? 'soft' : 'primary', onClick: () => onOpenArticle(article.id, myActiveReview.revisionId) })
    else if (queued && isReviewer) list.push({ label: 'Review this', icon: <ClipboardCheck />, kind: list.length ? 'soft' : 'primary', onClick: () => onOpenArticle(article.id, queued.revisionId) })
    if (article.workflowState === 'Archived') {
      if (editable) list.push({ label: archiveBusyId === article.id ? 'Restoring' : 'Restore', icon: <ArchiveRestore />, kind: 'primary', disabled: archiveBusyId !== '', onClick: () => void restoreDraft(article) })
    } else {
      const writing = editable && (article.workflowState === 'Draft' || article.workflowState === 'Changes Requested')
      list.push({
        label: writing ? 'Continue writing' : 'Open in editor',
        icon: writing ? <PenLine /> : <FileText />,
        kind: list.length ? 'plain' : 'primary',
        onClick: () => openEditor(article),
      })
    }
    if (canPublish && article.workflowState === 'Published' && !pendingNow(article)) list.push({ label: 'Take off the website', icon: <EyeOff />, kind: 'danger', disabled: retractBusy || publishLocked, onClick: () => { setPanelArticleId(''); openRetractDialog(article) } })
    if (editable && !article.publishedRevisionId && (article.workflowState === 'Draft' || article.workflowState === 'Changes Requested')) {
      list.push({ label: 'Move to Trash', icon: <Trash2 />, kind: 'danger', disabled: archiveBusyId !== '', onClick: () => { setPanelArticleId(''); openArchiveDialog(article) } })
    }
    return list
  }
  const primaryAction = (article: Article) => actionsFor(article).find((action) => action.kind === 'primary')
  const button = (action: Act, size: 'sm' | 'md' = 'sm') => (
    <button
      key={action.label}
      type="button"
      className={`ed-btn${action.kind === 'primary' ? ' is-primary' : action.kind === 'soft' ? ' is-soft' : action.kind === 'danger' ? ' is-danger' : ''}${size === 'md' ? ' is-large' : ''}`}
      disabled={action.disabled}
      onClick={(event) => { event.stopPropagation(); action.onClick() }}
    >
      {action.icon}{action.label}
    </button>
  )

  /* ---- Building blocks --------------------------------------------- */
  const panelArticle = panelArticleId ? articlesById.get(panelArticleId) : undefined

  const card = (article: Article, extra?: ReactNode) => {
    const turn = whoseTurn(article)
    // A button only when this person can move the article forward now.
    // Everything else opens the side panel, so cards stay calm.
    const primary = turn.tone === 'you' || turn.tone === 'problem' ? primaryAction(article) : undefined
    return (
      <li key={article.id}>
        <article className={`ed-card-item is-turn-${turn.tone}`} onClick={() => setPanelArticleId(article.id)}>
          <div className="ed-card-head">
            <button type="button" className="ed-title-link" onClick={(event) => { event.stopPropagation(); setPanelArticleId(article.id) }}>
              {article.workingTitle || 'Untitled article'}
            </button>
            {hasLiveVersionBehind(article) && <span className="ed-live-chip">Live</span>}
          </div>
          <p className="ed-turn">{turn.text}</p>
          {extra}
          <div className="ed-card-foot">
            <span className="ed-card-meta">
              <Avatar name={authorName(article)} size={20} />
              <span>{displayLookup(article.primaryCategory) === 'Unassigned' ? 'No category' : displayLookup(article.primaryCategory)}</span>
              <span aria-hidden="true">·</span>
              <When value={activityOf(article) || undefined} />
            </span>
            {primary && button(primary)}
          </div>
        </article>
      </li>
    )
  }

  const cardList = (articles: Article[], empty: ReactNode, extra?: (article: Article) => ReactNode) => (
    articles.length === 0 ? empty : <ul className="ed-cards" role="list">{articles.map((article) => card(article, extra?.(article)))}</ul>
  )

  const quietEmpty = (text: string) => <p className="ed-quiet">{text}</p>

  const toolbar = (placeholder: string, withOwnership = false) => (
    <div className="ed-toolbar">
      <label className="ed-search">
        <Search aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input value={query} placeholder={placeholder} onChange={(event) => setQuery(event.target.value)} />
        {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X /></button>}
      </label>
      {categoryOptions.length > 1 && (
        <label className="ed-select">
          <span className="sr-only">Category</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <ChevronDown aria-hidden="true" />
        </label>
      )}
      {withOwnership && showAll && (
        <div className="ed-segment" role="group" aria-label="Whose articles">
          <button type="button" aria-pressed={ownership === 'everyone'} className={ownership === 'everyone' ? 'is-active' : ''} onClick={() => setOwnership('everyone')}>Everyone’s</button>
          <button type="button" aria-pressed={ownership === 'mine'} className={ownership === 'mine' ? 'is-active' : ''} onClick={() => setOwnership('mine')}>Mine</button>
        </div>
      )}
    </div>
  )

  const table = (rows: Article[], empty: ReactNode, when?: (article: Article) => string | undefined) => (
    rows.length === 0 ? empty : (
      <div className="ed-card">
        <ul className="ed-table" role="list">
          <li className="ed-row is-head" aria-hidden="true"><span>Article</span><span>Stage</span><span>Author</span><span>Updated</span><span /></li>
          {rows.map((article) => {
            const candidate = primaryAction(article)
            const primary = candidate && candidate.label !== 'Open in editor' ? candidate : undefined
            return (
              <li key={article.id} className="ed-row is-clickable" onClick={() => setPanelArticleId(article.id)}>
                <div className="ed-cell-title">
                  <button type="button" className="ed-title-link" onClick={(event) => { event.stopPropagation(); setPanelArticleId(article.id) }}>{article.workingTitle || 'Untitled article'}</button>
                  <span>{whoseTurn(article).text}</span>
                </div>
                <div className="ed-cell-stage"><StageBadge stage={stageFor(article)} liveBehind={hasLiveVersionBehind(article)} /></div>
                <div className="ed-cell-person"><Avatar name={authorName(article)} size={24} /><span>{authorName(article)}</span></div>
                <div className="ed-cell-when"><When value={when?.(article) || activityOf(article) || undefined} /></div>
                <div className="ed-cell-actions">
                  {primary && button(primary)}
                  <span className="ed-chevron" aria-hidden="true"><ChevronRight /></span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    )
  )

  const ACTIVITY_VERBS: Record<string, string> = {
    'Submitted for Review': 'sent for review',
    'Review Approved': 'approved',
    'Review Changes Requested': 'asked for changes on',
    'Review Rejected': 'rejected',
    'Review Claimed': 'started reviewing',
    'Catalyst Article Published': 'published',
    'Catalyst Article Retracted': 'took down',
    'Article Scheduled': 'scheduled',
    'New Version Started': 'started a new version of',
    'New Version Discarded': 'discarded the new version of',
    'Draft Moved to Trash': 'moved to Trash',
    'Draft Restored': 'restored',
    'Catalyst Publication Failed': 'could not publish',
  }
  const assignmentsByUuid = new Map(validAssignments.map((assignment) => [assignment.uuid, assignment]))
  const articleForEvent = (event: AuditEvent) => articlesByUuidForActivity.get(event.entityUuid)
    || data.articles.find((article) => event.entityUuid.startsWith(`REV-${article.uuid}`))
    || articlesById.get(assignmentsByUuid.get(event.entityUuid)?.articleId || '')
  const meaningfulEvents = visibleAuditEvents
    .filter((event) => ACTIVITY_VERBS[event.eventType])
    .sort((a, b) => timestampValue(b.occurredAt) - timestampValue(a.occurredAt))
  const activityList = (events: AuditEvent[], showArticle = true) => (
    events.length === 0 ? quietEmpty('Nothing has happened yet.') : (
      <ul className="ed-activity" role="list">
        {events.map((event) => {
          const article = articleForEvent(event)
          return (
            <li key={event.id}>
              <Avatar name={event.actorName || 'System'} size={24} />
              <p>
                <strong>{isMe(event.actorName || '') ? 'You' : event.actorName || 'Someone'}</strong> {ACTIVITY_VERBS[event.eventType]}
                {showArticle && <>{' '}{article
                  ? <button type="button" className="ed-inline-link" onClick={() => setPanelArticleId(article.id)}>{article.workingTitle}</button>
                  : <span>an article</span>}</>}
              </p>
              <When value={event.occurredAt} />
            </li>
          )
        })}
      </ul>
    )
  )

  /* ---- Side panel content ------------------------------------------- */
  const panel = (article: Article) => {
    const turn = whoseTurn(article)
    const assignments = assignmentsFor(article).sort((a, b) => latestAssignmentTime(b) - latestAssignmentTime(a))
    const decisions = assignments.filter((assignment) => assignment.decision)
    const reviewers = Array.from(new Set(assignments.map((assignment) => assignment.reviewerName).filter(Boolean) as string[]))
    const publishedBy = data.publicationJobs.filter((job) => job.articleId === article.id && job.status === 'Succeeded' && job.action !== 'Unpublish' && job.requestedBy)
      .sort((a, b) => timestampValue(b.requestedAt) - timestampValue(a.requestedAt))[0]
    const events = meaningfulEvents.filter((event) => articleForEvent(event)?.id === article.id).slice(0, 6)
    const actions = actionsFor(article)
    const facts: Array<[string, ReactNode]> = [
      ['Author', <span className="ed-fact-person"><Avatar name={authorName(article)} size={20} />{authorName(article)}</span>],
      ['Category', displayLookup(article.primaryCategory) === 'Unassigned' ? 'None' : displayLookup(article.primaryCategory)],
      ['Reviewers', reviewers.length ? nameList(reviewers) : 'Not reviewed yet'],
      ...(publishedBy ? [['Published by', displayLookup(publishedBy.requestedBy)] as [string, ReactNode]] : []),
      ...(article.firstPublishedAt ? [['First published', absoluteTime(article.firstPublishedAt)] as [string, ReactNode]] : []),
      ...(article.lastPublishedAt && article.lastPublishedAt !== article.firstPublishedAt ? [['Last updated on site', absoluteTime(article.lastPublishedAt)] as [string, ReactNode]] : []),
      ...(article.scheduledAt && article.workflowState === 'Scheduled' ? [['Goes live', absoluteTime(article.scheduledAt)] as [string, ReactNode]] : []),
    ]
    return (
      <SidePanel title={article.workingTitle} onClose={() => setPanelArticleId('')}>
        <header className="ed-panel-head">
          <div>
            <StageBadge stage={stageFor(article)} liveBehind={hasLiveVersionBehind(article)} />
            <h2>{article.workingTitle || 'Untitled article'}</h2>
          </div>
          <button type="button" className="ed-icon-btn" aria-label="Close" onClick={() => setPanelArticleId('')} autoFocus><X /></button>
        </header>
        <div className="ed-panel-body">
          <Stepper state={article.workflowState} />
          <div className={`ed-turn-box is-${turn.tone}`}>
            <strong>{turn.tone === 'you' ? 'Your turn' : turn.tone === 'problem' ? 'Needs attention' : turn.tone === 'done' ? 'Status' : 'Where it is'}</strong>
            <p>{turn.text}</p>
          </div>
          {actions.length > 0 && <div className="ed-panel-actions">{actions.map((action) => button(action, 'md'))}</div>}
          <dl className="ed-facts">
            {facts.map(([label, value]) => (<div key={label}><dt>{label}</dt><dd>{value}</dd></div>))}
          </dl>
          {decisions.length > 0 && (
            <div className="ed-panel-block">
              <h3>Reviewer notes</h3>
              <ul className="ed-notes">
                {decisions.slice(0, 3).map((assignment) => (
                  <li key={assignment.id}>
                    <div><StageBadge stage={REVIEW_STATUS[assignment.status] || { label: assignment.status, tone: 'muted' }} /> <span>{assignment.reviewerName}</span> <When value={assignment.decidedAt} /></div>
                    {tidyText(assignment.decisionSummary) && <p>“{tidyText(assignment.decisionSummary)}”</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="ed-panel-block">
            <h3>History</h3>
            {activityList(events, false)}
          </div>
        </div>
      </SidePanel>
    )
  }

  const REVIEW_STATUS: Record<string, { label: string; tone: StageTone }> = {
    Queued: { label: 'Open to reviewers', tone: 'review' },
    Assigned: { label: 'Assigned', tone: 'review' },
    Claimed: { label: 'In progress', tone: 'progress' },
    Approved: { label: 'Approved', tone: 'live' },
    'Changes Requested': { label: 'Asked for changes', tone: 'warn' },
    Rejected: { label: 'Rejected', tone: 'danger' },
    Cancelled: { label: 'Cancelled', tone: 'muted' },
  }

  const activeMode = jobModes.find((mode) => mode.key === activeSection)

  return (
    <main className="ed">
      {publishingNotice && <FloatingNotice notice={publishingNotice} onDismiss={() => setPublishingNotice(null)} />}
      {data.warnings?.map((message) => <div key={message} className="error-banner" role="alert"><AlertCircle /> {message}</div>)}

      <header className="ed-top">
        <div className="ed-top-title">
          <span className="ed-brand" aria-hidden="true">G</span>
          <div>
            <h1>{firstName ? `${greeting}, ${firstName}` : 'GeneDrift Editorial'}</h1>
            <p>
              GeneDrift Editorial
              {roles.length > 0 && <> · You can {nameList(roles.map((role) => ({
                Author: 'write', Reviewer: 'review', Publisher: 'publish', 'Editorial Admin': 'manage the team', CEO: 'see everything',
              } as Record<string, string>)[role] || role.toLowerCase()))}</>}
            </p>
          </div>
        </div>
        <div className="ed-top-actions">
          <button
            type="button"
            className={`ed-sync${liveRefreshError ? ' is-error' : ''}`}
            disabled={refreshBusy}
            onClick={() => void refreshDashboard()}
            title={liveRefreshError || `Updates by itself every ${formatRefreshInterval(dashboardRefreshDelayMs)}. Click to update now.`}
          >
            <RotateCcw className={refreshBusy || liveRefreshBusy ? 'is-spinning' : ''} />
            <span>{liveRefreshError ? 'Not updating' : refreshBusy || liveRefreshBusy ? 'Updating' : `Updated ${relativeTime(updatedAt)}`}</span>
          </button>
          {canCreateArticle && (
            <button type="button" className="ed-btn is-primary is-large" onClick={() => {
              setCreateTitle('')
              setCreateCategoryId('')
              setCreatePolicyId(defaultApprovalPolicyId(data))
              setCreateCategoryName('')
              setCreateError('')
              setCreateOpen(true)
            }}>
              <Plus /> New article
            </button>
          )}
        </div>
      </header>

      <nav className="ed-modes" aria-label="What do you want to do">
        {jobModes.map((mode) => (
          <button key={mode.key} type="button" className={activeSection === mode.key ? 'is-active' : ''} aria-current={activeSection === mode.key ? 'page' : undefined} onClick={() => goSection(mode.key)}>
            <span className="ed-mode-icon" aria-hidden="true">{mode.icon}</span>
            <span className="ed-mode-label">{mode.label}</span>
            {modeCount[mode.key] > 0 && <span className="ed-mode-count">{modeCount[mode.key]}</span>}
          </button>
        ))}
        <span className="ed-modes-gap" aria-hidden="true" />
        <button type="button" className={`is-secondary${activeSection === 'library' ? ' is-active' : ''}`} onClick={() => goSection('library')}>
          <span className="ed-mode-icon" aria-hidden="true"><FileText /></span><span className="ed-mode-label">All articles</span>
        </button>
        {(isAuthor || showAll) && (
          <button type="button" className={`is-secondary${activeSection === 'trash' ? ' is-active' : ''}`} onClick={() => goSection('trash')}>
            <span className="ed-mode-icon" aria-hidden="true"><Trash2 /></span><span className="ed-mode-label">Trash</span>
          </button>
        )}
      </nav>

      {activeMode && <p className="ed-mode-about">{activeMode.about}</p>}

      {(dashboardNotice || dashboardError) && (
        <p className={`ed-alert${dashboardError ? ' is-error' : ''}`} role="status">{dashboardError || dashboardNotice}</p>
      )}

      {activeSection === 'write' && (
        myArticles.length === 0 ? (
          <div className="ed-card"><EmptyState icon={<PenLine />} title="You haven’t written anything yet" detail="Start an article. It stays private until you send it for review." action={canCreateArticle ? <button type="button" className="ed-btn is-primary" onClick={() => setCreateOpen(true)}><Plus />New article</button> : undefined} /></div>
        ) : (
          <div className="ed-board">
            {boardColumns.map((column) => {
              const items = myArticles.filter((article) => column.states.includes(article.workflowState)).sort(byActivity)
              const shown = column.key === 'live' ? items.slice(0, 6) : items
              return (
                <section key={column.key} className={`ed-column is-${column.tone}`}>
                  <header>
                    <h2><i aria-hidden="true" />{column.title}<span className="ed-count">{items.length}</span></h2>
                    <p>{column.hint}</p>
                  </header>
                  {cardList(shown, quietEmpty(column.key === 'changes' ? 'Nothing to fix.' : 'Empty'))}
                  {items.length > shown.length && <button type="button" className="ed-link" onClick={() => openLibrary('live')}>See all {items.length}</button>}
                </section>
              )
            })}
          </div>
        )
      )}

      {activeSection === 'review' && (
        <div className="ed-stack">
          <Section title="Your reviews" count={myReviewsActive.length} hint="Articles you’ve been asked to review, or have started.">
            {cardList(
              myReviewsActive.map((assignment) => articlesById.get(assignment.articleId)).filter(Boolean) as Article[],
              <div className="ed-card"><EmptyState icon={<CircleCheck />} title="No reviews waiting on you" detail={reviewQueue.length ? 'Pick one from the list below.' : 'You’re all caught up.'} /></div>,
            )}
          </Section>
          <Section title="Waiting for a reviewer" count={reviewQueue.length} hint="Anyone can pick these up. Oldest first.">
            {cardList(
              (reviewQueue.map((assignment) => articlesById.get(assignment.articleId)).filter(Boolean) as Article[]).sort((a, b) => activityOf(a) - activityOf(b)),
              quietEmpty('Nothing is waiting for a reviewer.'),
              (article) => {
                const since = reviewQueue.find((assignment) => assignment.articleId === article.id)?.assignedAt
                const old = since && Date.now() - timestampValue(since) > 2 * DAY
                return since ? <p className={`ed-waiting${old ? ' is-old' : ''}`}><Clock />Waiting {relativeTime(since).replace(' ago', '')}</p> : null
              },
            )}
          </Section>
          {myReviewHistory.length > 0 && (
            <Section title="You reviewed recently">
              <ul className="ed-activity" role="list">
                {myReviewHistory.map((assignment) => {
                  const article = articlesById.get(assignment.articleId)
                  const status = REVIEW_STATUS[assignment.status] || { label: assignment.status, tone: 'muted' as StageTone }
                  return (
                    <li key={assignment.id}>
                      <StageBadge stage={status} />
                      <p>{article ? <button type="button" className="ed-inline-link" onClick={() => setPanelArticleId(article.id)}>{article.workingTitle}</button> : assignment.articleTitle || 'Article'}</p>
                      <When value={assignment.decidedAt} />
                    </li>
                  )
                })}
              </ul>
            </Section>
          )}
        </div>
      )}

      {activeSection === 'publish' && (
        <div className="ed-stack">
          {pubProblems.length > 0 && (
            <Section title="Didn’t finish publishing" count={pubProblems.length} hint="These were sent to the website but it didn’t confirm. Try again." tone="attention">
              {cardList(pubProblems, null)}
            </Section>
          )}
          <Section title="Ready to publish" count={pubReady.length} hint="Approved by reviewers. Publish now, or schedule a time.">
            {cardList(pubReady, <div className="ed-card"><EmptyState icon={<Send />} title="Nothing waiting to be published" detail="Articles appear here once a reviewer approves them." /></div>,
              (article) => {
                const approvers = assignmentsFor(article).filter((assignment) => assignment.status === 'Approved').map((assignment) => assignment.reviewerName || '')
                return approvers.length ? <p className="ed-waiting"><CircleCheck />Approved by {nameList(approvers)}</p> : null
              })}
          </Section>
          {pubRunning.length > 0 && (
            <Section title="Publishing now" count={pubRunning.length} hint="Usually takes under a minute.">
              {cardList(pubRunning, null)}
            </Section>
          )}
          {pubScheduled.length > 0 && (
            <Section title="Coming up" count={pubScheduled.length}>
              {cardList(pubScheduled, null)}
            </Section>
          )}
          <Section title="Recently published" action={<button type="button" className="ed-link" onClick={() => openLibrary('live')}>All live articles</button>}>
            {table(pubRecent, quietEmpty('Nothing published yet.'), (article) => article.lastPublishedAt)}
          </Section>
        </div>
      )}

      {activeSection === 'manage' && (
        <div className="ed-stack">
          <section className="ed-health" aria-label="Team overview">
            {health.map((item) => (
              <button key={item.key} type="button" className="ed-health-item" onClick={() => openLibrary(item.key)}>
                <span>{item.note}</span>
                <strong>{item.value}</strong>
                <em>{item.label}</em>
              </button>
            ))}
          </section>
          <div className="ed-split">
            <Section title="Stuck for more than 3 days" count={stuck.length || undefined} tone={stuck.length ? 'attention' : undefined}>
              {stuck.length === 0
                ? <div className="ed-card"><EmptyState icon={<CircleCheck />} title="Nothing is stuck" detail="Every article has moved in the last 3 days." /></div>
                : cardList(stuck, null, (article) => <p className="ed-waiting is-old"><Clock />No movement for {relativeTime(waitingSince(article)).replace(' ago', '')}</p>)}
            </Section>
            <Section title="Who’s doing what">
              {people.length === 0 ? quietEmpty('No one has work in progress.') : (
                <div className="ed-card">
                  <ul className="ed-people" role="list">
                    <li className="is-head" aria-hidden="true"><span>Person</span><span>Writing</span><span>In review</span><span>Reviewing</span></li>
                    {people.map((person) => (
                      <li key={person.name}>
                        <span className="ed-fact-person"><Avatar name={person.name} size={24} />{person.name}</span>
                        <span>{person.writing || '–'}</span>
                        <span>{person.inReview || '–'}</span>
                        <span>{person.reviewing || '–'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          </div>
          <Section title="Recent activity">{activityList(meaningfulEvents.slice(0, 10))}</Section>
          {staleRecords.length > 0 && (
            <details className="ed-housekeeping">
              <summary>{staleRecords.length} old publishing record{staleRecords.length === 1 ? '' : 's'} didn’t update (the articles are live, nothing to do)</summary>
              <ul>{staleRecords.map((article) => <li key={article.id}>{article.workingTitle} · sent <When value={activePublicationJobByArticleId.get(article.id)?.requestedAt} /></li>)}</ul>
            </details>
          )}
        </div>
      )}

      {activeSection === 'library' && (
        <div className="ed-stack">
          {toolbar('Search by title, author or category', true)}
          <div className="ed-chips" role="group" aria-label="Filter by stage">
            {STAGE_FILTERS.map((filter) => {
              const count = searchableArticles.filter(filter.test).length
              if (filter.key !== 'all' && count === 0 && stageFilter !== filter.key) return null
              return (
                <button key={filter.key} type="button" aria-pressed={stageFilter === filter.key} className={stageFilter === filter.key ? 'is-active' : ''} onClick={() => setStageFilter(filter.key)}>
                  {filter.label}<span>{count}</span>
                </button>
              )
            })}
          </div>
          {table(libraryRows, <div className="ed-card"><EmptyState icon={<FileText />} title={queryText || stageFilter !== 'all' ? 'No articles match' : 'No articles yet'} detail={queryText || stageFilter !== 'all' ? 'Try a different search or stage.' : 'New articles will appear here.'} /></div>)}
        </div>
      )}

      {activeSection === 'trash' && (
        <div className="ed-stack">
          <p className="ed-mode-about">Drafts you removed. Restore one to keep working on it.</p>
          {table(trashRows, <div className="ed-card"><EmptyState icon={<Trash2 />} title="Trash is empty" /></div>, (article) => article.archivedAt)}
          {canResetTestContent && <button type="button" className="ed-link is-danger" disabled={resetBusy} onClick={openResetDialog}>Reset local test content</button>}
        </div>
      )}

      {panelArticle && panel(panelArticle)}
      {createOpen && (
        <div className="dialog-backdrop" role="presentation">
          <DialogFrame busy={createBusy || createCategoryBusy} onClose={() => setCreateOpen(false)} className="review-dialog new-article-dialog" role="dialog" aria-modal="true" aria-labelledby="new-article-title">
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
              {canCreateCategory && (
                <div className="taxonomy-create-row in-dialog">
                  <label>
                    <span>Create a category</span>
                    <input
                      value={createCategoryName}
                      maxLength={150}
                      placeholder="New governed category"
                      onChange={(event) => setCreateCategoryName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void createCategory()
                        }
                      }}
                    />
                  </label>
                  <button type="button" className="secondary-command" disabled={createCategoryBusy || createCategoryName.trim().length < 2} onClick={() => void createCategory()}>
                    <Plus /> {createCategoryBusy ? 'Adding' : 'Add'}
                  </button>
                </div>
              )}
              <label className="field-label">
                Approval policy
                <select value={createPolicyId} onChange={(event) => setCreatePolicyId(event.target.value)}>
                  {data.approvalPolicies.map((policy) => (
                    <option key={policy.ID} value={policy.ID}>{displayLookup(policy)}</option>
                  ))}
                </select>
              </label>
              {approvalPolicySummary(data, createPolicyId) && (
                <p className="policy-choice-summary"><ShieldCheck /> {approvalPolicySummary(data, createPolicyId)}</p>
              )}
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
          </DialogFrame>
        </div>
      )}

      {scheduleArticleTarget && (
        <div className="dialog-backdrop" role="presentation">
          <DialogFrame busy={scheduleBusy} onClose={() => setScheduleArticleTarget(null)} className="review-dialog new-article-dialog" role="dialog" aria-modal="true" aria-labelledby="schedule-article-title">
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
                  min={formatDateTimeLocal(new Date(Date.now() + 2 * 60 * 1000))}
                  onChange={(event) => setScheduleAt(event.target.value)}
                />
              </label>
              <p className="field-help">Choose a time at least two minutes from now.</p>
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
          </DialogFrame>
        </div>
      )}

      {retractArticleTarget && (
        <div className="dialog-backdrop" role="presentation">
          <DialogFrame busy={retractBusy} onClose={() => setRetractArticleTarget(null)} className="review-dialog new-article-dialog" role="dialog" aria-modal="true" aria-labelledby="retract-article-title">
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
          </DialogFrame>
        </div>
      )}

      {resetDialogOpen && (
        <div className="dialog-backdrop" role="presentation">
          <DialogFrame busy={resetBusy} onClose={() => setResetDialogOpen(false)} className="review-dialog new-article-dialog reset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-content-title">
            <header>
              <div>
                <h2 id="reset-content-title">Reset test content?</h2>
                <p>This deletes article workspace test data from Creator.</p>
              </div>
              <button className="icon-command" type="button" title="Close" aria-label="Close" disabled={resetBusy} onClick={() => setResetDialogOpen(false)}><X /></button>
            </header>
            <div className="review-dialog-body">
              <div className="reset-warning-panel">
                <AlertCircle />
                <div>
                  <strong>This cannot be undone from the widget.</strong>
                  <p>It deletes articles, revisions, media rows, review rows, publication jobs, and audit events. Employees, roles, policies, categories, tags, and site settings stay in place.</p>
                </div>
              </div>
              <p className="section-hint">{loadedContentCount} loaded dashboard records will be removed, plus related revision, media, and comment records that are not loaded in the dashboard.</p>
              <label className="field-label">
                Type {RESET_TEST_CONTENT_CONFIRMATION} to confirm
                <input value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} placeholder={RESET_TEST_CONTENT_CONFIRMATION} />
              </label>
              {resetError && <p className="dialog-error">{resetError}</p>}
            </div>
            <footer>
              <button type="button" className="secondary-command" disabled={resetBusy} onClick={() => setResetDialogOpen(false)}>Cancel</button>
              <button type="button" className="submit-review-command danger-command" disabled={resetBusy || resetConfirmation.trim() !== RESET_TEST_CONTENT_CONFIRMATION} onClick={() => void resetTestContent()}>
                <Trash2 /> {resetBusy ? 'Resetting' : 'Reset content'}
              </button>
            </footer>
          </DialogFrame>
        </div>
      )}

      {archiveArticleTarget && (
        <div className="dialog-backdrop" role="presentation">
          <DialogFrame busy={Boolean(archiveBusyId)} onClose={() => setArchiveArticleTarget(null)} className="review-dialog new-article-dialog" role="dialog" aria-modal="true" aria-labelledby="archive-article-title">
            <header>
              <div>
                <h2 id="archive-article-title">Move draft to Trash?</h2>
                <p>{archiveArticleTarget.workingTitle}</p>
              </div>
              <button className="icon-command" type="button" title="Close" aria-label="Close" disabled={archiveBusyId !== ''} onClick={() => setArchiveArticleTarget(null)}><X /></button>
            </header>
            <div className="review-dialog-body">
              <p>The draft will leave active work, but its revisions and audit history will be preserved. It can be restored later.</p>
              {archiveError && <p className="dialog-error">{archiveError}</p>}
            </div>
            <footer>
              <button type="button" className="secondary-command" disabled={archiveBusyId !== ''} onClick={() => setArchiveArticleTarget(null)}>Cancel</button>
              <button type="button" className="submit-review-command danger-command" disabled={archiveBusyId !== ''} onClick={() => void archiveDraft()}>
                <Trash2 /> {archiveBusyId ? 'Moving' : 'Move to Trash'}
              </button>
            </footer>
          </DialogFrame>
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
  const [recoveryWarning, setRecoveryWarning] = useState('')
  const recoveryStorage = useMemo(() => createRecoveryStorage(() => window.localStorage, setRecoveryWarning), [])
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
  const [actionOutcome, setActionOutcome] = useState<ActionOutcome | null>(null)
  const [reviewActionOpen, setReviewActionOpen] = useState(false)
  const [reviewActionBusy, setReviewActionBusy] = useState(false)
  const [reviewActionError, setReviewActionError] = useState('')
  const [workspacePublishBusy, setWorkspacePublishBusy] = useState(false)
  const [newVersionBusy, setNewVersionBusy] = useState(false)
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const [discardBusy, setDiscardBusy] = useState(false)
  const revisionRef = useRef<Revision | null>(null)
  const articleRef = useRef<Article | null>(null)
  const changeVersionRef = useRef(0)
  const savePromiseRef = useRef<Promise<boolean> | null>(null)
  const saveQueuedRef = useRef(false)
  const taxonomyDirtyRef = useRef(false)
  const taxonomyVersionRef = useRef(0)
  const titleTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const dashboardRefreshPromiseRef = useRef<Promise<void> | null>(null)
  const workspaceLoadRef = useRef(0)

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
        articleRef.current = data.article
        const stored = recoveryStorage.getItem(recoveryKey(data.revision.id))
        if (stored && canEditArticle(data.article, data.review.currentEmployee)
          && data.revision.state === 'Draft'
          && (data.article.workflowState === 'Draft' || data.article.workflowState === 'Changes Requested')) {
          try {
            const parsed = parseRecovery(stored, data.revision.id)
            if (parsed.id === data.revision.id) setRecovery(parsed)
          } catch {
            setRecoveryWarning('A damaged local recovery copy was ignored. The saved Creator draft is unchanged.')
            recoveryStorage.removeItem(recoveryKey(data.revision.id))
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
    const requestVersion = workspaceLoadRef.current
    const operation = repository.loadDashboard()
      .then((data) => {
        if (workspaceLoadRef.current !== requestVersion) return
        setDashboard(data)
        setDashboardUpdatedAt(Date.now())
      })
      .finally(() => {
        if (dashboardRefreshPromiseRef.current === operation) dashboardRefreshPromiseRef.current = null
      })
    dashboardRefreshPromiseRef.current = operation
    return operation
  }, [])

  const handleOpenArticle = useCallback((articleId: string, revisionId?: string) => {
    const requestVersion = ++workspaceLoadRef.current
    openWorkspaceArticle(articleId, revisionId)
    setLoadingError('')
    setSaveError('')
    setSaveStatus('idle')
    setActionMessage('')
    setActionOutcome(null)
    setDashboard(null)
    setWorkspace(null)
    setRevision(null)
    setRecovery(null)
    setPreview(false)
    revisionRef.current = null
    articleRef.current = null

    void repository.loadWorkspace(articleId, revisionId)
      .then((data) => {
        if (workspaceLoadRef.current !== requestVersion) return
        setWorkspace(data)
        setRevision(data.revision)
        revisionRef.current = data.revision
        articleRef.current = data.article
        const stored = recoveryStorage.getItem(recoveryKey(data.revision.id))
        if (stored && canEditArticle(data.article, data.review.currentEmployee)
          && data.revision.state === 'Draft'
          && (data.article.workflowState === 'Draft' || data.article.workflowState === 'Changes Requested')) {
          try {
            const parsed = parseRecovery(stored, data.revision.id)
            if (parsed.id === data.revision.id) setRecovery(parsed)
          } catch {
            setRecoveryWarning('A damaged local recovery copy was ignored. The saved Creator draft is unchanged.')
            recoveryStorage.removeItem(recoveryKey(data.revision.id))
          }
        }
      })
      .catch((error) => {
        if (workspaceLoadRef.current !== requestVersion) return
        setLoadingError(errorMessage(error, 'The workspace could not be loaded.'))
      })
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
        const savingTaxonomyVersion = taxonomyVersionRef.current
        const shouldSaveTaxonomy = taxonomyDirtyRef.current
        setSaveStatus('saving')
        setSaveError('')
        try {
          const saved = await repository.saveDraft(saveInput(current, articleRef.current || undefined, shouldSaveTaxonomy))
          if (shouldSaveTaxonomy && savingTaxonomyVersion === taxonomyVersionRef.current) {
            taxonomyDirtyRef.current = false
          }
          if (savingVersion === changeVersionRef.current) {
            revisionRef.current = saved
            setRevision(saved)
            setSaveStatus('saved')
            recoveryStorage.removeItem(recoveryKey(saved.id))
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
              recoveryStorage.setItem(recoveryKey(rebased.id), JSON.stringify(saveInput(rebased, articleRef.current || undefined, taxonomyDirtyRef.current)))
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
    if (!['dirty', 'saving', 'error'].includes(saveStatus)) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [saveStatus])

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
    recoveryStorage.setItem(recoveryKey(next.id), JSON.stringify(saveInput(next, articleRef.current || undefined, taxonomyDirtyRef.current)))
    changeVersionRef.current += 1
    setSaveStatus('dirty')
    setChangeVersion(changeVersionRef.current)
  }, [])

  const updateArticle = useCallback((changes: Partial<Article>) => {
    const current = articleRef.current
    if (!current || !revisionRef.current) return
    const next = { ...current, ...changes }
    articleRef.current = next
    setWorkspace((workspace) => workspace ? { ...workspace, article: next } : workspace)
    taxonomyDirtyRef.current = true
    taxonomyVersionRef.current += 1
    recoveryStorage.setItem(recoveryKey(revisionRef.current.id), JSON.stringify(saveInput(revisionRef.current, next, true)))
    changeVersionRef.current += 1
    setSaveStatus('dirty')
    setChangeVersion(changeVersionRef.current)
  }, [])

  const createWorkspaceTaxonomy = useCallback(async (kind: TaxonomyKind, name: string): Promise<LookupValue> => {
    const result = await repository.createTaxonomyTerm(kind, name)
    setWorkspace((current) => {
      if (!current) return current
      const key = kind === 'category' ? 'categories' : 'tags'
      const collection = current[key]
      const nextCollection = collection.some((term) => term.ID === result.term.ID)
        ? collection
        : [...collection, result.term].sort((a, b) => displayLookup(a).localeCompare(displayLookup(b)))
      return { ...current, [key]: nextCollection }
    })
    setActionMessage(result.message || `${displayLookup(result.term)} is ready to use.`)
    return result.term
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
    setActionOutcome(null)
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
      const latestArticle = articleRef.current || currentWorkspace.article
      const submittedArticle = { ...latestArticle, workflowState: result.state }
      articleRef.current = submittedArticle
      revisionRef.current = submittedRevision
      setRevision(submittedRevision)
      setWorkspace({
        ...currentWorkspace,
        article: submittedArticle,
        revision: submittedRevision,
      })
      setPreview(true)
      setReviewDialogOpen(false)
      recoveryStorage.removeItem(recoveryKey(submittedRevision.id))
      setRecovery(null)
      setActionOutcome({
        title: 'Sent for review',
        message: `${result.message} ${result.assignmentIds.length} assignment${result.assignmentIds.length === 1 ? '' : 's'} created. The submitted revision is now read-only.`,
        dashboardLabel: 'Back to dashboard',
      })
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
    setActionOutcome(null)
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
    setActionOutcome(null)
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
    setActionOutcome(null)
    try {
      const result = await repository.recordReviewDecision(assignment.id, decision, summary)
      updateReviewAssignment({ status: decision, decision, decisionSummary: summary })
      setWorkspace((current) => current ? {
        ...current,
        article: (() => {
          const nextArticle = {
          ...(articleRef.current || current.article),
          workflowState: result.articleState || current.article.workflowState,
          activeDraftRevisionId: result.newDraftRevisionId || current.article.activeDraftRevisionId,
          }
          articleRef.current = nextArticle
          return nextArticle
        })(),
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
      const nextReview = await repository.loadDashboard().then((data) => {
        const articles = new Map(data.articles.map((article) => [article.id, article]))
        return data.assignments
          .filter((item) => item.id !== assignment.id)
          .filter((item) => activeReviewAssignment(item, articles.get(item.articleId)))
          .find((item) => assignmentBelongsToCurrentReviewer(item, data.currentEmployee)
            || (item.status === 'Queued' && data.currentEmployee?.roles.includes('Reviewer')))
      }).catch(() => undefined)
      setActionOutcome({
        title: decision === 'Approved' ? 'Approval recorded' : decision === 'Changes Requested' ? 'Changes requested' : 'Article rejected',
        message,
        dashboardLabel: 'Review dashboard',
        nextReview: nextReview ? { articleId: nextReview.articleId, revisionId: nextReview.revisionId } : undefined,
      })
      setReviewActionOpen(false)
    } catch (error) {
      setReviewActionError(errorMessage(error, 'The review decision could not be recorded.'))
    } finally {
      setReviewActionBusy(false)
    }
  }, [updateReviewAssignment, workspace])

  const publishWorkspaceArticle = useCallback(async () => {
    const currentWorkspace = workspace
    if (!currentWorkspace) return
    setWorkspacePublishBusy(true)
    setActionMessage('')
    setActionOutcome(null)
    setSaveError('')
    try {
      const result = await repository.publishArticle(currentWorkspace.article.id)
      const nextArticle = {
        ...currentWorkspace.article,
        workflowState: result.articleState || currentWorkspace.article.workflowState,
        publishedRevisionId: result.revisionId || currentWorkspace.article.publishedRevisionId,
        lastPublishedAt: result.publishedAt || currentWorkspace.article.lastPublishedAt,
        firstPublishedAt: currentWorkspace.article.firstPublishedAt || result.publishedAt,
      }
      articleRef.current = nextArticle
      setWorkspace({ ...currentWorkspace, article: nextArticle })
      setActionOutcome({
        title: 'Publication started',
        message: result.message || `${currentWorkspace.article.workingTitle} was sent for publishing.`,
        dashboardLabel: 'Publishing dashboard',
        floating: true,
      })
    } catch (error) {
      setSaveError(errorMessage(error, 'The article could not be published.'))
    } finally {
      setWorkspacePublishBusy(false)
    }
  }, [workspace])

  const startNewVersion = async () => {
    const currentWorkspace = workspace
    if (!currentWorkspace) return
    setNewVersionBusy(true)
    setSaveError('')
    try {
      const result = await repository.startNewRevision(currentWorkspace.article.id, '')
      handleOpenArticle(currentWorkspace.article.id, result.revisionId)
    } catch (error) {
      setSaveError(errorMessage(error, 'A new version could not be started.'))
    } finally {
      setNewVersionBusy(false)
    }
  }

  const discardNewVersion = async () => {
    const currentWorkspace = workspace
    if (!currentWorkspace) return
    setDiscardBusy(true)
    setSaveError('')
    try {
      await repository.discardNewRevision(currentWorkspace.article.id)
      recoveryStorage.removeItem(recoveryKey(revisionRef.current?.id || ''))
      setDiscardConfirm(false)
      handleOpenArticle(currentWorkspace.article.id)
    } catch (error) {
      setSaveError(errorMessage(error, 'The new version could not be discarded.'))
    } finally {
      setDiscardBusy(false)
    }
  }

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
    if (dashboard) return <EditorialDashboard data={dashboard} onRefresh={refreshDashboard} onOpenArticle={handleOpenArticle} updatedAt={dashboardUpdatedAt} />
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
  const workspaceRoles = workspace.review.currentEmployee?.roles || []
  const canSubmitCurrentArticle = editable && (workspaceRoles.includes('Author') || workspaceRoles.includes('Editorial Admin') || workspaceRoles.includes('CEO'))
  const canReviewCurrentArticle = workspace.article.workflowState === 'In Review'
    && workspace.review.assignment
    && ACTIVE_ASSIGNMENT_STATES.has(workspace.review.assignment.status)
    && workspace.review.canReview
  const canPublishCurrentArticle = workspace.article.workflowState === 'Approved'
    && revision.id === workspace.article.approvedRevisionId
    && (workspaceRoles.includes('Publisher') || workspaceRoles.includes('Editorial Admin') || workspaceRoles.includes('CEO'))
  const manager = canEditArticle(workspace.article, workspace.review.currentEmployee)
  const hasPublishedVersion = Boolean(workspace.article.publishedRevisionId)
  const lockedState = workspace.article.workflowState
  const canStartNewVersion = manager && ['Approved', 'Published', 'Unpublished', 'Rejected'].includes(lockedState)
  const canDiscardNewVersion = manager && hasPublishedVersion && ['Draft', 'Changes Requested', 'Rejected'].includes(lockedState)
  const lockedReason = lockedState === 'Published'
    ? 'This version is live on the website and is locked.'
    : lockedState === 'Unpublished'
      ? 'This article was withdrawn from the website and is locked.'
      : lockedState === 'Approved'
        ? 'This version is approved and locked. Starting a new version replaces the approval, so it will need review again.'
        : 'This version was rejected and is locked.'
  // Once an article has gone live its address is fixed, so links people
  // already hold keep working after a correction.
  const slugLocked = hasPublishedVersion
  const missingReadinessItems = readinessMissing(workspace.article, revision)
  const showPromotedFeedback = workspace.article.workflowState === 'Changes Requested' && workspace.feedback.some(reviewFeedbackHasVisibleContent)

  const restoreRecovery = async () => {
    if (!recovery) return
    try {
      const document = await repository.hydrateDocument(recovery.document)
      const { expectedChecksum, expectedVersionToken, primaryCategoryId, tagIds, saveTaxonomy, ...recoveredFields } = recovery
      const restored = revisionRef.current
        ? {
          ...revisionRef.current,
          ...recoveredFields,
          checksum: expectedChecksum || undefined,
          versionToken: expectedVersionToken,
          document,
        }
        : null
      revisionRef.current = restored
      setRevision(restored)
      const recoveredTagIds = tagIds || []
      const recoveredArticle = saveTaxonomy && articleRef.current ? {
        ...articleRef.current,
        primaryCategory: workspace.categories.find((category) => category.ID === primaryCategoryId),
        tags: workspace.tags.filter((tag) => recoveredTagIds.includes(tag.ID)),
      } : null
      if (recoveredArticle) {
        articleRef.current = recoveredArticle
        setWorkspace((current) => current ? { ...current, article: recoveredArticle } : current)
        taxonomyDirtyRef.current = true
        taxonomyVersionRef.current += 1
      }
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
          <button className="icon-command" type="button" title="Back to dashboard" aria-label="Back to dashboard" onClick={() => {
            void (async () => {
              if (['dirty', 'saving', 'error'].includes(saveStatus) && !await saveNow()) return
              openDashboard()
            })()
          }}>
            <ArrowLeft />
          </button>
          <div className="brand-mark" aria-hidden="true">G</div>
          <div className="document-identity">
            <strong>{revision.title || workspace.article.workingTitle || 'Untitled article'}</strong>
            <span>
              <StatusPill state={workspace.article.workflowState} />
              <em>Revision {revision.number}</em>
            </span>
          </div>
        </div>

        <div className={`save-state is-${saveStatus}${missingReadinessItems.length ? ' has-missing' : ''}`} aria-live="polite">
          {status.icon}<span>{status.label}</span>
        </div>

        <div className="header-actions">
          <button className="icon-command" type="button" title={preview ? 'Exit preview' : 'Preview'} aria-label={preview ? 'Exit preview' : 'Preview'} onClick={() => setPreview((value) => !value)}>
            {preview ? <EyeOff /> : <Eye />}
          </button>
          <button className="icon-command" type="button" title={inspectorOpen ? 'Hide inspector' : 'Show inspector'} aria-label={inspectorOpen ? 'Hide inspector' : 'Show inspector'} onClick={() => setInspectorOpen((value) => !value)}>
            {inspectorOpen ? <PanelRightClose /> : <PanelRightOpen />}
          </button>
          {editable && (
            <button className="save-command" type="button" disabled={saveStatus === 'saving'} onClick={() => void saveNow()}>
              <Save /> Save draft
            </button>
          )}
          {canSubmitCurrentArticle && (
            <button className="submit-review-command header-submit" type="button" disabled={reviewBusy} onClick={() => {
              setReviewError('')
              setReviewDialogOpen(true)
            }}>
              <Send /> {workspace.article.workflowState === 'Changes Requested' ? 'Resubmit' : 'Submit for review'}
            </button>
          )}
          {canReviewCurrentArticle && (
            <button className="submit-review-command header-submit" type="button" onClick={() => {
              setReviewActionError('')
              setReviewActionOpen(true)
            }}>
              <ClipboardCheck /> Review
            </button>
          )}
          {canPublishCurrentArticle && (
            <button className="submit-review-command header-submit" type="button" disabled={workspacePublishBusy} onClick={() => void publishWorkspaceArticle()}>
              <Send /> {workspacePublishBusy ? 'Publishing' : 'Publish'}
            </button>
          )}
        </div>
      </header>

      {recovery && (
        <div className="recovery-banner">
          <span><RotateCcw /> A local recovery copy is available. Restoring replaces the current draft fields.</span>
          <div>
            <button type="button" onClick={() => {
              recoveryStorage.removeItem(recoveryKey(revision.id))
              setRecovery(null)
            }}>Discard</button>
            <button type="button" onClick={() => void restoreRecovery()}>Restore</button>
          </div>
        </div>
      )}

      {recoveryWarning && <div className="error-banner" role="alert"><AlertCircle /> {recoveryWarning}</div>}

      {saveError && (
        <div className="error-banner" role="alert"><AlertCircle /> {saveError}</div>
      )}

      {actionMessage && (
        <div className="success-banner" role="status"><Check /> {actionMessage}</div>
      )}

      {actionOutcome && (actionOutcome.floating ? (
        <FloatingNotice
          notice={{
            id: 0,
            tone: 'success',
            title: actionOutcome.title,
            message: actionOutcome.message,
            actionLabel: actionOutcome.dashboardLabel,
            onAction: openDashboard,
          }}
          onDismiss={() => setActionOutcome(null)}
        />
      ) : (
        <WorkflowOutcome outcome={actionOutcome} onDismiss={() => setActionOutcome(null)} />
      ))}

      {canStartNewVersion && (
        <div className="version-banner" role="status">
          <span><GitBranch /> {lockedReason} To make changes, start a new version. Your changes go live only after the new version is reviewed, approved and published.</span>
          <div>
            {canDiscardNewVersion && lockedState === 'Rejected' && (
              <button type="button" disabled={discardBusy || newVersionBusy} onClick={() => void discardNewVersion()}>
                {discardBusy ? 'Returning' : 'Back to published version'}
              </button>
            )}
            <button type="button" className="is-primary" disabled={newVersionBusy || discardBusy} onClick={() => void startNewVersion()}>
              {newVersionBusy ? 'Starting' : 'Start new version'}
            </button>
          </div>
        </div>
      )}

      {canDiscardNewVersion && lockedState !== 'Rejected' && revision.state === 'Draft' && (
        <div className="version-banner" role="status">
          <span><GitBranch /> You are editing a new version. The published version stays on the website until this one is approved and published.</span>
          <div>
            {discardConfirm ? (
              <>
                <button type="button" disabled={discardBusy} onClick={() => setDiscardConfirm(false)}>Keep editing</button>
                <button type="button" className="is-danger" disabled={discardBusy} onClick={() => void discardNewVersion()}>
                  {discardBusy ? 'Discarding' : 'Discard these changes'}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setDiscardConfirm(true)}>Discard new version</button>
            )}
          </div>
        </div>
      )}

      <main className="workspace-main">
        <section className="document-column">
          {showPromotedFeedback && <ReviewFeedbackPanel feedback={workspace.feedback} />}
          <ArticleWorkflowTimeline article={workspace.article} auditEvents={workspace.auditEvents} />
          <RevisionComparison current={revision} previous={workspace.previousRevision} />
          <section className={`readiness-checklist${missingReadinessItems.length ? '' : ' is-ready'}`} aria-label="Publishing readiness">
            <div>
              <strong>{missingReadinessItems.length ? 'Before this is ready' : 'Ready for workflow'}</strong>
              <span>{missingReadinessItems.length ? 'Complete the missing editorial fields below.' : 'Required editorial fields are present.'}</span>
            </div>
            {missingReadinessItems.length ? (
              <ul>
                {missingReadinessItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <span className="readiness-ready"><Check /> Ready</span>
            )}
          </section>
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
                const shouldUpdateSlug = !slugLocked && revision.slug === slugify(revision.title)
                updateRevision({ title, ...(shouldUpdateSlug ? { slug: slugify(title) } : {}) })
              }}
            />
            <div className="slug-row">
              <span>/insights/</span>
              <input
                aria-label="Article slug"
                value={revision.slug}
                maxLength={180}
                readOnly={preview || !editable || slugLocked}
                title={slugLocked ? 'The web address is fixed once an article has been published.' : undefined}
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
            categories={workspace.categories}
            tags={workspace.tags}
            feedback={showPromotedFeedback ? [] : workspace.feedback}
            readOnly={!editable}
            canCreateCategory={editable && (workspaceRoles.includes('Editorial Admin') || workspaceRoles.includes('CEO'))}
            canCreateTag={editable && (workspaceRoles.includes('Author') || workspaceRoles.includes('Editorial Admin') || workspaceRoles.includes('CEO'))}
            onChange={updateRevision}
            onArticleChange={updateArticle}
            onCreateTaxonomy={createWorkspaceTaxonomy}
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
        missingItems={missingReadinessItems}
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

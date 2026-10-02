import type { JSONContent } from '@tiptap/react'

export type LookupValue = {
  ID: string
  zc_display_value?: string
  display_value?: string
}

export type MediaMetadata = {
  altText: string
  caption: string
}

export type MediaAsset = MediaMetadata & {
  id: string
  uuid: string
  originalFilename: string
  mimeType: string
  fileSizeBytes: number
  widthPixels: number
  heightPixels: number
  // Retained only so existing Creator records and historical snapshots remain
  // readable. Credit is no longer collected or rendered by the authoring UI.
  credit: string
  status: 'Draft' | 'Processing' | 'Ready' | 'Failed' | 'Archived'
  previewUrl: string
}

export type Article = {
  id: string
  uuid: string
  workingTitle: string
  owner: LookupValue
  primaryAuthor: LookupValue
  primaryCategory?: LookupValue
  tags: LookupValue[]
  approvalPolicy: LookupValue
  workflowState: string
  activeDraftRevisionId?: string
  approvedRevisionId?: string
  publishedRevisionId?: string
  scheduledAt?: string
  firstPublishedAt?: string
  lastPublishedAt?: string
  archivedAt?: string
}

export type ApprovalPolicyOption = LookupValue & {
  description: string
  requiredApprovals: number
  isDefault: boolean
}

export type TaxonomyKind = 'category' | 'tag'

export type TaxonomyTermResult = {
  ok: boolean
  message: string
  kind: TaxonomyKind
  term: LookupValue
  created: boolean
}

export type ReviewerOption = {
  id: string
  displayName: string
  workEmail: string
  jobTitle: string
  expertise: string[]
}

export type SubmitForReviewResult = {
  ok: boolean
  message: string
  articleId: string
  revisionId: string
  state: string
  requiredApprovals: number
  assignmentIds: string[]
}

export type CurrentEmployee = {
  id: string
  displayName: string
  workEmail: string
  roles: string[]
}

export type ReviewAssignment = {
  id: string
  uuid: string
  articleId: string
  articleTitle?: string
  revisionId: string
  revisionTitle?: string
  reviewerId?: string
  reviewerName?: string
  source: 'Author Suggested' | 'Queue' | 'Admin Assigned'
  status: 'Queued' | 'Assigned' | 'Claimed' | 'Approved' | 'Changes Requested' | 'Rejected' | 'Cancelled'
  decision?: 'Approved' | 'Changes Requested' | 'Rejected'
  decisionSummary: string
  assignedAt: string
  claimedAt: string
  decidedAt: string
}

export type ReviewComment = {
  id: string
  assignmentId: string
  revisionId: string
  authorId: string
  authorName: string
  type: 'General' | 'Change Request' | 'Reply' | 'Resolution'
  body: string
  documentAnchor: string
  resolved: boolean
}

export type AuditEvent = {
  id: string
  uuid: string
  entityType: string
  entityUuid: string
  eventType: string
  actorId?: string
  actorName?: string
  previousState: string
  newState: string
  summary: string
  occurredAt: string
}

export type ReviewContext = {
  currentEmployee?: CurrentEmployee
  assignment?: ReviewAssignment
  comments: ReviewComment[]
  canReview: boolean
}

export type ReviewFeedback = {
  id: string
  revisionId: string
  reviewerName: string
  status: ReviewAssignment['status']
  decisionSummary: string
  decidedAt: string
  comments: ReviewComment[]
}

export type ReviewActionResult = {
  ok: boolean
  message: string
  assignmentId: string
  articleId: string
  revisionId: string
  status?: string
  decision?: string
  articleState?: string
  approvedReviewerCount?: number
  requiredApprovals?: number
  newDraftRevisionId?: string
  newDraftRevisionNumber?: number
  newDraftRevisionUuid?: string
}

export type Revision = {
  id: string
  uuid: string
  articleId: string
  number: number
  state: 'Draft' | 'Submitted' | 'Approved' | 'Superseded' | 'Published'
  title: string
  slug: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  robotsDirective: 'Index Follow' | 'Noindex Follow' | 'Noindex Nofollow'
  wordCount: number
  readingTimeMinutes: number
  checksum?: string
  versionToken: string
  featuredMediaId?: string
  featuredMedia?: MediaAsset
  document: JSONContent
}

export type WorkspaceData = {
  article: Article
  revision: Revision
  previousRevision?: Revision
  eligibleReviewers: ReviewerOption[]
  categories: LookupValue[]
  tags: LookupValue[]
  review: ReviewContext
  feedback: ReviewFeedback[]
  auditEvents: AuditEvent[]
  source: 'creator' | 'mock'
}

export type DashboardData = {
  warnings?: string[]
  currentEmployee?: CurrentEmployee
  articles: Article[]
  publicationJobs: PublicationJob[]
  assignments: ReviewAssignment[]
  auditEvents: AuditEvent[]
  categories: LookupValue[]
  approvalPolicies: ApprovalPolicyOption[]
  source: 'creator' | 'mock'
}

export type PublicationJob = {
  id: string
  articleId: string
  revisionId: string
  action: 'Publish' | 'Schedule' | 'Unpublish' | string
  status: 'Queued' | 'Processing' | 'Succeeded' | 'Failed' | 'Cancelled' | string
  requestedBy?: LookupValue
  requestedAt: string
  nextRetryAt: string
  errorCode: string
}

export type ArticleDraftInput = {
  title: string
  categoryId?: string
  approvalPolicyId: string
}

export type ArticleDraftResult = {
  articleId: string
}

export type PublishArticleResult = {
  ok: boolean
  message: string
  articleId: string
  revisionId: string
  jobId: string
  articleState: string
  publishedAt: string
}

export type ScheduleArticleResult = {
  ok: boolean
  message: string
  articleId: string
  revisionId: string
  jobId: string
  articleState: string
  scheduledAt: string
}

export type RetractArticleResult = {
  ok: boolean
  message: string
  articleId: string
  revisionId: string
  jobId: string
  articleState: string
}

export type ArticleLifecycleResult = {
  ok: boolean
  message: string
  articleId: string
  articleState: string
  archivedAt?: string
}

export type WorkspaceResetResult = {
  ok: boolean
  message: string
  deletedArticles: number
  deletedRevisions: number
  deletedReviewAssignments: number
  deletedReviewComments: number
  deletedPublicationJobs: number
  deletedMediaAssets: number
  deletedAuditEvents: number
}

export type SaveRevisionInput = Pick<
  Revision,
  | 'id'
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'seoTitle'
  | 'seoDescription'
  | 'robotsDirective'
  | 'wordCount'
  | 'readingTimeMinutes'
  | 'featuredMediaId'
  | 'document'
> & {
  expectedChecksum: string
  expectedVersionToken: string
  primaryCategoryId?: string
  tagIds: string[]
  saveTaxonomy: boolean
}

export interface EditorialRepository {
  readonly source: 'creator' | 'mock'
  resolveArticleId(): Promise<string | undefined>
  resolveRevisionId(): Promise<string | undefined>
  loadDashboard(): Promise<DashboardData>
  createDraftArticle(input: ArticleDraftInput): Promise<ArticleDraftResult>
  createTaxonomyTerm(kind: TaxonomyKind, name: string): Promise<TaxonomyTermResult>
  loadWorkspace(articleId: string, revisionId?: string): Promise<WorkspaceData>
  saveDraft(input: SaveRevisionInput): Promise<Revision>
  submitForReview(articleId: string, reviewerIds: string[]): Promise<SubmitForReviewResult>
  claimReviewAssignment(assignmentId: string): Promise<ReviewActionResult>
  addReviewComment(assignmentId: string, type: ReviewComment['type'], body: string, documentAnchor?: string): Promise<ReviewComment>
  recordReviewDecision(assignmentId: string, decision: NonNullable<ReviewAssignment['decision']>, summary: string): Promise<ReviewActionResult>
  publishArticle(articleId: string): Promise<PublishArticleResult>
  scheduleArticle(articleId: string, scheduledAt: string): Promise<ScheduleArticleResult>
  retractArticle(articleId: string, reason: string, replacementPath: string): Promise<RetractArticleResult>
  archiveDraftArticle(articleId: string): Promise<ArticleLifecycleResult>
  restoreArchivedArticle(articleId: string): Promise<ArticleLifecycleResult>
  resetTestContent(confirmation: string): Promise<WorkspaceResetResult>
  hydrateDocument(document: JSONContent): Promise<JSONContent>
  createImageAsset(file: File, metadata: MediaMetadata, uploadedById: string): Promise<MediaAsset>
  updateImageAsset(asset: MediaAsset, metadata: MediaMetadata): Promise<MediaAsset>
}

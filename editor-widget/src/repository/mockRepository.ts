import type {
  Article,
  ArticleDraftInput,
  ArticleDraftResult,
  AuditEvent,
  DashboardData,
  EditorialRepository,
  MediaAsset,
  MediaMetadata,
  PublishArticleResult,
  ReviewerOption,
  ReviewActionResult,
  ReviewAssignment,
  ReviewComment,
  Revision,
  ScheduleArticleResult,
  RetractArticleResult,
  SaveRevisionInput,
  SubmitForReviewResult,
  WorkspaceData,
} from '../domain'
import { EMPTY_DOCUMENT, makeOpaqueId, sha256, sha256Blob, slugify } from '../utils'
import { collectMediaIds, canonicalizeMedia, hydrateMedia, mediaDimensions } from '../media'

const TEST_ARTICLE_ID = '471741000000032002'
const STORAGE_KEY = `genedrift:revision:${TEST_ARTICLE_ID}`
const MEDIA_DATABASE = 'genedrift-editorial-preview'
const MEDIA_STORE = 'media-assets'

type StoredMediaAsset = Omit<MediaAsset, 'previewUrl'> & { file: Blob }

function openMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MEDIA_DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(MEDIA_STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function putMedia(asset: StoredMediaAsset): Promise<void> {
  const database = await openMediaDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(MEDIA_STORE, 'readwrite')
    transaction.objectStore(MEDIA_STORE).put(asset)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}

async function getMedia(id: string): Promise<MediaAsset> {
  const database = await openMediaDatabase()
  const stored = await new Promise<StoredMediaAsset | undefined>((resolve, reject) => {
    const request = database.transaction(MEDIA_STORE).objectStore(MEDIA_STORE).get(id)
    request.onsuccess = () => resolve(request.result as StoredMediaAsset | undefined)
    request.onerror = () => reject(request.error)
  })
  database.close()
  if (!stored) throw new Error(`Media asset ${id} is unavailable in this local preview.`)
  const { file, ...asset } = stored
  return { ...asset, previewUrl: URL.createObjectURL(file) }
}

const article: Article = {
  id: TEST_ARTICLE_ID,
  uuid: 'ART-519d5491e1a2c8b0b086087cce578647',
  workingTitle: 'GeneDrift Editorial Workflow Test',
  owner: { ID: '471741000000030001', zc_display_value: 'Piyush Tyagi' },
  primaryAuthor: { ID: '471741000000030001', zc_display_value: 'Piyush Tyagi' },
  primaryCategory: { ID: '471741000000031001', zc_display_value: 'Regulatory Affairs' },
  tags: [
    { ID: '471741000000031101', zc_display_value: 'Drugs' },
    { ID: '471741000000031102', zc_display_value: 'Dossiers' },
  ],
  approvalPolicy: { ID: '471741000000031201', zc_display_value: 'Standard Review' },
  workflowState: 'Draft',
}

const eligibleReviewers: ReviewerOption[] = [
  {
    id: '471741000000030101',
    displayName: 'Ravi Reviewer',
    workEmail: 'ravi.reviewer@example.com',
    jobTitle: 'Regulatory Reviewer',
    expertise: ['Regulatory Affairs'],
  },
  {
    id: '471741000000030102',
    displayName: 'Meera Reviewer',
    workEmail: 'meera.reviewer@example.com',
    jobTitle: 'Medical Reviewer',
    expertise: ['Drug Safety'],
  },
]

let mockAssignment: ReviewAssignment | undefined
let mockComments: ReviewComment[] = []

const mockAuditEvents: AuditEvent[] = [
  {
    id: 'mock-audit-submit',
    uuid: 'EVT-MOCK-SUBMIT',
    entityType: 'Article',
    entityUuid: article.uuid,
    eventType: 'Submitted for Review',
    actorId: article.primaryAuthor.ID,
    actorName: article.primaryAuthor.zc_display_value,
    previousState: 'Draft',
    newState: 'In Review',
    summary: 'Revision 1 submitted to the review workflow.',
    occurredAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
  {
    id: 'mock-audit-decision',
    uuid: 'EVT-MOCK-DECISION',
    entityType: 'Review',
    entityUuid: 'ASG-MOCK-HISTORY',
    eventType: 'Review Approved',
    actorId: eligibleReviewers[0].id,
    actorName: eligibleReviewers[0].displayName,
    previousState: 'In Review',
    newState: 'Approved',
    summary: 'Reviewer approved the submitted revision.',
    occurredAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
]

function revisionVersionToken(revision: Revision): string {
  return JSON.stringify({
    state: revision.state,
    title: revision.title,
    slug: revision.slug,
    excerpt: revision.excerpt,
    seoTitle: revision.seoTitle,
    seoDescription: revision.seoDescription,
    robotsDirective: revision.robotsDirective,
    wordCount: revision.wordCount,
    readingTimeMinutes: revision.readingTimeMinutes,
    checksum: revision.checksum || '',
    featuredMediaId: revision.featuredMediaId || '',
  })
}

function initialRevision(): Revision {
  const revision: Revision = {
    id: 'mock-revision-1',
    uuid: `REV-${article.uuid}-0001`,
    articleId: article.id,
    number: 1,
    state: 'Draft',
    title: article.workingTitle,
    slug: slugify(article.workingTitle),
    excerpt: '',
    seoTitle: '',
    seoDescription: '',
    robotsDirective: 'Index Follow',
    wordCount: 0,
    readingTimeMinutes: 0,
    versionToken: '',
    document: EMPTY_DOCUMENT,
  }
  revision.versionToken = revisionVersionToken(revision)
  return revision
}

async function loadRevision(): Promise<Revision> {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return initialRevision()
  try {
    const revision = JSON.parse(stored) as Revision
    revision.versionToken = revisionVersionToken(revision)
    revision.document = await hydrateMockDocument(revision.document)
    if (revision.featuredMediaId) revision.featuredMedia = await getMedia(revision.featuredMediaId).catch(() => undefined)
    return revision
  } catch {
    return initialRevision()
  }
}

async function hydrateMockDocument(document: Revision['document']) {
  const results = await Promise.allSettled(collectMediaIds(document).map((id) => getMedia(id)))
  const assets = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
  return hydrateMedia(document, new Map(assets.map((asset) => [asset.id, asset])))
}

export class MockEditorialRepository implements EditorialRepository {
  readonly source = 'mock' as const

  async resolveArticleId(): Promise<string | undefined> {
    return new URLSearchParams(window.location.search).get('articleId') ?? undefined
  }

  async resolveRevisionId(): Promise<string | undefined> {
    return new URLSearchParams(window.location.search).get('revisionId') ?? undefined
  }

  async loadDashboard(): Promise<DashboardData> {
    await new Promise((resolve) => window.setTimeout(resolve, 250))
    return {
      currentEmployee: {
        id: eligibleReviewers[0].id,
        displayName: eligibleReviewers[0].displayName,
        workEmail: eligibleReviewers[0].workEmail,
        roles: ['Reviewer'],
      },
      articles: [article],
      publicationJobs: [],
      assignments: mockAssignment ? [mockAssignment] : [{
        id: 'mock-assignment-history',
        uuid: 'ASG-MOCK-HISTORY',
        articleId: article.id,
        revisionId: 'mock-revision-1',
        reviewerId: eligibleReviewers[0].id,
        reviewerName: eligibleReviewers[0].displayName,
        source: 'Author Suggested',
        status: 'Approved',
        decision: 'Approved',
        decisionSummary: 'Local preview decision.',
        assignedAt: new Date().toISOString(),
        claimedAt: new Date().toISOString(),
        decidedAt: new Date().toISOString(),
      }],
      auditEvents: mockAuditEvents,
      categories: [
        { ID: '471741000000031001', zc_display_value: 'Regulatory Affairs' },
        { ID: '471741000000031002', zc_display_value: 'Pharmacovigilance' },
      ],
      approvalPolicies: [
        { ID: '471741000000031201', zc_display_value: 'Standard Review' },
        { ID: '471741000000031202', zc_display_value: 'Regulated Review' },
      ],
      source: this.source,
    }
  }

  async createDraftArticle(input: ArticleDraftInput): Promise<ArticleDraftResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 300))
    const title = input.title.trim()
    if (!title) throw new Error('Enter a working title before creating an article.')
    article.id = makeOpaqueId('mock-article')
    article.uuid = makeOpaqueId('ART')
    article.workingTitle = title
    article.primaryCategory = input.categoryId
      ? { ID: input.categoryId, zc_display_value: input.categoryId.includes('31002') ? 'Pharmacovigilance' : 'Regulatory Affairs' }
      : undefined
    article.approvalPolicy = { ID: input.approvalPolicyId, zc_display_value: input.approvalPolicyId.includes('31202') ? 'Regulated Review' : 'Standard Review' }
    article.workflowState = 'Draft'
    article.activeDraftRevisionId = undefined
    localStorage.removeItem(STORAGE_KEY)
    mockAssignment = undefined
    mockComments = []
    return { articleId: article.id }
  }

  async loadWorkspace(articleId: string, revisionId?: string): Promise<WorkspaceData> {
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    if (articleId !== article.id) {
      throw new Error(`Mock article ${articleId} was not found.`)
    }
    const revision = await loadRevision()
    if (revisionId && revision.id !== revisionId) throw new Error(`Mock revision ${revisionId} was not found.`)
    article.activeDraftRevisionId = revision.id
    return {
      article,
      revision,
      eligibleReviewers,
      review: {
        currentEmployee: {
          id: eligibleReviewers[0].id,
          displayName: eligibleReviewers[0].displayName,
          workEmail: eligibleReviewers[0].workEmail,
          roles: ['Reviewer'],
        },
        assignment: mockAssignment,
        comments: mockComments,
        canReview: article.workflowState === 'In Review',
      },
      source: this.source,
    }
  }

  async saveDraft(input: SaveRevisionInput): Promise<Revision> {
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    const current = await loadRevision()
    if (current.state !== 'Draft') throw new Error('This revision is no longer editable. Reload the workspace.')
    if ((current.checksum || '') !== input.expectedChecksum) {
      throw new Error('This draft changed in another tab or session. Reload before continuing.')
    }
    if (revisionVersionToken(current) !== input.expectedVersionToken) {
      throw new Error('This draft metadata changed in another tab or session. Reload before continuing.')
    }
    const { expectedChecksum: _expectedChecksum, expectedVersionToken: _expectedVersionToken, ...savedInput } = input
    const revision: Revision = {
      ...current,
      ...savedInput,
      uuid: current.uuid || makeOpaqueId('REV'),
      document: canonicalizeMedia(input.document),
      checksum: await sha256(JSON.stringify(canonicalizeMedia(input.document))),
      versionToken: '',
    }
    revision.versionToken = revisionVersionToken(revision)
    const storedRevision = { ...revision, featuredMedia: undefined }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedRevision))
    revision.document = await this.hydrateDocument(revision.document)
    if (revision.featuredMediaId) revision.featuredMedia = await getMedia(revision.featuredMediaId).catch(() => undefined)
    return revision
  }

  async submitForReview(articleId: string, reviewerIds: string[]): Promise<SubmitForReviewResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 550))
    const current = await loadRevision()
    const submitted: Revision = { ...current, state: 'Submitted' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...submitted, featuredMedia: undefined }))
    article.workflowState = 'In Review'
    mockAssignment = {
      id: 'mock-assignment-1',
      uuid: 'ASG-MOCK-1',
      articleId,
      revisionId: current.id,
      reviewerId: eligibleReviewers[0].id,
      reviewerName: eligibleReviewers[0].displayName,
      source: reviewerIds.length > 0 ? 'Author Suggested' : 'Queue',
      status: reviewerIds.length > 0 ? 'Assigned' : 'Queued',
      decisionSummary: '',
      assignedAt: new Date().toISOString(),
      claimedAt: '',
      decidedAt: '',
    }
    return {
      ok: true,
      message: 'Article submitted for review.',
      articleId,
      revisionId: current.id,
      state: 'In Review',
      requiredApprovals: 1,
      assignmentIds: reviewerIds.length > 0 ? reviewerIds.map((id) => `mock-${id}`) : ['mock-queue-1'],
    }
  }

  async claimReviewAssignment(assignmentId: string): Promise<ReviewActionResult> {
    if (!mockAssignment || mockAssignment.id !== assignmentId) throw new Error('Mock review assignment was not found.')
    mockAssignment = { ...mockAssignment, status: 'Claimed', reviewerId: eligibleReviewers[0].id, reviewerName: eligibleReviewers[0].displayName, claimedAt: new Date().toISOString() }
    return { ok: true, message: 'Review claimed.', assignmentId, articleId: article.id, revisionId: mockAssignment.revisionId, status: 'Claimed' }
  }

  async addReviewComment(assignmentId: string, type: ReviewComment['type'], body: string, documentAnchor = ''): Promise<ReviewComment> {
    const comment: ReviewComment = {
      id: makeOpaqueId('comment'), assignmentId, revisionId: mockAssignment?.revisionId || '',
      authorId: eligibleReviewers[0].id, authorName: eligibleReviewers[0].displayName,
      type, body, documentAnchor, resolved: false,
    }
    mockComments = [...mockComments, comment]
    return comment
  }

  async recordReviewDecision(assignmentId: string, decision: NonNullable<ReviewAssignment['decision']>, summary: string): Promise<ReviewActionResult> {
    if (!mockAssignment || mockAssignment.id !== assignmentId || mockAssignment.status !== 'Claimed') throw new Error('Claim the mock review first.')
    mockAssignment = { ...mockAssignment, status: decision, decision, decisionSummary: summary, decidedAt: new Date().toISOString() }
    article.workflowState = decision === 'Approved' ? 'Approved' : decision
    return {
      ok: true, message: 'Review decision recorded.', assignmentId, articleId: article.id,
      revisionId: mockAssignment.revisionId, decision, articleState: article.workflowState,
      approvedReviewerCount: decision === 'Approved' ? 1 : 0, requiredApprovals: 1,
    }
  }

  async publishArticle(articleId: string): Promise<PublishArticleResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 550))
    if (article.id !== articleId) throw new Error('Mock article was not found.')
    if (article.workflowState !== 'Approved') throw new Error('Only approved mock articles can be published.')
    const current = await loadRevision()
    const publishedAt = new Date().toISOString()
    const published: Revision = { ...current, state: 'Published' }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...published, featuredMedia: undefined }))
    article.workflowState = 'Published'
    article.publishedRevisionId = published.id
    article.firstPublishedAt ||= publishedAt
    article.lastPublishedAt = publishedAt
    return {
      ok: true,
      message: 'Article published.',
      articleId,
      revisionId: published.id,
      jobId: makeOpaqueId('job'),
      articleState: 'Published',
      publishedAt,
    }
  }

  async scheduleArticle(articleId: string, scheduledAt: string): Promise<ScheduleArticleResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    if (article.id !== articleId) throw new Error('Mock article was not found.')
    if (article.workflowState !== 'Approved') throw new Error('Only approved mock articles can be scheduled.')
    const current = await loadRevision()
    article.workflowState = 'Scheduled'
    article.approvedRevisionId = current.id
    article.scheduledAt = scheduledAt
    return {
      ok: true,
      message: 'Article scheduled.',
      articleId,
      revisionId: current.id,
      jobId: makeOpaqueId('job'),
      articleState: 'Scheduled',
      scheduledAt,
    }
  }

  async retractArticle(articleId: string, reason: string, _replacementPath: string): Promise<RetractArticleResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    if (article.id !== articleId) throw new Error('Mock article was not found.')
    if (article.workflowState !== 'Published') throw new Error('Only a published mock article can be retracted.')
    if (reason.trim().length < 3) throw new Error('A retraction reason is required.')
    article.workflowState = 'Unpublished'
    return {
      ok: true,
      message: 'Article retraction accepted.',
      articleId,
      revisionId: article.publishedRevisionId || '',
      jobId: makeOpaqueId('job'),
      articleState: 'Unpublished',
    }
  }

  hydrateDocument(document: Revision['document']) {
    return hydrateMockDocument(document)
  }

  async createImageAsset(file: File, metadata: MediaMetadata, _uploadedById: string): Promise<MediaAsset> {
    const dimensions = await mediaDimensions(file)
    const stored: StoredMediaAsset = {
      id: makeOpaqueId('media'),
      uuid: makeOpaqueId('MED'),
      originalFilename: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      widthPixels: dimensions.width,
      heightPixels: dimensions.height,
      status: 'Draft',
      ...metadata,
      file,
    }
    await sha256Blob(file)
    await putMedia(stored)
    return getMedia(stored.id)
  }

  async updateImageAsset(asset: MediaAsset, metadata: MediaMetadata): Promise<MediaAsset> {
    const databaseAsset = await getMedia(asset.id)
    const database = await openMediaDatabase()
    const stored = await new Promise<StoredMediaAsset>((resolve, reject) => {
      const request = database.transaction(MEDIA_STORE).objectStore(MEDIA_STORE).get(asset.id)
      request.onsuccess = () => resolve(request.result as StoredMediaAsset)
      request.onerror = () => reject(request.error)
    })
    database.close()
    await putMedia({ ...stored, ...metadata })
    return { ...databaseAsset, ...metadata }
  }
}

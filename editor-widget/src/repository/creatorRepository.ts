import type { JSONContent } from '@tiptap/react'
import type {
  Article,
  ArticleDraftInput,
  ArticleDraftResult,
  AuditEvent,
  CurrentEmployee,
  DashboardData,
  EditorialRepository,
  LookupValue,
  MediaAsset,
  MediaMetadata,
  PublicationJob,
  PublishArticleResult,
  RetractArticleResult,
  ReviewerOption,
  ReviewActionResult,
  ReviewAssignment,
  ReviewComment,
  ReviewContext,
  Revision,
  ScheduleArticleResult,
  SaveRevisionInput,
  SubmitForReviewResult,
  WorkspaceData,
} from '../domain'
import { EMPTY_DOCUMENT, documentText, errorMessage, makeOpaqueId, sha256, sha256Blob, slugify } from '../utils'
import { collectMediaIds, canonicalizeMedia, hydrateMedia } from '../media'
import { mediaDimensions } from '../media'

const REPORTS = {
  articles: 'Articles_Report',
  revisions: 'Article_Revisions_Report',
  media: 'Media_Assets_Report',
  employees: 'Demo_Employees_Report',
  approvalPolicies: 'Approval_Policies_Report',
  categories: 'Categories_Report',
  editorialRoles: 'Editorial_Role_Assignments_Report',
  reviewAssignments: 'Review_Assignments_Report',
  reviewComments: 'Review_Comments_Report',
  auditEvents: 'Audit_Events_Report',
  publicationJobs: 'Publication_Jobs_Report',
} as const

const FORMS = {
  articles: 'Articles',
  revisions: 'Article_Revisions',
  media: 'Media_Assets',
} as const

const ARTICLE_FIELDS = [
  'Article_UUID', 'Working_Title', 'Owner', 'Primary_Author', 'Primary_Category',
  'Tags', 'Approval_Policy', 'Workflow_State', 'Active_Draft_Revision_ID',
  'Approved_Revision_ID', 'Published_Revision_ID', 'Scheduled_At',
  'First_Published_At', 'Last_Published_At',
].join(',')

const MEDIA_FIELDS = [
  'Media_UUID', 'Media_Type', 'Original_Filename', 'MIME_Type', 'File_Size_Bytes',
  'Width_Pixels', 'Height_Pixels', 'Alt_Text', 'Caption', 'Credit', 'Status',
  'Draft_File', 'Published_URL',
].join(',')

const EMPLOYEE_FIELDS = ['Display_Name', 'Work_Email', 'Creator_Username', 'Job_Title', 'Status'].join(',')
const REVIEWER_ROLE_FIELDS = ['Employee', 'Expertise_Categories', 'Active'].join(',')
const CATEGORY_FIELDS = ['Name', 'Active'].join(',')
const APPROVAL_POLICY_FIELDS = ['Policy_Name', 'Active', 'Is_Default'].join(',')
const AUDIT_EVENT_FIELDS = [
  'Event_UUID', 'Entity_Type', 'Entity_UUID', 'Event_Type', 'Actor_Employee',
  'Previous_State', 'New_State', 'Event_Summary', 'Occurred_At',
].join(',')
const PUBLICATION_JOB_FIELDS = [
  'Article', 'Revision', 'Action', 'Status', 'Requested_At', 'Next_Retry_At', 'Error_Code',
].join(',')
const VERIFY_DELAYS = [0, 500, 1_000, 2_000, 4_000, 8_000] as const
const NO_RECORD_CODES = new Set([9220, 9280])

function sdk(): ZohoCreatorSdk {
  const creator = window.ZOHO?.CREATOR
  if (!creator) throw new Error('Zoho Creator Widget SDK V2 is unavailable.')
  return creator
}

function assertSuccess<T>(response: ZohoResponse<T>, operation: string): T {
  const code = Number(response.code)
  if (code !== 3000) {
    const error = new Error(response.message || `${operation} failed with code ${response.code}.`)
    if (Number.isFinite(code)) Object.assign(error, { code })
    throw error
  }
  return response.data
}

async function creatorCall<T>(operation: string, request: Promise<T>): Promise<T> {
  try {
    return await request
  } catch (error) {
    const wrapped = new Error(`${operation}: ${errorMessage(error, 'Creator request rejected.')}`)
    const code = creatorErrorCode(error)
    if (code != null) Object.assign(wrapped, { code })
    throw wrapped
  }
}

function creatorErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = error as Record<string, unknown>
  if (value.code != null) return Number(value.code)
  if (typeof value.responseText === 'string') {
    try {
      const response = JSON.parse(value.responseText) as Record<string, unknown>
      if (response.code != null) return Number(response.code)
    } catch {
      return undefined
    }
  }
  return undefined
}

function isNoRecordsError(error: unknown): boolean {
  const code = creatorErrorCode(error)
  if (code != null && NO_RECORD_CODES.has(code)) return true
  return errorMessage(error, '').toLowerCase().includes('no records exist in this report')
}

function text(value: unknown): string {
  return value == null ? '' : String(value)
}

function normalizedField(value: string): string {
  return value.replace(/\r\n?/g, '\n').trim()
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function lookup(value: unknown): LookupValue {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return {
      ID: text(record.ID),
      zc_display_value: text(record.zc_display_value || record.display_value),
    }
  }
  return { ID: '', zc_display_value: text(value) }
}

function lookupList(value: unknown): LookupValue[] {
  return Array.isArray(value) ? value.map(lookup) : []
}

function truthy(value: unknown): boolean {
  return value === true || text(value).toLowerCase() === 'true'
}

function urlValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return text(record.url || record.value || record.href || record.download_url || record.file_path || record.filepath || record.zc_display_value || record.display_value)
  }
  return ''
}

function creatorImageUrl(sourceUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    let settled = false
    const finish = (result?: string) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      if (result || image.src) resolve(result || image.src)
      else reject(new Error('Creator returned an empty image response.'))
    }
    image.onload = () => finish()
    image.onerror = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      reject(new Error('Creator could not render the stored image.'))
    }
    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('Creator image loading timed out.'))
    }, 12_000)
    sdk().UTIL.setImageData(image, sourceUrl, (response) => {
      if (typeof response === 'string' && response.startsWith('data:image/')) finish(response)
      else if (image.complete && image.naturalWidth > 0) finish()
    })
  })
}

function binaryImageUrl(content: unknown, mimeType: string): string {
  if (content instanceof Blob) return URL.createObjectURL(content)
  if (typeof content !== 'string') throw new Error('Creator returned an unsupported image response.')
  if (content.startsWith('data:image/') || content.startsWith('http')) return content
  const bytes = Uint8Array.from(content, (character) => character.charCodeAt(0) & 0xff)
  return URL.createObjectURL(new Blob([bytes], { type: mimeType || 'application/octet-stream' }))
}

async function fileResponseText(response: unknown, depth = 0): Promise<string> {
  if (depth > 5) throw new Error('Creator returned an excessively nested editor document response.')
  if (typeof response === 'string') return response.replace(/^\uFEFF/, '')
  if (response instanceof Blob) return (await response.text()).replace(/^\uFEFF/, '')
  if (response instanceof ArrayBuffer) return new TextDecoder().decode(response).replace(/^\uFEFF/, '')
  if (ArrayBuffer.isView(response)) {
    return new TextDecoder().decode(response).replace(/^\uFEFF/, '')
  }
  if (Array.isArray(response) && response.every((value) => typeof value === 'number')) {
    return new TextDecoder().decode(Uint8Array.from(response)).replace(/^\uFEFF/, '')
  }
  if (response && typeof response === 'object') {
    const value = response as Record<string, unknown>
    if (typeof value.responseText === 'string') return value.responseText.replace(/^\uFEFF/, '')
    if (typeof value.text === 'function') {
      return String(await (value.text as () => Promise<string>)()).replace(/^\uFEFF/, '')
    }
    for (const key of ['response', 'data', 'body', 'content', 'result', 'payload', 'buffer', '_body', 'fileContent', 'filecontent']) {
      if (value[key] == null || value[key] === response) continue
      try {
        return await fileResponseText(value[key], depth + 1)
      } catch {
        // Try the next known host-wrapper property.
      }
    }
  }
  const shape = (() => {
    if (response == null) return String(response)
    if (typeof response !== 'object') return typeof response
    const value = response as Record<string, unknown>
    const keys = Object.keys(value).slice(0, 12)
    const details = keys.map((key) => {
      const nested = value[key]
      const tag = nested == null ? String(nested) : Object.prototype.toString.call(nested)
      return `${key}:${tag}`
    })
    return `${Object.prototype.toString.call(response)} {${details.join(', ') || 'no enumerable keys'}}`
  })()
  throw new Error(`Creator returned an unsupported editor document response: ${shape}`)
}

function parsedEditorDocument(response: unknown): JSONContent | undefined {
  if (!response || typeof response !== 'object' || Array.isArray(response)) return undefined
  const value = response as Record<string, unknown>
  if (value.type !== 'doc' || !Array.isArray(value.content)) return undefined
  return value as JSONContent
}

function imageDimensionsFromUrl(sourceUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => resolve({ width: 0, height: 0 })
    image.src = sourceUrl
  })
}

function mapArticle(record: Record<string, unknown>): Article {
  return {
    id: text(record.ID),
    uuid: text(record.Article_UUID),
    workingTitle: text(record.Working_Title),
    owner: lookup(record.Owner),
    primaryAuthor: lookup(record.Primary_Author),
    primaryCategory: record.Primary_Category ? lookup(record.Primary_Category) : undefined,
    tags: lookupList(record.Tags),
    approvalPolicy: lookup(record.Approval_Policy),
    workflowState: text(record.Workflow_State),
    activeDraftRevisionId: text(record.Active_Draft_Revision_ID) || undefined,
    approvedRevisionId: text(record.Approved_Revision_ID) || undefined,
    publishedRevisionId: text(record.Published_Revision_ID) || undefined,
    scheduledAt: text(record.Scheduled_At) || undefined,
    firstPublishedAt: text(record.First_Published_At) || undefined,
    lastPublishedAt: text(record.Last_Published_At) || undefined,
  }
}

function mapPublicationJob(record: Record<string, unknown>): PublicationJob {
  return {
    id: text(record.ID),
    articleId: lookup(record.Article).ID,
    revisionId: lookup(record.Revision).ID,
    action: text(record.Action),
    status: text(record.Status),
    requestedAt: text(record.Requested_At),
    nextRetryAt: text(record.Next_Retry_At),
    errorCode: text(record.Error_Code),
  }
}

function mapCategory(record: Record<string, unknown>): LookupValue {
  return { ID: text(record.ID), zc_display_value: text(record.Name) }
}

function mapApprovalPolicy(record: Record<string, unknown>): LookupValue {
  return { ID: text(record.ID), zc_display_value: text(record.Policy_Name) }
}

function revisionVersionToken(record: Record<string, unknown>): string {
  return JSON.stringify({
    state: text(record.Revision_State),
    title: text(record.Title),
    slug: text(record.Slug),
    excerpt: text(record.Excerpt),
    seoTitle: text(record.SEO_Title),
    seoDescription: text(record.SEO_Description),
    robotsDirective: text(record.Robots_Directive),
    wordCount: Number(record.Word_Count || 0),
    readingTimeMinutes: Number(record.Reading_Time_Minutes || 0),
    checksum: text(record.Document_Checksum),
    featuredMediaId: record.Featured_Media ? lookup(record.Featured_Media).ID : '',
    referencedMediaUuids: text(record.Referenced_Media_UUIDs),
  })
}

function mapRevision(record: Record<string, unknown>, document: JSONContent): Revision {
  const featuredMediaId = record.Featured_Media ? lookup(record.Featured_Media).ID : ''
  return {
    id: text(record.ID),
    uuid: text(record.Revision_UUID),
    articleId: lookup(record.Article).ID,
    number: Number(record.Revision_Number || 1),
    state: (text(record.Revision_State) || 'Draft') as Revision['state'],
    title: text(record.Title),
    slug: text(record.Slug),
    excerpt: text(record.Excerpt),
    seoTitle: text(record.SEO_Title),
    seoDescription: text(record.SEO_Description),
    robotsDirective: (text(record.Robots_Directive) || 'Index Follow') as Revision['robotsDirective'],
    wordCount: Number(record.Word_Count || 0),
    readingTimeMinutes: Number(record.Reading_Time_Minutes || 0),
    checksum: text(record.Document_Checksum) || undefined,
    versionToken: revisionVersionToken(record),
    featuredMediaId: featuredMediaId || undefined,
    document,
  }
}

async function mapMediaAsset(record: Record<string, unknown>): Promise<MediaAsset> {
  let previewUrl = urlValue(record.Published_URL)
  if (record.Draft_File) {
    const sourceUrl = urlValue(record.Draft_File)
    if (sourceUrl) previewUrl = await creatorImageUrl(sourceUrl).catch(() => '')
    if (!previewUrl) {
      const response = await sdk().FILE.readFile({
        report_name: REPORTS.media,
        id: text(record.ID),
        field_name: 'Draft_File',
      })
      previewUrl = binaryImageUrl(response, text(record.MIME_Type))
    }
  }
  let widthPixels = Number(record.Width_Pixels || 0)
  let heightPixels = Number(record.Height_Pixels || 0)
  if (previewUrl && (!widthPixels || !heightPixels)) {
    const dimensions = await imageDimensionsFromUrl(previewUrl)
    widthPixels ||= dimensions.width
    heightPixels ||= dimensions.height
  }
  return {
    id: text(record.ID),
    uuid: text(record.Media_UUID),
    originalFilename: text(record.Original_Filename),
    mimeType: text(record.MIME_Type),
    fileSizeBytes: Number(record.File_Size_Bytes || 0),
    widthPixels,
    heightPixels,
    altText: text(record.Alt_Text),
    caption: text(record.Caption),
    credit: text(record.Credit),
    status: (text(record.Status) || 'Draft') as MediaAsset['status'],
    previewUrl,
  }
}

async function getMediaAsset(id: string): Promise<MediaAsset> {
  const response = await sdk().DATA.getRecordById({
    report_name: REPORTS.media,
    id,
    field_config: 'custom',
    fields: MEDIA_FIELDS,
  })
  return mapMediaAsset(assertSuccess(response, 'Load media asset'))
}

async function readDocument(record: Record<string, unknown>): Promise<JSONContent> {
  const documentReference = record.Editor_Document
  const hasDocumentReference = Object.prototype.hasOwnProperty.call(record, 'Editor_Document')
  if (hasDocumentReference && (documentReference == null || (typeof documentReference === 'string' && documentReference.trim() === ''))) {
    return EMPTY_DOCUMENT
  }
  try {
    const response = await creatorCall('Read editor document', sdk().FILE.readFile({
      report_name: REPORTS.revisions,
      id: text(record.ID),
      field_name: 'Editor_Document',
    }))
    const responseCode = creatorErrorCode(response)
    if (responseCode === 3730) return EMPTY_DOCUMENT
    if (responseCode != null && responseCode !== 3000) {
      const errorResponse = response as Record<string, unknown>
      throw Object.assign(
        new Error(text(errorResponse.message) || `Read editor document failed with code ${responseCode}.`),
        { code: responseCode },
      )
    }
    const parsedDocument = parsedEditorDocument(response)
    if (parsedDocument) return parsedDocument
    const raw = await fileResponseText(response)
    const document = JSON.parse(raw) as unknown
    const parsedRawDocument = parsedEditorDocument(document)
    if (!parsedRawDocument) throw new Error('The editor document does not contain a valid document root.')
    return parsedRawDocument
  } catch (error) {
    if (creatorErrorCode(error) === 3730) return EMPTY_DOCUMENT
    throw new Error(errorMessage(error, 'The saved editor document could not be read.'))
  }
}

async function getRevisionById(id: string): Promise<Record<string, unknown>> {
  const response = await creatorCall('Load revision record', sdk().DATA.getRecordById({
    report_name: REPORTS.revisions,
    id,
    field_config: 'all',
  }))
  return assertSuccess(response, 'Load revision')
}

async function findFirstRevision(articleId: string): Promise<Record<string, unknown> | undefined> {
  let response: ZohoResponse<Record<string, unknown>[]>
  try {
    response = await sdk().DATA.getRecords({
      report_name: REPORTS.revisions,
      criteria: `Article == ${articleId} && Revision_Number == 1`,
      field_config: 'all',
      max_records: 200,
    })
  } catch (error) {
    // Creator V2 rejects an empty filtered result instead of resolving with [].
    if (isNoRecordsError(error)) return undefined
    throw new Error(`Find initial revision: ${errorMessage(error, 'Creator request rejected.')}`)
  }
  if (NO_RECORD_CODES.has(Number(response.code))) return undefined
  if (Number(response.code) !== 3000) return undefined
  return response.data[0]
}

async function findLatestRevisionByState(articleId: string, state: Revision['state']): Promise<Record<string, unknown> | undefined> {
  const records = await getRecordsOrEmpty({
    report_name: REPORTS.revisions,
    criteria: `Article == ${articleId} && Revision_State == "${state}"`,
    field_config: 'all',
    max_records: 200,
  }, `Find ${state.toLowerCase()} revisions`)
  return records
    .sort((a, b) => Number(b.Revision_Number || 0) - Number(a.Revision_Number || 0))[0]
}

async function getRecordsOrEmpty(config: ZohoCreatorConfig, operation: string): Promise<Record<string, unknown>[]> {
  try {
    const response = await creatorCall(operation, sdk().DATA.getRecords(config))
    if (NO_RECORD_CODES.has(Number(response.code))) return []
    return assertSuccess(response, operation)
  } catch (error) {
    if (isNoRecordsError(error)) return []
    throw error
  }
}

async function loadEligibleReviewers(primaryAuthorId: string): Promise<ReviewerOption[]> {
  const [employees, roleAssignments] = await Promise.all([
    getRecordsOrEmpty({
      report_name: REPORTS.employees,
      criteria: 'Status == "Active"',
      field_config: 'custom',
      fields: EMPLOYEE_FIELDS,
      max_records: 200,
    }, 'Load active employees'),
    getRecordsOrEmpty({
      report_name: REPORTS.editorialRoles,
      criteria: 'Editorial_Role == "Reviewer" && Active == true',
      field_config: 'custom',
      fields: REVIEWER_ROLE_FIELDS,
      max_records: 200,
    }, 'Load reviewer roles'),
  ])

  const employeesById = new Map(employees.map((employee) => [text(employee.ID), employee]))
  const reviewers = new Map<string, ReviewerOption>()
  for (const assignment of roleAssignments) {
    if (!truthy(assignment.Active)) continue
    const employeeLookup = lookup(assignment.Employee)
    if (!employeeLookup.ID || employeeLookup.ID === primaryAuthorId) continue
    const employee = employeesById.get(employeeLookup.ID)
    if (!employee) continue
    reviewers.set(employeeLookup.ID, {
      id: employeeLookup.ID,
      displayName: text(employee.Display_Name) || employeeLookup.zc_display_value || 'Reviewer',
      workEmail: text(employee.Work_Email),
      jobTitle: text(employee.Job_Title),
      expertise: lookupList(assignment.Expertise_Categories).map((category) => category.zc_display_value || '').filter(Boolean),
    })
  }
  return [...reviewers.values()].sort((a, b) => a.displayName.localeCompare(b.displayName))
}

function submitResult(response: ZohoCustomApiResponse): SubmitForReviewResult {
  if (Number(response.code) !== 3000) {
    throw new Error(response.message || `Submit for review failed with code ${response.code}.`)
  }
  let value = response.result ?? response.data
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      throw new Error(String(value || 'Creator returned an invalid submit-for-review response.'))
    }
  }
  if (!value || typeof value !== 'object') {
    throw new Error('Creator returned an invalid submit-for-review response.')
  }
  const result = value as Record<string, unknown>
  if (!truthy(result.ok)) {
    throw new Error(text(result.message) || 'Creator rejected the review submission.')
  }
  return {
    ok: true,
    message: text(result.message) || 'Article submitted for review.',
    articleId: text(result.articleId),
    revisionId: text(result.revisionId),
    state: text(result.state) || 'In Review',
    requiredApprovals: Number(result.requiredApprovals || 0),
    assignmentIds: Array.isArray(result.assignmentIds) ? result.assignmentIds.map(text) : [],
  }
}

function customApiValue(response: ZohoCustomApiResponse, operation: string): Record<string, unknown> {
  if (Number(response.code) !== 3000) {
    throw new Error(response.message || `${operation} failed with code ${response.code}.`)
  }
  let value = response.result ?? response.data
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      throw new Error(String(value || `Creator returned an invalid ${operation.toLowerCase()} response.`))
    }
  }
  if (!value || typeof value !== 'object') {
    throw new Error(`Creator returned an invalid ${operation.toLowerCase()} response.`)
  }
  const result = value as Record<string, unknown>
  if (!truthy(result.ok)) throw new Error(text(result.message) || `Creator rejected ${operation.toLowerCase()}.`)
  return result
}

function reviewActionResult(response: ZohoCustomApiResponse, operation: string): ReviewActionResult {
  const result = customApiValue(response, operation)
  return {
    ok: true,
    message: text(result.message),
    assignmentId: text(result.assignmentId),
    articleId: text(result.articleId),
    revisionId: text(result.revisionId),
    status: text(result.status) || undefined,
    decision: text(result.decision) || undefined,
    articleState: text(result.articleState) || undefined,
    approvedReviewerCount: result.approvedReviewerCount == null ? undefined : Number(result.approvedReviewerCount),
    requiredApprovals: result.requiredApprovals == null ? undefined : Number(result.requiredApprovals),
    newDraftRevisionId: text(result.newDraftRevisionId) || undefined,
    newDraftRevisionNumber: result.newDraftRevisionNumber == null ? undefined : Number(result.newDraftRevisionNumber),
    newDraftRevisionUuid: text(result.newDraftRevisionUuid) || undefined,
  }
}

function publishArticleResult(response: ZohoCustomApiResponse): PublishArticleResult {
  const result = customApiValue(response, 'Publish article')
  return {
    ok: true,
    message: text(result.message) || 'Article published.',
    articleId: text(result.articleId),
    revisionId: text(result.revisionId),
    jobId: text(result.jobId),
    articleState: text(result.articleState) || 'Published',
    publishedAt: text(result.publishedAt),
  }
}

function scheduleArticleResult(response: ZohoCustomApiResponse): ScheduleArticleResult {
  const result = customApiValue(response, 'Schedule article')
  return {
    ok: true,
    message: text(result.message) || 'Article scheduled.',
    articleId: text(result.articleId),
    revisionId: text(result.revisionId),
    jobId: text(result.jobId),
    articleState: text(result.articleState) || 'Scheduled',
    scheduledAt: text(result.scheduledAt),
  }
}

function retractArticleResult(response: ZohoCustomApiResponse): RetractArticleResult {
  const result = customApiValue(response, 'Retract article')
  return {
    ok: true,
    message: text(result.message) || 'Article retraction accepted.',
    articleId: text(result.articleId),
    revisionId: text(result.revisionId),
    jobId: text(result.jobId),
    articleState: text(result.articleState) || 'Published',
  }
}

function mapReviewAssignment(record: Record<string, unknown>): ReviewAssignment {
  const article = lookup(record.Article)
  const revision = lookup(record.Revision)
  const reviewer = record.Reviewer ? lookup(record.Reviewer) : undefined
  return {
    id: text(record.ID),
    uuid: text(record.Assignment_UUID),
    articleId: article.ID,
    articleTitle: article.zc_display_value || undefined,
    revisionId: revision.ID,
    revisionTitle: revision.zc_display_value || undefined,
    reviewerId: reviewer?.ID || undefined,
    reviewerName: reviewer?.zc_display_value || undefined,
    source: text(record.Assignment_Source) as ReviewAssignment['source'],
    status: text(record.Status) as ReviewAssignment['status'],
    decision: text(record.Decision) as ReviewAssignment['decision'] || undefined,
    decisionSummary: text(record.Decision_Summary),
    assignedAt: text(record.Assigned_At),
    claimedAt: text(record.Claimed_At),
    decidedAt: text(record.Decided_At),
  }
}

function normalizedIdentity(value?: string) {
  return text(value).trim().toLowerCase()
}

function assignmentBelongsToEmployee(assignment: ReviewAssignment, currentEmployee: CurrentEmployee) {
  return assignment.reviewerId === currentEmployee.id
    || (!assignment.reviewerId
      && normalizedIdentity(assignment.reviewerName) === normalizedIdentity(currentEmployee.displayName))
}

function lookupBelongsToEmployee(value: LookupValue, currentEmployee: CurrentEmployee) {
  if (value.ID) return value.ID === currentEmployee.id
  return normalizedIdentity(value.zc_display_value || value.display_value) === normalizedIdentity(currentEmployee.displayName)
}

function mapReviewComment(record: Record<string, unknown>): ReviewComment {
  const author = lookup(record.Author_Employee)
  return {
    id: text(record.ID),
    assignmentId: lookup(record.Assignment).ID,
    revisionId: lookup(record.Revision).ID,
    authorId: author.ID,
    authorName: author.zc_display_value || 'Editorial user',
    type: text(record.Comment_Type) as ReviewComment['type'],
    body: text(record.Comment_Body),
    documentAnchor: text(record.Document_Anchor),
    resolved: truthy(record.Resolved),
  }
}

function mapAuditEvent(record: Record<string, unknown>): AuditEvent {
  const actor = record.Actor_Employee ? lookup(record.Actor_Employee) : undefined
  return {
    id: text(record.ID),
    uuid: text(record.Event_UUID),
    entityType: text(record.Entity_Type),
    entityUuid: text(record.Entity_UUID),
    eventType: text(record.Event_Type),
    actorId: actor?.ID || undefined,
    actorName: actor?.zc_display_value || undefined,
    previousState: text(record.Previous_State),
    newState: text(record.New_State),
    summary: text(record.Event_Summary),
    occurredAt: text(record.Occurred_At),
  }
}

async function loadCurrentEmployee(): Promise<CurrentEmployee | undefined> {
  const init: Record<string, unknown> = await sdk().UTIL.getInitParams().catch(() => ({}))
  const loginEmail = text(init['loginUser']).trim().toLowerCase()
  const employees = await getRecordsOrEmpty({
    report_name: REPORTS.employees,
    criteria: 'Status == "Active"',
    field_config: 'custom',
    fields: EMPLOYEE_FIELDS,
    max_records: 200,
  }, 'Load current employee')
  const employee = employees.find((record) => (
    text(record.Work_Email).trim().toLowerCase() === loginEmail
    || text(record.Creator_Username).trim().toLowerCase() === loginEmail
  ))
  if (!employee) return undefined
  const roleAssignments = await getRecordsOrEmpty({
    report_name: REPORTS.editorialRoles,
    criteria: `Employee == ${text(employee.ID)} && Active == true`,
    field_config: 'all',
    max_records: 200,
  }, 'Load current employee roles')
  return {
    id: text(employee.ID),
    displayName: text(employee.Display_Name) || 'Editorial user',
    workEmail: text(employee.Work_Email),
    roles: roleAssignments.map((role) => text(role.Editorial_Role)).filter(Boolean),
  }
}

function canManageArticle(article: Article, currentEmployee?: CurrentEmployee) {
  if (!currentEmployee) return false
  return currentEmployee.roles.includes('CEO')
    || currentEmployee.roles.includes('Editorial Admin')
    || lookupBelongsToEmployee(article.owner, currentEmployee)
    || lookupBelongsToEmployee(article.primaryAuthor, currentEmployee)
}

async function loadReviewContext(article: Article, revision: Revision, currentEmployee?: CurrentEmployee): Promise<ReviewContext> {
  if (!currentEmployee || article.workflowState !== 'In Review' || revision.state !== 'Submitted') {
    return { currentEmployee, comments: [], canReview: false }
  }
  const records = await getRecordsOrEmpty({
    report_name: REPORTS.reviewAssignments,
    criteria: `Article == ${article.id} && Revision == ${revision.id}`,
    field_config: 'all',
    max_records: 200,
  }, 'Load review assignments')
  const assignments = records.map(mapReviewAssignment)
  const direct = assignments.find((item) => assignmentBelongsToEmployee(item, currentEmployee) && item.status !== 'Cancelled')
  const queued = assignments.find((item) => item.status === 'Queued' && !item.reviewerId)
  const canReview = currentEmployee.roles.includes('Reviewer') && !lookupBelongsToEmployee(article.primaryAuthor, currentEmployee)
  const assignment = direct || (canReview ? queued : undefined)
  if (!assignment) return { currentEmployee, comments: [], canReview }
  const commentRecords = await getRecordsOrEmpty({
    report_name: REPORTS.reviewComments,
    criteria: `Assignment == ${assignment.id} && Revision == ${revision.id}`,
    field_config: 'all',
    max_records: 200,
  }, 'Load review comments')
  return { currentEmployee, assignment, comments: commentRecords.map(mapReviewComment), canReview }
}

export class CreatorEditorialRepository implements EditorialRepository {
  readonly source = 'creator' as const

  async resolveArticleId(): Promise<string | undefined> {
    const [widgetParams, queryParams]: Record<string, unknown>[] = await Promise.all([
      sdk().UTIL.getWidgetParams().catch(() => ({})),
      sdk().UTIL.getQueryParams().catch(() => ({})),
    ])
    const articleId = text(widgetParams.articleId || queryParams.articleId)
    return articleId || undefined
  }

  async resolveRevisionId(): Promise<string | undefined> {
    const [widgetParams, queryParams]: Record<string, unknown>[] = await Promise.all([
      sdk().UTIL.getWidgetParams().catch(() => ({})),
      sdk().UTIL.getQueryParams().catch(() => ({})),
    ])
    const revisionId = text(widgetParams.revisionId || queryParams.revisionId)
    return revisionId || undefined
  }

  async loadDashboard(): Promise<DashboardData> {
    const [currentEmployee, articleRecords, publicationJobRecords, assignmentRecords, auditEventRecords, categoryRecords, policyRecords] = await Promise.all([
      loadCurrentEmployee(),
      getRecordsOrEmpty({
        report_name: REPORTS.articles,
        field_config: 'custom',
        fields: ARTICLE_FIELDS,
        max_records: 200,
      }, 'Load dashboard articles'),
      getRecordsOrEmpty({
        report_name: REPORTS.publicationJobs,
        criteria: '(Status == "Queued" || Status == "Processing")',
        field_config: 'custom',
        fields: PUBLICATION_JOB_FIELDS,
        max_records: 200,
      }, 'Load active publication jobs').catch(() => []),
      getRecordsOrEmpty({
        report_name: REPORTS.reviewAssignments,
        field_config: 'all',
        max_records: 200,
      }, 'Load dashboard review assignments'),
      getRecordsOrEmpty({
        report_name: REPORTS.auditEvents,
        field_config: 'custom',
        fields: AUDIT_EVENT_FIELDS,
        max_records: 200,
      }, 'Load dashboard audit events').catch(() => []),
      getRecordsOrEmpty({
        report_name: REPORTS.categories,
        criteria: 'Active == true',
        field_config: 'custom',
        fields: CATEGORY_FIELDS,
        max_records: 200,
      }, 'Load dashboard categories').catch(() => []),
      getRecordsOrEmpty({
        report_name: REPORTS.approvalPolicies,
        criteria: 'Active == true',
        field_config: 'custom',
        fields: APPROVAL_POLICY_FIELDS,
        max_records: 200,
      }, 'Load dashboard approval policies').catch(() => []),
    ])
    return {
      currentEmployee,
      articles: articleRecords.map(mapArticle),
      publicationJobs: publicationJobRecords.map(mapPublicationJob),
      assignments: assignmentRecords.map(mapReviewAssignment),
      auditEvents: auditEventRecords.map(mapAuditEvent),
      categories: categoryRecords.map(mapCategory).sort((a, b) => text(a.zc_display_value).localeCompare(text(b.zc_display_value))),
      approvalPolicies: policyRecords.map(mapApprovalPolicy).sort((a, b) => text(a.zc_display_value).localeCompare(text(b.zc_display_value))),
      source: this.source,
    }
  }

  async createDraftArticle(input: ArticleDraftInput): Promise<ArticleDraftResult> {
    const currentEmployee = await loadCurrentEmployee()
    if (!currentEmployee) throw new Error('Your Creator login is not mapped to an active editorial employee.')
    if (!currentEmployee.roles.some((role) => role === 'CEO' || role === 'Editorial Admin' || role === 'Author')) {
      throw new Error('Your editorial role cannot create articles.')
    }
    const title = normalizedField(input.title)
    if (!title) throw new Error('Enter a working title before creating an article.')
    if (!input.approvalPolicyId) throw new Error('Choose an approval policy before creating an article.')
    const response = await creatorCall('Create draft article', sdk().DATA.addRecords({
      form_name: FORMS.articles,
      payload: {
        data: {
          Article_UUID: makeOpaqueId('ART'),
          Working_Title: title,
          Owner: currentEmployee.id,
          Primary_Author: currentEmployee.id,
          Primary_Category: input.categoryId || '',
          Approval_Policy: input.approvalPolicyId,
          Workflow_State: 'Draft',
        },
      },
    }))
    const record = assertSuccess(response, 'Create draft article')
    return { articleId: text(record.ID) }
  }

  async loadWorkspace(articleId: string, revisionId?: string): Promise<WorkspaceData> {
    const articleResponse = await creatorCall('Load article record', sdk().DATA.getRecordById({
      report_name: REPORTS.articles,
      id: articleId,
      field_config: 'custom',
      fields: ARTICLE_FIELDS,
    }))
    const article = mapArticle(assertSuccess(articleResponse, 'Load article'))
    const currentEmployee = await loadCurrentEmployee()
    const managesArticle = canManageArticle(article, currentEmployee)
    if (!revisionId
      && (article.workflowState === 'Draft' || article.workflowState === 'Changes Requested')
      && !managesArticle) {
      throw new Error('Only this article\'s owner, primary author, or an editorial administrator can open its working draft.')
    }

    let revisionRecord: Record<string, unknown> | undefined
    const needsWorkingDraft = !revisionId && (article.workflowState === 'Draft' || article.workflowState === 'Changes Requested')
    if (revisionId) {
      revisionRecord = await getRevisionById(revisionId)
      if (lookup(revisionRecord.Article).ID !== article.id) {
        throw new Error('The requested revision does not belong to this article.')
      }
      if (text(revisionRecord.Revision_State) === 'Draft' && !managesArticle) {
        throw new Error('Only this article\'s owner, primary author, or an editorial administrator can open its working draft.')
      }
    }
    if (!revisionRecord && article.activeDraftRevisionId) {
      try {
        revisionRecord = await getRevisionById(article.activeDraftRevisionId)
      } catch {
        // Fall back to the report read model below; Creator report permissions can
        // briefly hide or omit the active draft pointer during setup.
      }
    }
    if (revisionRecord && needsWorkingDraft && text(revisionRecord.Revision_State) !== 'Draft') {
      revisionRecord = undefined
    }
    if (!revisionRecord && needsWorkingDraft) {
      revisionRecord = await findLatestRevisionByState(article.id, 'Draft')
    }
    if (!revisionRecord && article.workflowState === 'In Review') {
      revisionRecord = await findLatestRevisionByState(article.id, 'Submitted')
    }
    if (!revisionRecord && article.workflowState === 'Approved') {
      revisionRecord = await findLatestRevisionByState(article.id, 'Approved')
    }
    if (!revisionRecord) revisionRecord = await findFirstRevision(article.id)

    if (!revisionRecord) {
      if (!managesArticle) {
        throw new Error('This article has no revision available to your editorial role.')
      }
      const revisionUuid = `REV-${article.uuid}-0001`
      const createResponse = await creatorCall('Create initial revision', sdk().DATA.addRecords({
        form_name: FORMS.revisions,
        payload: {
          data: {
            Revision_UUID: revisionUuid,
            Article: article.id,
            Revision_Number: 1,
            Revision_State: 'Draft',
            Title: article.workingTitle,
            Slug: slugify(article.workingTitle),
            Robots_Directive: 'Index Follow',
            Created_By_Employee: article.primaryAuthor.ID,
          },
        },
      }))

      if (createResponse.code !== 3000) {
        revisionRecord = await findFirstRevision(article.id)
        if (!revisionRecord) assertSuccess(createResponse, 'Create initial revision')
      } else {
        revisionRecord = await getRevisionById(createResponse.data.ID)
      }

      if (!revisionRecord) throw new Error('Creator did not return the initial revision.')

      const pointerResponse = await creatorCall('Connect initial revision', sdk().DATA.updateRecordById({
        report_name: REPORTS.articles,
        id: article.id,
        payload: { data: { Active_Draft_Revision_ID: text(revisionRecord.ID) } },
      }))
      assertSuccess(pointerResponse, 'Connect initial revision')
      article.activeDraftRevisionId = text(revisionRecord.ID)
    }

    const document = await this.hydrateDocument(await readDocument(revisionRecord))
    const revision = mapRevision(revisionRecord, document)
    if (revision.featuredMediaId) {
      revision.featuredMedia = await getMediaAsset(revision.featuredMediaId).catch(() => undefined)
    }
    const workspace = {
      article,
      revision,
      eligibleReviewers: managesArticle
        ? await loadEligibleReviewers(article.primaryAuthor.ID)
        : [],
      review: { currentEmployee, comments: [], canReview: false } as ReviewContext,
      source: this.source,
    }
    workspace.review = await loadReviewContext(article, revision, currentEmployee)
    return workspace
  }

  async saveDraft(input: SaveRevisionInput): Promise<Revision> {
    const currentRecord = await getRevisionById(input.id)
    const articleId = lookup(currentRecord.Article).ID
    const [currentEmployee, articleResponse] = await Promise.all([
      loadCurrentEmployee(),
      creatorCall('Load article authorization record', sdk().DATA.getRecordById({
        report_name: REPORTS.articles,
        id: articleId,
        field_config: 'custom',
        fields: ARTICLE_FIELDS,
      })),
    ])
    const article = mapArticle(assertSuccess(articleResponse, 'Load article authorization'))
    if (!canManageArticle(article, currentEmployee)) {
      throw new Error('Your editorial role cannot edit this draft.')
    }
    if (text(currentRecord.Revision_State) !== 'Draft') {
      throw new Error('This revision is no longer editable. Reload the workspace to see its current state.')
    }
    if (text(currentRecord.Document_Checksum) !== input.expectedChecksum) {
      throw new Error('This draft changed in another tab or session. Reload before continuing so newer work is not overwritten.')
    }
    if (revisionVersionToken(currentRecord) !== input.expectedVersionToken) {
      throw new Error('This draft metadata changed in another tab or session. Reload before continuing so newer work is not overwritten.')
    }

    const normalizedInput = {
      ...input,
      title: normalizedField(input.title),
      slug: normalizedField(input.slug),
      excerpt: normalizedField(input.excerpt),
      seoTitle: normalizedField(input.seoTitle),
      seoDescription: normalizedField(input.seoDescription),
      robotsDirective: normalizedField(input.robotsDirective) as SaveRevisionInput['robotsDirective'],
    }
    const canonicalDocument = canonicalizeMedia(input.document)
    const serialized = JSON.stringify(canonicalDocument)
    const checksum = await sha256(serialized)
    const referencedMediaUuids = collectMediaIds(canonicalDocument).sort().join(',')
    const documentFile = new File([serialized], `revision-${input.id}.json`, {
      type: 'application/json',
    })
    const uploadResponse = await sdk().FILE.uploadFile({
      report_name: REPORTS.revisions,
      id: input.id,
      field_name: 'Editor_Document',
      file: documentFile,
    })
    assertSuccess(uploadResponse, 'Upload editor document')

    const stateAfterUpload = await getRevisionById(input.id)
    if (text(stateAfterUpload.Revision_State) !== 'Draft') {
      throw new Error('The revision left Draft while it was being saved. Reload the workspace before continuing.')
    }
    if (revisionVersionToken(stateAfterUpload) !== input.expectedVersionToken) {
      throw new Error('This draft changed while it was being saved. Reload before continuing so newer work is not overwritten.')
    }

    const updateResponse = await sdk().DATA.updateRecordById({
      report_name: REPORTS.revisions,
      id: input.id,
      payload: {
        data: {
          Title: normalizedInput.title,
          Slug: normalizedInput.slug,
          Excerpt: normalizedInput.excerpt,
          SEO_Title: normalizedInput.seoTitle,
          SEO_Description: normalizedInput.seoDescription,
          Robots_Directive: normalizedInput.robotsDirective,
          Word_Count: input.wordCount,
          Reading_Time_Minutes: input.readingTimeMinutes,
          Plain_Text_Extract: documentText(input.document),
          Document_Checksum: checksum,
          Referenced_Media_UUIDs: referencedMediaUuids,
          Featured_Media: input.featuredMediaId || '',
        },
      },
    })
    assertSuccess(updateResponse, 'Save revision metadata')

    let documentVerified = false
    for (const retryDelay of VERIFY_DELAYS) {
      if (retryDelay > 0) await delay(retryDelay)
      try {
        const persistedDocument = canonicalizeMedia(await readDocument({ ID: input.id }))
        if (await sha256(JSON.stringify(persistedDocument)) === checksum) {
          documentVerified = true
          break
        }
      } catch {
        // Creator can briefly return the previous file state immediately after upload.
      }
    }
    if (!documentVerified) {
      throw new Error('Creator did not verify the uploaded editor document.')
    }

    const expectedValues = {
      Title: normalizedInput.title,
      Slug: normalizedInput.slug,
      Excerpt: normalizedInput.excerpt,
      SEO_Title: normalizedInput.seoTitle,
      SEO_Description: normalizedInput.seoDescription,
      Robots_Directive: normalizedInput.robotsDirective,
      Plain_Text_Extract: documentText(input.document),
      Word_Count: input.wordCount,
      Reading_Time_Minutes: input.readingTimeMinutes,
      Document_Checksum: checksum,
      Referenced_Media_UUIDs: referencedMediaUuids,
      Featured_Media: input.featuredMediaId || '',
    }
    let record = await getRevisionById(input.id)
    let unverifiedFields: string[] = []
    for (const retryDelay of VERIFY_DELAYS) {
      if (retryDelay > 0) {
        await delay(retryDelay)
        record = await getRevisionById(input.id)
      }
      const persistedValues = {
        Title: text(record.Title),
        Slug: text(record.Slug),
        Excerpt: text(record.Excerpt),
        SEO_Title: text(record.SEO_Title),
        SEO_Description: text(record.SEO_Description),
        Robots_Directive: text(record.Robots_Directive),
        Plain_Text_Extract: text(record.Plain_Text_Extract),
        Word_Count: Number(record.Word_Count || 0),
        Reading_Time_Minutes: Number(record.Reading_Time_Minutes || 0),
        Document_Checksum: text(record.Document_Checksum),
        Referenced_Media_UUIDs: text(record.Referenced_Media_UUIDs),
        Featured_Media: record.Featured_Media ? lookup(record.Featured_Media).ID : '',
      }
      unverifiedFields = Object.keys(expectedValues).filter((field) => (
        persistedValues[field as keyof typeof persistedValues] !== expectedValues[field as keyof typeof expectedValues]
      ))
      if (unverifiedFields.length === 0) break
    }
    if (unverifiedFields.length > 0) {
      throw new Error(`Creator did not verify the saved values for: ${unverifiedFields.join(', ')}.`)
    }
    const revision = {
      ...mapRevision(record, await this.hydrateDocument(canonicalDocument)),
      title: normalizedInput.title,
      slug: normalizedInput.slug,
      excerpt: normalizedInput.excerpt,
      seoTitle: normalizedInput.seoTitle,
      seoDescription: normalizedInput.seoDescription,
      robotsDirective: normalizedInput.robotsDirective,
      wordCount: input.wordCount,
      readingTimeMinutes: input.readingTimeMinutes,
      featuredMediaId: input.featuredMediaId,
    }
    if (revision.featuredMediaId) {
      revision.featuredMedia = await getMediaAsset(revision.featuredMediaId).catch(() => undefined)
    }
    return revision
  }

  async submitForReview(articleId: string, reviewerIds: string[]): Promise<SubmitForReviewResult> {
    const response = await creatorCall('Submit article for review', sdk().DATA.invokeCustomApi({
      api_name: 'submit_article_for_review',
      workspace_name: 'opensourceindia22',
      http_method: 'POST',
      content_type: 'application/json',
      payload: {
        // Creator record IDs must remain strings in JavaScript to avoid precision loss.
        articleId,
        reviewerIdsCsv: reviewerIds.join(','),
      },
    }))
    return submitResult(response)
  }

  async claimReviewAssignment(assignmentId: string): Promise<ReviewActionResult> {
    const response = await creatorCall('Claim review assignment', sdk().DATA.invokeCustomApi({
      api_name: 'claim_review_assignment',
      workspace_name: 'opensourceindia22',
      http_method: 'POST',
      content_type: 'application/json',
      payload: { assignmentId },
    }))
    return reviewActionResult(response, 'Claim review assignment')
  }

  async addReviewComment(assignmentId: string, type: ReviewComment['type'], body: string, documentAnchor = ''): Promise<ReviewComment> {
    const response = await creatorCall('Add review comment', sdk().DATA.invokeCustomApi({
      api_name: 'add_review_comment',
      workspace_name: 'opensourceindia22',
      http_method: 'POST',
      content_type: 'application/json',
      payload: { assignmentId, commentType: type, commentBody: body, documentAnchor, parentCommentId: 0 },
    }))
    const result = customApiValue(response, 'Add review comment')
    const init: Record<string, unknown> = await sdk().UTIL.getInitParams().catch(() => ({}))
    return {
      id: text(result.commentId),
      assignmentId,
      revisionId: text(result.revisionId),
      authorId: '',
      authorName: text(init['loginUser']) || 'Editorial user',
      type,
      body,
      documentAnchor,
      resolved: false,
    }
  }

  async recordReviewDecision(assignmentId: string, decision: NonNullable<ReviewAssignment['decision']>, summary: string): Promise<ReviewActionResult> {
    const response = await creatorCall('Record review decision', sdk().DATA.invokeCustomApi({
      api_name: 'record_review_decision',
      workspace_name: 'opensourceindia22',
      http_method: 'POST',
      content_type: 'application/json',
      payload: { assignmentId, decision, decisionSummary: summary },
    }))
    return reviewActionResult(response, 'Record review decision')
  }

  async publishArticle(articleId: string): Promise<PublishArticleResult> {
    const response = await creatorCall('Publish article', sdk().DATA.invokeCustomApi({
      api_name: 'publish_approved_article',
      workspace_name: 'opensourceindia22',
      http_method: 'POST',
      content_type: 'application/json',
      payload: { articleId },
    }))
    return publishArticleResult(response)
  }

  async scheduleArticle(articleId: string, scheduledAt: string): Promise<ScheduleArticleResult> {
    const response = await creatorCall('Schedule article', sdk().DATA.invokeCustomApi({
      api_name: 'schedule_approved_article',
      workspace_name: 'opensourceindia22',
      http_method: 'POST',
      content_type: 'application/json',
      payload: { articleId, scheduledAtText: scheduledAt },
    }))
    return scheduleArticleResult(response)
  }

  async retractArticle(articleId: string, reason: string, replacementPath: string): Promise<RetractArticleResult> {
    const response = await creatorCall('Retract article', sdk().DATA.invokeCustomApi({
      api_name: 'retract_published_article',
      workspace_name: 'opensourceindia22',
      http_method: 'POST',
      content_type: 'application/json',
      payload: { articleId, reason, replacementPath },
    }))
    return retractArticleResult(response)
  }

  async hydrateDocument(document: JSONContent): Promise<JSONContent> {
    const ids = collectMediaIds(document)
    const results = await Promise.allSettled(ids.map((id) => getMediaAsset(id)))
    const assets = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
    return hydrateMedia(document, new Map(assets.map((asset) => [asset.id, asset])))
  }

  async createImageAsset(file: File, metadata: MediaMetadata, uploadedById: string): Promise<MediaAsset> {
    const dimensions = await mediaDimensions(file)
    const mediaUuid = makeOpaqueId('MED')
    const createResponse = await sdk().DATA.addRecords({
      form_name: FORMS.media,
      payload: {
        data: {
          Media_UUID: mediaUuid,
          Media_Type: 'Image',
          Original_Filename: file.name,
          MIME_Type: file.type,
          File_Size_Bytes: file.size,
          Width_Pixels: dimensions.width,
          Height_Pixels: dimensions.height,
          Checksum: await sha256Blob(file),
          Alt_Text: metadata.altText,
          Caption: metadata.caption,
          Credit: metadata.credit,
          Status: 'Draft',
          Uploaded_By: uploadedById,
        },
      },
    })
    const record = assertSuccess(createResponse, 'Create media asset')
    try {
      const uploadResponse = await sdk().FILE.uploadFile({
        report_name: REPORTS.media,
        id: record.ID,
        field_name: 'Draft_File',
        file,
      })
      assertSuccess(uploadResponse, 'Upload image file')
    } catch (error) {
      await sdk().DATA.updateRecordById({
        report_name: REPORTS.media,
        id: record.ID,
        payload: { data: { Status: 'Failed' } },
      }).catch(() => undefined)
      throw error
    }
    let mediaAsset: MediaAsset | undefined
    let mediaError: unknown
    for (const retryDelay of VERIFY_DELAYS) {
      if (retryDelay > 0) await delay(retryDelay)
      try {
        mediaAsset = await getMediaAsset(record.ID)
        if (mediaAsset.previewUrl) break
      } catch (error) {
        mediaError = error
      }
    }
    if (!mediaAsset?.previewUrl) {
      throw new Error(errorMessage(mediaError, 'Creator stored the image but did not make it available for preview.'))
    }
    return mediaAsset
  }

  async updateImageAsset(asset: MediaAsset, metadata: MediaMetadata): Promise<MediaAsset> {
    const response = await sdk().DATA.updateRecordById({
      report_name: REPORTS.media,
      id: asset.id,
      payload: { data: { Alt_Text: metadata.altText, Caption: metadata.caption, Credit: metadata.credit } },
    })
    assertSuccess(response, 'Update media details')
    let stored = await getMediaAsset(asset.id)
    for (const retryDelay of VERIFY_DELAYS) {
      if (retryDelay > 0) {
        await delay(retryDelay)
        stored = await getMediaAsset(asset.id)
      }
      if (stored.altText === metadata.altText && stored.caption === metadata.caption && stored.credit === metadata.credit) {
        return stored
      }
    }
    throw new Error('Creator did not verify the updated image details.')
  }
}

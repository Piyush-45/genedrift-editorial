import type { Article, AuditEvent, DashboardData, PublicationJob, ReviewAssignment } from '../domain'

// Local preview only: a realistic multi-role workspace, used when the dev
// server is opened with ?demo=admin. Never reached in a Creator build.
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()
const person = (ID: string, name: string) => ({ ID, zc_display_value: name })
const piyu = person('E1', 'Piyu Gene')
const ztm = person('E2', 'Zara Malik')
const anshika = person('E3', 'Anshika Tyagi')
const ravi = person('E4', 'Ravi Menon')
const ra = { ID: 'C1', zc_display_value: 'Regulatory Affairs' }
const pv = { ID: 'C2', zc_display_value: 'Pharmacovigilance' }
const mkt = { ID: 'C3', zc_display_value: 'Market Insights' }
const policy = { ID: 'P1', zc_display_value: 'Standard Review' }

function art(id: string, title: string, state: string, author = piyu, category = ra, extra: Partial<Article> = {}): Article {
  return {
    id, uuid: `ART-${id}`, workingTitle: title, owner: author, primaryAuthor: author,
    primaryCategory: category, tags: [], approvalPolicy: policy, workflowState: state, ...extra,
  }
}

const articles: Article[] = [
  art('A1', 'Saudi SFDA registration timelines for 2027', 'Draft', piyu, ra),
  art('A2', 'What changes under the new GCC variation rules', 'Changes Requested', piyu, ra),
  art('A3', 'QPPV responsibilities in emerging markets', 'In Review', ztm, pv),
  art('A4', 'Nigeria NAFDAC dossier checklist', 'Approved', piyu, ra),
  art('A5', 'Uzbekistan inspection readiness guide', 'Approved', anshika, mkt, { publishedRevisionId: '' }),
  art('A6', 'Gulf market entry roadmap', 'Published', piyu, mkt, { publishedRevisionId: 'R6', firstPublishedAt: ago(60 * 24 * 20), lastPublishedAt: ago(60 * 24 * 1) }),
  art('A7', 'Rehearsal test: publishing check', 'Published', piyu, ra, { publishedRevisionId: 'R7', firstPublishedAt: ago(60 * 26), lastPublishedAt: ago(60 * 26) }),
  art('A8', 'Pharmacovigilance outsourcing models compared', 'Draft', piyu, pv, { publishedRevisionId: 'R8', firstPublishedAt: ago(60 * 24 * 30), lastPublishedAt: ago(60 * 24 * 30) }),
  art('A9', 'Medical device classification in Egypt', 'Scheduled', ztm, ra, { scheduledAt: new Date(Date.now() + 60 * 60_000 * 20).toISOString() }),
  art('A10', 'Old draft about cosmetics labelling', 'Archived', piyu, mkt, { archivedAt: ago(60 * 24 * 3) }),
  art('A11', 'Withdrawn: 2025 fee schedule', 'Unpublished', anshika, ra, { publishedRevisionId: 'R11', lastPublishedAt: ago(60 * 24 * 40) }),
  art('A12', 'Testing role based access version', 'Approved', piyu, ra),
]

const assignments: ReviewAssignment[] = [
  { id: 'S1', uuid: 'ASG-1', articleId: 'A3', revisionId: 'R3', reviewerId: 'E1', reviewerName: 'Piyu Gene', source: 'Author Suggested', status: 'Assigned', decisionSummary: '', assignedAt: ago(60 * 5), claimedAt: '', decidedAt: '' },
  { id: 'S2', uuid: 'ASG-2', articleId: 'A3', revisionId: 'R3', source: 'Queue', status: 'Queued', decisionSummary: '', assignedAt: ago(60 * 5), claimedAt: '', decidedAt: '' },
  { id: 'S3', uuid: 'ASG-3', articleId: 'A2', revisionId: 'R2', reviewerId: 'E2', reviewerName: 'Zara Malik', source: 'Author Suggested', status: 'Changes Requested', decision: 'Changes Requested', decisionSummary: 'Please cite the 2026 circular and fix the fee table.', assignedAt: ago(60 * 30), claimedAt: ago(60 * 29), decidedAt: ago(60 * 3) },
  { id: 'S4', uuid: 'ASG-4', articleId: 'A4', revisionId: 'R4', reviewerId: 'E3', reviewerName: 'Anshika Tyagi', source: 'Queue', status: 'Approved', decision: 'Approved', decisionSummary: 'Clear and accurate.', assignedAt: ago(60 * 50), claimedAt: ago(60 * 48), decidedAt: ago(60 * 2) },
]

const jobs: PublicationJob[] = [
  { id: 'J1', articleId: 'A12', revisionId: 'R12', action: 'Publish', status: 'Processing', requestedBy: piyu, requestedAt: ago(60 * 3), nextRetryAt: '', errorCode: '' },
]

const event = (id: string, articleId: string, type: string, actor: { ID: string; zc_display_value: string }, minutes: number, summary = ''): AuditEvent => ({
  id, uuid: `EVT-${id}`, entityType: 'Article', entityUuid: `ART-${articleId}`, eventType: type,
  actorId: actor.ID, actorName: actor.zc_display_value, previousState: '', newState: '', summary, occurredAt: ago(minutes),
})

const auditEvents: AuditEvent[] = [
  event('V1', 'A2', 'Review Changes Requested', ztm, 180, 'Zara Malik recorded Changes Requested for revision 1.'),
  event('V2', 'A4', 'Review Approved', anshika, 120),
  event('V3', 'A6', 'Catalyst Article Published', piyu, 60 * 24),
  event('V4', 'A6', 'Notification Handoff', piyu, 60 * 24),
  event('V5', 'A3', 'Submitted for Review', ztm, 60 * 5),
  event('V6', 'A8', 'New Version Started', piyu, 45),
  event('V7', 'A9', 'Article Scheduled', ztm, 60 * 7),
  event('V8', 'A12', 'Catalyst Handoff Accepted', piyu, 60 * 3),
  event('V9', 'A11', 'Catalyst Article Retracted', anshika, 60 * 24 * 2),
]

export function demoDashboard(): DashboardData {
  return {
    currentEmployee: { id: 'E1', displayName: 'Piyu Gene', workEmail: 'piyu@example.com', roles: ['Editorial Admin', 'Reviewer', 'Publisher', 'Author'] },
    articles,
    publicationJobs: jobs,
    assignments,
    auditEvents,
    categories: [ra, pv, mkt],
    approvalPolicies: [{ ...policy, description: 'One reviewer approval.', requiredApprovals: 1, isDefault: true }],
    source: 'mock',
  }
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CreatorEditorialRepository } from '../src/repository/creatorRepository.ts';
import { createRepository } from '../src/repository/index.ts';
import { documentText, metricsFor } from '../src/utils.ts';

const employee = { ID: '11', Display_Name: 'Test Editor', Work_Email: 'editor@example.test', Creator_Username: '' };
const article = { ID: '21', Article_UUID: 'ART-test', Working_Title: 'Readiness test', Owner: { ID: '11' }, Primary_Author: { ID: '11' }, Workflow_State: 'Draft', Active_Draft_Revision_ID: '31' };
const revision = { ID: '31', Article: { ID: '21' }, Revision_UUID: 'REV-test-0001', Revision_Number: 1, Revision_State: 'Draft', Title: 'Readiness test', Slug: 'readiness-test', Robots_Directive: 'Index Follow', Editor_Document: '', Document_Checksum: '' };
function install({ login = 'editor@example.test', records, record = revision, currentArticle = article, readFile } = {}) {
  const calls = [];
  globalThis.document = { referrer: 'https://creatorapp.zoho.in/piyugene02/genedrift-editorial-platform' };
  globalThis.window = { location: { href: 'https://widget.example.test/' }, ZOHO: { CREATOR: {
    UTIL: { getInitParams: async () => ({ loginUser: login }) },
    DATA: {
      getRecords: async (config) => {
        calls.push(config);
        if (records) { const result = await records(config); if (result) return result; }
        if (config.report_name === 'Demo_Employees_Report') return { code: 3000, data: [employee] };
        if (config.report_name === 'Editorial_Role_Assignments_Report') return { code: 3000, data: [{ Editorial_Role: 'Editorial Admin', Employee: { ID: '11' }, Active: true }] };
        return { code: 3000, data: [] };
      },
      getRecordById: async (config) => ({ code: 3000, data: config.report_name === 'Articles_Report' ? currentArticle : record }),
      addRecords: async () => { throw new Error('Unexpected record creation'); },
    },
    FILE: { readFile: readFile || (async () => ({ code: 3730 })) },
  } } };
  return calls;
}

test('rich text extraction preserves words split by formatting and separates blocks', () => {
  const doc = { type: 'doc', content: [{ type: 'paragraph', content: [
    { type: 'text', text: 'reg' }, { type: 'text', text: 'ulatory', marks: [{ type: 'bold' }] },
    { type: 'hardBreak' }, { type: 'text', text: 'guidance' },
  ] }, { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] }] };
  assert.equal(documentText(doc), 'regulatory guidance Overview');
  assert.equal(metricsFor(doc).wordCount, 3);
});

test('production startup refuses to substitute demo data when the SDK is missing', () => {
  globalThis.window = {};
  assert.throws(() => createRepository(), /SDK|Creator/i);
});

test('missing login cannot match an employee with an empty Creator username', async () => {
  install({ login: '' });
  await assert.rejects(new CreatorEditorialRepository().loadDashboard(), /login|identity|session/i);
});

test('dashboard reads subsequent report pages instead of hiding articles after the first page', async () => {
  const calls = install({ records: (config) => {
    if (config.report_name !== 'Articles_Report') return;
    return config.record_cursor
      ? { code: 3000, data: [{ ...article, ID: '1021' }] }
      : { code: 3000, data: Array.from({ length: 1000 }, (_, i) => ({ ...article, ID: String(i + 21) })), record_cursor: 'next-page' };
  } });
  const data = await new CreatorEditorialRepository().loadDashboard();
  assert.equal(data.articles.length, 1001);
  assert.equal(calls.filter((c) => c.report_name === 'Articles_Report').length, 2);
});

test('missing previously saved document fails visibly rather than opening an empty editable body', async () => {
  install({ record: { ...revision, Editor_Document: 'revision.json', Document_Checksum: 'saved-hash' } });
  await assert.rejects(new CreatorEditorialRepository().loadWorkspace('21'), /document|file/i);
});

test('a genuinely new draft may have no uploaded document', async () => {
  install();
  const data = await new CreatorEditorialRepository().loadWorkspace('21');
  assert.equal(data.revision.document.type, 'doc');
});

test('a non-draft article with no readable revision cannot create a new draft revision', async () => {
  install({ currentArticle: { ...article, Workflow_State: 'Approved', Active_Draft_Revision_ID: '' } });
  await assert.rejects(new CreatorEditorialRepository().loadWorkspace('21'), /no revision available/i);
});

test('repeated pagination cursors fail instead of looping or displaying partial counts', async () => {
  install({ records: (config) => config.report_name === 'Articles_Report' ? { code: 3000, data: [article], record_cursor: 'repeated' } : undefined });
  await assert.rejects(new CreatorEditorialRepository().loadDashboard(), /repeated.*cursor/i);
});

test('publication report failures are not silently converted into an empty publishing queue', async () => {
  install({ records: (config) => {
    if (config.report_name === 'Publication_Jobs_Report') throw new Error('Permission denied');
  } });
  await assert.rejects(new CreatorEditorialRepository().loadDashboard(), /Permission denied/);
});

test('optional dashboard history failure is visibly reported', async () => {
  install({ records: (config) => {
    if (config.report_name === 'Audit_Events_Report') throw new Error('History unavailable');
  } });
  const data = await new CreatorEditorialRepository().loadDashboard();
  assert.match(data.warnings[0], /Activity history could not be loaded/);
});

test('Creator reset cannot invoke the destructive server action', async () => {
  install();
  await assert.rejects(new CreatorEditorialRepository().resetTestContent('RESET TEST CONTENT'), /disabled/i);
});

test('a hidden Editor Document report field still reads the saved file', async () => {
  const record = { ...revision }; delete record.Editor_Document;
  install({ record, readFile: async () => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Preserved body' }] }] }) });
  const data = await new CreatorEditorialRepository().loadWorkspace('21');
  assert.equal(documentText(data.revision.document), 'Preserved body');
});

test('an archived article or obsolete draft is rejected before any body upload', async () => {
  for (const currentArticle of [{ ...article, Workflow_State: 'Archived' }, { ...article, Active_Draft_Revision_ID: '32' }]) {
    install({ currentArticle });
    const repo = new CreatorEditorialRepository();
    const loaded = await repo.loadWorkspace('21', '31');
    let uploads = 0;
    window.ZOHO.CREATOR.FILE.uploadFile = async () => { uploads++; throw new Error('Unexpected upload'); };
    await assert.rejects(repo.saveDraft({ ...loaded.revision, expectedChecksum: '', expectedVersionToken: loaded.revision.versionToken, saveTaxonomy: false, tagIds: [] }), /active editable draft/i);
    assert.equal(uploads, 0);
  }
});

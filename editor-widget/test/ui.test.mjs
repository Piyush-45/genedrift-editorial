import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
const dom = new JSDOM('<!doctype html><html><body><button id="outside">Outside</button><div id="root"></div></body></html>', { url: 'https://widget.example.test/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'DOMParser', 'MutationObserver', 'HTMLInputElement', 'HTMLTextAreaElement']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.ZOHO = { CREATOR: { DATA: {}, UTIL: { navigateParentURL() {} } } };
const { createRoot } = await import('react-dom/client');
const { CreatorEditorialRepository } = await import('../src/repository/creatorRepository.ts');
const { default: App } = await import('../src/App.tsx');
const { MediaDialog } = await import('../src/components/MediaDialog.tsx');
const prototype = CreatorEditorialRepository.prototype;
const original = Object.getOwnPropertyDescriptors(prototype);
let root;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const employee = { id: '11', displayName: 'Test Editor', workEmail: 'editor@example.test', roles: ['Editorial Admin', 'Author', 'Publisher'] };
const article = { id: '21', uuid: 'ART-test', workingTitle: 'Production readiness test', owner: { ID: '11' }, primaryAuthor: { ID: '11' }, tags: [], approvalPolicy: { ID: '41' }, workflowState: 'Draft', activeDraftRevisionId: '31' };
const revision = { id: '31', uuid: 'REV-test', articleId: '21', number: 1, state: 'Draft', title: article.workingTitle, slug: 'production-readiness-test', excerpt: '', seoTitle: '', seoDescription: '', robotsDirective: 'Index Follow', wordCount: 1, readingTimeMinutes: 1, versionToken: 'old-token', document: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Original' }] }] } };
const workspace = { article, revision, eligibleReviewers: [], categories: [], tags: [], review: { currentEmployee: employee, comments: [], canReview: false }, feedback: [], auditEvents: [], source: 'creator' };
async function mount(component) {
  root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(component); await delay(20); });
  await act(async () => { await delay(40); });
}
function button(label) { return [...document.querySelectorAll('button')].find((node) => node.textContent.trim() === label); }
async function click(node) { assert.ok(node, 'Expected control exists'); await act(async () => { node.click(); await delay(10); }); }
function setupEditor() {
  prototype.resolveArticleId = async () => '21';
  prototype.resolveRevisionId = async () => undefined;
  prototype.loadWorkspace = async () => structuredClone(workspace);
}
afterEach(async () => {
  if (root) await act(async () => { root.unmount(); });
  root = undefined;
  Object.defineProperties(prototype, original);
  Object.defineProperty(window, 'localStorage', { configurable: true, value: dom.window.sessionStorage });
  window.localStorage.clear();
});

test('storage failure leaves title editable and autosave still reaches Creator', async () => {
  setupEditor();
  let saves = [];
  prototype.saveDraft = async (input) => { saves.push(input); return { ...revision, ...input, versionToken: 'saved-token' }; };
  Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
  await mount(createElement(App));
  const title = document.querySelector('textarea[aria-label="Article title"]');
  assert.ok(title);
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(title, 'Edited despite blocked storage');
    title.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  await act(async () => { await delay(1600); });
  assert.equal(saves.at(-1)?.title, 'Edited despite blocked storage');
  assert.match(document.body.textContent, /Saved/);
  assert.match(document.body.textContent, /Local recovery is unavailable/);
});

test('dashboard keeps accepted publish truthful if its follow-up refresh fails', async () => {
  prototype.resolveArticleId = async () => undefined;
  prototype.resolveRevisionId = async () => undefined;
  let reads = 0, publishes = 0;
  prototype.loadDashboard = async () => {
    if (++reads > 1) throw new Error('Refresh connection unavailable');
    return { currentEmployee: employee, articles: [{ ...article, workflowState: 'Approved', approvedRevisionId: '31' }], publicationJobs: [], assignments: [], auditEvents: [], categories: [], approvalPolicies: [], source: 'creator' };
  };
  prototype.publishArticle = async () => { publishes++; return { ok: true, message: 'Accepted for publishing' }; };
  await mount(createElement(App));
  assert.equal(button('Reset test content'), undefined);
  await click(button('Publish'));
  assert.equal(publishes, 1);
  assert.match(document.body.textContent, /Publishing started/);
  assert.match(document.body.textContent, /Refresh connection unavailable/);
  assert.doesNotMatch(document.body.textContent, /Publishing failed/);
});

test('media dialog traps keyboard focus, closes with Escape, and restores the trigger', async () => {
  const trigger = document.getElementById('outside');
  trigger.focus();
  let closed = 0;
  await mount(createElement(MediaDialog, { open: true, mode: 'cover', onClose: () => { closed++; }, onSubmit() {} }));
  const dialog = document.querySelector('[role="dialog"]');
  assert.ok(dialog.contains(document.activeElement));
  const controls = [...dialog.querySelectorAll('button,input,textarea')].filter((node) => !node.disabled);
  controls.at(-1).focus();
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  assert.equal(document.activeElement, controls[0]);
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(closed, 1);
  await act(async () => root.unmount()); root = undefined;
  assert.equal(document.activeElement, trigger);
});

test('edits made during an in-flight save are queued without replacing newer text', async () => {
  setupEditor();
  let release;
  const saves = [];
  prototype.saveDraft = async (input) => {
    saves.push(input);
    if (saves.length === 1) await new Promise((resolve) => { release = resolve; });
    return { ...revision, ...input, checksum: 'saved-checksum', versionToken: 'saved-token' };
  };
  await mount(createElement(App));
  const title = document.querySelector('textarea[aria-label="Article title"]');
  async function type(value) {
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(title, value);
      title.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
  }
  await type('First edit');
  await click(button('Save draft'));
  await type('Newer edit while saving');
  await act(async () => { release(); await delay(30); });
  assert.equal(saves.length, 2);
  assert.equal(saves[1].title, 'Newer edit while saving');
  assert.equal(saves[1].expectedVersionToken, 'saved-token');
  assert.equal(title.value, 'Newer edit while saving');
});

test('restoring an older recovery copy preserves its conflict token and does not overwrite taxonomy', async () => {
  setupEditor();
  const recovery = { ...revision, title: 'Recovered title', expectedChecksum: 'old-checksum', expectedVersionToken: 'recovery-old-token', primaryCategoryId: 'unrelated-category', tagIds: ['unrelated-tag'], saveTaxonomy: false };
  window.localStorage.setItem('genedrift:recovery:31', JSON.stringify(recovery));
  let saved;
  prototype.hydrateDocument = async (doc) => doc;
  prototype.saveDraft = async (input) => { saved = input; throw new Error('Draft changed elsewhere'); };
  await mount(createElement(App));
  await click(button('Restore'));
  await click(button('Save draft'));
  assert.equal(saved.expectedVersionToken, 'recovery-old-token');
  assert.equal(saved.expectedChecksum, 'old-checksum');
  assert.equal(saved.saveTaxonomy, false);
  assert.deepEqual(saved.tagIds, []);
  assert.match(document.body.textContent, /Draft changed elsewhere/);
});

test('back-to-dashboard waits for saving and stays in the editor when saving fails', async () => {
  setupEditor();
  let navigations = 0;
  window.ZOHO.CREATOR.UTIL.navigateParentURL = () => { navigations++; };
  prototype.saveDraft = async () => { throw new Error('Save connection unavailable'); };
  await mount(createElement(App));
  const title = document.querySelector('textarea[aria-label="Article title"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(title, 'Keep my unsaved title');
    title.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
  await click(document.querySelector('button[aria-label="Back to dashboard"]'));
  assert.equal(navigations, 0);
  assert.equal(title.value, 'Keep my unsaved title');
  assert.match(document.body.textContent, /Save connection unavailable/);
});

test('an approved article opened at an older revision does not expose Publish', async () => {
  setupEditor();
  prototype.loadWorkspace = async () => ({ ...structuredClone(workspace), article: { ...article, workflowState: 'Approved', approvedRevisionId: '32' }, revision: { ...revision, state: 'Submitted' } });
  await mount(createElement(App));
  assert.equal(button('Publish'), undefined);
  assert.equal(button('Save draft'), undefined);
  assert.equal(document.querySelector('textarea[aria-label="Article title"]').readOnly, true);
});

test('patched editor round-trips H2/H3, bold, lists, tables, and canonical inline images', async () => {
  const { Editor } = await import('@tiptap/core');
  const { default: StarterKit } = await import('@tiptap/starter-kit');
  const { TableKit } = await import('@tiptap/extension-table');
  const { MediaImage } = await import('../src/extensions/MediaImage.ts');
  const { canonicalizeMedia } = await import('../src/media.ts');
  const content = { type: 'doc', content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Section' }] },
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Subsection' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Bold text', marks: [{ type: 'bold' }] }] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item' }] }] }] },
    { type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cell' }] }] }] }] },
    { type: 'mediaImage', attrs: { mediaId: 'MED-test', creatorRecordId: '51', src: 'blob:temporary-preview', alt: 'Accessible image', caption: 'Image caption' } },
  ] };
  const extensions = [StarterKit.configure({ heading: { levels: [2, 3, 4] } }), TableKit, MediaImage];
  const first = new Editor({ extensions, content });
  const saved = canonicalizeMedia(first.getJSON());
  const second = new Editor({ extensions, content: saved });
  assert.deepEqual(canonicalizeMedia(second.getJSON()), saved);
  assert.match(second.getHTML(), /<h2>Section<\/h2>/);
  assert.match(second.getHTML(), /<h3>Subsection<\/h3>/);
  assert.match(second.getHTML(), /<strong>Bold text<\/strong>/);
  assert.match(second.getHTML(), /<table/);
  assert.doesNotMatch(JSON.stringify(saved), /blob:temporary-preview/);
  first.destroy(); second.destroy();
});

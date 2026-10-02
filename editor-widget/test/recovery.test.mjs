import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecoveryStorage, parseRecovery } from '../src/recovery.ts';

test('blocked browser storage cannot interrupt edits, autosave, or save acknowledgement', () => {
  const notices = [];
  const storage = createRecoveryStorage(() => { throw new Error('Storage is blocked'); }, (message) => notices.push(message));
  assert.equal(storage.getItem('draft'), null);
  assert.doesNotThrow(() => storage.setItem('draft', '{}'));
  assert.doesNotThrow(() => storage.removeItem('draft'));
  assert.equal(notices.length, 3);
});

test('storage quota exhaustion reports recovery unavailability without throwing', () => {
  let warning = '';
  const storage = createRecoveryStorage(() => ({ setItem() { throw new Error('Quota exceeded'); } }), (message) => { warning = message; });
  storage.setItem('draft', '{}');
  assert.match(warning, /recovery is unavailable/);
});

test('malformed or cross-revision recovery data cannot replace saved content', () => {
  for (const value of ['null', '{}', '{', '{"id":"wrong","document":{"type":"doc"}}']) {
    assert.throws(() => parseRecovery(value, '31'));
  }
});

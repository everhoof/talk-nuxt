import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMessageComposer } from '../app/tools/message-composer.ts';

const draft = (text) => ({ text, html: `<p>${text}</p>` });
const deferred = () => {
  const { promise, resolve, reject } = Promise.withResolvers();
  return { promise, resolve, reject };
};
const composer = (submit) => createMessageComposer({
  submit, newId: () => 'stable-client-id', errorMessage: (error) => error.message,
});

test('failed sends retain their draft and pictures and retry the same client ID', async () => {
  const sent = [];
  const state = composer(async (submission) => {
    sent.push(submission);
    if (sent.length === 1) throw new Error('Offline');
  });
  state.updateDraft(draft('Recover me'));
  state.attachments.value = [12];
  assert.equal(await state.send(), false);
  assert.equal(state.status.value, 'failed');
  assert.deepEqual(state.draft.value, draft('Recover me'));
  assert.deepEqual(state.attachments.value, [12]);
  assert.equal(await state.retry(), true);
  assert.equal(sent[0].randomId, sent[1].randomId);
  assert.equal(state.draft.value.html, '');
  assert.deepEqual(state.attachments.value, []);
});

test('a late response does not erase a newer draft or accept a duplicate send', async () => {
  const request = deferred();
  const state = composer(() => request.promise);
  state.updateDraft(draft('First'));
  const send = state.send();
  assert.equal(await state.send(), false);
  state.updateDraft(draft('Second'));
  request.resolve();
  assert.equal(await send, true);
  assert.deepEqual(state.draft.value, draft('Second'));
});

test('rejected edits retain the attempted text and cancellation restores the original draft', async () => {
  const state = composer(async () => {
    throw new Error('Rejected');
  });
  state.updateDraft(draft('Unsent draft'));
  state.attachments.value = [3];
  state.startEdit({ id: 9, content: '<p>Original</p>' }, 'Original');
  state.updateDraft(draft('Edited'));
  assert.equal(await state.send(), false);
  assert.equal(state.editing.value.id, 9);
  assert.deepEqual(state.draft.value, draft('Edited'));
  state.cancelEdit();
  assert.deepEqual(state.draft.value, draft('Unsent draft'));
  assert.deepEqual(state.attachments.value, [3]);
});

test('cancelling an in-flight edit keeps the restored draft when the response arrives', async () => {
  const request = deferred();
  const state = composer(() => request.promise);
  state.updateDraft(draft('Unsent draft'));
  state.startEdit({ id: 9, content: '<p>Original</p>' }, 'Original');
  state.updateDraft(draft('Edited'));
  const send = state.send();
  state.cancelEdit();
  request.resolve();
  await send;
  assert.equal(state.editing.value, undefined);
  assert.deepEqual(state.draft.value, draft('Unsent draft'));
});

test('a failed submission can be retried without replacing text written during the request', async () => {
  const request = deferred();
  let attempts = 0;
  const state = composer(() => (++attempts === 1 ? request.promise : Promise.resolve()));
  state.updateDraft(draft('First'));
  const send = state.send();
  state.updateDraft(draft('Second'));
  request.reject(new Error('Offline'));
  await send;
  await state.retry();
  assert.deepEqual(state.draft.value, draft('Second'));
});

test('session reset discards late failures and private drafts', async () => {
  const request = deferred();
  const state = composer(() => request.promise);
  state.updateDraft(draft('Private draft'));
  const send = state.send();
  state.reset();
  request.reject(new Error('Previous session'));
  await send;
  assert.equal(state.status.value, 'idle');
  assert.equal(state.failed.value, undefined);
  assert.equal(state.error.value, '');
  assert.equal(state.draft.value.html, '');
});

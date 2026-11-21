import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeMessages } from '../app/tools/message-list.ts';

const message = (id, randomId = null, content = `Message ${id}`) => ({ id, randomId, content });

test('overlapping history pages replace existing messages without duplicating them', () => {
  const current = [message(3), message(2)];
  const page = [message(2, null, 'Updated'), message(1)];
  const merged = mergeMessages(current, page, 'end');
  assert.deepEqual(
    merged.map(({ id }) => id),
    [3, 2, 1],
  );
  assert.equal(merged[1].content, 'Updated');
  assert.deepEqual(mergeMessages(merged, page, 'end'), merged);
  assert.equal(current.length, 2);
});

test('polling and pagination can receive the same message in either order', () => {
  const current = [message(2)];
  const polled = message(3, 'client-3');
  const page = [polled, message(2)];
  const pollFirst = mergeMessages(mergeMessages(current, [polled]), page);
  const pageFirst = mergeMessages(mergeMessages(current, page), [polled]);
  assert.deepEqual(pollFirst, pageFirst);
  assert.deepEqual(
    pollFirst.map(({ id }) => id),
    [3, 2],
  );
});

test('server acknowledgements replace optimistic IDs and collapse preexisting copies', () => {
  const pending = message(20_000_000, 'client-1', 'Pending');
  const delivered = message(42, 'client-1', 'Delivered');
  assert.deepEqual(mergeMessages([pending], [delivered]), [delivered]);
  // The server copy may have arrived without its client ID first.
  assert.deepEqual(mergeMessages([pending, message(42)], [delivered]), [delivered]);
  assert.deepEqual(mergeMessages([delivered, pending], [delivered]), [delivered]);
});

test('messages without random IDs remain distinct and reconcile by server ID', () => {
  const current = [message(3), message(2, ''), message(1)];
  const updated = message(2, null, 'Edited');
  assert.deepEqual(mergeMessages(current, [updated]), [current[0], updated, current[2]]);
});

test('normalizes duplicate initial data and preserves batch order in both directions', () => {
  const duplicate = message(2, 'client-2');
  assert.deepEqual(mergeMessages([], [duplicate, duplicate]), [duplicate]);
  assert.deepEqual(mergeMessages([duplicate, duplicate], []), [duplicate]);
  const batch = [message(4), message(3), message(3)];
  assert.deepEqual(
    mergeMessages([message(2)], batch).map(({ id }) => id),
    [4, 3, 2],
  );
  assert.deepEqual(
    mergeMessages([message(2)], batch, 'end').map(({ id }) => id),
    [2, 4, 3],
  );
});

test('late responses cannot undo newer content or a deletion tombstone', () => {
  const original = { ...message(1), updatedAt: '2026-11-01T00:00:00Z' };
  const edited = { ...original, content: 'Edited', updatedAt: '2026-11-18T00:00:00Z' };
  const deleted = { ...edited, deletedAt: '2026-11-18T01:00:00Z' };
  assert.deepEqual(mergeMessages([edited], [original]), [edited]);
  assert.deepEqual(mergeMessages([deleted], [edited]), [deleted]);
  assert.deepEqual(mergeMessages([original], [edited]), [edited]);
});

test('poll freshness is independent of the message update timestamp', () => {
  const earlier = { ...message(1), updatedAt: '2026-11-01T00:00:00Z', poll: { serverTime: '2026-11-18T00:00:00Z', votes: 2 } };
  const later = { ...earlier, poll: { serverTime: '2026-11-18T00:01:00Z', votes: 3 } };
  assert.equal(mergeMessages([later], [earlier])[0].poll.votes, 3);
  const edited = { ...earlier, content: 'New question', updatedAt: '2026-11-18T00:02:00Z' };
  const result = mergeMessages([later], [edited])[0];
  assert.equal(result.content, 'New question');
  assert.equal(result.poll.votes, 3);
});

test('server acknowledgement wins over a pending copy with a fast client clock', () => {
  const pending = { ...message(2e7, 'pending'), state: 'SENT', updatedAtMillis: 9_999_999_999_999 };
  const delivered = { ...message(1, 'pending', 'Server HTML'), state: 'DELIVERED', updatedAtMillis: 1 };
  assert.deepEqual(mergeMessages([pending], [delivered]), [delivered]);
  assert.deepEqual(mergeMessages([delivered], [pending]), [delivered]);
});

test('normal incoming messages inspect history a linear number of times', () => {
  let idReads = 0;
  const history = Array.from({ length: 2000 }, (_, index) => ({
    get id() {
      idReads++;
      return index;
    },
    randomId: `client-${index}`,
  }));
  const merged = mergeMessages(history, [message(2000)]);
  assert.equal(merged.length, 2001);
  assert.ok(idReads < 2000 * 20, `History was inspected ${idReads} times`);
});

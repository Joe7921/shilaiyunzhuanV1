import assert from 'node:assert/strict';
import test from 'node:test';
import {shareUrl} from '../lib/share-links.ts';

test('invitations resolve to the published site without inheriting the sender session', () => {
  const home = 'https://shilai-yunzhuan.joe7921.chatgpt.site/';
  assert.equal(shareUrl(), home);
  assert.equal(shareUrl('recipe', 'tomato-eggs'), home + '?recipe=tomato-eggs');
  const poll = new URL(shareUrl('poll', 'a&b#c'));
  assert.equal(poll.origin + poll.pathname, home);
  assert.deepEqual([...poll.searchParams], [['poll', 'a&b#c']]);
  assert.equal(poll.hash, '');
});

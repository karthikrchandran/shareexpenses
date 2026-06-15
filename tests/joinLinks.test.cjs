const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildJoinUrl,
  createJoinToken,
  validateJoinToken,
} = require('../lib/joinLinks.js');

test('creates stable Expense Set join URLs from a token', () => {
  const token = '123e4567-e89b-12d3-a456-426614174000';

  assert.equal(
    buildJoinUrl({ appUrl: 'http://localhost:3200/', token }),
    'http://localhost:3200/join/123e4567-e89b-12d3-a456-426614174000'
  );
});

test('rejects malformed join tokens', () => {
  assert.throws(
    () => validateJoinToken('../not-a-token'),
    /Invalid join link/
  );
});

test('creates a join token from the supplied UUID generator', () => {
  assert.equal(
    createJoinToken(() => '123e4567-e89b-12d3-a456-426614174000'),
    '123e4567-e89b-12d3-a456-426614174000'
  );
});

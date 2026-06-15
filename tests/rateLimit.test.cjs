const assert = require('node:assert/strict');
const test = require('node:test');

const { createRateLimiter } = require('../lib/rateLimit.js');

test('allows requests up to the configured limit inside a window', () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => 1000 });

  assert.equal(limiter.check('user-1').allowed, true);
  assert.equal(limiter.check('user-1').allowed, true);
  assert.equal(limiter.check('user-1').allowed, false);
});

test('resets rate limit after the window passes', () => {
  let currentTime = 1000;
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => currentTime });

  assert.equal(limiter.check('user-1').allowed, true);
  assert.equal(limiter.check('user-1').allowed, false);

  currentTime = 2100;
  assert.equal(limiter.check('user-1').allowed, true);
});

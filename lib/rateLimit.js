function createRateLimiter({ limit, windowMs, now = Date.now }) {
  const buckets = new Map();

  return {
    check(key) {
      const currentTime = now();
      const bucket = buckets.get(key);

      if (!bucket || currentTime >= bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: currentTime + windowMs });
        return { allowed: true, remaining: limit - 1, resetAt: currentTime + windowMs };
      }

      if (bucket.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
      }

      bucket.count += 1;
      return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
    },
  };
}

const apiRateLimiter = createRateLimiter({
  limit: Number(process.env.API_RATE_LIMIT_REQUESTS || 120),
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000),
});

function getRateLimitKey(request, actorUserId) {
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return actorUserId ? `user:${actorUserId}` : `ip:${ip}`;
}

function checkApiRateLimit(request, actorUserId) {
  return apiRateLimiter.check(getRateLimitKey(request, actorUserId));
}

module.exports = {
  checkApiRateLimit,
  createRateLimiter,
  getRateLimitKey,
};

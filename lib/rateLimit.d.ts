export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): {
  check(key: string): RateLimitResult;
};

export function getRateLimitKey(request: Request, actorUserId?: string | null): string;
export function checkApiRateLimit(request: Request, actorUserId?: string | null): RateLimitResult;

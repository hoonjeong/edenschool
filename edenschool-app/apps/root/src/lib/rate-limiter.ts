import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Check rate limit for a given request.
 * @returns null if allowed, NextResponse if rate limited
 */
export function checkRateLimit(
  req: NextRequest,
  prefix: string,
  maxAttempts: number,
  windowMs: number,
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= maxAttempts) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 1분 뒤에 다시 시도해주세요.' },
      { status: 429 },
    );
  }

  entry.count++;
  return null;
}

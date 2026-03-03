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
  // x-real-ip는 리버스 프록시(Nginx)가 설정하므로 클라이언트 위조가 어려움 → 우선 사용
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  // x-forwarded-for 사용 시: 프록시가 뒤에 추가하므로 마지막(rightmost) IP가 가장 신뢰할 수 있음
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
    return ips[ips.length - 1] || 'unknown';
  }

  return 'unknown';
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

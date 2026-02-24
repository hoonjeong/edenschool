import { NextRequest } from 'next/server';

/**
 * 리버스 프록시 뒤에서도 올바른 외부 URL을 구성합니다.
 * X-Forwarded-Proto/Host 헤더를 우선 사용하고, 없으면 Host 헤더 사용.
 */
export function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost';
  return `${proto}://${host}`;
}

/**
 * NextResponse.redirect()에 사용할 URL을 생성합니다.
 * new URL(path, req.url) 대신 buildUrl(path, req)를 사용하세요.
 */
export function buildUrl(path: string, req: NextRequest): URL {
  return new URL(path, getBaseUrl(req));
}

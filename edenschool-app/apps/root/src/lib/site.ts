import { headers } from 'next/headers';

/** 사이트 이름 (OG/JSON-LD 표기용) */
export const SITE_NAME = process.env.SITE_TITLE || '부천국어학원 이든배움국어학원';

/** 정적 기본 URL (layout metadataBase 등 요청 컨텍스트가 없는 곳의 폴백).
 *  SITE_URL 미설정 시 운영 도메인을 기본값으로 둔다. */
export const SITE_URL = (process.env.SITE_URL || 'https://edenschool.kr').replace(/\/+$/, '');

/**
 * 요청 기반 사이트 절대 URL (SEO용 canonical/sitemap/OG).
 * - SITE_URL 환경변수가 있으면 그것을 우선 사용(운영 도메인 고정).
 * - 없으면 접속한 요청의 프로토콜/호스트로 구성 → IP로 운영하는 개발 기간에도 자동 대응.
 * 리버스 프록시 뒤를 고려해 x-forwarded-* 헤더를 우선한다.
 */
export async function getSiteUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const h = await headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost';
  return `${proto}://${host}`;
}

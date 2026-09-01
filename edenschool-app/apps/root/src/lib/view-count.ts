import { NextRequest, NextResponse } from 'next/server';
import { isCrawler } from './crawler';
import { checkRateLimit } from './rate-limiter';

/**
 * 게시글 조회수 집계 공통 로직.
 *
 * 서버 렌더링 시점에 올리면 새로고침·뒤로가기·프리페치마다 조회수가 늘어나므로,
 * 브라우저에서 한 번만 호출하는 API 로 분리하고 여기서 쿠키로 중복을 걸러낸다.
 * 쿠키에는 "글번호:집계시각(초)" 목록을 담아 두고, VIEW_TTL_SECONDS 안에 다시 열면 집계하지 않는다.
 */

/** 게시판 종류별 쿠키 이름 (게시판과 질문게시판은 글번호가 겹치므로 분리) */
const COOKIE_NAME = { board: 'viewed_board', qna: 'viewed_qna' } as const;

export type ViewKind = keyof typeof COOKIE_NAME;

/** 같은 글을 다시 열어도 이 시간 안에는 조회수가 오르지 않는다 */
const VIEW_TTL_SECONDS = 60 * 60; // 1시간

/** 쿠키 크기 제한(4KB)에 걸리지 않도록 최근에 본 글만 보관 */
const MAX_ENTRIES = 60;

/** 분당 허용 집계 요청 수 (한 IP 기준). 정상 열람으로는 닿기 어려운 값. */
const RATE_LIMIT_MAX = 60;

type ViewedEntry = { id: number; at: number };

/** "12:1756000000,34:1756000100" → 유효기간이 남은 항목만 */
function parseViewed(raw: string | undefined, nowSec: number): ViewedEntry[] {
  if (!raw) return [];
  const entries: ViewedEntry[] = [];
  for (const part of raw.split(',')) {
    const [idStr, atStr] = part.split(':');
    const id = Number(idStr);
    const at = Number(atStr);
    if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(at)) continue;
    if (nowSec - at >= VIEW_TTL_SECONDS) continue;
    entries.push({ id, at });
  }
  return entries;
}

function serializeViewed(entries: ViewedEntry[]): string {
  return entries.map((e) => `${e.id}:${e.at}`).join(',');
}

/**
 * 조회수 집계 요청 처리.
 * @param increment 실제 UPDATE 수행. 글이 없으면 false 를 돌려줘야 한다.
 * @returns { counted } — 이번 요청으로 조회수가 올랐는지 여부
 */
export async function handleViewCount(
  req: NextRequest,
  kind: ViewKind,
  increment: (id: number) => Promise<boolean>,
): Promise<NextResponse> {
  const limited = checkRateLimit(req, `view:${kind}`, RATE_LIMIT_MAX, 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const id = Number((body as { id?: unknown } | null)?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 });
  }

  // 크롤러는 대부분 JS 를 실행하지 않아 여기까지 오지 않지만, UA 로 한 번 더 거른다.
  if (isCrawler(req.headers.get('user-agent'))) {
    return NextResponse.json({ counted: false });
  }

  const cookieName = COOKIE_NAME[kind];
  const nowSec = Math.floor(Date.now() / 1000);
  const viewed = parseViewed(req.cookies.get(cookieName)?.value, nowSec);

  if (viewed.some((e) => e.id === id)) {
    return NextResponse.json({ counted: false });
  }

  const counted = await increment(id);
  if (!counted) {
    // 없는 글이면 쿠키를 더럽히지 않는다
    return NextResponse.json({ counted: false });
  }

  const next = [{ id, at: nowSec }, ...viewed].slice(0, MAX_ENTRIES);
  const res = NextResponse.json({ counted: true });
  res.cookies.set(cookieName, serializeViewed(next), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: VIEW_TTL_SECONDS,
  });
  return res;
}

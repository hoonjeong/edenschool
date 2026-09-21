import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { existsPortfolioItem, insertPortfolioItem, deletePortfolioItem, type PortfolioKind } from '@edenschool/common/queries/career-portfolio';

const KINDS: PortfolioKind[] = ['major', 'job', 'test', 'summary'];

/** POST /api/career/portfolio — 관심 학과·직업, 검사 결과 링크, 요약 저장 (학원생 로그인 필요) */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });

  const kind = body.kind as PortfolioKind;
  const refId = String(body.refId ?? '').trim();
  const title = String(body.title ?? '').trim();
  const content = body.content === undefined || body.content === null ? null : String(body.content).trim();

  if (!KINDS.includes(kind) || !title || title.length > 200 || refId.length > 32) {
    return NextResponse.json({ ok: false, error: '저장할 항목 정보가 올바르지 않습니다.' }, { status: 400 });
  }
  if (kind === 'test' && (!content || !/^https:\/\/www\.career\.go\.kr\//.test(content))) {
    return NextResponse.json({ ok: false, error: '검사 결과 주소가 올바르지 않습니다.' }, { status: 400 });
  }
  if (kind === 'summary' && (!content || content.length < 10 || content.length > 300)) {
    return NextResponse.json({ ok: false, error: '요약은 10~300자로 입력해 주세요.' }, { status: 400 });
  }

  try {
    // 관심 학과·직업·검사는 한 번만, 요약은 날마다 쌓인다
    if (kind !== 'summary' && (await existsPortfolioItem(session.user.id, kind, refId))) {
      return NextResponse.json({ ok: true, duplicated: true });
    }
    const id = await insertPortfolioItem(session.user.id, kind, refId, title, content);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    // 테이블 미적용(sql/career-portfolio.sql) 상태를 사용자에게 알린다
    console.error('career_portfolio insert error:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: '포트폴리오 저장소가 아직 준비되지 않았습니다.' }, { status: 503 });
  }
});

/** DELETE /api/career/portfolio?id=… */
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  const affected = await deletePortfolioItem(id, session.user.id);
  return NextResponse.json({ ok: affected > 0 });
});

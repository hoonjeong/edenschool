import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { checkRateLimit } from '@/lib/rate-limiter';
import { submitReportV1, submitReportV2, CareernetError } from '@/lib/careernet/client';
import { findTest } from '@/lib/careernet/content';

/**
 * POST /api/career/test — 심리검사 결과 요청 (커리어넷 중계).
 * 브라우저가 API 키를 갖지 않도록 서버가 대신 호출한다.
 * 이름·학교·이메일은 선택값이라 보내지 않는다(개인정보 최소 수집).
 * 커리어넷은 이용량에 따라 제한될 수 있어 IP 당 분당 5회로 막는다.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const limited = checkRateLimit(req, 'career-test-report', 5, 60 * 1000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });

  const qno = String(body.qno ?? '');
  const test = findTest(qno);
  if (!test) return NextResponse.json({ ok: false, error: '지원하지 않는 검사입니다.' }, { status: 400 });

  const gender = body.gender === '100324' ? '100324' : body.gender === '100323' ? '100323' : null;
  const grade = String(body.grade ?? '');
  const startDtm = Number(body.startDtm);
  if (!gender || !/^[1-3]$/.test(grade) || !Number.isFinite(startDtm)) {
    return NextResponse.json({ ok: false, error: '성별·학년·시작 시각이 필요합니다.' }, { status: 400 });
  }

  try {
    if (test.version === 'v1') {
      const answers = String(body.answers ?? '');
      if (!answers) return NextResponse.json({ ok: false, error: '답변이 없습니다.' }, { status: 400 });
      const r = await submitReportV1({ qestrnSeq: qno, trgetSe: test.trgetSe, gender, grade, startDtm, answers });
      return NextResponse.json({ ok: true, url: r.url });
    }
    const answers = Array.isArray(body.answers) ? (body.answers as { no: string; val: string }[]) : [];
    if (answers.length === 0) return NextResponse.json({ ok: false, error: '답변이 없습니다.' }, { status: 400 });
    const r = await submitReportV2({
      qno: Number(qno),
      trgetse: test.trgetSe,
      gender,
      grade,
      startdtm: startDtm,
      answers: answers.map((a) => ({ no: String(a.no), val: String(a.val) })),
    });
    return NextResponse.json({ ok: true, url: r.url });
  } catch (e) {
    if (e instanceof CareernetError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    }
    throw e;
  }
});

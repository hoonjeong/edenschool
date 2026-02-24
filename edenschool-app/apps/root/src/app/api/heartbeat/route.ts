import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { upsertSessionLog } from '@edenschool/common/queries/session-log';

// 인메모리 쓰로틀: user_id -> 마지막 DB 기록 시각
const throttleMap = new Map<number, number>();
const THROTTLE_MS = 5 * 60 * 1000; // 5분

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const now = Date.now();

  // 쓰로틀 체크
  const lastTime = throttleMap.get(userId) || 0;
  if (now - lastTime < THROTTLE_MS) {
    return NextResponse.json({ ok: true, throttled: true });
  }
  throttleMap.set(userId, now);

  // IP, UA 추출
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '0.0.0.0';
  const userAgent = req.headers.get('user-agent') || '';

  // 세션 로그 UPSERT
  await upsertSessionLog(userId, ip, userAgent);

  return NextResponse.json({ ok: true });
}

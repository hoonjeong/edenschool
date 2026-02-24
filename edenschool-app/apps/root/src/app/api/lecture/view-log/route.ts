import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { insertLectureViewLog, updateLectureViewLog } from '@edenschool/common/queries/lecture-view-log';

function detectDeviceType(ua: string): string {
  if (/iPad|Tablet|PlayBook/i.test(ua)) return 'tablet';
  if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) return 'mobile';
  if (/Windows|Macintosh|Linux/i.test(ua)) return 'pc';
  return 'other';
}

// POST: 시청 시작 (새 로그 생성) + sendBeacon 종료 처리
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '0.0.0.0';
  const userAgent = req.headers.get('user-agent') || '';

  const body = await req.json();

  // sendBeacon 종료 업데이트 (_method='PUT')
  if (body._method === 'PUT') {
    const { id, endSeconds, duration } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    await updateLectureViewLog(id, session.user.id, endSeconds || 0, duration || 0);
    return NextResponse.json({ success: true });
  }

  // 시청 시작
  const { lectureId, startSeconds } = body;
  if (!lectureId) {
    return NextResponse.json({ error: 'Missing lectureId' }, { status: 400 });
  }

  const deviceType = detectDeviceType(userAgent);
  const id = await insertLectureViewLog(
    session.user.id,
    lectureId,
    ip,
    deviceType,
    userAgent,
    startSeconds || 0
  );

  return NextResponse.json({ id });
}

// PUT: 시청 업데이트 (진행/종료)
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, endSeconds, duration } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  await updateLectureViewLog(id, session.user.id, endSeconds || 0, duration || 0);
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { selectLectureProgress, upsertLectureProgress } from '@edenschool/common/queries/lecture-progress';

// 학생: 진도 조회
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lectureId = Number(req.nextUrl.searchParams.get('lectureId'));
  if (!lectureId) {
    return NextResponse.json({ error: 'Missing lectureId' }, { status: 400 });
  }

  const progress = await selectLectureProgress(session.user.id, lectureId);
  return NextResponse.json({ progress });
}

// 학생: 진도 저장
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { lectureId, watchedSeconds, duration, percent, completed } = body;

  if (!lectureId || watchedSeconds == null || duration == null || percent == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await upsertLectureProgress(
    session.user.id,
    lectureId,
    watchedSeconds,
    duration,
    percent,
    completed || 0
  );

  return NextResponse.json({ success: true });
}

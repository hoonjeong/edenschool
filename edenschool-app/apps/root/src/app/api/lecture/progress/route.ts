import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectLectureProgress, upsertLectureProgress } from '@edenschool/common/queries/lecture-progress';
import { isLectureAccessibleByStudent } from '@edenschool/common/queries/lecture';

// 학생: 진도 조회
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const lectureId = Number(req.nextUrl.searchParams.get('lectureId'));
  if (!lectureId) {
    return NextResponse.json({ error: 'Missing lectureId' }, { status: 400 });
  }

  const progress = await selectLectureProgress(session.user.id, lectureId);
  return NextResponse.json({ progress });
});

// 학생: 진도 저장
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const body = await req.json();
  const { lectureId, watchedSeconds, duration, percent, completed } = body;

  if (!lectureId || watchedSeconds == null || duration == null || percent == null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const numLectureId = Number(lectureId);
  const numWatched = Number(watchedSeconds);
  const numDuration = Number(duration);
  const numPercent = Number(percent);
  const numCompleted = Number(completed) || 0;

  if (!Number.isInteger(numLectureId) || numLectureId <= 0) {
    return NextResponse.json({ error: 'Invalid lectureId' }, { status: 400 });
  }
  if (session.user.studentId) {
    const accessible = await isLectureAccessibleByStudent(numLectureId, session.user.studentId);
    if (!accessible) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  if (isNaN(numWatched) || numWatched < 0 || isNaN(numDuration) || numDuration < 0) {
    return NextResponse.json({ error: 'Invalid time values' }, { status: 400 });
  }
  if (isNaN(numPercent) || numPercent < 0 || numPercent > 100) {
    return NextResponse.json({ error: 'Invalid percent' }, { status: 400 });
  }

  await upsertLectureProgress(
    session.user.id,
    numLectureId,
    numWatched,
    numDuration,
    numPercent,
    numCompleted
  );

  return NextResponse.json({ success: true });
});

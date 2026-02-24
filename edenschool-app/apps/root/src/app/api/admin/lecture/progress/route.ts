import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-session';
import { selectLectureProgressByLectureId } from '@edenschool/common/queries/lecture-progress';

// 관리자: 강의별 시청 학생 목록
export async function GET(req: NextRequest) {
  await requireAdminSession();

  const lectureId = Number(req.nextUrl.searchParams.get('lectureId'));
  if (!lectureId) {
    return NextResponse.json({ error: 'Missing lectureId' }, { status: 400 });
  }

  const list = await selectLectureProgressByLectureId(lectureId);
  return NextResponse.json({ list });
}

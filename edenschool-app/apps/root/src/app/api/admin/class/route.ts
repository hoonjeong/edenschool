import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession, requireOwnerApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { insertClassInfo, selectClassInfoListLive } from '@edenschool/common/queries/class';

export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();
  const list = await selectClassInfoListLive();
  return NextResponse.json({ list });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();

  try {
    const body = await req.json();
    const { name, subject, grade, year, day, hour, minute, teacherOne, teacherTwo, code, price } = body;

    const classId = await insertClassInfo({ name, subject, grade, year, day, hour, minute, teacherOne, teacherTwo, code, price });

    return NextResponse.json({ success: true, id: classId });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json({ success: false, error: '수강반 추가에 실패했습니다.' }, { status: 500 });
  }
});

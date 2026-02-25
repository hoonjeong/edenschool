import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { deleteLectureById, selectLectureTeacherById } from '@edenschool/common/queries/lecture';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  try {
    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing lecture id' }, { status: 400 });
    }

    // 선생님은 본인 강의만 삭제 가능
    if (session.user.code !== 'O') {
      const teacher = await selectLectureTeacherById(Number(id));
      if (teacher !== session.user.name) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    await deleteLectureById(Number(id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete lecture error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete lecture' }, { status: 500 });
  }
});

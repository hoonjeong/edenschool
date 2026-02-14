import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { deleteLectureById } from '@edenschool/common/queries/lecture';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing lecture id' }, { status: 400 });
    }

    // Java original: LectureDeleteController - dao.deleteLectureById(id)
    // SQL: delete from lecture where id=#{id}
    await deleteLectureById(Number(id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete lecture error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete lecture' }, { status: 500 });
  }
});

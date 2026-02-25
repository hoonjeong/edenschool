import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { selectDreamById, deleteDream } from '@edenschool/common/queries/dream';

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApiSession();

  const { id } = await params;
  const dream = await selectDreamById(Number(id));
  if (!dream) {
    return NextResponse.json({ error: '데이터를 찾을 수 없습니다.' }, { status: 404 });
  }
  if (dream.userId !== session.user.id) {
    return NextResponse.json({ error: '본인 데이터만 삭제할 수 있습니다.' }, { status: 403 });
  }

  await deleteDream(Number(id));
  return NextResponse.json({ success: true });
});

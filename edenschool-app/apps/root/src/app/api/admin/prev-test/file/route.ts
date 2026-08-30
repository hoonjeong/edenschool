import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { deletePrevTestFileInfoById } from '@edenschool/common/queries/prev-test';

// 기출 파일 **한 개** 삭제 (메타 정보는 남긴다).
// 상위의 DELETE /api/admin/prev-test?id= 는 메타 + 딸린 파일 전체를 지우는 다른 동작이다.
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const affected = await deletePrevTestFileInfoById(id);
  if (affected === 0) {
    return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
});

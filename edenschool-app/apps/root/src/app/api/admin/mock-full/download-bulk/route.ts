import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { buildZipResponse } from '@/lib/download-response';
import { selectMockFullContentsByMetaIds } from '@edenschool/common/queries/mock-test';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const body = await req.json();
  const ids: number[] = body.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids는 비어있지 않은 배열이어야 합니다.' }, { status: 400 });
  }
  if (ids.length > 50) {
    return NextResponse.json({ error: '한 번에 최대 50개까지 다운로드 가능합니다.' }, { status: 400 });
  }

  const files = await selectMockFullContentsByMetaIds(ids);
  if (files.length === 0) return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });

  return buildZipResponse(files, '풀세트모의고사_일괄다운.zip');
});

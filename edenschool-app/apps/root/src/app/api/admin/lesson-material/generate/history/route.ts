import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { listHistory } from '@/lib/lesson-material/queries';

/** 최근 생성 이력 50건 */
export const GET = withErrorHandler(async () => {
  await requireAdminApiSession();
  return NextResponse.json(await listHistory());
});

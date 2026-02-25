import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession, requireOwnerApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectSitePage, upsertSitePage } from '@edenschool/common/queries/site-config';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();
  const { searchParams } = new URL(req.url);
  const pageKey = searchParams.get('key') || 'main';
  const page = await selectSitePage(pageKey);
  return NextResponse.json({ page });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();
  const body = await req.json();
  const { page_key, blocks } = body;
  // blocks JSON을 gjsdata 컬럼에 저장, html/css는 빈 문자열
  await upsertSitePage(page_key || 'main', '', '', blocks || '[]');
  return NextResponse.json({ success: true });
});

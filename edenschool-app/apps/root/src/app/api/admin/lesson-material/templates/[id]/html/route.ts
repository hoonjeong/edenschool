import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { getTemplateHtml } from '@/lib/lesson-material/queries';
import { stripBrandingFromHtml } from '@/lib/lesson-material/template';

/** 템플릿 원본 미리보기 (출처 표기는 내보낼 때만 제거) */
export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdminApiSession();

  const row = await getTemplateHtml(Number((await params).id));
  if (!row) return new NextResponse('템플릿을 찾을 수 없습니다.', { status: 404 });

  return new NextResponse(stripBrandingFromHtml(row.html), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
});

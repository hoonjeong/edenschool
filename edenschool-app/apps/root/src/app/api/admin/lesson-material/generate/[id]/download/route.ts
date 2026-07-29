import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { getGenerationHtml } from '@/lib/lesson-material/queries';

/** 완성본 다운로드 */
export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdminApiSession();

  const row = await getGenerationHtml(Number((await params).id));
  if (!row?.full_html) return new NextResponse('생성 결과를 찾을 수 없습니다.', { status: 404 });

  const safe = (row.title || '학습자료').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);

  return new NextResponse(row.full_html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safe)}.html`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

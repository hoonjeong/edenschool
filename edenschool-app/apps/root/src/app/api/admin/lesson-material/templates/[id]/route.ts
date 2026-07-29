import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { getTemplate, deleteTemplate } from '@/lib/lesson-material/queries';

/** 삭제 (생성 이력은 template_id = NULL 로 보존) */
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdminApiSession();

  const id = Number((await params).id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const row = await getTemplate(id);
  if (!row) return NextResponse.json({ error: '템플릿을 찾을 수 없습니다.' }, { status: 404 });

  await deleteTemplate(id);
  return NextResponse.json({ ok: true });
});

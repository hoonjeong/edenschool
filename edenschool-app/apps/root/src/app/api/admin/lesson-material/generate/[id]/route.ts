import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { listGenerationSourceFiles, deleteGeneration } from '@/lib/lesson-material/queries';
import { removeSourceFile } from '@/lib/lesson-material/storage';

/** 생성 이력 삭제 (첨부 파일도 함께 삭제) */
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdminApiSession();

  const id = Number((await params).id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const sources = await listGenerationSourceFiles(id);
  await deleteGeneration(id);
  for (const s of sources) await removeSourceFile(s.stored_name);

  return NextResponse.json({ ok: true });
});

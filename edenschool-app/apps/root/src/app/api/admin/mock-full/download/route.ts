import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { fileDownloadResponse } from '@/lib/download-response';
import { selectMockFullContentByMetaId } from '@edenschool/common/queries/mock-test';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const file = await selectMockFullContentByMetaId(Number(id));
  if (!file || !file.content || !file.fileName) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return fileDownloadResponse(file.fileName, file.content as Buffer);
});

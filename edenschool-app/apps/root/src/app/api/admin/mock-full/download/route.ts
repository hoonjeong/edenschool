import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectMockFullContentByMetaId } from '@edenschool/common/queries/mock-test';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const file = await selectMockFullContentByMetaId(Number(id));
  if (!file || !file.content || !file.fileName) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const fileName = file.fileName;
  const content = file.content as Buffer;
  let contentType = 'application/octet-stream';
  if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
  else if (fileName.endsWith('.hwp') || fileName.endsWith('.hwt')) contentType = 'application/x-hwp';

  return new NextResponse(new Uint8Array(content), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Content-Length': String(content.length),
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

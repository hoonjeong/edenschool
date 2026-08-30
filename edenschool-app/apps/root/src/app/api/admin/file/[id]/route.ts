import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectFileInfoById } from '@edenschool/common/queries/file';
import { toId } from '@/lib/params';

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdminApiSession();

  const { id } = await params;
  const fileId = toId(id);
  if (!fileId) return new NextResponse('Not Found', { status: 404 });

  try {
    const file = await selectFileInfoById(fileId);

    if (!file || !file.filedata) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.filedata), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
        'Content-Length': String(file.filedata.length),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('File download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
});

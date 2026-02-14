import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectSplitFileContentByMetaId } from '@edenschool/common/queries/split-file';

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const fileInfo = await selectSplitFileContentByMetaId(Number(id));

    if (!fileInfo || !fileInfo.content || !fileInfo.fileName) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileName = fileInfo.fileName;
    const content = fileInfo.content as Buffer;

    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (fileName.endsWith('.hwp') || fileName.endsWith('.hwt')) {
      contentType = 'application/x-hwp';
    }

    const encodedFileName = encodeURIComponent(fileName);

    return new NextResponse(new Uint8Array(content), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': String(content.length),
        'Content-Transfer-Encoding': 'binary',
        'Pragma': 'no-cache',
        'Expires': '-1',
      },
    });
  } catch (error) {
    console.error('Download split file error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
});

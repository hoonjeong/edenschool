import { NextResponse } from 'next/server';
import { selectFileInfoById } from '@edenschool/common/queries/file';
import { getSession } from './session';
import { getAdminSession } from './admin-session';

export async function serveFile(id: number, mode: 'download' | 'image' | 'pdf'): Promise<NextResponse> {
  // Auth check: require either student or admin session
  const [session, adminSession] = await Promise.all([
    getSession(),
    getAdminSession(),
  ]);
  if (!session.user && !adminSession.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const file = await selectFileInfoById(id);
  if (!file || !file.filedata) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const buffer = Buffer.isBuffer(file.filedata) ? new Uint8Array(file.filedata) : file.filedata;

  if (mode === 'download') {
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
        'Content-Length': String(file.filedata.length),
      },
    });
  }

  if (mode === 'pdf') {
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.filename)}"`,
      },
    });
  }

  // mode === 'image'
  const ext = file.filename.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp',
  };
  const contentType = contentTypes[ext || ''] || 'image/jpeg';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

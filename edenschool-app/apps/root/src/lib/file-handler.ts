import { NextResponse } from 'next/server';
import { selectFileInfoById, isFilePublicImage, isFileAccessibleByUser } from '@edenschool/common/queries/file';
import { getSession } from './session';
import { getAdminSession } from './admin-session';

export async function serveFile(id: number, mode: 'download' | 'image' | 'pdf'): Promise<NextResponse> {
  const [session, adminSession] = await Promise.all([
    getSession(),
    getAdminSession(),
  ]);
  const isAdmin = !!adminSession.user;
  const isStudent = !!session.user;

  // Image mode: allow public access for teacher photos
  if (mode === 'image' && !isAdmin && !isStudent) {
    const isPublic = await isFilePublicImage(id);
    if (!isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (!isAdmin && !isStudent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Access control: admin has full access, student must have permission
  if (isStudent && !isAdmin) {
    const accessible = await isFileAccessibleByUser(id, session.user!.id);
    // Image mode: also allow teacher photos
    const isPublicPhoto = mode === 'image' && await isFilePublicImage(id);
    if (!accessible && !isPublicPhoto) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  if (mode === 'pdf') {
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.filename)}"`,
        'X-Content-Type-Options': 'nosniff',
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
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

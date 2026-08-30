import { NextResponse } from 'next/server';
import { selectFileInfoById, isFilePublicImage, isFileAccessibleByUser, isFileAttachedToPost } from '@edenschool/common/queries/file';
import { getSession } from './session';
import { getAdminSession } from './admin-session';
import { readUploadFile } from './legacy-upload';

/** filedata(DB BLOB) 우선, 없으면 파일시스템(upload/)에서 읽는다. 못 읽으면 null */
async function loadFileBuffer(file: { filedata?: unknown; filename?: string }): Promise<Uint8Array | null> {
  if (file.filedata) {
    return Buffer.isBuffer(file.filedata)
      ? new Uint8Array(file.filedata)
      : (file.filedata as Uint8Array);
  }
  if (file.filename) {
    try {
      return await readUploadFile(file.filename);
    } catch {
      return null;
    }
  }
  return null;
}

/** 다운로드(attachment) 응답 */
function downloadResponse(buffer: Uint8Array, filename: string): NextResponse {
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': String(buffer.length),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/**
 * 게시판 첨부파일 다운로드 (무인증).
 * 게시판은 로그인 없이 볼 수 있는 공개 페이지이므로 첨부파일도 같은 범위로 연다.
 * 다만 임의 파일 노출을 막기 위해 **게시글에 실제로 붙어 있는 파일**만 서빙한다.
 */
export async function servePostAttachment(id: number): Promise<NextResponse> {
  if (!Number.isInteger(id) || id <= 0) {
    return new NextResponse('Bad Request', { status: 400 });
  }
  if (!(await isFileAttachedToPost(id))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const file = await selectFileInfoById(id);
  if (!file) return new NextResponse('Not Found', { status: 404 });

  const buffer = await loadFileBuffer(file);
  if (!buffer) return new NextResponse('Not Found', { status: 404 });

  return downloadResponse(buffer, file.filename);
}

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
  if (!file) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const buffer = await loadFileBuffer(file);
  if (!buffer) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (mode === 'download') {
    return downloadResponse(buffer, file.filename);
  }

  if (mode === 'pdf') {
    return new NextResponse(buffer as unknown as BodyInit, {
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

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

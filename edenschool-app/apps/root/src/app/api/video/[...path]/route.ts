import { NextRequest, NextResponse } from 'next/server';
import { stat, open } from 'fs/promises';
import path from 'path';

const CONTENT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
};

// PM2 cwd: edenschool-app/ → ./video, 로컬 dev cwd: apps/root/ → ../../video
const VIDEO_DIR = (() => {
  const candidates = [
    path.resolve(process.cwd(), 'video'),
    path.resolve(process.cwd(), '../../video'),
  ];
  return candidates.find(dir => {
    try { require('fs').statSync(dir); return true; } catch { return false; }
  }) || candidates[0];
})();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const fileName = decodeURIComponent(segments.join('/'));

  // Path traversal prevention
  if (fileName.includes('..') || path.isAbsolute(fileName)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const filePath = path.join(VIDEO_DIR, fileName);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(VIDEO_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  let fileStat;
  try {
    fileStat = await stat(resolved);
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }

  const ext = path.extname(fileName).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
  const fileSize = fileStat.size;

  const range = req.headers.get('range');

  if (range) {
    const match = range.match(/bytes=(\d+)-(\d*)/);
    if (!match) {
      return new NextResponse('Invalid Range', { status: 416 });
    }

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1);

    if (start >= fileSize || end >= fileSize) {
      return new NextResponse('Range Not Satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;
    const fileHandle = await open(resolved, 'r');
    const buffer = Buffer.alloc(chunkSize);
    await fileHandle.read(buffer, 0, chunkSize, start);
    await fileHandle.close();

    return new NextResponse(buffer, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // No range — return full file (for small files or initial requests)
  const fileHandle = await open(resolved, 'r');
  const buffer = Buffer.alloc(fileSize);
  await fileHandle.read(buffer, 0, fileSize, 0);
  await fileHandle.close();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': String(fileSize),
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

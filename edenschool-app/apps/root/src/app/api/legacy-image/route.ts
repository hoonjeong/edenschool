import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { statSync } from 'fs';
import path from 'path';
import { selectFileInfoById } from '@edenschool/common/queries/file';

// 레거시(구 JSP) 호환: 옛 게시물 본문이 참조하는 `image-view.html?id=<file_info.id>`를 처리.
// next.config의 rewrite가 /image-view.html(및 /admin/image-view.html) → 이 라우트로 보낸다.
//
// 레거시는 업로드 파일을 디스크(upload/)에 저장하고 DB(file_info)엔 파일명만 둔다.
// 새 앱 업로드는 DB BLOB(file_info.filedata)에 저장한다. 두 경우를 모두 처리한다.
//
// 게시판은 공개 페이지이므로 인증 없이 서빙하되, 노출 범위를 줄이기 위해
// 이미지 확장자만 응답한다(첨부 PDF 등은 404).
const IMAGE_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
};

// 레거시 업로드 폴더. PM2/dev 모두 cwd=apps/root 이므로 ../../upload(= edenschool-app/upload).
// LEGACY_UPLOAD_DIR 환경변수로 명시 지정 가능.
const UPLOAD_DIR = (() => {
  if (process.env.LEGACY_UPLOAD_DIR) return path.resolve(process.env.LEGACY_UPLOAD_DIR);
  const candidates = [
    path.resolve(process.cwd(), 'upload'),
    path.resolve(process.cwd(), '../../upload'),
  ];
  return (
    candidates.find((dir) => {
      try {
        statSync(dir);
        return true;
      } catch {
        return false;
      }
    }) || candidates[1]
  );
})();

export async function GET(req: NextRequest) {
  // Number()는 'id=1291\n' 같은 공백/줄바꿈도 안전하게 처리
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id || Number.isNaN(id)) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const file = await selectFileInfoById(id);
  if (!file || !file.filename) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 이미지가 아닌 파일은 이 공개 경로로 서빙하지 않음
  const ext = file.filename.split('.').pop()?.toLowerCase() || '';
  const contentType = IMAGE_CONTENT_TYPES[ext];
  if (!contentType) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const headers = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
  };

  // 1) 새 앱 업로드: DB BLOB(filedata)이 있으면 그것으로 서빙
  if (file.filedata) {
    const buffer = Buffer.isBuffer(file.filedata)
      ? new Uint8Array(file.filedata)
      : file.filedata;
    return new NextResponse(buffer, { headers });
  }

  // 2) 레거시: 디스크 upload 폴더에서 파일명으로 읽기 (경로 순회 방지: basename만 사용)
  const safeName = path.basename(file.filename);
  try {
    const data = await readFile(path.join(UPLOAD_DIR, safeName));
    return new NextResponse(data, { headers });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}

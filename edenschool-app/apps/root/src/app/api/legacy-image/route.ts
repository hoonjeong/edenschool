import { NextRequest, NextResponse } from 'next/server';
import { selectFileInfoById } from '@edenschool/common/queries/file';
import { readUploadFile } from '@/lib/legacy-upload';

// 레거시(구 JSP) 호환: 옛 게시물 본문이 참조하는 `image-view.html?id=<file_info.id>`를 처리.
// next.config의 rewrite가 /image-view.html(및 /admin/image-view.html) → 이 라우트로 보낸다.
//
// 파일은 디스크(upload/)에 저장되고 DB(file_info)엔 파일명만 있다(레거시/새 앱 공통).
// 단, 구버전 데이터 호환을 위해 filedata(DB BLOB)가 있으면 그것도 처리한다.
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

  // 구버전 호환: DB BLOB(filedata)이 있으면 그것으로 서빙
  if (file.filedata) {
    const buffer = Buffer.isBuffer(file.filedata)
      ? new Uint8Array(file.filedata)
      : file.filedata;
    return new NextResponse(buffer as unknown as BodyInit, { headers });
  }

  // 디스크 upload/image 폴더에서 파일명으로 읽기
  try {
    const data = await readUploadFile(file.filename);
    return new NextResponse(data as unknown as BodyInit, { headers });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}

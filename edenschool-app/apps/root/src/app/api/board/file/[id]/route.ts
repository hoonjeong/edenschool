import { NextRequest, NextResponse } from 'next/server';
import { servePostAttachment } from '@/lib/file-handler';

// 게시판 첨부파일 다운로드 (무인증).
// 게시판은 로그인 없이 볼 수 있는 공개 페이지이므로 첨부파일도 외부인이 받을 수 있어야 한다.
// 임의 파일 노출을 막기 위해 servePostAttachment 가 post_file_status 에 걸린 파일인지 먼저 확인한다.
// (로그인 사용자 전용 파일은 기존 /api/file/[id] 를 그대로 쓴다.)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fileId = Number(id);
  if (!fileId || Number.isNaN(fileId)) {
    return new NextResponse('Bad Request', { status: 400 });
  }
  return servePostAttachment(fileId);
}

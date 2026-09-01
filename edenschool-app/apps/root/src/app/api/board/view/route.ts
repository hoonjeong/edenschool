import { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { handleViewCount } from '@/lib/view-count';
import { updatePostReadCount } from '@edenschool/common/queries/post';

// 게시글 조회수 집계 (무인증 — 게시판은 로그인 없이 볼 수 있는 공개 페이지).
// 중복 집계는 view-count.ts 의 쿠키 검사로 막는다.
export const POST = withErrorHandler(async (req: NextRequest) =>
  handleViewCount(req, 'board', updatePostReadCount),
);

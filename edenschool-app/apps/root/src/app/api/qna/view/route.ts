import { NextRequest } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { handleViewCount } from '@/lib/view-count';
import { updateQnaPostReadCount } from '@edenschool/common/queries/qna';

// 질문게시판 조회수 집계 (무인증 — 목록/본문은 공개 페이지).
export const POST = withErrorHandler(async (req: NextRequest) =>
  handleViewCount(req, 'qna', updateQnaPostReadCount),
);

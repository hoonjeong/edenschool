import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import {
  existsQnaPost,
  insertQnaComment,
  selectQnaCommentById,
  deleteQnaComment,
} from '@edenschool/common/queries/qna';

const MAX_COMMENT_LENGTH = 1000;

function parsePositiveInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

// 댓글 작성
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();
  const body = await req.json();
  const text = String(body.text ?? '').trim();
  const qnaPostId = parsePositiveInt(body.qnaPostId);

  if (!text) {
    return NextResponse.json({ error: '댓글 내용을 입력하세요.' }, { status: 400 });
  }
  if (text.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `댓글은 ${MAX_COMMENT_LENGTH}자 이내로 입력하세요.` }, { status: 400 });
  }
  if (!qnaPostId) {
    return NextResponse.json({ error: '유효하지 않은 게시글입니다.' }, { status: 400 });
  }

  const postExists = await existsQnaPost(qnaPostId);
  if (!postExists) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }

  const id = await insertQnaComment(text, session.user.id, qnaPostId);
  return NextResponse.json({ success: true, id });
});

// 댓글 삭제
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();
  const { searchParams } = new URL(req.url);
  const id = parsePositiveInt(searchParams.get('id'));

  if (!id) {
    return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 });
  }

  const comment = await selectQnaCommentById(id);
  if (!comment) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: '본인 댓글만 삭제할 수 있습니다.' }, { status: 403 });
  }

  await deleteQnaComment(id);
  return NextResponse.json({ success: true });
});

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { selectCommentById, deleteComment } from '@edenschool/common/queries/post';
import { toId } from '@/lib/params';

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApiSession();

  const { id } = await params;
  const commentId = toId(id);
  if (!commentId) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }
  const comment = await selectCommentById(commentId);
  if (!comment) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }
  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: '본인 댓글만 삭제할 수 있습니다.' }, { status: 403 });
  }

  await deleteComment(commentId);
  return NextResponse.json({ success: true });
});

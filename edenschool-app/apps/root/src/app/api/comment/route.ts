import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { insertComment } from '@edenschool/common/queries/post';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const { text, postId } = await req.json();
  if (!postId || !Number.isInteger(Number(postId))) {
    return NextResponse.json({ error: 'Invalid postId' }, { status: 400 });
  }
  if (!text || typeof text !== 'string' || text.length > 5000) {
    return NextResponse.json({ error: '댓글은 5000자 이내로 입력해주세요.' }, { status: 400 });
  }
  const id = await insertComment(text, session.user.id, Number(postId));
  return NextResponse.json({ success: true, id });
});

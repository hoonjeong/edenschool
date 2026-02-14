import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { insertComment } from '@edenschool/common/queries/post';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const { text, postId } = await req.json();
  const id = await insertComment(text, session.user.id, postId);
  return NextResponse.json({ success: true, id });
});

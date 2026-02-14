import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { deleteComment } from '@edenschool/common/queries/post';

export const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireApiSession();

  const { id } = await params;
  await deleteComment(Number(id));
  return NextResponse.json({ success: true });
});

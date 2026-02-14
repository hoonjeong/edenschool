import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { insertQuestion } from '@edenschool/common/queries/question';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const { text, lectureId } = await req.json();
  const id = await insertQuestion(text, session.user.id, lectureId);
  return NextResponse.json({ success: true, id });
});

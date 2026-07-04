import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { answerQuestion } from '@edenschool/common/queries/question';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  const { questionId, answer } = await req.json();

  if (!questionId || !Number.isInteger(Number(questionId))) {
    return NextResponse.json({ error: 'Invalid questionId' }, { status: 400 });
  }
  if (!answer || typeof answer !== 'string' || !answer.trim() || answer.length > 5000) {
    return NextResponse.json({ error: '답변은 5000자 이내로 입력해주세요.' }, { status: 400 });
  }

  const affected = await answerQuestion(
    Number(questionId),
    answer.trim(),
    session.user.name || '선생님'
  );
  if (affected === 0) {
    return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});

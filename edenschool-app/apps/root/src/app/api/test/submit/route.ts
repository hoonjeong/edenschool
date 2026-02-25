import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { insertTestResult } from '@edenschool/common/queries/test';
import { withTransaction } from '@edenschool/common/db';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const { testInfoId, answers } = await req.json();

  if (!testInfoId || !Number.isInteger(Number(testInfoId))) {
    return NextResponse.json({ error: 'Invalid testInfoId' }, { status: 400 });
  }
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > 200) {
    return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
  }
  for (const item of answers) {
    if (!item || !Number.isInteger(Number(item.num)) || typeof item.answer !== 'string') {
      return NextResponse.json({ error: 'Invalid answer item' }, { status: 400 });
    }
  }

  await withTransaction(async () => {
    for (const item of answers) {
      await insertTestResult(Number(testInfoId), session.user.studentId!, Number(item.num), item.answer);
    }
  });

  return NextResponse.json({ success: true });
});

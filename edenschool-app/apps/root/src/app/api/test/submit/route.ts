import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { insertTestResult } from '@edenschool/common/queries/test';
import { withTransaction } from '@edenschool/common/db';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const { testInfoId, answers } = await req.json();
  // answers is an array of { num, answer }

  await withTransaction(async () => {
    for (const item of answers) {
      await insertTestResult(testInfoId, session.user.studentId!, item.num, item.answer);
    }
  });

  return NextResponse.json({ success: true });
});

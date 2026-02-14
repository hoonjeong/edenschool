import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  // Update user code to "E" (exited)
  const { updateUserStatus } = await import('@edenschool/common/queries/user');
  await updateUserStatus(session.user.studentId!, 'E');

  session.destroy();
  return NextResponse.json({ success: true });
});

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { checkUsedEmail, updateUserInfo } from '@edenschool/common/queries/user';
import { isValidEmail } from '@edenschool/common/validation';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const { email, sphone, pphone } = await req.json();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: '올바른 이메일을 입력해주세요.' });
  }

  // Check if email is used by another user
  const count = await checkUsedEmail(session.user.studentId!, email);
  if (count > 0) {
    return NextResponse.json({ error: '이미 사용중인 이메일입니다.' });
  }

  await updateUserInfo(session.user.studentId!, email, sphone, pphone);

  // Update session
  session.user.email = email;
  await session.save();

  return NextResponse.json({ success: true });
});

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireApiSession } from '@/lib/session';
import { selectUserInfoById, updateUserInfoPw } from '@edenschool/common/queries/user';
import { verifyPassword, hashPassword } from '@edenschool/common/password';
import { isValidPassword, PASSWORD_RULES } from '@edenschool/common/validation';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireApiSession();

  const { oldPw, newPw } = await req.json();

  if (!oldPw || !newPw) {
    return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' });
  }

  if (!isValidPassword(newPw)) {
    return NextResponse.json({ error: PASSWORD_RULES });
  }

  // Verify old password
  const user = await selectUserInfoById(session.user.id);
  if (!user || !user.pw) {
    return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' });
  }

  const valid = await verifyPassword(oldPw, user.pw);
  if (!valid) {
    return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' });
  }

  const hashedPw = await hashPassword(newPw);
  await updateUserInfoPw(session.user.id, hashedPw);
  return NextResponse.json({ success: true });
});

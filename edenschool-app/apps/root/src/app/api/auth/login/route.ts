import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { selectUserInfoByLoginInput, selectUserInfoByEmail } from '@edenschool/common/queries/user';
import { verifyPassword } from '@edenschool/common/password';
import { sessionOptions } from '@edenschool/common/auth';
import type { SessionData } from '@edenschool/common/auth';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = formData.get('email') as string;
  const pw = formData.get('pw') as string;
  const referer = (formData.get('referer') as string) || '/';

  if (!email || !pw) {
    return NextResponse.redirect(new URL('/login?error=1', req.url));
  }

  // 1) 기존 방식: SQL SHA1 비교 (레거시 계정)
  let user = await selectUserInfoByLoginInput(email, pw);

  // 2) bcrypt 폴백 (리팩토링 후 가입한 계정)
  if (!user) {
    const userByEmail = await selectUserInfoByEmail(email);
    if (userByEmail?.pw?.startsWith('$2')) {
      const valid = await verifyPassword(pw, userByEmail.pw);
      if (valid) user = userByEmail;
    }
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=1', req.url));
  }

  const response = NextResponse.redirect(new URL(referer || '/', req.url));
  const session = await getIronSession<SessionData>(req, response, sessionOptions);
  session.user = {
    id: user.id,
    email: user.email,
    studentId: user.studentId,
    name: user.name,
    code: user.code,
  };
  await session.save();

  return response;
}

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { selectUserInfoByEmail } from '@edenschool/common/queries/user';
import { verifyPassword } from '@edenschool/common/password';
import { getSessionOptions } from '@edenschool/common/auth';
import type { SessionData } from '@edenschool/common/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  // Rate limit: 10 attempts per 15 minutes per IP
  const limited = checkRateLimit(req, 'login', 10, 15 * 60 * 1000);
  if (limited) return limited;

  const formData = await req.formData();
  const email = formData.get('email') as string;
  const pw = formData.get('pw') as string;
  const referer = (formData.get('referer') as string) || '/';
  const saveEmail = formData.get('saveEmail') === 'on';
  const autoLogin = formData.get('autoLogin') === 'on';

  if (!email || !pw) {
    return NextResponse.redirect(new URL('/login?error=1', req.url));
  }

  // Fetch user by email and verify password app-side (handles both bcrypt and SHA1)
  const user = await selectUserInfoByEmail(email);
  if (!user || !user.pw || !(await verifyPassword(pw, user.pw))) {
    return NextResponse.redirect(new URL('/login?error=1', req.url));
  }

  const response = NextResponse.redirect(new URL(referer || '/', req.url));

  // Save email cookie
  if (saveEmail) {
    response.cookies.set('saved-email', email, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
  } else {
    response.cookies.delete('saved-email');
  }

  const opts = getSessionOptions(autoLogin);
  const session = await getIronSession<SessionData>(req, response, opts);
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

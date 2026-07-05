import { buildUrl, safeRedirectPath } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { selectUserInfoByEmail, updateUserInfoPw } from '@edenschool/common/queries/user';
import { verifyPassword, needsRehash, hashPassword } from '@edenschool/common/password';
import { getSessionOptions } from '@edenschool/common/auth';
import type { SessionData } from '@edenschool/common/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'login', 10, 60 * 1000);
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const pw = formData.get('pw') as string;
    const referer = safeRedirectPath(formData.get('referer') as string, '/');
    const saveEmail = formData.get('saveEmail') === 'on';
    const autoLogin = formData.get('autoLogin') === 'on';

    if (!email || !pw) {
      const errorUrl = referer && referer !== '/' ? `/login?error=1&referer=${encodeURIComponent(referer)}` : '/login?error=1';
      return NextResponse.redirect(buildUrl(errorUrl, req));
    }

    // Fetch user by email and verify password app-side (handles both bcrypt and SHA1)
    const user = await selectUserInfoByEmail(email);
    if (!user || !user.pw || !(await verifyPassword(pw, user.pw))) {
      const errorUrl = referer && referer !== '/' ? `/login?error=1&referer=${encodeURIComponent(referer)}` : '/login?error=1';
      return NextResponse.redirect(buildUrl(errorUrl, req));
    }

    // 레거시 SHA1 해시는 로그인 성공 시 bcrypt로 재해싱(점진 전환). 실패해도 로그인은 진행.
    if (needsRehash(user.pw)) {
      try {
        await updateUserInfoPw(user.id, await hashPassword(pw));
      } catch (e) {
        console.error('Password rehash failed:', e);
      }
    }

    const response = NextResponse.redirect(buildUrl(referer || '/', req));

    // Save email cookie
    if (saveEmail) {
      response.cookies.set('saved-email', email, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.COOKIE_SECURE === 'true',
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
    session.autoLogin = autoLogin;
    await session.save();

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.redirect(buildUrl('/login?error=1', req));
  }
}

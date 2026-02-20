import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { selectAdminUserInfoByEmail } from '@edenschool/common/queries/admin-user';
import { verifyPassword } from '@edenschool/common/password';
import { getAdminSessionOptions, type AdminSessionData } from '@/lib/admin-session';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 attempts per 15 minutes per IP
    const limited = checkRateLimit(req, 'admin-login', 10, 15 * 60 * 1000);
    if (limited) return limited;

    const formData = await req.formData();
    const email = formData.get('email') as string;
    const pw = formData.get('pw') as string;
    const referer = (formData.get('referer') as string) || '/admin';
    const saveEmail = formData.get('saveEmail') === 'on';
    const autoLogin = formData.get('autoLogin') === 'on';

    if (!email || !pw) {
      return NextResponse.redirect(new URL('/admin/login?error=1', req.url));
    }

    // Fetch user by email and verify password app-side (handles both bcrypt and SHA1)
    const user = await selectAdminUserInfoByEmail(email);
    if (!user || !user.pw || !(await verifyPassword(pw, user.pw))) {
      return NextResponse.redirect(new URL('/admin/login?error=1', req.url));
    }

    const defaultPage = user.code === 'O' ? '/admin' : '/admin/student-manage';
    const dest = referer && referer !== '/admin' ? referer : defaultPage;
    const response = NextResponse.redirect(new URL(dest, req.url));

    // Save email cookie
    if (saveEmail) {
      response.cookies.set('saved-admin-email', email, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    } else {
      response.cookies.delete('saved-admin-email');
    }

    const opts = getAdminSessionOptions(autoLogin);
    const session = await getIronSession<AdminSessionData>(req, response, opts);
    session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      code: user.code,
    };
    await session.save();

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.redirect(new URL('/admin/login?error=1', req.url));
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { selectAdminUserInfoByLoginInput, selectAdminUserInfoByEmail } from '@edenschool/common/queries/admin-user';
import { verifyPassword } from '@edenschool/common/password';
import { adminSessionOptions, type AdminSessionData } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const pw = formData.get('pw') as string;
    const referer = (formData.get('referer') as string) || '/admin';

    if (!email || !pw) {
      return NextResponse.redirect(new URL('/admin/login?error=1', req.url));
    }

    // 1) 기존 방식: SQL SHA1 비교 (레거시 계정)
    let user = await selectAdminUserInfoByLoginInput(email, pw);

    // 2) bcrypt 폴백 (리팩토링 후 가입한 계정)
    if (!user) {
      const userByEmail = await selectAdminUserInfoByEmail(email);
      if (userByEmail?.pw?.startsWith('$2')) {
        const valid = await verifyPassword(pw, userByEmail.pw);
        if (valid) user = userByEmail;
      }
    }

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login?error=1', req.url));
    }

    const defaultPage = user.code === 'O' ? '/admin' : '/admin/student-manage';
    const dest = referer && referer !== '/admin' ? referer : defaultPage;
    const response = NextResponse.redirect(new URL(dest, req.url));
    const session = await getIronSession<AdminSessionData>(req, response, adminSessionOptions);
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

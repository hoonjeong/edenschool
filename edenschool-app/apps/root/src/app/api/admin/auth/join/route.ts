import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { selectAdminUserIdByPhone, updateAdminUserInfo, selectAdminUserByPhone } from '@edenschool/common/queries/admin-user';
import { hashPassword } from '@edenschool/common/password';
import { isValidEmail, isValidPassword, normalizePhone } from '@edenschool/common/validation';
import { adminSessionOptions, type AdminSessionData } from '@/lib/admin-session';
import { getVerification, deleteVerification } from '@/lib/verification-store';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const pw1 = formData.get('pw1') as string;

    if (!email || !phone || !pw1 || !isValidEmail(email) || !isValidPassword(pw1)) {
      return NextResponse.redirect(buildUrl('/admin/join?error=1', req));
    }

    const normalizedPhone = normalizePhone(phone);

    // Verify phone verification was completed via verification-store
    const verification = getVerification('admin', normalizedPhone);
    if (!verification || !verification.verified) {
      return NextResponse.redirect(buildUrl('/admin/join?error=1', req));
    }

    // Clear verification after use
    deleteVerification('admin', normalizedPhone);

    // Check if phone exists in admin_user_info
    const adminId = await selectAdminUserIdByPhone(normalizedPhone);
    if (adminId === -1) {
      return NextResponse.redirect(buildUrl('/admin/join?error=phone', req));
    }

    // Update the admin user with email and hashed password
    const hashedPw = await hashPassword(pw1);
    await updateAdminUserInfo(email, hashedPw, normalizedPhone);

    // Fetch updated user info for session
    const user = await selectAdminUserByPhone(normalizedPhone);

    const response = NextResponse.redirect(buildUrl('/admin/', req));

    if (user) {
      const session = await getIronSession<AdminSessionData>(req, response, adminSessionOptions);
      session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        code: user.code,
      };
      await session.save();
    }

    return response;
  } catch (error) {
    console.error('Join error:', error);
    return NextResponse.redirect(buildUrl('/admin/join?error=1', req));
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { updatePasswordByPhone } from '@edenschool/common/queries/admin-user';
import { hashPassword } from '@edenschool/common/password';
import { normalizePhone, isValidPassword, PASSWORD_RULES } from '@edenschool/common/validation';
import { adminSessionOptions, type AdminSessionData } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhone(body.phone as string);
    const pw = body.pw as string;

    if (!phone || !pw) {
      return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' });
    }

    // Use req/response pattern for reliable session cookie handling
    const response = NextResponse.json({ success: true });
    const session = await getIronSession<AdminSessionData>(req, response, adminSessionOptions);
    const verification = session.phoneVerification;
    if (!verification || verification.phone !== phone || Date.now() > verification.expiresAt || !verification.verified) {
      return NextResponse.json({ error: '전화번호 인증이 필요합니다.' });
    }

    if (!isValidPassword(pw)) {
      return NextResponse.json({ error: PASSWORD_RULES });
    }

    const hashedPw = await hashPassword(pw);
    const affected = await updatePasswordByPhone(phone, hashedPw);

    if (affected === 0) {
      return NextResponse.json({ error: '해당하는 계정이 없습니다.' });
    }

    // Clear phone verification after successful password reset
    delete session.phoneVerification;
    await session.save();

    return response;
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}

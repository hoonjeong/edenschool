import { NextRequest, NextResponse } from 'next/server';
import { updatePasswordByPhone } from '@edenschool/common/queries/admin-user';
import { hashPassword } from '@edenschool/common/password';
import { normalizePhone, isValidPassword, PASSWORD_RULES } from '@edenschool/common/validation';
import { getVerification, deleteVerification } from '@/lib/verification-store';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'admin-find-pass', 5, 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const phone = normalizePhone(body.phone as string);
    const pw = body.pw as string;

    if (!phone || !pw) {
      return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 });
    }

    const entry = getVerification('admin', phone);
    if (!entry || !entry.verified) {
      return NextResponse.json({ error: '전화번호 인증이 필요합니다.' }, { status: 400 });
    }

    if (!isValidPassword(pw)) {
      return NextResponse.json({ error: PASSWORD_RULES }, { status: 400 });
    }

    const hashedPw = await hashPassword(pw);
    const affected = await updatePasswordByPhone(phone, hashedPw);

    if (affected === 0) {
      return NextResponse.json({ error: '해당하는 계정이 없습니다.' }, { status: 404 });
    }

    deleteVerification('admin', phone);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}

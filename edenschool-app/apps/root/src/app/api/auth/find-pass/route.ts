import { NextRequest, NextResponse } from 'next/server';
import { selectEmailByPhone, updatePassByEmail } from '@edenschool/common/queries/user';
import { hashPassword } from '@edenschool/common/password';
import { normalizePhone, isValidPassword, PASSWORD_RULES } from '@edenschool/common/validation';
import { getVerification, deleteVerification } from '@/lib/verification-store';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'find-pass', 5, 60 * 1000);
  if (limited) return limited;

  const { phone: rawPhone, phoneType, pw } = await req.json();
  const phone = normalizePhone(rawPhone || '');

  if (!phone || !pw) {
    return NextResponse.json({ error: '필수 입력값이 누락되었습니다.' }, { status: 400 });
  }

  const entry = getVerification('user-find', phone);
  if (!entry || !entry.verified) {
    return NextResponse.json({ error: '전화번호 인증이 필요합니다.' }, { status: 400 });
  }

  if (!isValidPassword(pw)) {
    return NextResponse.json({ error: PASSWORD_RULES }, { status: 400 });
  }

  const email = await selectEmailByPhone(phone, phoneType);
  if (!email) {
    return NextResponse.json({ error: '해당하는 계정을 찾을 수 없습니다.' }, { status: 404 });
  }

  const hashedPw = await hashPassword(pw);
  await updatePassByEmail(email, hashedPw);

  deleteVerification('user-find', phone);

  return NextResponse.json({ success: true });
}

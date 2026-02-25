import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { selectEmailByEmail, updatePassByEmail, selectUserPhoneByEmail } from '@edenschool/common/queries/user';
import { hashPassword } from '@edenschool/common/password';
import { sendSms, isSmsSuccess } from '@edenschool/common/sms';
import { isValidEmail } from '@edenschool/common/validation';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const limited = checkRateLimit(req, 'find-pass', 5, 15 * 60 * 1000);
  if (limited) return limited;

  const { email } = await req.json();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: '올바른 이메일을 입력해주세요.' });
  }

  const found = await selectEmailByEmail(email);
  if (!found) {
    return NextResponse.json({ error: '등록된 이메일을 찾을 수 없습니다.' });
  }

  // Look up user's phone number first
  const phones = await selectUserPhoneByEmail(email);
  const targetPhone = phones?.sphone || phones?.pphone;
  if (!targetPhone) {
    return NextResponse.json({ error: '등록된 전화번호가 없습니다. 학원에 문의해주세요.' });
  }

  // Generate cryptographically secure temporary password (12 chars)
  const tempPw = randomBytes(9).toString('base64url').slice(0, 12);

  // Send SMS first — only update password if SMS succeeds
  const smsPrefix = process.env.SMS_PREFIX || '[이든배움국어학원]';
  const result = await sendSms('SMS', targetPhone, `${smsPrefix}\n임시비밀번호를 확인해주세요. [${tempPw}]`);
  if (!isSmsSuccess(result)) {
    return NextResponse.json({ error: '임시 비밀번호 발송에 실패했습니다. 학원에 문의해주세요.' });
  }

  // SMS succeeded — now update password in DB
  const hashedPw = await hashPassword(tempPw);
  await updatePassByEmail(email, hashedPw);

  return NextResponse.json({ success: true });
}

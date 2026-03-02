import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { selectEmailByPhone } from '@edenschool/common/queries/user';
import { sendSms, isSmsSuccess } from '@edenschool/common/sms';
import { isValidPhone, normalizePhone } from '@edenschool/common/validation';
import { setVerification } from '@/lib/verification-store';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'check-find-phone', 5, 60 * 1000);
  if (limited) return limited;

  const { phone: rawPhone, phoneType } = await req.json();
  const phone = normalizePhone(rawPhone || '');

  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' });
  }

  const email = await selectEmailByPhone(phone, phoneType);
  if (!email) {
    return NextResponse.json({ error: '등록된 회원을 찾을 수 없습니다.' });
  }

  const code = String(randomInt(100000, 1000000));
  const smsPrefix = process.env.SMS_PREFIX || '[이든배움국어학원]';
  const message = `${smsPrefix}\n인증번호를 확인해주세요. [${code}]`;

  const result = await sendSms('SMS', phone, message);
  if (!isSmsSuccess(result)) {
    return NextResponse.json({ error: '인증번호 발송에 실패했습니다. 다시 시도해주세요.' });
  }

  setVerification('user-find', phone, code);

  return NextResponse.json({ success: true });
}

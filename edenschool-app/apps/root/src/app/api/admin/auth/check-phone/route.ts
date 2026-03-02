import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { countAdminUserByPhone } from '@edenschool/common/queries/admin-user';
import { sendSms, isSmsSuccess } from '@edenschool/common/sms';
import { normalizePhone, isValidPhone } from '@edenschool/common/validation';
import { setVerification } from '@/lib/verification-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhone(body.phone as string);

    if (!isValidPhone(phone)) {
      return new NextResponse('FAIL');
    }

    const count = await countAdminUserByPhone(phone);
    if (count === 0) {
      return new NextResponse('FAIL');
    }

    const code = String(randomInt(100000, 1000000));

    const callNum = process.env.SMS_DEFAULT_CALLNUM;
    if (!callNum) {
      console.error('SMS_DEFAULT_CALLNUM not configured');
      return new NextResponse('SMS_FAIL');
    }

    const smsPrefix = process.env.SMS_PREFIX || '[이든배움국어학원]';
    const message = `${smsPrefix} 관리자\n인증번호를 확인해주세요. [${code}]`;
    const result = await sendSms('SMS', phone, message, callNum);
    if (!isSmsSuccess(result)) {
      return new NextResponse('SMS_FAIL');
    }

    setVerification('admin', phone, code);

    return new NextResponse('OK');
  } catch (error) {
    console.error('Check phone error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}

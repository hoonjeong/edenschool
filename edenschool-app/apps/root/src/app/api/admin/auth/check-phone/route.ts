import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { countAdminUserByPhone } from '@edenschool/common/queries/admin-user';
import { sendSms, isSmsSuccess } from '@edenschool/common/sms';
import { normalizePhone, isValidPhone } from '@edenschool/common/validation';
import { adminSessionOptions, type AdminSessionData } from '@/lib/admin-session';

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

    // Generate 6-digit verification code
    const code = String(randomInt(100000, 1000000));

    // Send SMS with verification code
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

    // Store verification code in session using req/response pattern (reliable cookie handling)
    const response = new NextResponse('OK');
    const session = await getIronSession<AdminSessionData>(req, response, adminSessionOptions);
    session.phoneVerification = {
      code,
      phone,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
    await session.save();

    return response;
  } catch (error) {
    console.error('Check phone error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}

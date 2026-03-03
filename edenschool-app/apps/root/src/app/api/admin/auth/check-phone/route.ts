import { NextRequest, NextResponse } from 'next/server';
import { countAdminUserByPhone } from '@edenschool/common/queries/admin-user';
import { normalizePhone, isValidPhone } from '@edenschool/common/validation';
import { sendVerificationSms } from '@/lib/auth-handlers';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'admin-check-phone', 5, 60 * 1000);
  if (limited) return limited;

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

    const callNum = process.env.SMS_DEFAULT_CALLNUM;
    if (!callNum) {
      console.error('SMS_DEFAULT_CALLNUM not configured');
      return new NextResponse('SMS_FAIL');
    }

    const result = await sendVerificationSms({
      prefix: 'admin',
      phone,
      adminMode: true,
      callNum,
    });

    if (result.status === 'sms_fail') {
      return new NextResponse('SMS_FAIL');
    }

    return new NextResponse('OK');
  } catch (error) {
    console.error('Check phone error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}

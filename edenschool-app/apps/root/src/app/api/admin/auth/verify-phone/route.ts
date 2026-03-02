import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@edenschool/common/validation';
import { getVerification, markVerified, incrementAttempts } from '@/lib/verification-store';

export async function POST(req: NextRequest) {
  try {
    const { code, phone: rawPhone } = await req.json();

    if (!code || !rawPhone) {
      return new NextResponse('EMPTY');
    }

    const phone = normalizePhone(rawPhone);
    const entry = getVerification('admin', phone);

    if (!entry) {
      return new NextResponse('NO_REQUEST');
    }

    if (code !== entry.code) {
      incrementAttempts('admin', phone);
      return new NextResponse('WRONG');
    }

    markVerified('admin', phone);
    return new NextResponse('OK');
  } catch (error) {
    console.error('Verify phone error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}

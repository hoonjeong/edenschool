import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@edenschool/common/validation';
import { getVerification, markVerified, incrementAttempts } from '@/lib/verification-store';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'verify-phone', 10, 60 * 1000);
  if (limited) return limited;

  const { code, phone: rawPhone } = await req.json();

  if (!code || !rawPhone) {
    return NextResponse.json({ error: '인증번호를 입력해주세요.' });
  }

  const phone = normalizePhone(rawPhone);
  const entry = getVerification('user', phone);

  if (!entry) {
    return NextResponse.json({ error: '인증 요청이 없습니다. 다시 시도해주세요.' });
  }

  if (code !== entry.code) {
    incrementAttempts('user', phone);
    return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' });
  }

  markVerified('user', phone);
  return NextResponse.json({ success: true, studentId: entry.studentId });
}

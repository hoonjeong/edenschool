import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  // Rate limit: 10 verify attempts per 15 minutes per IP
  const limited = checkRateLimit(req, 'verify-phone', 10, 15 * 60 * 1000);
  if (limited) return limited;

  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ error: '인증번호를 입력해주세요.' });
  }

  const session = await getSession();
  const verification = session.phoneVerification;

  if (!verification) {
    return NextResponse.json({ error: '인증 요청이 없습니다. 다시 시도해주세요.' });
  }

  if (Date.now() > verification.expiresAt) {
    delete session.phoneVerification;
    await session.save();
    return NextResponse.json({ error: '인증번호가 만료되었습니다. 다시 요청해주세요.' });
  }

  if (code !== verification.code) {
    return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' });
  }

  // Verification successful — keep phoneVerification in session for join-step2
  return NextResponse.json({ success: true, studentId: verification.studentId });
}

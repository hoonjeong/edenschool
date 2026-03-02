import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@edenschool/common/auth';
import type { SessionData } from '@edenschool/common/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'verify-phone', 10, 60 * 1000);
  if (limited) return limited;

  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ error: '인증번호를 입력해주세요.' });
  }

  // Use req/response pattern for reliable session cookie handling
  const response = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, response, sessionOptions);
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
    // Track failed attempts — invalidate code after 5 failures
    verification.attempts = (verification.attempts || 0) + 1;
    if (verification.attempts >= 5) {
      delete session.phoneVerification;
    }
    await session.save();
    // Copy session cookies to error response
    const errorRes = NextResponse.json({ error: '인증번호가 일치하지 않습니다.' });
    response.headers.forEach((value, key) => {
      errorRes.headers.append(key, value);
    });
    return errorRes;
  }

  // Verification successful — mark as verified
  session.phoneVerification = {
    ...verification,
    verified: true,
  };
  await session.save();

  // Copy session cookies to success response
  const successRes = NextResponse.json({ success: true, studentId: verification.studentId });
  response.headers.forEach((value, key) => {
    successRes.headers.append(key, value);
  });
  return successRes;
}

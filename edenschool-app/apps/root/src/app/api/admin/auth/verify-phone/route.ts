import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 verify attempts per 15 minutes per IP
    const limited = checkRateLimit(req, 'admin-verify-phone', 10, 15 * 60 * 1000);
    if (limited) return limited;

    const { code } = await req.json();

    if (!code) {
      return new NextResponse('EMPTY');
    }

    const session = await getAdminSession();
    const verification = session.phoneVerification;

    if (!verification) {
      return new NextResponse('NO_REQUEST');
    }

    if (Date.now() > verification.expiresAt) {
      delete session.phoneVerification;
      await session.save();
      return new NextResponse('EXPIRED');
    }

    if (code !== verification.code) {
      // Track failed attempts — invalidate code after 5 failures
      verification.attempts = (verification.attempts || 0) + 1;
      if (verification.attempts >= 5) {
        delete session.phoneVerification;
      }
      await session.save();
      return new NextResponse('WRONG');
    }

    // Verification successful — mark as verified
    session.phoneVerification = {
      ...verification,
      verified: true,
    };
    await session.save();
    return new NextResponse('OK');
  } catch (error) {
    console.error('Verify phone error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { adminSessionOptions, type AdminSessionData } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return new NextResponse('EMPTY');
    }

    // Use req/response pattern for reliable session cookie handling
    const response = new NextResponse('');
    const session = await getIronSession<AdminSessionData>(req, response, adminSessionOptions);
    const verification = session.phoneVerification;

    let result: string;

    if (!verification) {
      result = 'NO_REQUEST';
    } else if (Date.now() > verification.expiresAt) {
      delete session.phoneVerification;
      await session.save();
      result = 'EXPIRED';
    } else if (code !== verification.code) {
      // Track failed attempts — invalidate code after 5 failures
      verification.attempts = (verification.attempts || 0) + 1;
      if (verification.attempts >= 5) {
        delete session.phoneVerification;
      }
      await session.save();
      result = 'WRONG';
    } else {
      // Verification successful — mark as verified
      session.phoneVerification = {
        ...verification,
        verified: true,
      };
      await session.save();
      result = 'OK';
    }

    // Create final response with correct body and copy session cookies
    const finalResponse = new NextResponse(result);
    response.headers.forEach((value, key) => {
      finalResponse.headers.append(key, value);
    });
    return finalResponse;
  } catch (error) {
    console.error('Verify phone error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}

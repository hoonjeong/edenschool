import { NextRequest, NextResponse } from 'next/server';
import { handleVerifyPhone } from '@/lib/auth-handlers';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'admin-verify-phone', 10, 60 * 1000);
  if (limited) return limited;

  try {
    const { code, phone } = await req.json();
    const result = handleVerifyPhone('admin', phone, code);

    switch (result.status) {
      case 'empty':
        return new NextResponse('EMPTY');
      case 'no_request':
        return new NextResponse('NO_REQUEST');
      case 'wrong':
        return new NextResponse('WRONG');
      case 'ok':
        return new NextResponse('OK');
    }
  } catch (error) {
    console.error('Verify phone error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}

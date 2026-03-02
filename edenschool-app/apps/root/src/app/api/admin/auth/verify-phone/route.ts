import { NextRequest, NextResponse } from 'next/server';
import { handleVerifyPhone } from '@/lib/auth-handlers';

export async function POST(req: NextRequest) {
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

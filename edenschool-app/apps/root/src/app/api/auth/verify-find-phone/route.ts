import { NextRequest, NextResponse } from 'next/server';
import { handleVerifyPhone } from '@/lib/auth-handlers';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'verify-find-phone', 10, 60 * 1000);
  if (limited) return limited;

  const { code, phone } = await req.json();
  const result = handleVerifyPhone('user-find', phone, code);

  switch (result.status) {
    case 'empty':
      return NextResponse.json({ error: '인증번호를 입력해주세요.' });
    case 'no_request':
      return NextResponse.json({ error: '인증 요청 내역이 없습니다. 인증번호를 다시 요청해주세요.' });
    case 'wrong':
      return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' });
    case 'ok':
      return NextResponse.json({ success: true });
  }
}

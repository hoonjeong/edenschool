import { NextRequest, NextResponse } from 'next/server';
import { handleVerifyPhone } from '@/lib/auth-handlers';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'verify-phone', 10, 60 * 1000);
  if (limited) return limited;

  const { code, phone } = await req.json();
  const result = handleVerifyPhone('user', phone, code);

  switch (result.status) {
    case 'empty':
      return NextResponse.json({ error: '인증번호를 입력해주세요.' });
    case 'no_request':
      return NextResponse.json({ error: '인증 요청이 없습니다. 다시 시도해주세요.' });
    case 'wrong':
      return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' });
    case 'ok':
      return NextResponse.json({ success: true, studentId: result.studentId });
  }
}

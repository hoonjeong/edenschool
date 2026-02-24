import { NextRequest, NextResponse } from 'next/server';
import { selectAdminEmailByPhone } from '@edenschool/common/queries/admin-user';
import { normalizePhone } from '@edenschool/common/validation';
import { checkRateLimit } from '@/lib/rate-limiter';

function getMaskedEmail(email: string): string {
  const match = email.match(/^(\S+)@(\S+\.\S+)$/);
  if (!match) return email;
  const id = match[1];
  const domain = match[2];
  if (id.length < 3) {
    return '*'.repeat(id.length) + '@' + domain;
  } else if (id.length === 3) {
    return id.slice(0, 1) + '**@' + domain;
  } else {
    return id.slice(0, id.length - 3) + '***@' + domain;
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = checkRateLimit(req, 'admin-find-email', 10, 15 * 60 * 1000);
    if (limited) return limited;

    const body = await req.json();
    const phone = normalizePhone(body.phone as string);

    const email = await selectAdminEmailByPhone(phone);

    if (!email) {
      return new NextResponse('등록된 이메일이 없습니다.');
    }

    const maskedEmail = getMaskedEmail(email);
    return new NextResponse(`회원님의 가입 이메일은 ${maskedEmail}입니다.`);
  } catch (error) {
    console.error('Find email error:', error);
    return new NextResponse('이메일 찾기 중 오류가 발생했습니다.', { status: 500 });
  }
}

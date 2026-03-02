import { NextRequest, NextResponse } from 'next/server';
import { selectEmailByPhone } from '@edenschool/common/queries/user';
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
  const limited = checkRateLimit(req, 'find-email', 10, 60 * 1000);
  if (limited) return limited;

  const { phone, phoneType } = await req.json();
  const email = await selectEmailByPhone(phone, phoneType);
  if (email) {
    return NextResponse.json({ email: getMaskedEmail(email) });
  }
  return NextResponse.json({ error: '등록된 이메일을 찾을 수 없습니다.' });
}

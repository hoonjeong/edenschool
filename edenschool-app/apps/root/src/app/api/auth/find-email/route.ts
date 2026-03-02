import { NextRequest, NextResponse } from 'next/server';
import { selectEmailByPhone } from '@edenschool/common/queries/user';
import { normalizePhone } from '@edenschool/common/validation';
import { getVerification, deleteVerification } from '@/lib/verification-store';
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

  const { phone: rawPhone, phoneType } = await req.json();
  const phone = normalizePhone(rawPhone || '');

  const entry = getVerification('user-find', phone);
  if (!entry || !entry.verified) {
    return NextResponse.json({ error: '전화번호 인증이 필요합니다.' });
  }

  const email = await selectEmailByPhone(phone, phoneType);

  deleteVerification('user-find', phone);

  if (!email) {
    return NextResponse.json({ error: '등록된 이메일을 찾을 수 없습니다.' });
  }

  return NextResponse.json({ email: getMaskedEmail(email) });
}

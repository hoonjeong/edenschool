import { NextRequest, NextResponse } from 'next/server';
import { selectAccountByPhone } from '@edenschool/common/queries/user';
import { normalizePhone, getMaskedEmail } from '@edenschool/common/validation';
import { getVerification, deleteVerification } from '@/lib/verification-store';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'find-email', 10, 60 * 1000);
  if (limited) return limited;

  const { phone: rawPhone, phoneType } = await req.json();
  const phone = normalizePhone(rawPhone || '');

  const entry = getVerification('user-find', phone);
  if (!entry || !entry.verified) {
    return NextResponse.json({ error: '전화번호 인증이 필요합니다.' });
  }

  const account = await selectAccountByPhone(phone, phoneType);

  deleteVerification('user-find', phone);

  if (!account?.email) {
    return NextResponse.json({ error: '등록된 이메일을 찾을 수 없습니다.' });
  }

  // 퇴원('D')·탈퇴('E') 계정은 로그인이 막혀 있으므로, 이메일과 함께 상태를 알려준다.
  return NextResponse.json({ email: getMaskedEmail(account.email), status: account.code });
}

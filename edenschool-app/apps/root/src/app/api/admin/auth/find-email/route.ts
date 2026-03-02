import { NextRequest, NextResponse } from 'next/server';
import { selectAdminEmailByPhone } from '@edenschool/common/queries/admin-user';
import { normalizePhone, getMaskedEmail } from '@edenschool/common/validation';
import { getVerification, deleteVerification } from '@/lib/verification-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = normalizePhone(body.phone as string);

    const entry = getVerification('admin', phone);
    if (!entry || !entry.verified) {
      return new NextResponse('전화번호 인증이 필요합니다.');
    }

    const email = await selectAdminEmailByPhone(phone);

    deleteVerification('admin', phone);

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

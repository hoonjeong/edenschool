import { NextRequest, NextResponse } from 'next/server';
import { selectEmailByPhone } from '@edenschool/common/queries/user';

export async function POST(req: NextRequest) {
  const { phone, phoneType } = await req.json();
  const email = await selectEmailByPhone(phone, phoneType);
  if (email) {
    return NextResponse.json({ email });
  }
  return NextResponse.json({ error: '등록된 이메일을 찾을 수 없습니다.' });
}

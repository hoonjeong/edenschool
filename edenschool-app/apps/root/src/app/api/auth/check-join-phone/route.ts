import { NextRequest, NextResponse } from 'next/server';
import { selectLiveStudentByPhone } from '@edenschool/common/queries/user';
import { sendSms, isSmsSuccess } from '@edenschool/common/sms';
import { isValidPhone } from '@edenschool/common/validation';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { phone, phoneType } = await req.json();

  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' });
  }

  const student = await selectLiveStudentByPhone(phone, phoneType);
  if (!student) {
    return NextResponse.json({ error: '등록된 학생을 찾을 수 없습니다.' });
  }

  // Generate 6-digit auth code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const smsPrefix = process.env.SMS_PREFIX || '[이든배움국어학원]';
  const message = `${smsPrefix}\n인증번호를 확인해주세요. [${code}]`;

  const result = await sendSms('SMS', phone, message);
  if (!isSmsSuccess(result)) {
    return NextResponse.json({ error: '인증번호 발송에 실패했습니다. 다시 시도해주세요.' });
  }

  // Store verification code in session (not in response)
  const session = await getSession();
  session.phoneVerification = {
    code,
    studentId: student.id,
    phone,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  };
  await session.save();

  return NextResponse.json({ success: true, studentId: student.id });
}

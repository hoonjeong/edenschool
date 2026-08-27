import { NextRequest, NextResponse } from 'next/server';
import { selectLiveStudentByPhone, countLiveUserByStudentId } from '@edenschool/common/queries/user';
import { isValidPhone, normalizePhone } from '@edenschool/common/validation';
import { sendVerificationSms } from '@/lib/auth-handlers';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'check-join-phone', 5, 60 * 1000);
  if (limited) return limited;

  const { phone: rawPhone, phoneType } = await req.json();
  // 인증 저장소 키·DB 조회·SMS 발송이 모두 같은 형태를 쓰도록 입구에서 한 번만 정규화한다.
  // (정규화가 없으면 하이픈을 넣어 입력했을 때 발송 시 키와 확인 시 키가 어긋나 인증이 실패한다.)
  const phone = normalizePhone(rawPhone || '');
  const type = phoneType === 'P' ? 'P' : 'S';

  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' });
  }

  // 가입 자격은 인증번호를 보내기 전에 여기서 한 번만 확인한다.
  // 자격이 없으면 인증 절차를 밟게 할 이유가 없고, SMS 발송 비용도 아낀다.
  // 인증한 번호 종류로만 조회한다 — 학부모 번호로 인증하면 pphone, 학생 번호면 sphone.
  const student = await selectLiveStudentByPhone(phone, type);
  if (!student) {
    return NextResponse.json({
      error: '학원에 등록된 번호가 아닙니다. 재원생만 가입할 수 있으니 학원으로 문의해 주세요.',
    });
  }

  // 한 학생당 계정 하나. 이미 있으면 로그인/계정 찾기로 안내한다.
  const existing = await countLiveUserByStudentId(student.id);
  if (existing > 0) {
    return NextResponse.json({
      error: '이미 가입된 학생입니다. 로그인하거나 이메일/비밀번호 찾기를 이용해 주세요.',
    });
  }

  // 여기서 확인한 student.id를 인증 저장소에 함께 넣어둔다.
  // 이후 단계는 이 값을 쓰므로 학생 판별이 클라이언트 입력에 좌우되지 않는다.
  const result = await sendVerificationSms({
    prefix: 'user',
    phone,
    studentId: student.id,
  });

  if (result.status === 'sms_fail') {
    return NextResponse.json({ error: '인증번호 발송에 실패했습니다. 다시 시도해주세요.' });
  }

  return NextResponse.json({ success: true });
}

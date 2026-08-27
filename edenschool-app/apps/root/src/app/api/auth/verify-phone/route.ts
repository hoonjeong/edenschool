import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@edenschool/common/auth';
import { normalizePhone } from '@edenschool/common/validation';
import { handleVerifyPhone } from '@/lib/auth-handlers';
import { deleteVerification } from '@/lib/verification-store';
import { checkRateLimit } from '@/lib/rate-limiter';

// 인증 완료 후 2단계(정보 입력)를 마칠 때까지 허용하는 시간.
// 인증번호 자체의 유효시간(5분)과 분리한다 — 이메일 중복확인·비밀번호 입력에 5분은 너무 짧다.
const PENDING_JOIN_TTL_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'verify-phone', 10, 60 * 1000);
  if (limited) return limited;

  const { code, phone: rawPhone } = await req.json();
  const phone = normalizePhone(rawPhone || '');

  const result = handleVerifyPhone('user', phone, code);
  switch (result.status) {
    case 'empty':
      return NextResponse.json({ error: '인증번호를 입력해주세요.' });
    case 'no_request':
      return NextResponse.json({ error: '인증 요청이 없습니다. 다시 시도해주세요.' });
    case 'wrong':
      return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' });
  }

  // 인증 성공 = 본인이 그 번호를 실제로 소유하고 있다는 뜻.
  // studentId는 인증번호 발송 시점에 서버(check-join-phone)가 조회해 저장소에 넣어둔 값이라
  // 클라이언트를 거치지 않는다. 따라서 재원생 판별을 여기서 다시 할 필요가 없다.
  if (!result.studentId) {
    return NextResponse.json({ error: '인증 정보가 올바르지 않습니다. 처음부터 다시 진행해 주세요.' });
  }

  // 인증번호는 역할을 다했으므로 여기서 바로 소각한다(1회용).
  deleteVerification('user', phone);

  // 2단계로 넘기는 것은 학생 id 하나뿐. 암호화 세션 쿠키에만 담으므로
  // 클라이언트가 값을 읽거나 다른 학생으로 바꿔치기할 수 없다.
  const response = NextResponse.json({ success: true });
  const session = await getIronSession<SessionData>(req, response, sessionOptions);
  session.pendingJoin = {
    studentId: result.studentId,
    expiresAt: Date.now() + PENDING_JOIN_TTL_MS,
  };
  await session.save();

  return response;
}

import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { insertUser, selectEmailByEmail, countLiveUserByStudentId } from '@edenschool/common/queries/user';
import { selectStudentById } from '@edenschool/common/queries/student';
import { hashPassword } from '@edenschool/common/password';
import { isValidEmail, isValidPassword } from '@edenschool/common/validation';
import { sessionOptions, type SessionData } from '@edenschool/common/auth';
import { getSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limiter';

// POST 후 이동은 303으로 돌려 브라우저가 GET으로 따라가게 한다.
// (307이면 목적지로 POST가 다시 날아가고, 새로고침 시 재전송된다.)
function goTo(path: string, req: NextRequest) {
  return NextResponse.redirect(buildUrl(path, req), { status: 303 });
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'join', 5, 60 * 1000);
  if (limited) return limited;

  const formData = await req.formData();
  const email = ((formData.get('email') as string) || '').trim();
  const pw = (formData.get('pw') as string) || '';

  // 학생 정보는 폼에서 받지 않는다. 1단계 인증 때 서버가 확정해 세션에 넣어둔 값만 신뢰한다.
  // (화면의 이름·전화번호 칸은 표시 전용이라 전송되지도 않는다.)
  const session = await getSession();
  const pending = session.pendingJoin;
  if (!pending) return goTo('/join?error=session', req);
  if (Date.now() > pending.expiresAt) return goTo('/join?error=expired', req);

  if (!email || !isValidEmail(email)) return goTo('/join-step2?error=invalid', req);
  if (!isValidPassword(pw)) return goTo('/join-step2?error=password', req);

  // 인증 시점 이후 학생 상태가 바뀌었을 수 있으므로 저장 직전에 다시 읽는다.
  const student = await selectStudentById(pending.studentId);
  if (!student || Number(student.status) !== 1) return goTo('/join?error=student', req);

  // 중복 확인은 1단계에서도 하지만, 그 사이 다른 창에서 가입했을 수 있으므로 저장 직전에 다시 본다.
  if (await countLiveUserByStudentId(student.id) > 0) return goTo('/join?error=duplicate', req);

  // 이메일 중복은 서버에서 반드시 확인한다. 2단계의 중복확인 버튼은 편의 기능일 뿐이다.
  if (await selectEmailByEmail(email)) return goTo('/join-step2?error=email', req);

  // user_info의 번호는 이메일/비밀번호 찾기가 조회하는 값이므로,
  // 폼 값이 아니라 student에 등록된 두 번호를 그대로 저장한다.
  const hashedPw = await hashPassword(pw);
  const userId = await insertUser(email, hashedPw, student.sphone || '', student.pphone || '', 'S', student.id);

  const response = goTo('/', req);
  const saved = await getIronSession<SessionData>(req, response, sessionOptions);
  saved.user = {
    id: userId,
    email,
    studentId: student.id,
    name: student.name,
    code: 'S',
  };
  saved.autoLogin = false;
  saved.pendingJoin = undefined; // 1회용 — 가입과 함께 소멸
  await saved.save();

  return response;
}

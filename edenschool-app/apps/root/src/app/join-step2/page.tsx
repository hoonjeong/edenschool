import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectStudentById } from '@edenschool/common/queries/student';
import { JoinStep2Form } from './JoinStep2Form';

const STEP2_ERRORS: Record<string, string> = {
  invalid: '입력값을 다시 확인해 주세요.',
  email: '이미 사용 중인 이메일입니다. 다른 이메일을 입력해 주세요.',
  password: '비밀번호는 영문, 숫자를 포함하여 8자 이상이어야 합니다.',
};

export default async function JoinStep2Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session.user) redirect('/');

  // 1단계 인증을 마쳐야만 들어올 수 있다. 인증 결과는 암호화 세션 쿠키에만 있으므로
  // 주소창으로 직접 들어오거나 값을 위조해서 들어올 수 없다.
  const pending = session.pendingJoin;
  if (!pending) redirect('/join?error=session');
  if (Date.now() > pending.expiresAt) redirect('/join?error=expired');

  // 본인이 맞는지 확인할 수 있게 이름만 읽어 표시한다.
  // 전화번호는 화면에 띄우지 않는다 — 저장 시점에 서버가 student 테이블에서 직접 읽는다.
  const student = await selectStudentById(pending.studentId);
  if (!student || Number(student.status) !== 1) redirect('/join?error=student');

  const { error } = await searchParams;

  return (
    <JoinStep2Form
      name={student.name || ''}
      initialError={error ? STEP2_ERRORS[error] ?? '가입 처리 중 문제가 발생했습니다.' : ''}
    />
  );
}

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { JoinForm } from './JoinForm';

// 가입 도중 되돌아온 이유를 화면에 알려준다.
// (예전에는 /join?error=1 로만 돌아와 아무 안내 없이 첫 화면이 새로 뜨는 것처럼 보였다.)
const JOIN_ERRORS: Record<string, string> = {
  session: '인증 정보가 없습니다. 전화번호 인증부터 다시 진행해 주세요.',
  expired: '인증 유효시간이 지났습니다. 다시 인증해 주세요.',
  student: '학원에 등록된 학생 정보를 찾을 수 없습니다. 학원으로 문의해 주세요.',
  duplicate: '이미 가입된 학생입니다. 로그인하거나 이메일/비밀번호 찾기를 이용해 주세요.',
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session.user) redirect('/');

  const { error } = await searchParams;
  return <JoinForm initialError={error ? JOIN_ERRORS[error] ?? '가입 처리 중 문제가 발생했습니다. 다시 시도해 주세요.' : ''} />;
}

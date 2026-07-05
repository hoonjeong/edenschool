import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SessionData } from '@edenschool/common/auth';
import { sessionOptions, getSessionOptions } from '@edenschool/common/auth';

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

// 자동로그인 지속성을 유지한 채 세션을 다시 저장할 때 사용.
// (기본 getSession()으로 저장하면 세션쿠키로 다운그레이드되어 자동로그인이 풀림)
export async function getSessionForSave(autoLogin: boolean) {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions(autoLogin));
}

export async function requireSession() {
  const session = await getSession();
  if (!session.user) redirect('/login');
  return session as typeof session & { user: NonNullable<SessionData['user']> };
}

export async function requireApiSession() {
  const session = await getSession();
  if (!session.user) {
    throw new ApiUnauthorizedError();
  }
  return session as typeof session & { user: NonNullable<SessionData['user']> };
}

export class ApiUnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'ApiUnauthorizedError';
  }
}

export class ApiForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ApiForbiddenError';
  }
}

export type { SessionData };

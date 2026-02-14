import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SessionData } from '@edenschool/common/auth';
import { sessionOptions } from '@edenschool/common/auth';

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
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

export type { SessionData };

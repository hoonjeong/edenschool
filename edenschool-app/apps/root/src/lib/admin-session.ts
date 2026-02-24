import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SessionOptions } from 'iron-session';
import { ApiUnauthorizedError } from './session';

export interface AdminSessionData {
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    code: string;
  };
  phoneVerification?: {
    code: string;
    phone: string;
    expiresAt: number;
  };
}

const DEFAULT_ADMIN_TTL = Number(process.env.ADMIN_SESSION_TTL) || 60 * 60 * 3;
const AUTO_LOGIN_TTL = 60 * 60 * 24 * 3; // 3 days

export const adminSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: process.env.ADMIN_SESSION_COOKIE_NAME || 'edenschool-admin-session',
  ttl: DEFAULT_ADMIN_TTL,
  cookieOptions: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'strict' as const,
  },
};

export function getAdminSessionOptions(autoLogin: boolean): SessionOptions {
  if (!autoLogin) return adminSessionOptions;
  return {
    ...adminSessionOptions,
    ttl: AUTO_LOGIN_TTL,
    cookieOptions: {
      ...adminSessionOptions.cookieOptions,
      maxAge: AUTO_LOGIN_TTL,
    },
  };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<AdminSessionData>(cookieStore, adminSessionOptions);
  return session;
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session.user) redirect('/admin/login');
  return session as typeof session & { user: NonNullable<AdminSessionData['user']> };
}

export async function requireAdminApiSession() {
  const session = await getAdminSession();
  if (!session.user) {
    throw new ApiUnauthorizedError();
  }
  return session as typeof session & { user: NonNullable<AdminSessionData['user']> };
}

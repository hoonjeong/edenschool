import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SessionOptions } from 'iron-session';
import { ApiUnauthorizedError, ApiForbiddenError } from './session';

export interface AdminSessionData {
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    code: string;
  };
  autoLogin?: boolean;
  phoneVerification?: {
    code: string;
    phone: string;
    expiresAt: number;
    verified?: boolean;
    attempts?: number;
  };
}

// 자동로그인 유지 기간(초). 브라우저는 지속 쿠키를 최대 ~400일로 캡하므로 그 이하로 설정.
const AUTO_LOGIN_TTL = 60 * 60 * 24 * 365; // 1년 (로그아웃 전까지 사실상 계속 유지)

// 기본(자동로그인 미체크): maxAge 없는 "세션 쿠키" → 브라우저 종료 시 삭제(=로그아웃).
export const adminSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: process.env.ADMIN_SESSION_COOKIE_NAME || 'edenschool-admin-session',
  ttl: 0,
  cookieOptions: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: undefined, // 세션 쿠키(브라우저 닫으면 로그아웃)
  },
};

// 자동로그인 체크 시: 지속(persistent) 쿠키로 장기 유지. 로그아웃 시에만 해제됨.
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

/** 원장(code='O') 전용 API — 선생님(code='T')은 403 */
export async function requireOwnerApiSession() {
  const session = await requireAdminApiSession();
  if (session.user.code !== 'O') {
    throw new ApiForbiddenError();
  }
  return session;
}

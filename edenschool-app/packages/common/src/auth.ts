import type { SessionOptions } from 'iron-session';

const DEFAULT_TTL = Number(process.env.SESSION_TTL) || 60 * 60 * 3; // 3 hours
const AUTO_LOGIN_TTL = 60 * 60 * 24 * 3; // 3 days

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: process.env.SESSION_COOKIE_NAME || 'edenschool-session',
  ttl: DEFAULT_TTL,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: DEFAULT_TTL,
  },
};

export function getSessionOptions(autoLogin: boolean): SessionOptions {
  if (!autoLogin) return sessionOptions;
  return {
    ...sessionOptions,
    ttl: AUTO_LOGIN_TTL,
    cookieOptions: {
      ...sessionOptions.cookieOptions,
      maxAge: AUTO_LOGIN_TTL,
    },
  };
}

export interface SessionData {
  user?: {
    id: number;
    email: string;
    studentId?: number;
    name: string;
    code: string;
    phone?: string;
  };
  phoneVerification?: {
    code: string;
    studentId?: number;
    phone: string;
    expiresAt: number;
    verified?: boolean;
    attempts?: number;
  };
}

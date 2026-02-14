import type { SessionOptions } from 'iron-session';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: process.env.SESSION_COOKIE_NAME || 'edenschool-session',
  ttl: Number(process.env.SESSION_TTL) || 60 * 60 * 3, // default 3 hours
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
};

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
  };
}

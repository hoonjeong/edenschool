import type { SessionOptions } from 'iron-session';

// 자동로그인 유지 기간(초). 브라우저는 지속 쿠키를 최대 ~400일로 캡하므로 그 이하로 설정.
const AUTO_LOGIN_TTL = 60 * 60 * 24 * 365; // 1년 (로그아웃 전까지 사실상 계속 유지)

// 기본(자동로그인 미체크): maxAge 없는 "세션 쿠키" → 브라우저 종료 시 삭제(=로그아웃).
// ttl:0 은 iron-session에서 시간 기반 만료를 두지 않음을 의미(만료는 쿠키 수명이 담당).
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: process.env.SESSION_COOKIE_NAME || 'edenschool-session',
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
  autoLogin?: boolean;
  phoneVerification?: {
    code: string;
    studentId?: number;
    phone: string;
    expiresAt: number;
    verified?: boolean;
    attempts?: number;
  };
  // 회원가입 1단계(휴대폰 인증) 통과 정보. 2단계(정보 입력)로 넘길 때 사용한다.
  // 서버(api/auth/verify-phone)만 기록하고 가입 확정 시 소비 후 삭제한다.
  // 인증으로 확정된 학생 id 하나만 담는다 — 전화번호는 여기에도, 화면에도 남기지 않고
  // 저장 직전에 student 테이블에서 id로 다시 읽는다.
  pendingJoin?: {
    studentId: number;
    expiresAt: number;
  };
}

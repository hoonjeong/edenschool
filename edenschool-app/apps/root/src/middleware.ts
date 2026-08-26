import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import type { SessionData } from '@edenschool/common/auth';
import { sessionOptions } from '@edenschool/common/auth';
import { adminSessionOptions, type AdminSessionData } from '@/lib/admin-session';

// Student protected paths
const protectedPaths = ['/myinfo', '/lecture', '/lecture-view', '/free-lecture', '/special-lecture', '/school-lecture', '/test', '/test-view', '/carrer', '/carrer-view', '/major', '/major-view', '/my-dream', '/ai-career'];
const publicPaths = ['/', '/login', '/join', '/join-step2', '/find-email', '/find-pass', '/board', '/post-view', '/class-video', '/error', '/api', '/about'];

// Admin public paths (no auth required)
const adminPublicPaths = ['/admin/login', '/admin/join', '/admin/find-admin-email', '/admin/find-admin-pass'];

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  if (process.env.COOKIE_SECURE === 'true') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Pass pathname to server components via request header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', path);

  // Allow static files
  if (path.startsWith('/_next') || path.startsWith('/assets')) {
    return withSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // === 독서교육원(R) 전용 세그먼트 ===
  if (path.startsWith('/reading')) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    const session = await getIronSession<AdminSessionData>(req, res, adminSessionOptions);
    if (!session.user) {
      return NextResponse.redirect(buildUrl('/admin/login', req));
    }
    if (session.user.code !== 'R') {
      return NextResponse.redirect(buildUrl('/admin', req));
    }
    return withSecurityHeaders(res);
  }

  // === Admin routes ===
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    // Allow admin public paths and admin auth API
    if (
      adminPublicPaths.some(p => path === p || path.startsWith(p + '/')) ||
      path.startsWith('/api/admin/auth')
    ) {
      return withSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    const session = await getIronSession<AdminSessionData>(req, res, adminSessionOptions);
    if (!session.user) {
      return NextResponse.redirect(buildUrl('/admin/login', req));
    }
    return withSecurityHeaders(res);
  }

  // === Student routes ===
  // Allow public paths
  if (publicPaths.some(p => path === p || path.startsWith(p + '/'))) {
    return withSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // Check if path is protected
  if (protectedPaths.some(p => path === p || path.startsWith(p + '/'))) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session.user) {
      return NextResponse.redirect(buildUrl(`/login?referer=${encodeURIComponent(path + req.nextUrl.search)}`, req));
    }
    return withSecurityHeaders(res);
  }

  return withSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};

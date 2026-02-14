import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import type { SessionData } from '@edenschool/common/auth';
import { sessionOptions } from '@edenschool/common/auth';
import { adminSessionOptions, type AdminSessionData } from '@/lib/admin-session';

// Student protected paths
const protectedPaths = ['/myinfo', '/lecture', '/lecture-view', '/free-lecture', '/special-lecture', '/school-lecture', '/test', '/test-view', '/carrer', '/carrer-view', '/major', '/major-view', '/my-dream', '/ai-career'];
const publicPaths = ['/', '/login', '/join', '/join-step2', '/find-email', '/find-pass', '/board', '/post-view', '/error', '/api'];

// Admin public paths (no auth required)
const adminPublicPaths = ['/admin/login', '/admin/join', '/admin/find-admin-email', '/admin/find-admin-pass'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Pass pathname to server components via request header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', path);

  // Allow static files
  if (path.startsWith('/_next') || path.startsWith('/assets')) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // === Admin routes ===
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    // Allow admin public paths and admin auth API
    if (
      adminPublicPaths.some(p => path === p || path.startsWith(p + '/')) ||
      path.startsWith('/api/admin/auth')
    ) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    const session = await getIronSession<AdminSessionData>(req, res, adminSessionOptions);
    if (!session.user) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return res;
  }

  // === Student routes ===
  // Allow public paths
  if (publicPaths.some(p => path === p || path.startsWith(p + '/'))) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Check if path is protected
  if (protectedPaths.some(p => path === p || path.startsWith(p + '/'))) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session.user) {
      return NextResponse.redirect(new URL(`/login?referer=${encodeURIComponent(path + req.nextUrl.search)}`, req.url));
    }
    return res;
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};

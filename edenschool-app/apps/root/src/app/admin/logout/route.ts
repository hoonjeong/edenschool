import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  session.destroy();
  return NextResponse.redirect(new URL('/admin/login', req.url));
}

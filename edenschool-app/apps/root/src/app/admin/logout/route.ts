import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-session';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  session.destroy();
  return NextResponse.redirect(buildUrl('/admin/login', req));
}

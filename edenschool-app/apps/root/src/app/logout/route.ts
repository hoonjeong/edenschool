import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  session.destroy();
  await session.save();
  return NextResponse.redirect(buildUrl('/', req));
}

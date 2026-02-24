import { NextRequest, NextResponse } from 'next/server';
import { selectEmailByEmail } from '@edenschool/common/queries/user';
import { isValidEmail } from '@edenschool/common/validation';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'check-email', 20, 60 * 1000);
  if (limited) return limited;

  const { email } = await req.json();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ used: false });
  }
  const existing = await selectEmailByEmail(email);
  return NextResponse.json({ used: !!existing });
}

import { NextRequest, NextResponse } from 'next/server';
import { selectEmailByEmail } from '@edenschool/common/queries/user';
import { isValidEmail } from '@edenschool/common/validation';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ used: false });
  }
  const existing = await selectEmailByEmail(email);
  return NextResponse.json({ used: !!existing });
}

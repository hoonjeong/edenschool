import { NextRequest, NextResponse } from 'next/server';
import { countAdminUserByEmail } from '@edenschool/common/queries/admin-user';
import { isValidEmail } from '@edenschool/common/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email as string;

    if (!email || !isValidEmail(email)) {
      return new NextResponse('FAIL');
    }

    const count = await countAdminUserByEmail(email);
    return new NextResponse(count > 0 ? 'FAIL' : 'OK');
  } catch (error) {
    console.error('Check email error:', error);
    return new NextResponse('FAIL', { status: 500 });
  }
}

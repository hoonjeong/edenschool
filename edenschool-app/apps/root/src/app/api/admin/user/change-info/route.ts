import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { countAdminUserByEmailExceptMe, countAdminUserByPhoneExceptMe, updateEmailPhoneById } from '@edenschool/common/queries/admin-user';
import { normalizePhone, isValidEmail } from '@edenschool/common/validation';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  const body = await req.json();
  const id = body.id;

  // Only allow changing own info
  if (id !== session.user.id) {
    return new NextResponse('UNAUTHORIZED', { status: 403 });
  }
  const phone = normalizePhone(body.phone || '');
  const email = body.email;

  if (!email || !isValidEmail(email)) {
    return new NextResponse('EMAIL');
  }

  // Check for duplicate email (excluding current user)
  const emailCount = await countAdminUserByEmailExceptMe(id, email);
  if (emailCount > 0) {
    return new NextResponse('EMAIL');
  }

  // Check for duplicate phone (excluding current user)
  const phoneCount = await countAdminUserByPhoneExceptMe(id, phone);
  if (phoneCount > 0) {
    return new NextResponse('PHONE');
  }

  // Update user info
  await updateEmailPhoneById(id, email, phone);

  return new NextResponse('OK');
});

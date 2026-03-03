import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { selectAdminUserPwById, updatePasswordById } from '@edenschool/common/queries/admin-user';
import { verifyPassword, hashPassword } from '@edenschool/common/password';
import { isValidPassword, PASSWORD_RULES } from '@edenschool/common/validation';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  const body = await req.json();
  const id = session.user.id;
  const beforepw = body.beforepw;
  const newpw = body.newpw;

  if (!beforepw || !newpw) {
    return new NextResponse('FAIL');
  }

  if (!isValidPassword(newpw)) {
    return new NextResponse('FAIL');
  }

  // Verify old password
  const storedPw = await selectAdminUserPwById(id);
  if (!storedPw) {
    return new NextResponse('FAIL');
  }

  const valid = await verifyPassword(beforepw, storedPw);
  if (!valid) {
    return new NextResponse('DIFF');
  }

  // Update password with bcrypt hash
  const hashedPw = await hashPassword(newpw);
  const affectedRows = await updatePasswordById(id, hashedPw);

  if (affectedRows > 0) {
    return new NextResponse('OK');
  }

  return new NextResponse('FAIL');
});

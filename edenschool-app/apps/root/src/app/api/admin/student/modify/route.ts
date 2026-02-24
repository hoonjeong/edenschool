import { buildUrl } from '@/lib/url';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { modifyStudent } from '@edenschool/common/queries/student';
import { updateUserInfoPwByStudentId } from '@edenschool/common/queries/user';
import { hashPassword } from '@edenschool/common/password';
import { normalizePhone } from '@edenschool/common/validation';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const formData = await req.formData();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const school = formData.get('school') as string;
  const grade = formData.get('grade') as string;
  const year = formData.get('year') as string;
  const sphone = normalizePhone(formData.get('sphone') as string || '');
  const pphone = normalizePhone(formData.get('pphone') as string || '');
  const address = formData.get('address') as string;
  const specialty = formData.get('specialty') as string;
  const memo = formData.get('memo') as string;
  const pw = formData.get('pw') as string | null;

  // Update student table
  await modifyStudent({ id: Number(id), name, school, grade, year: Number(year), sphone, pphone, address, specialty, memo });

  // If password provided, update user_info pw too
  if (pw) {
    const hashedPw = await hashPassword(pw);
    await updateUserInfoPwByStudentId(Number(id), hashedPw);
  }

  return NextResponse.redirect(buildUrl(`/admin/student-info?id=${id}`, req));
});

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { insertStudent } from '@edenschool/common/queries/student';
import { insertStudentAnalysis } from '@edenschool/common/queries/admin-user';
import { normalizePhone } from '@edenschool/common/validation';
import { withTransaction } from '@edenschool/common/db';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const formData = await req.formData();
  const name = formData.get('name') as string;
  const school = formData.get('school') as string;
  const grade = formData.get('grade') as string;
  const year = formData.get('year') as string;
  const sphone = normalizePhone(formData.get('sphone') as string || '');
  const pphone = normalizePhone(formData.get('pphone') as string || '');
  const address = formData.get('address') as string;
  const specialty = formData.get('specialty') as string;
  const memo = formData.get('memo') as string;

  const studentId = await withTransaction(async () => {
    // Insert student
    const sid = await insertStudent({ name, school, grade, year: Number(year), sphone, pphone, address, specialty, memo });
    // Insert student_analysis with code='join'
    await insertStudentAnalysis(sid, 'join');
    return sid;
  });

  return NextResponse.redirect(new URL(`/admin/student-info?id=${studentId}`, req.url));
});

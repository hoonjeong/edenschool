import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireOwnerApiSession } from '@/lib/admin-session';
import { updateStudentStatus } from '@edenschool/common/queries/student';
import { updateUserStatus } from '@edenschool/common/queries/user';
import { insertStudentAnalysis } from '@edenschool/common/queries/admin-user';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireOwnerApiSession();

  const body = await req.json();
  const id = body.id as string;

  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing student id' }, { status: 400 });
  }

  // 1. Update student status to 1 (active)
  await updateStudentStatus(Number(id), 1);
  // 2. Update user_info code to 'S' (student active)
  await updateUserStatus(Number(id), 'S');
  // 3. Insert student_analysis with code='rejoin'
  await insertStudentAnalysis(Number(id), 'rejoin');

  return NextResponse.json({ success: true });
});

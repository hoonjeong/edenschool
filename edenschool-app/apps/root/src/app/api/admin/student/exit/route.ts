import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { endClassStatus } from '@edenschool/common/queries/class';
import { updateStudentStatus } from '@edenschool/common/queries/student';
import { updateUserStatus } from '@edenschool/common/queries/user';
import { insertStudentAnalysis } from '@edenschool/common/queries/admin-user';
import { withTransaction } from '@edenschool/common/db';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const body = await req.json();
  const student_id = body.student_id as string;

  await withTransaction(async () => {
    // End all active class_status for this student
    await endClassStatus(Number(student_id));
    // Mark student as exited (status=0)
    await updateStudentStatus(Number(student_id), 0);
    // Update user_info code to 'D' (disabled)
    await updateUserStatus(Number(student_id), 'D');
    // Insert student_analysis with code='exit'
    await insertStudentAnalysis(Number(student_id), 'exit');
  });

  return NextResponse.json({ success: true });
});

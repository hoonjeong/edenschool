import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectClassIdByName, insertClassStatus } from '@edenschool/common/queries/class';
import { updateStudentStatus } from '@edenschool/common/queries/student';
import { updateUserStatus } from '@edenschool/common/queries/user';

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const body = await req.json();
    const class_name = body.class_name as string;
    const student_id = body.student_id as string;
    const start_date = body.start_date as string;

    // Find class_id from class name
    const class_id = await selectClassIdByName(class_name);

    if (class_id === -1) {
      return NextResponse.json({ message: '존재하지 않는 반입니다.' }, { status: 404 });
    }

    // Insert class_status
    await insertClassStatus(class_id, Number(student_id), start_date);

    // 반 배정 시 학생을 재원 상태로 복원(퇴원생이면 자동 재활성화 + 로그인 계정 활성화)
    await updateStudentStatus(Number(student_id), 1);
    await updateUserStatus(Number(student_id), 'S');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Enroll class error:', error);
    return NextResponse.json({ message: '반 등록에 실패했습니다.' }, { status: 500 });
  }
});

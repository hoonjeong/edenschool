import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectClassIdByName, insertClassStatus, isStudentEnrolledInClass } from '@edenschool/common/queries/class';
import { selectStudentById, updateStudentStatus } from '@edenschool/common/queries/student';
import { updateUserStatus } from '@edenschool/common/queries/user';
import { insertStudentAnalysis } from '@edenschool/common/queries/admin-user';

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

    // 중복 등록 방지: 해당 반에 이미 수강중(status=1)이면 등록 불가
    const alreadyEnrolled = await isStudentEnrolledInClass(Number(student_id), class_id);
    if (alreadyEnrolled) {
      return NextResponse.json({ message: '이미 수강중인 반입니다.' }, { status: 409 });
    }

    // 배정 전 현재 상태 확인 (퇴원생 → 재원 전환일 때만 통계용 재등록 로그)
    const student = await selectStudentById(Number(student_id));
    const wasExited = student?.status === 0;

    // Insert class_status
    await insertClassStatus(class_id, Number(student_id), start_date);

    // 반 배정 시 학생을 재원 상태로 복원(퇴원생이면 자동 재활성화 + 로그인 계정 활성화)
    await updateStudentStatus(Number(student_id), 1);
    await updateUserStatus(Number(student_id), 'S');

    // 퇴원생을 다시 반에 배정한 경우에만 재등록 통계 기록(중복 집계 방지)
    if (wasExited) {
      await insertStudentAnalysis(Number(student_id), 'rejoin');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Enroll class error:', error);
    return NextResponse.json({ message: '반 등록에 실패했습니다.' }, { status: 500 });
  }
});

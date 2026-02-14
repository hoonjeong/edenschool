import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectClassIdByName, insertClassStatus } from '@edenschool/common/queries/class';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Enroll class error:', error);
    return NextResponse.json({ message: '반 등록에 실패했습니다.' }, { status: 500 });
  }
});

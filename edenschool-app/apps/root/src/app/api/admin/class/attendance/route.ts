import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { requireAdminApiSession } from '@/lib/admin-session';
import { selectClassInfoById } from '@edenschool/common/queries/class';
import { selectStudentListByClassId } from '@edenschool/common/queries/student';
import { buildAttendanceWorkbook, attendanceFileName } from '@/lib/attendance-excel';

// 출석부(엑셀) 다운로드.
// 선생님(T)도 담당반 명단 화면에서 쓰므로 원장 전용으로 막지 않는다.
// 명단 화면이 이미 이름·연락처를 보여주고 있어 새로 노출되는 정보는 없다.
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const params = req.nextUrl.searchParams;
  const classId = Number(params.get('id'));
  if (!classId) {
    return NextResponse.json({ error: '수강반을 찾을 수 없습니다.' }, { status: 400 });
  }

  const now = new Date();
  const year = Number(params.get('year')) || now.getFullYear();
  const month = Number(params.get('month')) || now.getMonth() + 1;
  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    return NextResponse.json({ error: '연·월이 올바르지 않습니다.' }, { status: 400 });
  }

  const info = await selectClassInfoById(classId);
  if (!info) {
    return NextResponse.json({ error: '수강반을 찾을 수 없습니다.' }, { status: 404 });
  }

  const students = await selectStudentListByClassId(classId);
  const buffer = await buildAttendanceWorkbook(info, students, year, month);
  const fileName = attendanceFileName(info, year, month);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Content-Length': String(buffer.length),
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

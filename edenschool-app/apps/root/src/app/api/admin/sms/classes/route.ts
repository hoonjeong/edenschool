import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectClassInfoListLive } from '@edenschool/common/queries/class';
import { selectTeacherClassListByTeacherName } from '@edenschool/common/queries/class';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdminApiSession();

  const { searchParams } = new URL(req.url);
  const teacherOnly = searchParams.get('teacherOnly');

  try {
    if (teacherOnly === 'true') {
      // Teacher-specific: selectTeacherClassListByTeacherName
      // Returns classes where the logged-in user is teacherOne or teacherTwo
      const teacherName = session.user.name;
      const rows = await selectTeacherClassListByTeacherName(teacherName);
      return NextResponse.json({ classes: rows });
    } else {
      // Admin-wide: all live classes with grade/year for grouping
      const rows = await selectClassInfoListLive();
      return NextResponse.json(rows);
    }
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json([], { status: 500 });
  }
});

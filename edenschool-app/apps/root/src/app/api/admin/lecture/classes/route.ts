import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectClassInfoListLive } from '@edenschool/common/queries/class';

export const GET = withErrorHandler(async (_req: NextRequest) => {
  await requireAdminApiSession();

  try {
    // Matches original: selectLectureListByGradeYear
    // Return all fields so the client can filter by grade+year+teacher
    const rows = await selectClassInfoListLive();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json([], { status: 500 });
  }
});

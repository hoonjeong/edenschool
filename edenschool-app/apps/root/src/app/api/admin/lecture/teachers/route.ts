import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { selectTeacherList } from '@edenschool/common/queries/admin-user';

export const GET = withErrorHandler(async (_req: NextRequest) => {
  await requireAdminApiSession();

  try {
    const rows = await selectTeacherList();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json([], { status: 500 });
  }
});
